-- Phase 5: Admin Dashboard additions

-- Add jurisdiction to organisations
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS jurisdiction text DEFAULT 'other';

-- Allow admins to read all profiles in their org
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view org members'
  ) THEN
    CREATE POLICY "Admins can view org members"
      ON public.profiles
      FOR SELECT
      USING (
        organisation_id IS NOT NULL
        AND organisation_id = (
          SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow admins to update role/active on org members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update org members'
  ) THEN
    CREATE POLICY "Admins can update org members"
      ON public.profiles
      FOR UPDATE
      USING (
        organisation_id IS NOT NULL
        AND organisation_id = (
          SELECT organisation_id FROM public.profiles p2 WHERE p2.id = auth.uid()
        )
        AND (
          SELECT role FROM public.profiles p3 WHERE p3.id = auth.uid()
        ) = 'admin'
      )
      WITH CHECK (
        organisation_id = (
          SELECT organisation_id FROM public.profiles p4 WHERE p4.id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow admins to update their org's settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'organisations' AND policyname = 'Admins can update their organisation'
  ) THEN
    CREATE POLICY "Admins can update their organisation"
      ON public.organisations
      FOR UPDATE
      USING (
        id = (
          SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
        )
        AND (
          SELECT role FROM public.profiles WHERE id = auth.uid()
        ) = 'admin'
      )
      WITH CHECK (
        id = (
          SELECT organisation_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
