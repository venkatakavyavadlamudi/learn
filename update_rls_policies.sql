-- ==============================================================================
-- LearnAI: Least-Privilege RLS Helper Functions & Role Policies
-- ==============================================================================
-- Fixes RLS functions (public.is_admin, public.is_learnai_admin, public.current_user_role)
-- to target public.learnai_users instead of non-existent public.profiles table.
-- Ensures authenticated Admins can read all dataset metrics while preserving RLS on every table.
-- ==============================================================================

-- 1. Role Resolution Functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.learnai_users 
    WHERE user_id = auth.uid() OR email = (auth.jwt() ->> 'email') 
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.learnai_users 
        WHERE (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
          AND (lower(role) IN ('admin', 'institution_admin', 'super_admin', 'institution admin'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_learnai_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.learnai_users 
        WHERE (user_id = auth.uid() OR email = (auth.jwt() ->> 'email'))
          AND (lower(role) IN ('admin', 'institution_admin', 'super_admin', 'institution admin'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. LEAST-PRIVILEGE RLS POLICIES (Keep RLS Enabled everywhere)

-- A. learnai_users
ALTER TABLE public.learnai_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to learnai_users" ON public.learnai_users;
CREATE POLICY "Allow read access to learnai_users" ON public.learnai_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own learnai_users" ON public.learnai_users;
CREATE POLICY "Users insert own learnai_users" ON public.learnai_users FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own learnai_users" ON public.learnai_users;
CREATE POLICY "Users update own learnai_users" ON public.learnai_users FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- B. students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to students" ON public.students;
CREATE POLICY "Admins full access to students" ON public.students FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students view own record" ON public.students;
CREATE POLICY "Students view own record" ON public.students FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- C. mentors
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to mentors" ON public.mentors;
CREATE POLICY "Admins full access to mentors" ON public.mentors FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users view mentors" ON public.mentors;
CREATE POLICY "Authenticated users view mentors" ON public.mentors FOR SELECT USING (auth.role() = 'authenticated');

-- D. trainers
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to trainers" ON public.trainers;
CREATE POLICY "Admins full access to trainers" ON public.trainers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users view trainers" ON public.trainers;
CREATE POLICY "Authenticated users view trainers" ON public.trainers FOR SELECT USING (auth.role() = 'authenticated');

-- E. courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view courses" ON public.courses;
CREATE POLICY "Anyone view courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (public.is_admin());

-- F. student_features
ALTER TABLE public.student_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to student_features" ON public.student_features;
CREATE POLICY "Admins full access to student_features" ON public.student_features FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students view own features" ON public.student_features;
CREATE POLICY "Students view own features" ON public.student_features FOR SELECT USING (auth.uid() = student_id OR public.is_admin());

-- G. skill_assessments
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access to skill_assessments" ON public.skill_assessments;
CREATE POLICY "Admins full access to skill_assessments" ON public.skill_assessments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students view own assessments" ON public.skill_assessments;
CREATE POLICY "Students view own assessments" ON public.skill_assessments FOR SELECT USING (auth.uid() = student_id OR public.is_admin());
