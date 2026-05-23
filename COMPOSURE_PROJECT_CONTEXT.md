# Composure — Full Project Context for Claude Code

## What You Are Building

Composure is a B2B SaaS web application that helps people leaders (managers) feel confident when responding to professional workplace people issues. It functions as an AI-powered Employee Relations (ER) advisor, available 24/7, that drafts responses grounded in the organisation's own HR policies, procedures, and employment law for their jurisdiction.

This document is the single source of truth for the product vision, technical architecture, feature roadmap, and implementation plan. Read it fully before touching any code.

---

## The Problem It Solves

Managers frequently face sensitive people situations — performance issues, attendance problems, interpersonal conflict, disciplinary matters — and either:
- Delay responding because they are unsure how to handle it
- Respond inconsistently, exposing the business to risk
- Escalate to HR unnecessarily, overloading the team
- Handle it without documentation, creating future liability

HR consultants charge $150–300/hour for exactly this guidance. Composure delivers it instantly, at a fraction of the cost, grounded in the organisation's actual policies.

---

## Current Features Already Built

The following features are live and working. Do not rebuild or duplicate them:

1. **Situation input** — Manager describes the workplace issue in free text
2. **AI-generated draft email** — A professional response email for the manager to send
3. **Confidence score** — A percentage score indicating how well-suited the suggested approach is
4. **HR escalation flag** — A clear recommendation on whether the matter should be escalated to HR
5. **Record-keeping document** — A structured document draft for the manager's file, capturing the issue and response for audit purposes

The existing AI provider is **Anthropic (Claude)**. This must remain the primary generation model throughout all future development.

---

## What We Are Building Next — Full Roadmap

The roadmap has six phases. They must be built in order. Each phase must be fully working and tested before the next begins.

---

### Phase 1 — Multi-Tenant Foundation

**Goal:** Ensure every organisation's data is completely isolated from every other organisation's data before any shared features are added.

**What to build:**
- `organisations` table: `id` (uuid, PK), `name` (text), `plan_tier` (text, default `'starter'`), `created_at` (timestamp)
- Add `organisation_id` (uuid, FK to organisations) to the existing `users` table if not present
- Add `role` column to users if not present: values are `'admin'` or `'manager'`
  - Admin: can manage org settings, users, documents, billing
  - Manager: can only use the tool to generate responses
- Tag every existing case/response record with `organisation_id`
- Apply **Row Level Security (RLS)** in Supabase so users can only ever read/write records belonging to their own `organisation_id`

**Audit first:** Before writing any code, read the entire existing schema and summarise current tables, columns, and relationships. Show the SQL for every proposed change before applying it.

---

### Phase 2 — Document Upload & Storage

**Goal:** Allow org admins to upload their HR policies, SOPs, employee handbooks, and case files into a secure, org-scoped document store.

**What to build:**
- New page: **Knowledge Base** — visible to `admin` role only, added to navigation
- File uploader accepting: PDF, DOCX, TXT only. Max 20MB per file.
- Store files in Supabase Storage bucket: `organisation-documents`
  - Path structure: `/{organisation_id}/{uuid}-{filename}`
  - This ensures org-level isolation at the storage layer
- `documents` table:
  - `id` (uuid, PK)
  - `organisation_id` (uuid, FK)
  - `file_name` (text)
  - `file_path` (text)
  - `file_type` (text)
  - `status` (text): `'uploaded'` | `'processing'` | `'ready'` | `'error'`
  - `uploaded_by` (uuid, FK to users)
  - `uploaded_at` (timestamp)
- Display uploaded documents with: name, upload date, status badge (colour coded)
- Delete button removes both the storage file and database record
- Apply RLS: orgs see only their own documents

---

### Phase 3 — Document Processing (RAG Engine)

**Goal:** Convert uploaded documents into searchable vector embeddings so they can be retrieved at response time.

**What to build:**

1. Enable pgvector in Supabase:
```sql
create extension if not exists vector;
```

2. `document_chunks` table:
```sql
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  document_id uuid references documents(id),
  content text,
  embedding vector(1536),
  created_at timestamp default now()
);
```
Apply RLS: orgs access only their own chunks.

3. Supabase Edge Function: `process-document`
   - Triggered when a document is inserted with `status = 'uploaded'`
   - Sets status to `'processing'` immediately
   - Downloads the file from Supabase Storage
   - Extracts raw text (handle PDF, DOCX, TXT)
   - Splits text into ~500 word chunks with 50 word overlap
   - Calls **OpenAI `text-embedding-3-small`** to generate 1536-dimension vectors for each chunk
   - Note: OpenAI is used for embeddings only. Anthropic remains the generation model.
   - Inserts each chunk + embedding into `document_chunks`
   - Updates document `status` to `'ready'` on success, `'error'` on failure

4. Knowledge Base page polls document status every 10 seconds and updates status badge in real time

---

### Phase 4 — Retrieval at Response Time

**Goal:** Before generating any AI response, retrieve the most relevant chunks from the org's uploaded documents and inject them into the prompt. This grounds every response in the organisation's own policies.

**Critical:** Do not change the existing UI, response format, or output structure. Only modify the prompt construction logic.

**What to build:**

1. Supabase Edge Function: `retrieve-context`
   - Input: `situation_text` (string), `organisation_id` (uuid)
   - Generates an embedding of the situation text using OpenAI `text-embedding-3-small`
   - Runs similarity search against `document_chunks` filtered by `organisation_id`:
   ```sql
   SELECT content FROM document_chunks
   WHERE organisation_id = $1
   ORDER BY embedding <-> $2
   LIMIT 5;
   ```
   - Returns top 5 most relevant chunks as plain text

2. Modify existing AI call:
   - Before calling Claude, call `retrieve-context`
   - If chunks are returned, prepend to the Claude prompt:
   ```
   --- ORGANISATION POLICIES AND PROCEDURES ---
   [retrieved chunks]
   --- END OF POLICIES ---

   Using the organisation policies above where relevant, and applying
   [jurisdiction] employment law, respond to the following workplace
   situation as an experienced HR advisor:

   [manager's situation input]
   ```
   - If no chunks exist for the org, skip retrieval silently and use the existing prompt unchanged

3. Add a UI indicator on the response output:
   - When chunks were used: `"Response informed by your organisation's policies"`
   - When no chunks: `"General guidance applied — upload your policies for personalised responses"`
   - This creates a natural incentive to upload documents

---

### Phase 5 — Admin Dashboard

**Goal:** Give org admins full control over settings, users, and usage visibility.

**What to build:**

1. **Jurisdiction Settings**
   - Dropdown saved to `organisations.jurisdiction` (text column)
   - Options: Alberta, British Columbia, Ontario, Quebec, Saskatchewan, Manitoba, Nova Scotia, New Brunswick, Federal (Canada), New York, California, Texas, Florida, Illinois, Federal (USA), England & Wales, Scotland
   - Jurisdiction auto-applies to every AI response — managers never need to select it manually

2. **User Management** (admin only)
   - List: name, email, role, last active
   - Invite by email (Supabase auth invite)
   - Change role: admin ↔ manager
   - Deactivate user: blocks login, preserves case history
   - Show seats used vs plan limit

3. **Usage Summary** (refreshed daily)
   - Cases generated this month (org total)
   - Breakdown by manager
   - HR escalations flagged this month
   - Documents uploaded + status
   - Cases used vs monthly plan limit

4. All admin pages hidden from `manager` role via both RLS and frontend route guards

---

### Phase 6 — Billing & Plan Gating

**Goal:** Enforce plan limits and allow orgs to upgrade via Stripe.

**Plan tiers:**

| Tier | Price | Seats | Knowledge Base | Cases/Month |
|------|-------|-------|---------------|-------------|
| Starter | $99/mo | 10 | No | 50 |
| Growth | $199/mo | 30 | Yes | 200 |
| Enterprise | Custom | Unlimited | Yes | Unlimited |

**What to build:**

1. Define tier limits as constants in the codebase (not hardcoded in DB queries)

2. Stripe integration:
   - Stripe products for Starter and Growth
   - Upgrade flow from within admin dashboard
   - Stripe webhook updates `organisations.plan_tier` on payment success
   - Store `stripe_customer_id` and `stripe_subscription_id` on `organisations` table

3. Knowledge Base gating:
   - Starter plan: show Knowledge Base page but replace upload UI with upgrade prompt
   - Explain the benefit clearly before showing the paywall

4. Seat limit enforcement:
   - Block invite when seat limit is reached
   - Show upgrade prompt with seats available on next tier

5. Case limit enforcement:
   - Block generation when monthly case limit is reached
   - Show admin-facing alert — never fail silently
   - Always show the upgrade path

6. Billing section in admin dashboard:
   - Current plan, renewal date, cases used vs limit, seats used vs limit
   - "Manage Billing" button → Stripe Customer Portal

**All limit checks must happen server-side in edge functions, not frontend only.**

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React (existing Lovable build, migrating to VS Code) |
| Backend / DB | Supabase (Postgres + RLS + Edge Functions + Storage) |
| Vector search | Supabase pgvector extension |
| AI generation | Anthropic Claude (primary, existing) |
| Embeddings | OpenAI text-embedding-3-small (Phase 3+ only) |
| Payments | Stripe (Phase 6) |
| Auth | Supabase Auth |

---

## Data Model Overview

```
organisations
  id, name, plan_tier, jurisdiction, stripe_customer_id,
  stripe_subscription_id, created_at

users
  id, organisation_id, email, role, active, last_active_at, created_at

cases (existing — name may differ)
  id, organisation_id, created_by, situation_text, draft_email,
  confidence_score, escalation_flag, record_document, created_at

documents
  id, organisation_id, file_name, file_path, file_type,
  status, uploaded_by, uploaded_at

document_chunks
  id, organisation_id, document_id, content, embedding, created_at
```

---

## Security Rules

- Every table must have RLS enabled
- `organisation_id` must be present and enforced on every user-generated record
- Anthropic and OpenAI API keys must never appear in frontend code — edge functions only
- Each org's storage files must be path-scoped to their `organisation_id`
- Stripe webhooks must be signature-verified before processing
- Seat and case limit checks must be server-side

---

## Monetization Context

- Target buyer: HR Director or People Ops Lead at an SMB (10–200 employees)
- End users: People managers / team leads within that org
- Primary acquisition: Cold outbound email (Apollo) + paid social retargeting
- Pricing: Monthly subscription per org, not per user
- Key differentiator: The only ER guidance tool that responds within the context of the org's own policies AND the correct employment jurisdiction

---

## Tone & Product Principles

- The product must feel calm, professional, and trustworthy — it is handling sensitive HR matters
- Never expose raw AI output without the confidence score and escalation flag — these frame the response appropriately
- When the knowledge base is active, always indicate to the manager that the response is informed by their org's policies — this is a core trust signal
- Failure states (no documents, hit case limit, processing error) must always be clearly communicated with a next step — never leave the user stranded

---

## Instructions for Claude Code

1. **Audit before every phase.** Read the existing codebase fully and report what is already there before writing new code.
2. **Never duplicate existing functionality.** If a feature is already built, extend it — do not rebuild it.
3. **Show SQL before applying.** For every Supabase schema change, show the SQL first and wait for confirmation.
4. **Build phases in order.** Do not start Phase 3 until Phase 2 is working. Do not start Phase 4 until Phase 3 is tested with real documents.
5. **Preserve the existing response format.** The draft email, confidence score, escalation flag, and record document output must never be disrupted by changes to the prompt pipeline.
6. **Edge functions for sensitive logic.** API keys, limit checks, and retrieval logic live server-side only.
