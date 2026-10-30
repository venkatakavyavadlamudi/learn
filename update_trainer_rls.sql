-- ==============================================================================
-- LearnAI: Trainer RLS Access Policies for Academic Portal Telemetry
-- ==============================================================================
-- Ensures logged-in Trainers (whose role in learnai_users is 'trainer') can SELECT
-- records from students, submissions, skill_assessments, practice_sessions, student_features,
-- assignments, and courses without disabling RLS.
-- ==============================================================================

-- 1. Helper function for role check
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.learnai_users 
    WHERE user_id = auth.uid() OR email = (auth.jwt() ->> 'email') 
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Students Policy
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers view assigned students" ON public.students;
CREATE POLICY "Trainers view assigned students" ON public.students 
    FOR SELECT USING (
        public.current_user_role() IN ('trainer', 'admin', 'institution_admin', 'super_admin') 
        OR auth.uid() = user_id
    );

-- 3. Submissions Policy
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers view submissions" ON public.submissions;
CREATE POLICY "Trainers view submissions" ON public.submissions 
    FOR SELECT USING (
        public.current_user_role() IN ('trainer', 'admin', 'institution_admin', 'super_admin') 
        OR auth.role() = 'authenticated'
    );

-- 4. Skill Assessments Policy
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers view skill_assessments" ON public.skill_assessments;
CREATE POLICY "Trainers view skill_assessments" ON public.skill_assessments 
    FOR SELECT USING (
        public.current_user_role() IN ('trainer', 'admin', 'institution_admin', 'super_admin') 
        OR auth.role() = 'authenticated'
    );

-- 5. Practice Sessions Policy
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers view practice_sessions" ON public.practice_sessions;
CREATE POLICY "Trainers view practice_sessions" ON public.practice_sessions 
    FOR SELECT USING (
        public.current_user_role() IN ('trainer', 'admin', 'institution_admin', 'super_admin') 
        OR auth.role() = 'authenticated'
    );

-- 6. Student Features Policy
ALTER TABLE public.student_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trainers view student_features" ON public.student_features;
CREATE POLICY "Trainers view student_features" ON public.student_features 
    FOR SELECT USING (
        public.current_user_role() IN ('trainer', 'admin', 'institution_admin', 'super_admin') 
        OR auth.role() = 'authenticated'
    );

-- 7. Courses & Assignments Policy
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view courses" ON public.courses;
CREATE POLICY "Anyone view courses" ON public.courses FOR SELECT USING (true);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view assignments" ON public.assignments;
CREATE POLICY "Anyone view assignments" ON public.assignments FOR SELECT USING (true);
