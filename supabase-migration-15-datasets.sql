-- ==============================================================================
-- LearnAI: Supabase Safe Database Migration for 15 Datasets
-- Aligned with LearnPath_AI_Datasets specifications
-- Fixes Data Type Mismatches (e.g. "invalid syntax for Student_ID")
-- Single-Institution Architecture (No multi-institution clutter)
-- ==============================================================================
-- ROOT CAUSE ANALYSIS & RESOLUTION:
-- 1. Identifiers like 'STU001', 'CRS001', 'USR001', 'MEN001', 'TRN001' are alphanumeric TEXT strings.
--    If any column ending in '_ID' was created as INTEGER or UUID, Postgres throws:
--    "ERROR: invalid input syntax for integer: 'STU001'" or "invalid input syntax for type uuid".
-- 2. This migration alters all ID columns to TEXT safely without losing any existing data.
-- 3. It establishes proper types for all 15 tables:
--    - Identifiers & codes: TEXT
--    - Descriptive fields & names: TEXT
--    - Counts & quantities: INTEGER
--    - Scores, metrics, percentages: NUMERIC
--    - Dates: DATE or TIMESTAMPTZ
--    - Flags: BOOLEAN
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- STEP 1: SAFE ALTERATIONS FOR EXISTING TABLES (Preserving all existing records)
-- ==============================================================================

-- If public.students exists with UUID or INT student_id / id:
DO $$
BEGIN
    -- Ensure student_id column exists as TEXT
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'student_id') THEN
            ALTER TABLE public.students ALTER COLUMN student_id TYPE TEXT USING student_id::TEXT;
        ELSE
            ALTER TABLE public.students ADD COLUMN student_id TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'user_id') THEN
            ALTER TABLE public.students ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'current_course_id') THEN
            ALTER TABLE public.students ALTER COLUMN current_course_id TYPE TEXT USING current_course_id::TEXT;
        ELSE
            ALTER TABLE public.students ADD COLUMN current_course_id TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'mentor_id') THEN
            ALTER TABLE public.students ALTER COLUMN mentor_id TYPE TEXT USING mentor_id::TEXT;
        ELSE
            ALTER TABLE public.students ADD COLUMN mentor_id TEXT;
        END IF;
    END IF;

    -- Mentors alterations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mentors') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mentors' AND column_name = 'mentor_id') THEN
            ALTER TABLE public.mentors ALTER COLUMN mentor_id TYPE TEXT USING mentor_id::TEXT;
        ELSE
            ALTER TABLE public.mentors ADD COLUMN mentor_id TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mentors' AND column_name = 'user_id') THEN
            ALTER TABLE public.mentors ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;
    END IF;

    -- Trainers alterations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainers') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trainers' AND column_name = 'trainer_id') THEN
            ALTER TABLE public.trainers ALTER COLUMN trainer_id TYPE TEXT USING trainer_id::TEXT;
        ELSE
            ALTER TABLE public.trainers ADD COLUMN trainer_id TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trainers' AND column_name = 'user_id') THEN
            ALTER TABLE public.trainers ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;
    END IF;

    -- Courses alterations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'course_id') THEN
            ALTER TABLE public.courses ALTER COLUMN course_id TYPE TEXT USING course_id::TEXT;
        ELSE
            ALTER TABLE public.courses ADD COLUMN course_id TEXT;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'trainer_id') THEN
            ALTER TABLE public.courses ALTER COLUMN trainer_id TYPE TEXT USING trainer_id::TEXT;
        END IF;
    END IF;
END $$;

-- ==============================================================================
-- STEP 2: CREATE / ENSURE ALL 15 DATASET TABLES EXIST WITH CORRECT DATA TYPES
-- ==============================================================================

-- 1. APP_USERS (Bridges dataset user records with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.app_users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'mentor', 'trainer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    phone TEXT,
    avatar_url TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. MENTORS (Mentor roster and specialization)
CREATE TABLE IF NOT EXISTS public.mentors (
    mentor_id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    qualification TEXT DEFAULT 'Industry Specialist',
    specialization TEXT DEFAULT 'AI & Machine Learning',
    years_of_experience NUMERIC DEFAULT 5,
    skills TEXT[] DEFAULT ARRAY['Machine Learning', 'Python', 'System Design']::TEXT[],
    availability TEXT DEFAULT 'Available',
    max_mentees INTEGER DEFAULT 15,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TRAINERS (Curriculum trainers and subject expertise)
CREATE TABLE IF NOT EXISTS public.trainers (
    trainer_id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    qualification TEXT DEFAULT 'Senior Technical Instructor',
    specialization TEXT DEFAULT 'Full-Stack Development & AI',
    experience_years NUMERIC DEFAULT 7,
    skills TEXT[] DEFAULT ARRAY['Python', 'Cloud Architecture', 'Full-Stack']::TEXT[],
    courses_can_teach TEXT[] DEFAULT ARRAY['AI Career Pathway', 'Full Stack Development']::TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. COURSES (Course curriculum catalog)
CREATE TABLE IF NOT EXISTS public.courses (
    course_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Computer Science',
    duration TEXT NOT NULL DEFAULT '8 Weeks',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    skills_covered TEXT[] DEFAULT ARRAY['Python', 'Problem Solving']::TEXT[],
    learning_level TEXT NOT NULL DEFAULT 'Undergraduate',
    trainer_id TEXT,
    enrolled_count INTEGER DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.85,
    total_lessons INTEGER DEFAULT 12,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. CONTENT_CHUNKS (Module chapters, lessons, and content units)
CREATE TABLE IF NOT EXISTS public.content_chunks (
    chunk_id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    module_title TEXT NOT NULL,
    chunk_order INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    duration TEXT DEFAULT '30 min',
    content_summary TEXT,
    content_body TEXT,
    resource_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. STUDENTS (Student directory)
CREATE TABLE IF NOT EXISTS public.students (
    student_id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    college_name TEXT DEFAULT 'University / College',
    degree TEXT DEFAULT 'Bachelor of Technology',
    branch TEXT DEFAULT 'Computer Science',
    graduation_year TEXT DEFAULT '2026',
    learning_level TEXT DEFAULT 'Undergraduate',
    skills TEXT[] DEFAULT ARRAY['Python', 'Data Structures']::TEXT[],
    career_goal TEXT DEFAULT 'Software Engineer',
    current_course_id TEXT,
    mentor_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. STUDENT_FEATURES (KPIs: readiness, study streak, attendance, risk flags)
CREATE TABLE IF NOT EXISTS public.student_features (
    student_id TEXT PRIMARY KEY,
    readiness_score NUMERIC(5, 2) NOT NULL DEFAULT 45.0,
    job_ready_target NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    overall_progress NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    weekly_study_hours NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    target_study_hours NUMERIC(5, 2) NOT NULL DEFAULT 15.0,
    avg_assessment_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    assignments_completed INTEGER NOT NULL DEFAULT 0,
    total_assignments INTEGER NOT NULL DEFAULT 0,
    attendance_rate NUMERIC(5, 2) NOT NULL DEFAULT 85.0,
    risk_status TEXT NOT NULL DEFAULT 'Good' CHECK (risk_status IN ('Good', 'Needs Attention', 'At Risk')),
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. SKILL_ASSESSMENTS (Competency evaluations, benchmarks, and percentiles)
CREATE TABLE IF NOT EXISTS public.skill_assessments (
    assessment_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT,
    skill_name TEXT NOT NULL,
    category TEXT DEFAULT 'Technical Core',
    score NUMERIC(5, 2) NOT NULL,
    benchmark_score NUMERIC(5, 2) NOT NULL DEFAULT 75.0,
    target_score NUMERIC(5, 2) NOT NULL DEFAULT 85.0,
    percentile TEXT,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'passed' CHECK (status IN ('passed', 'needs_improvement', 'mastered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ASSIGNMENTS (Curriculum tasks and due dates)
CREATE TABLE IF NOT EXISTS public.assignments (
    assignment_id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    trainer_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 100,
    passing_score INTEGER NOT NULL DEFAULT 60,
    batch_name TEXT DEFAULT 'Batch 2026-A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. SUBMISSIONS (Student submissions and grades)
CREATE TABLE IF NOT EXISTS public.submissions (
    submission_id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    evaluator_id TEXT,
    submission_url TEXT,
    score NUMERIC(5, 2),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'evaluated', 'pending_review', 'late')),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    graded_at TIMESTAMPTZ
);

-- 11. WEEKLY_ENGAGEMENT (Weekly activity tracking)
CREATE TABLE IF NOT EXISTS public.weekly_engagement (
    engagement_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    week_label TEXT NOT NULL,
    day_name TEXT NOT NULL CHECK (day_name IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    study_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    target_hours NUMERIC(4, 2) NOT NULL DEFAULT 2.5,
    active_logins INTEGER NOT NULL DEFAULT 1,
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 12. DOUBTS (Student questions and mentor resolutions)
CREATE TABLE IF NOT EXISTS public.doubts (
    doubt_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT,
    mentor_id TEXT,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
    resolution_status TEXT NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'in_review', 'resolved')),
    solution TEXT,
    asked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- 13. PRACTICE_SESSIONS (Drill questions and topic accuracy)
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    practice_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    questions_answered INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    is_weak BOOLEAN NOT NULL DEFAULT false,
    recommendation TEXT,
    practiced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. MOCK_INTERVIEWS (Mock interview scores by attempt)
CREATE TABLE IF NOT EXISTS public.mock_interviews (
    interview_id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    mentor_id TEXT,
    attempt_label TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'Software Engineer',
    technical_score NUMERIC(5, 2) NOT NULL,
    behavioral_score NUMERIC(5, 2) NOT NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    cohort_avg_score NUMERIC(5, 2) NOT NULL DEFAULT 65.0,
    feedback TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 15. MENTOR_ESCALATIONS (Flagged student risk and interventions)
CREATE TABLE IF NOT EXISTS public.mentor_escalations (
    escalation_id TEXT PRIMARY KEY,
    mentor_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Doubt Resolution', 'Assignment Blockers', 'Low Attendance / Inactive', 'Career & Portfolio Guidance')),
    severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT NOT NULL,
    action_taken TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- ==============================================================================
-- INDEXES FOR FAST QUERY EXECUTION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON public.mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_trainers_user_id ON public.trainers(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_student ON public.skill_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_weekly_engagement_student ON public.weekly_engagement(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_student ON public.doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_mentor ON public.doubts(mentor_id);
CREATE INDEX IF NOT EXISTS idx_practice_student ON public.practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_student ON public.mock_interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_mentor ON public.mock_interviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_escalations_mentor ON public.mentor_escalations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_escalations_student ON public.mentor_escalations(student_id);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_escalations ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Safe baseline RLS policies
DROP POLICY IF EXISTS "Admins full access to app_users" ON public.app_users;
CREATE POLICY "Admins full access to app_users" ON public.app_users FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Users can view own app_user" ON public.app_users;
CREATE POLICY "Users can view own app_user" ON public.app_users FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to student_features" ON public.student_features;
CREATE POLICY "Admins full access to student_features" ON public.student_features FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students view own features" ON public.student_features;
CREATE POLICY "Students view own features" ON public.student_features FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = student_features.student_id AND u.auth_user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Mentors and Trainers view student_features" ON public.student_features;
CREATE POLICY "Mentors and Trainers view student_features" ON public.student_features FOR SELECT USING (
    public.current_user_role() IN ('mentor', 'trainer')
);

DROP POLICY IF EXISTS "Anyone can view published content_chunks" ON public.content_chunks;
CREATE POLICY "Anyone can view published content_chunks" ON public.content_chunks FOR SELECT USING (is_published = true OR public.is_admin());
DROP POLICY IF EXISTS "Trainers and Admins manage content_chunks" ON public.content_chunks;
CREATE POLICY "Trainers and Admins manage content_chunks" ON public.content_chunks FOR ALL USING (public.is_admin() OR public.current_user_role() = 'trainer');

DROP POLICY IF EXISTS "Anyone authenticated can view courses" ON public.courses;
CREATE POLICY "Anyone authenticated can view courses" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins and Trainers manage courses" ON public.courses;
CREATE POLICY "Admins and Trainers manage courses" ON public.courses FOR ALL USING (public.is_admin() OR public.current_user_role() = 'trainer');

DROP POLICY IF EXISTS "Anyone authenticated can view mentors" ON public.mentors;
CREATE POLICY "Anyone authenticated can view mentors" ON public.mentors FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Anyone authenticated can view trainers" ON public.trainers;
CREATE POLICY "Anyone authenticated can view trainers" ON public.trainers FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Anyone authenticated view assignments" ON public.assignments;
CREATE POLICY "Anyone authenticated view assignments" ON public.assignments FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Trainers and Admins manage assignments" ON public.assignments;
CREATE POLICY "Trainers and Admins manage assignments" ON public.assignments FOR ALL USING (public.is_admin() OR public.current_user_role() = 'trainer');

DROP POLICY IF EXISTS "Admins full access to submissions" ON public.submissions;
CREATE POLICY "Admins full access to submissions" ON public.submissions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students view and submit own work" ON public.submissions;
CREATE POLICY "Students view and submit own work" ON public.submissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = submissions.student_id AND u.auth_user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Trainers evaluate submissions" ON public.submissions;
CREATE POLICY "Trainers evaluate submissions" ON public.submissions FOR ALL USING (public.current_user_role() = 'trainer');

DROP POLICY IF EXISTS "Admins full access to doubts" ON public.doubts;
CREATE POLICY "Admins full access to doubts" ON public.doubts FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students manage own doubts" ON public.doubts;
CREATE POLICY "Students manage own doubts" ON public.doubts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = doubts.student_id AND u.auth_user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Mentors and Trainers resolve doubts" ON public.doubts;
CREATE POLICY "Mentors and Trainers resolve doubts" ON public.doubts FOR ALL USING (public.current_user_role() IN ('mentor', 'trainer'));

DROP POLICY IF EXISTS "Admins full access to practice_sessions" ON public.practice_sessions;
CREATE POLICY "Admins full access to practice_sessions" ON public.practice_sessions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students manage own practice_sessions" ON public.practice_sessions;
CREATE POLICY "Students manage own practice_sessions" ON public.practice_sessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = practice_sessions.student_id AND u.auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins full access to mock_interviews" ON public.mock_interviews;
CREATE POLICY "Admins full access to mock_interviews" ON public.mock_interviews FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Students view own mock_interviews" ON public.mock_interviews;
CREATE POLICY "Students view own mock_interviews" ON public.mock_interviews FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.app_users u ON s.user_id = u.user_id
        WHERE s.student_id = mock_interviews.student_id AND u.auth_user_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "Mentors conduct and evaluate mock_interviews" ON public.mock_interviews;
CREATE POLICY "Mentors conduct and evaluate mock_interviews" ON public.mock_interviews FOR ALL USING (public.current_user_role() = 'mentor');

DROP POLICY IF EXISTS "Admins full access to mentor_escalations" ON public.mentor_escalations;
CREATE POLICY "Admins full access to mentor_escalations" ON public.mentor_escalations FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Mentors manage own escalations" ON public.mentor_escalations;
CREATE POLICY "Mentors manage own escalations" ON public.mentor_escalations FOR ALL USING (public.current_user_role() = 'mentor');
