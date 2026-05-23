-- Phase 1: Multi-Tenant Foundation
-- Apply this AFTER the initial migration (20251217202821) has been applied.

-- ============================================================
-- 1. ORGANISATIONS TABLE (policy added after profiles column exists)
-- ============================================================
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. UPDATE PROFILES — add org link first, then create policy
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Members of an org can see their org's record (column now exists)
CREATE POLICY "Org members can view their organisation"
  ON public.organisations FOR SELECT
  USING (
    id IN (
      SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Constrain role to the two valid values (existing NULL rows are allowed)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('admin', 'manager'));

-- ============================================================
-- 3. UPDATE SAVED_DRAFTS — add org scoping
-- ============================================================
ALTER TABLE public.saved_drafts
  ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL;

-- Drop the existing user-only RLS policies and replace with org-aware ones.
-- Users can still see their own drafts; when an org is attached they must
-- also belong to that org. This keeps existing personal drafts accessible.
DROP POLICY IF EXISTS "Users can view their own drafts" ON public.saved_drafts;
DROP POLICY IF EXISTS "Users can create their own drafts" ON public.saved_drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON public.saved_drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.saved_drafts;

CREATE POLICY "Users can view their own drafts"
  ON public.saved_drafts FOR SELECT
  USING (
    auth.uid() = user_id
    AND (
      organisation_id IS NULL
      OR organisation_id IN (
        SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create their own drafts"
  ON public.saved_drafts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organisation_id IS NULL
      OR organisation_id IN (
        SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own drafts"
  ON public.saved_drafts FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (
      organisation_id IS NULL
      OR organisation_id IN (
        SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own drafts"
  ON public.saved_drafts FOR DELETE
  USING (
    auth.uid() = user_id
    AND (
      organisation_id IS NULL
      OR organisation_id IN (
        SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );
