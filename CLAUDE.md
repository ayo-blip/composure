# Composure — Claude Context

## What This Project Is

**HRCompoSure** is a B2B SaaS web app for managers and HR professionals. It generates professionally worded drafts for difficult workplace conversations, assesses HR/legal risk, and builds a defensible audit trail.

**This project has NO connection to n8n or Aiprikot. Do not reference leadlyai, VAPI, Twilio, Nylas, or any Aiprikot workflows here.**

---

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, edge functions, storage)
- Anthropic Claude claude-sonnet-4-6 (AI backbone)
- React Router v6
- Stripe (billing — test mode)
- Brevo (transactional email)
- VAPID (web push notifications)

---

## Supabase Project

- Project ID: `owpqkhuffdadidqynqgp`
- URL: `https://owpqkhuffdadidqynqgp.supabase.co`
- Anon key: `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
- Secrets set: `ANTHROPIC_API_KEY`, `BREVO_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VAPID_PRIVATE_KEY`

---

## GitHub & Deployment

- Repo: https://github.com/ayo-blip/composure.git
- Local: `/Users/mac/Desktop/Agentic workdlows/n8n Builder/Composure/`
- Vercel live: https://composure-git-main-hello-2191s-projects.vercel.app/
- Custom domain: hrcomposure.com

---

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | Home + Draft Generator | Public (features shown to logged-out) |
| `/auth` | Sign in / Sign up / Forgot password | Public |
| `/reset-password` | Password reset | Public |
| `/library` | Saved drafts | Auth |
| `/cases` | Employee case list | Auth |
| `/cases/:id` | Case detail + timeline | Auth |
| `/knowledge-base` | Document upload (admin only) | Admin |
| `/admin` | Admin dashboard + team management | Admin |
| `/superadmin` | Platform owner dashboard | leke365@gmail.com only |
| `/pricing` | Plans + billing | Public |
| `/billing/success` | Post-checkout success | Auth |
| `/privacy` | Privacy Policy | Public |
| `/terms` | Terms of Service | Public |
| `/contact` | Contact + support | Public |
| `/waitlist` | Waitlist signup | Public |
| `/setup` | Org setup (post-signup) | Auth |

---

## Edge Functions

| Function | Purpose |
|---|---|
| `generate-draft` | Claude claude-sonnet-4-6 — draft, talking points, doc note, risk assessment |
| `generate-safer` | Claude claude-sonnet-4-6 — softer rewrite |
| `chat-hr` | Enterprise HR chat (50 msg/user/month cap) |
| `broadcast-message` | Admin broadcast — in-app + email + push |
| `invite-member` | Invite team member (seat caps: Pro 10, Enterprise 30) |
| `process-document` | Knowledge base document processing |
| `create-checkout-session` | Stripe checkout |
| `create-portal-session` | Stripe billing portal |
| `stripe-webhook` | Stripe event handler |
| `send-welcome-email` | Brevo welcome email on signup |
| `send-waitlist-email` | Brevo waitlist confirmation |
| `send-nurture-emails` | Day-3 tips + day-7 check-in (needs daily cron via cron-job.org — not yet scheduled) |

---

## Plans & Limits

| Plan | Price | Seats | Chat | Drafts |
|---|---|---|---|---|
| Starter | Free | 1 | No | 10/month |
| Professional | £49/mo | 10 | No | Unlimited |
| Enterprise | £149/mo | 30 | 50 msg/user/month | Unlimited |

---

## Brand

- Primary: Navy `#1e3a5f`
- Accent: Amber `#f59e0b`
- Fonts: Playfair Display (headings) + Inter (body)
- No purple — previous Lovable default, fully replaced

---

## Database Tables

- `profiles` — id, full_name, role (admin|manager), organisation_id, active
- `organisations` — id, name, plan_tier
- `saved_drafts` — draft output, organisation_id, user_id, case_id, is_favorite
- `cases` — employee case records
- `documents` — knowledge base uploads
- `push_subscriptions` — VAPID push endpoints per user
- `waitlist` — name, email, organisation (UNIQUE on email)

---

## Key Rules

- **No n8n in this project** — scheduling uses cron-job.org or Supabase pg_cron
- **Stripe stays in test mode** until user confirms testers are happy
- **Super admin** gated by hardcoded email `leke365@gmail.com`
- **Avoid the word "AI"** in user-facing copy — use outcome-led language
