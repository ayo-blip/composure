import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- VAPID helpers (Web Crypto API, no external deps) ---

function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function buildVapidJwt(audience: string, privateKeyB64url: string, publicKeyB64url: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = { aud: audience, exp: now + 43200, sub: 'mailto:noreply@hrcomposure.com' };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const rawPrivate = base64urlToUint8Array(privateKeyB64url);
  const rawPublic = base64urlToUint8Array(publicKeyB64url);

  // Reconstruct JWK from raw keys
  const jwk: JsonWebKey = {
    kty: 'EC', crv: 'P-256',
    d: uint8ArrayToBase64url(rawPrivate),
    x: uint8ArrayToBase64url(rawPublic.slice(1, 33)),
    y: uint8ArrayToBase64url(rawPublic.slice(33, 65)),
  };

  const cryptoKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, enc.encode(signingInput));

  return `${signingInput}.${uint8ArrayToBase64url(new Uint8Array(signature))}`;
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<void> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await buildVapidJwt(audience, vapidPrivateKey, vapidPublicKey);

  // Encrypt payload using Web Push Content Encryption (RFC 8291 / aesgcm simplified)
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const serverPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey));
  const clientPublicKey = await crypto.subtle.importKey('raw', base64urlToUint8Array(subscription.p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = await crypto.subtle.deriveKey({ name: 'ECDH', public: clientPublicKey }, serverKeyPair.privateKey, { name: 'AES-GCM', length: 128 }, false, ['encrypt']);

  // HKDF for content encryption key
  const authBuffer = base64urlToUint8Array(subscription.auth);
  const prk = await crypto.subtle.importKey('raw', sharedSecret ? new Uint8Array(await crypto.subtle.exportKey('raw', sharedSecret)) : new Uint8Array(32), { name: 'HKDF' }, false, ['deriveKey', 'deriveBits']);

  const authInfo = enc.encode('Content-Encoding: auth\0');
  const prkBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: authBuffer, info: authInfo }, prk, 256);

  const contentKey = await crypto.subtle.importKey('raw', new Uint8Array(prkBits), { name: 'HKDF' }, false, ['deriveBits']);
  const keyInfo = new Uint8Array([...enc.encode('Content-Encoding: aesgcm\0'), ...new Uint8Array(1), ...serverPublicRaw, ...base64urlToUint8Array(subscription.p256dh)]);
  const keyBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: keyInfo }, contentKey, 128);

  const nonceInfo = new Uint8Array([...enc.encode('Content-Encoding: nonce\0'), ...new Uint8Array(1), ...serverPublicRaw, ...base64urlToUint8Array(subscription.p256dh)]);
  const nonceBits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, contentKey, 96);

  const aesKey = await crypto.subtle.importKey('raw', new Uint8Array(keyBits), { name: 'AES-GCM' }, false, ['encrypt']);
  const paddedPayload = new Uint8Array([0, 0, ...enc.encode(payload)]);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(nonceBits) }, aesKey, paddedPayload);

  await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'Encryption': `salt=${uint8ArrayToBase64url(salt)}`,
      'Crypto-Key': `dh=${uint8ArrayToBase64url(serverPublicRaw)}`,
      'TTL': '86400',
    },
    body: ciphertext,
  });
}

// --------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { content, organisation_id, sender_user_id } = await req.json();
    if (!content?.trim() || !organisation_id || !sender_user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const brevoKey = Deno.env.get('BREVO_API_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify sender is admin
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('role, organisation_id')
      .eq('id', sender_user_id)
      .single();

    if (senderProfile?.role !== 'admin' || senderProfile?.organisation_id !== organisation_id) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch org name
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', organisation_id)
      .single();
    const orgName = org?.name ?? 'Your organisation';

    // Save broadcast message to chat
    const { error: insertError } = await supabase.from('chat_messages').insert({
      organisation_id,
      user_id: null,
      role: 'broadcast',
      content: content.trim(),
    });
    if (insertError) throw insertError;

    // Fetch org member profiles
    const { data: members } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('organisation_id', organisation_id)
      .eq('active', true)
      .neq('id', sender_user_id);

    const memberIds = (members ?? []).map((m: { id: string }) => m.id);

    // Send emails via Brevo
    let emailsSent = 0;
    if (brevoKey && memberIds.length > 0) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const orgEmails = (usersData?.users ?? [])
        .filter((u) => memberIds.includes(u.id))
        .map((u) => ({ email: u.email!, name: (members ?? []).find((m: any) => m.id === u.id)?.full_name ?? '' }))
        .filter((u) => !!u.email);

      for (const { email, name } of orgEmails) {
        try {
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
            body: JSON.stringify({
              sender: { name: 'HRCompoSure', email: 'noreply@hrcomposure.com' },
              to: [{ email, name }],
              subject: `[${orgName}] HR Announcement`,
              htmlContent: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <div style="margin-bottom:24px">
                    <span style="font-size:20px;font-weight:600">HR<span style="color:#7c3aed">CompoSure</span></span>
                  </div>
                  <h2 style="font-size:18px;font-weight:600;margin-bottom:8px">HR Announcement from ${orgName}</h2>
                  ${name ? `<p style="color:#6b7280;font-size:14px;margin-bottom:16px">Hi ${name},</p>` : ''}
                  <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:15px;line-height:1.6;color:#111827">
                    ${content.trim().replace(/\n/g, '<br>')}
                  </div>
                  <p style="font-size:12px;color:#9ca3af;margin-top:24px">
                    You received this because you are a member of ${orgName} on HRCompoSure.
                  </p>
                </div>
              `,
            }),
          });
          emailsSent++;
        } catch {
          // Continue to next recipient on failure
        }
      }
    }

    // Send push notifications
    let pushSent = 0;
    if (vapidPublicKey && vapidPrivateKey && memberIds.length > 0) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .in('user_id', memberIds);

      const pushPayload = JSON.stringify({
        title: `HR Announcement — ${orgName}`,
        body: content.trim().length > 120 ? content.trim().slice(0, 117) + '…' : content.trim(),
        url: '/',
      });

      for (const sub of subscriptions ?? []) {
        try {
          await sendPushNotification(sub, pushPayload, vapidPublicKey, vapidPrivateKey);
          pushSent++;
        } catch {
          // Stale subscription — ignore
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent, pushSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('broadcast-message error:', err);
    return new Response(JSON.stringify({ error: 'Broadcast failed. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
