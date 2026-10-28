-- ==============================================================================
-- LearnAI: Complete Supabase Database Schema, Functions & RLS Policies
-- ==============================================================================
-- Roles supported: 'admin', 'student', 'mentor', 'trainer'
-- All public signups automatically receive the 'student' role.
-- RLS policies restrict data access per role while giving Admin full governance.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Mirrors auth.users with app-specific metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'mentor', 'trainer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    college_name TEXT DEFAULT 'University / College',
    degree TEXT DEFAULT 'Bachelor of Technology',
    branch TEXT DEFAULT 'Computer Science',
    graduation_year TEXT DEFAULT '2026',
    learning_level TEXT DEFAULT 'Undergraduate',
    skills TEXT[] DEFAULT ARRAY['Python', 'Problem Solving', 'Data Structures']::TEXT[],
    career_goal TEXT DEFAULT 'Software Engineer',
    course_progress INTEGER DEFAULT 0,
    readiness_score INTEGER DEFAULT 45,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. MENTORS TABLE
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    qualification TEXT DEFAULT 'M.Tech / Industry Specialist',
    specialization TEXT DEFAULT 'AI & Machine Learning',
    years_of_experience INTEGER DEFAULT 5,
    skills TEXT[] DEFAULT ARRAY['Machine Learning', 'Python', 'System Design']::TEXT[],
    availability TEXT DEFAULT 'Available',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TRAINERS TABLE
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    qualification TEXT DEFAULT 'Senior Technical Instructor',
    specialization TEXT DEFAULT 'Full-Stack Development & AI',
    experience_years INTEGER DEFAULT 7,
    skills TEXT[] DEFAULT ARRAY['Full-Stack', 'Cloud Architecture', 'Python']::TEXT[],
    courses_can_teach TEXT[] DEFAULT ARRAY['AI Career Pathway', 'Full Stack Development']::TEXT[],
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Artificial Intelligence',
    duration TEXT NOT NULL DEFAULT '8 Weeks',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    skills_covered TEXT[] DEFAULT ARRAY['Python', 'Data Science', 'Machine Learning']::TEXT[],
    learning_level TEXT NOT NULL DEFAULT 'Undergraduate',
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    enrolled_count INTEGER DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 4.85,
    total_lessons INTEGER DEFAULT 12,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed BOOLEAN NOT NULL DEFAULT false,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- 8. LEARNING PROGRESS TABLE (Lesson-level tracking)
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    lesson_title TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, course_id, lesson_id)
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION & STUDENT ROLE ENFORCEMENT TRIGGER
-- ==============================================================================
-- Ensures that EVERY signup through Supabase Auth automatically gets:
-- 1. A public.profiles record with role='student' (or preserved admin if first admin)
-- 2. A public.students record
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role TEXT;
    parsed_full_name TEXT;
    existing_admin_count INTEGER;
BEGIN
    -- Check if there are any existing admins in the system
    SELECT count(*) INTO existing_admin_count FROM public.profiles WHERE role = 'admin';

    -- If this is the very first registered user and explicitly tagged or system empty, allow admin bootstrap
    IF existing_admin_count = 0 AND (NEW.raw_user_meta_data->>'role' = 'admin' OR NEW.email LIKE '%admin%') THEN
        assigned_role := 'admin';
    ELSE
        -- MANDATORY REQUIREMENT: All public registrations are assigned the Student role
        assigned_role := 'student';
    END IF;

    -- Extract full name from metadata, fallback to email prefix
    parsed_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- 1. Insert into public.profiles
    INSERT INTO public.profiles (id, email, full_name, phone, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        parsed_full_name,
        NEW.raw_user_meta_data->>'phone',
        assigned_role,
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = timezone('utc'::text, now());

    -- 2. If assigned_role is 'student', automatically create student record
    IF assigned_role = 'student' THEN
        INSERT INTO public.students (user_id, full_name, email, phone)
        VALUES (
            NEW.id,
            parsed_full_name,
            NEW.email,
            NEW.raw_user_meta_data->>'phone'
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- --- 1. PROFILES POLICIES ---
-- Admin can view and modify all profiles
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (name, phone, avatar) but not their role or status directly
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --- 2. STUDENTS POLICIES ---
-- Admin has full access to student records
CREATE POLICY "Admins full access to students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- Students can read and update their own record
CREATE POLICY "Students can view own record"
    ON public.students FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Students can update own record"
    ON public.students FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Mentors and Trainers can view students
CREATE POLICY "Mentors and Trainers can view students"
    ON public.students FOR SELECT
    USING (public.current_user_role() IN ('mentor', 'trainer'));

-- --- 3. MENTORS POLICIES ---
CREATE POLICY "Admins full access to mentors"
    ON public.mentors FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone authenticated can view mentors"
    ON public.mentors FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Mentors can update own record"
    ON public.mentors FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- --- 4. TRAINERS POLICIES ---
CREATE POLICY "Admins full access to trainers"
    ON public.trainers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Anyone authenticated can view trainers"
    ON public.trainers FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Trainers can update own record"
    ON public.trainers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- --- 5. COURSES POLICIES ---
-- Anyone (even public visitors) can browse published courses
CREATE POLICY "Anyone can view published courses"
    ON public.courses FOR SELECT
    USING (is_published = true OR public.is_admin() OR auth.uid() = trainer_id);

-- Admins and Trainers can create/edit courses
CREATE POLICY "Admins and Trainers can manage courses"
    ON public.courses FOR ALL
    USING (public.is_admin() OR (public.current_user_role() = 'trainer' AND auth.uid() = trainer_id));

-- --- 6. ENROLLMENTS POLICIES ---
-- Admin has full access
CREATE POLICY "Admins full access to enrollments"
    ON public.enrollments FOR ALL
    USING (public.is_admin());

-- Students can view and create their own enrollments
CREATE POLICY "Students can view own enrollments"
    ON public.enrollments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Students can enroll in courses"
    ON public.enrollments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own enrollment progress"
    ON public.enrollments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trainers can view enrollments for courses they teach
CREATE POLICY "Trainers can view course enrollments"
    ON public.enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = enrollments.course_id AND courses.trainer_id = auth.uid()
        )
    );

-- --- 7. LEARNING PROGRESS POLICIES ---
CREATE POLICY "Admins full access to learning progress"
    ON public.learning_progress FOR ALL
    USING (public.is_admin());

CREATE POLICY "Students can manage own learning progress"
    ON public.learning_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- INITIAL SEED COURSES (Provides immediate ready content)
-- ==============================================================================
INSERT INTO public.courses (title, description, category, duration, difficulty, skills_covered, learning_level, rating, enrolled_count)
VALUES 
    (
        'Machine Learning & AI Foundations',
        'Master core statistical learning, regression, neural networks, and modern deep learning models for practical industry applications.',
        'Artificial Intelligence',
        '8 Weeks',
        'Beginner',
        ARRAY['Python', 'NumPy', 'Scikit-Learn', 'Linear Algebra']::TEXT[],
        'Undergraduate',
        4.92,
        420
    ),
    (
        'Generative AI & LLM Application Engineering',
        'Build production-grade applications using modern LLMs, vector databases, RAG architecture, function calling, and prompt engineering.',
        'Artificial Intelligence',
        '10 Weeks',
        'Intermediate',
        ARRAY['LangChain', 'OpenAI', 'Vector DBs', 'FastAPI', 'RAG']::TEXT[],
        'Undergraduate',
        4.96,
        612
    ),
    (
        'Full-Stack Modern Web & Cloud Architecture',
        'Develop scalable, responsive web systems using React, TypeScript, Node.js, and modern serverless database platforms.',
        'Software Engineering',
        '12 Weeks',
        'Intermediate',
        ARRAY['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'PostgreSQL']::TEXT[],
        'Undergraduate',
        4.88,
        540
    )
ON CONFLICT DO NOTHING;
