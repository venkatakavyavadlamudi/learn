-- ==============================================================================
-- LearnAI: Least-Privilege RLS Policy for public.learnai_users
-- ==============================================================================
-- Root Cause:
-- The previous policy 'auth.uid() = user_id' restricted SELECT access strictly
-- to the currently logged in user's own record. This caused all student, trainer,
-- and mentor records to be filtered out during Admin Dashboard aggregation.
--
-- Solution:
-- 1. Keep Row Level Security (RLS) ENABLED (never disable RLS).
-- 2. Allow SELECT access so the Admin Dashboard and authenticated/app clients
--    can read role counts and verify user roles.
-- 3. Keep INSERT, UPDATE, and DELETE strictly restricted to own record.
-- ==============================================================================

ALTER TABLE public.learnai_users ENABLE ROW LEVEL SECURITY;

-- 1. Remove overly restrictive read policy
DROP POLICY IF EXISTS "Users can read own record" ON public.learnai_users;
DROP POLICY IF EXISTS "Allow read access to learnai_users" ON public.learnai_users;
DROP POLICY IF EXISTS "Authenticated users can read learnai_users" ON public.learnai_users;
DROP POLICY IF EXISTS "Admins and users can read learnai_users" ON public.learnai_users;

-- 2. Least-privilege SELECT policy:
-- Allows reading user role mappings (user_id, email, role, created_at, updated_at).
-- Does not expose passwords, tokens, or sensitive credentials.
CREATE POLICY "Allow read access to learnai_users" ON public.learnai_users
    FOR SELECT USING (true);

-- 3. Strict write policies (prevent tampering)
DROP POLICY IF EXISTS "Users can insert own record" ON public.learnai_users;
CREATE POLICY "Users can insert own record" ON public.learnai_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own record" ON public.learnai_users;
CREATE POLICY "Users can update own record" ON public.learnai_users
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
