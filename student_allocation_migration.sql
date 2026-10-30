-- ==============================================================================
-- LearnAI: Student Staff Allocation & Course Enrollment Migration
-- ==============================================================================

-- 1. ADD TRAINER_ID TO STUDENTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'trainer_id') THEN
        ALTER TABLE public.students ADD COLUMN trainer_id TEXT;
    END IF;
END $$;

-- 2. STUDENT STAFF ALLOCATIONS TABLE (History & Metadata)
CREATE TABLE IF NOT EXISTS public.student_staff_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    trainer_id TEXT REFERENCES public.trainers(trainer_id) ON DELETE SET NULL,
    mentor_id TEXT REFERENCES public.mentors(mentor_id) ON DELETE SET NULL,
    allocated_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'history')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. COURSE ENROLLMENTS TABLE (Multiple courses per student)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
    progress_percent NUMERIC(5, 2) DEFAULT 0.0,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, course_id)
);

-- 4. ENABLE RLS
ALTER TABLE public.student_staff_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- --- STUDENT_STAFF_ALLOCATIONS ---
DROP POLICY IF EXISTS "Admins full access to allocations" ON public.student_staff_allocations;
CREATE POLICY "Admins full access to allocations" ON public.student_staff_allocations FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view their own allocations" ON public.student_staff_allocations;
CREATE POLICY "Users can view their own allocations" ON public.student_staff_allocations FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = student_staff_allocations.student_id AND u.auth_user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.trainers t
        JOIN public.app_users u ON t.user_id = u.user_id
        WHERE t.trainer_id = student_staff_allocations.trainer_id AND u.auth_user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.mentors m
        JOIN public.app_users u ON m.user_id = u.user_id
        WHERE m.mentor_id = student_staff_allocations.mentor_id AND u.auth_user_id = auth.uid()
    )
);

-- --- COURSE_ENROLLMENTS ---
DROP POLICY IF EXISTS "Admins full access to enrollments" ON public.course_enrollments;
CREATE POLICY "Admins full access to enrollments" ON public.course_enrollments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Students manage own enrollments" ON public.course_enrollments;
CREATE POLICY "Students manage own enrollments" ON public.course_enrollments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = course_enrollments.student_id AND u.auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Trainers and Mentors view their students' enrollments" ON public.course_enrollments;
CREATE POLICY "Trainers and Mentors view their students' enrollments" ON public.course_enrollments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON (s.trainer_id = u.user_id OR s.mentor_id = u.user_id)
        WHERE s.student_id = course_enrollments.student_id AND u.auth_user_id = auth.uid()
    )
);

-- 6. UPDATE STUDENTS RLS FOR STAFF ACCESS
DROP POLICY IF EXISTS "Trainers view their allocated students" ON public.students;
CREATE POLICY "Trainers view their allocated students" ON public.students FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.trainers t
        JOIN public.app_users u ON t.user_id = u.user_id
        WHERE t.trainer_id = students.trainer_id AND u.auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Mentors view their allocated mentees" ON public.students;
CREATE POLICY "Mentors view their allocated mentees" ON public.students FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.mentors m
        JOIN public.app_users u ON m.user_id = u.user_id
        WHERE m.mentor_id = students.mentor_id AND u.auth_user_id = auth.uid()
    )
);
