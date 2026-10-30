-- =========================================================
-- LearnAI Mentor Analytical Portal RLS Security Policies
-- =========================================================
-- Grants least-privilege SELECT access to authenticated users
-- with role 'mentor', 'admin', or 'institution_admin' across
-- students, student_features, mock_interviews, doubts, and mentor_escalations.

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE IF EXISTS public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentor_escalations ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy restrictive policies if existing
DROP POLICY IF EXISTS "Mentors can read self record" ON public.mentors;
DROP POLICY IF EXISTS "Mentors can read assigned students" ON public.students;
DROP POLICY IF EXISTS "Mentors can read student_features" ON public.student_features;
DROP POLICY IF EXISTS "Mentors can read mock_interviews" ON public.mock_interviews;
DROP POLICY IF EXISTS "Mentors can read doubts" ON public.doubts;
DROP POLICY IF EXISTS "Mentors can read mentor_escalations" ON public.mentor_escalations;

-- 3. Mentors SELECT policy
CREATE POLICY "Mentors can read self record"
ON public.mentors FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.current_user_role() IN ('mentor', 'admin', 'institution_admin')
);

-- 4. Students SELECT policy for Mentors
CREATE POLICY "Mentors can read assigned students"
ON public.students FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.current_user_role() IN ('mentor', 'admin', 'institution_admin')
  OR mentor_id IN (
    SELECT mentor_id FROM public.mentors WHERE user_id = auth.uid()
  )
);

-- 5. Student Features SELECT policy for Mentors
CREATE POLICY "Mentors can read student_features"
ON public.student_features FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('mentor', 'admin', 'institution_admin')
  OR student_id IN (
    SELECT student_id FROM public.students
    WHERE mentor_id IN (SELECT mentor_id FROM public.mentors WHERE user_id = auth.uid())
       OR user_id = auth.uid()
  )
);

-- 6. Mock Interviews SELECT policy for Mentors
CREATE POLICY "Mentors can read mock_interviews"
ON public.mock_interviews FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('mentor', 'admin', 'institution_admin')
  OR mentor_id IN (SELECT mentor_id FROM public.mentors WHERE user_id = auth.uid())
);

-- 7. Doubts SELECT policy for Mentors
CREATE POLICY "Mentors can read doubts"
ON public.doubts FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('mentor', 'admin', 'institution_admin')
);

-- 8. Mentor Escalations SELECT policy for Mentors
CREATE POLICY "Mentors can read mentor_escalations"
ON public.mentor_escalations FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('mentor', 'admin', 'institution_admin')
  OR mentor_id IN (SELECT mentor_id FROM public.mentors WHERE user_id = auth.uid())
);
