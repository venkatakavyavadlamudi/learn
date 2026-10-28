-- Migration: Map super_admin role to admin in public.learnai_users
UPDATE public.learnai_users
SET role = 'admin'
WHERE role = 'super_admin';

-- Verify the change (optional)
-- SELECT * FROM public.learnai_users WHERE role = 'admin';
