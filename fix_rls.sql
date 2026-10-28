-- 1. Enable RLS on learnai_users
ALTER TABLE public.learnai_users ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy for users to read their own record
CREATE POLICY "Users can read own record" ON public.learnai_users
FOR SELECT
USING (auth.uid() = user_id);

-- 3. If you want to ensure they can't see others, this policy is already doing that by restricting to their own UID.
