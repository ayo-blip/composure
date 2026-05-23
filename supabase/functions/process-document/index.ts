import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractText(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  if (mimeType === 'text/plain') {
    return new TextDecoder().decode(buffer);
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('npm:mammoth');
    const result = await mammoth.default.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === 'application/pdf') {
    const { getDocumentProxy, extractText } = await import('npm:unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

function chunkText(text: string, chunkWords = 500, overlapWords = 50): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkWords).join(' ').trim();
    if (chunk) chunks.push(chunk);
    i += chunkWords - overlapWords;
  }

  return chunks;
}

async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text.slice(0, 8000),
      model: 'text-embedding-3-small',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embeddings error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let documentId: string | null = null;

  try {
    const body = await req.json();
    documentId = body.document_id;

    if (!documentId) throw new Error('document_id is required');

    // 1. Fetch the document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) throw new Error('Document not found');

    // 2. Mark as processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // 3. Download from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('organisation-documents')
      .download(doc.file_path);

    if (downloadError || !fileData) throw new Error('Could not download file from storage');

    const buffer = await fileData.arrayBuffer();

    // 4. Extract text
    const text = await extractText(buffer, doc.file_type);
    if (!text.trim()) throw new Error('No text could be extracted from this document');

    // 5. Chunk the text
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error('Document produced no chunks');

    // 6. Delete any existing chunks (handles reprocessing)
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // 7. Embed and insert each chunk
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk, OPENAI_API_KEY);

      const { error: insertError } = await supabase.from('document_chunks').insert({
        organisation_id: doc.organisation_id,
        document_id: doc.id,
        content: chunk,
        embedding,
      });

      if (insertError) throw new Error(`Failed to insert chunk: ${insertError.message}`);
    }

    // 8. Mark as ready
    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', documentId);

    console.log(`Processed document ${documentId}: ${chunks.length} chunks`);

    return new Response(JSON.stringify({ success: true, chunks: chunks.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing document:', error);

    if (documentId) {
      await supabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', documentId);
    }

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
