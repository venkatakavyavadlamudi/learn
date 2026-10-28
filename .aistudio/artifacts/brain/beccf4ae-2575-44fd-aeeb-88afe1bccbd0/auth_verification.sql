-- ==============================================================================
-- LearnAI: Auth & Role Resolution Verification Script
-- ==============================================================================

-- 1. SCHEMA VERIFICATION
-- Ensure learnai_users exists with correct columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learnai_users') THEN
        RAISE NOTICE 'Creating missing learnai_users table...';
        CREATE TABLE public.learnai_users (
            user_id UUID PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'mentor', 'trainer')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

-- 2. RLS POLICY VERIFICATION
-- Ensure authenticated users can read, insert, and update their own records
-- (Necessary for client-side upsert in registerUser and completeRegistration)

ALTER TABLE public.learnai_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own record" ON public.learnai_users;
CREATE POLICY "Users can read own record" ON public.learnai_users
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own record" ON public.learnai_users;
CREATE POLICY "Users can insert own record" ON public.learnai_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own record" ON public.learnai_users;
CREATE POLICY "Users can update own record" ON public.learnai_users
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. TESTING PROCEDURES

/*
TEST CASE 1: New Signup
1. Navigate to /signup
2. Register a new account with a fresh email.
3. Verify that the user lands on the Student Dashboard.
4. Run the following SQL to verify the record:
   SELECT * FROM public.learnai_users WHERE email = 'YOUR_NEW_EMAIL';
   SELECT * FROM public.students WHERE email = 'YOUR_NEW_EMAIL';

TEST CASE 2: Login with Existing User (Role Sync)
1. Navigate to /login
2. Login with an account that exists in auth.users but is MISSING from learnai_users.
3. Observe the "Account Verification Notice" with the "Complete Registration" button.
4. Click "Complete Registration".
5. Verify that the user is successfully routed to the Student Dashboard.
6. Run the following SQL to verify the newly created record:
   SELECT * FROM public.learnai_users WHERE email = 'YOUR_EMAIL';

TEST CASE 3: Role-Based Routing
1. Manually update a user's role in the database:
   UPDATE public.learnai_users SET role = 'trainer' WHERE email = 'YOUR_EMAIL';
2. Refresh the dashboard or log in again.
3. Verify that the user is redirected to the Trainer Dashboard (/trainer).

TEST CASE 4: Duplicate Signup Attempt
1. Attempt to sign up with an email that is already registered in Supabase Auth.
2. Verify that a clear error message is shown (e.g., "User already registered").
*/

-- 4. CLEANUP (For testing only - Use with caution)
-- To simulate a "missing profile" state for a user:
-- DELETE FROM public.learnai_users WHERE email = 'YOUR_EMAIL';
-- DELETE FROM public.students WHERE email = 'YOUR_EMAIL';
-- DELETE FROM public.app_users WHERE email = 'YOUR_EMAIL';
