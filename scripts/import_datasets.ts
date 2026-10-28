/**
 * LearnAI: 15-Dataset Case-Insensitive, Type-Safe Verification & Import Pipeline
 * Resolves: "invalid syntax for Student_ID", NaN conversions, and case mismatch issues.
 *
 * Supports all 15 datasets:
 *  1. app_users
 *  2. mentors
 *  3. trainers
 *  4. courses
 *  5. content_chunks
 *  6. students
 *  7. student_features
 *  8. skill_assessments
 *  9. assignments
 * 10. submissions
 * 11. weekly_engagement
 * 12. doubts
 * 13. practice_sessions
 * 14. mock_interviews
 * 15. mentor_escalations
 */

import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const DATA_DIR = path.resolve(process.cwd(), 'data');

/**
 * Creates a case-insensitive, type-coercing accessor for a CSV row.
 * Eliminates "undefined" strings, NaN integers, and inverted booleans.
 */
export function createRowAccessor(row: Record<string, any>) {
  const normalizedMap = new Map<string, any>();
  for (const [k, v] of Object.entries(row)) {
    const cleanKey = k.toLowerCase().replace(/[\s_-]/g, '');
    normalizedMap.set(cleanKey, v);
  }

  return {
    raw: row,

    getRaw(possibleKeys: string[]): any {
      for (const key of possibleKeys) {
        if (key in row && row[key] !== undefined) return row[key];
        const clean = key.toLowerCase().replace(/[\s_-]/g, '');
        if (normalizedMap.has(clean)) return normalizedMap.get(clean);
      }
      return undefined;
    },

    getString(possibleKeys: string[], fallback: string | null = null): string | null {
      const val = this.getRaw(possibleKeys);
      if (val === undefined || val === null) return fallback;
      const str = String(val).trim();
      return str.length > 0 ? str : fallback;
    },

    getInt(possibleKeys: string[], fallback: number | null = null): number | null {
      const val = this.getRaw(possibleKeys);
      if (val === undefined || val === null) return fallback;
      const str = String(val).trim();
      if (str === '') return fallback;
      const parsed = parseInt(str, 10);
      return isNaN(parsed) ? fallback : parsed;
    },

    getFloat(possibleKeys: string[], fallback: number | null = null): number | null {
      const val = this.getRaw(possibleKeys);
      if (val === undefined || val === null) return fallback;
      const str = String(val).trim();
      if (str === '') return fallback;
      const parsed = parseFloat(str);
      return isNaN(parsed) ? fallback : parsed;
    },

    getBoolean(possibleKeys: string[], fallback: boolean = false): boolean {
      const val = this.getRaw(possibleKeys);
      if (val === undefined || val === null) return fallback;
      const str = String(val).trim().toLowerCase();
      if (str === 'true' || str === '1' || str === 'yes' || str === 't' || str === 'y') return true;
      if (str === 'false' || str === '0' || str === 'no' || str === 'f' || str === 'n') return false;
      return fallback;
    },

    getDate(possibleKeys: string[], fallback: string | null = null): string | null {
      const val = this.getRaw(possibleKeys);
      if (val === undefined || val === null) return fallback;
      const str = String(val).trim();
      if (str === '') return fallback;
      const d = new Date(str);
      return isNaN(d.getTime()) ? fallback : d.toISOString();
    },

    getStringArray(possibleKeys: string[], fallback: string[] = []): string[] {
      const val = this.getRaw(possibleKeys);
      if (val === undefined || val === null) return fallback;
      if (Array.isArray(val)) return val.map((s) => String(s).trim());
      const str = String(val).trim();
      if (!str) return fallback;
      if (str.startsWith('[') && str.endsWith(']')) {
        try {
          return JSON.parse(str);
        } catch {}
      }
      return str.split(/[;,|]/).map((s) => s.trim()).filter(Boolean);
    },
  };
}

export interface DatasetMeta {
  name: string;
  csvFileName: string;
  tableName: string;
  primaryKey: string;
  transform: (accessor: ReturnType<typeof createRowAccessor>) => Record<string, any>;
}

export const DATASET_REGISTRY: DatasetMeta[] = [
  // 1. APP_USERS
  {
    name: 'App Users',
    csvFileName: 'app_users.csv',
    tableName: 'app_users',
    primaryKey: 'user_id',
    transform: (acc) => ({
      user_id: acc.getString(['User_ID', 'user_id', 'UserId', 'id'])!,
      email: acc.getString(['Email', 'email'])!.toLowerCase(),
      full_name: acc.getString(['Full_Name', 'full_name', 'Name', 'name'], 'User')!,
      role: acc.getString(['Role', 'role'], 'student')!.toLowerCase(),
      status: acc.getString(['Status', 'status'], 'active')!.toLowerCase(),
      phone: acc.getString(['Phone', 'phone']), // Preserves leading zeros!
      avatar_url: acc.getString(['Avatar_URL', 'avatar_url', 'AvatarUrl']),
      created_at: acc.getDate(['Created_At', 'created_at'], new Date().toISOString()),
    }),
  },

  // 2. MENTORS
  {
    name: 'Mentors',
    csvFileName: 'mentors.csv',
    tableName: 'mentors',
    primaryKey: 'mentor_id',
    transform: (acc) => ({
      mentor_id: acc.getString(['Mentor_ID', 'mentor_id', 'MentorId', 'id'])!,
      user_id: acc.getString(['User_ID', 'user_id', 'UserId']),
      full_name: acc.getString(['Full_Name', 'full_name', 'Name', 'name'], 'Mentor')!,
      email: acc.getString(['Email', 'email'])!.toLowerCase(),
      phone: acc.getString(['Phone', 'phone']),
      qualification: acc.getString(['Qualification', 'qualification'], 'Industry Specialist'),
      specialization: acc.getString(['Specialization', 'specialization'], 'AI & Machine Learning'),
      years_of_experience: acc.getFloat(['Years_Of_Experience', 'years_of_experience', 'experience'], 5),
      skills: acc.getStringArray(['Skills', 'skills'], ['Machine Learning', 'Python']),
      availability: acc.getString(['Availability', 'availability'], 'Available'),
      max_mentees: acc.getInt(['Max_Mentees', 'max_mentees'], 15),
      status: acc.getString(['Status', 'status'], 'active')!.toLowerCase(),
    }),
  },

  // 3. TRAINERS
  {
    name: 'Trainers',
    csvFileName: 'trainers.csv',
    tableName: 'trainers',
    primaryKey: 'trainer_id',
    transform: (acc) => ({
      trainer_id: acc.getString(['Trainer_ID', 'trainer_id', 'TrainerId', 'id'])!,
      user_id: acc.getString(['User_ID', 'user_id', 'UserId']),
      full_name: acc.getString(['Full_Name', 'full_name', 'Name', 'name'], 'Trainer')!,
      email: acc.getString(['Email', 'email'])!.toLowerCase(),
      phone: acc.getString(['Phone', 'phone']),
      qualification: acc.getString(['Qualification', 'qualification'], 'Senior Technical Instructor'),
      specialization: acc.getString(['Specialization', 'specialization'], 'Full-Stack Development & AI'),
      experience_years: acc.getFloat(['Experience_Years', 'experience_years', 'experience'], 7),
      skills: acc.getStringArray(['Skills', 'skills'], ['Python', 'System Architecture']),
      courses_can_teach: acc.getStringArray(['Courses_Can_Teach', 'courses_can_teach'], ['AI Career Pathway']),
      status: acc.getString(['Status', 'status'], 'active')!.toLowerCase(),
    }),
  },

  // 4. COURSES
  {
    name: 'Courses',
    csvFileName: 'courses.csv',
    tableName: 'courses',
    primaryKey: 'course_id',
    transform: (acc) => ({
      course_id: acc.getString(['Course_ID', 'course_id', 'CourseId', 'id'])!,
      title: acc.getString(['Title', 'title'])!,
      description: acc.getString(['Description', 'description'], ''),
      category: acc.getString(['Category', 'category'], 'Computer Science'),
      duration: acc.getString(['Duration', 'duration'], '8 Weeks'),
      difficulty: acc.getString(['Difficulty', 'difficulty'], 'Intermediate'),
      skills_covered: acc.getStringArray(['Skills_Covered', 'skills_covered', 'skills'], ['Python']),
      learning_level: acc.getString(['Learning_Level', 'learning_level'], 'Undergraduate'),
      trainer_id: acc.getString(['Trainer_ID', 'trainer_id', 'TrainerId']),
      enrolled_count: acc.getInt(['Enrolled_Count', 'enrolled_count'], 0),
      rating: acc.getFloat(['Rating', 'rating'], 4.8),
      total_lessons: acc.getInt(['Total_Lessons', 'total_lessons'], 12),
      is_published: acc.getBoolean(['Is_Published', 'is_published'], true),
    }),
  },

  // 5. CONTENT_CHUNKS
  {
    name: 'Content Chunks',
    csvFileName: 'content_chunks.csv',
    tableName: 'content_chunks',
    primaryKey: 'chunk_id',
    transform: (acc) => ({
      chunk_id: acc.getString(['Chunk_ID', 'chunk_id', 'ChunkId', 'id'])!,
      course_id: acc.getString(['Course_ID', 'course_id', 'CourseId'])!,
      module_id: acc.getString(['Module_ID', 'module_id', 'ModuleId'], 'MOD-01')!,
      module_title: acc.getString(['Module_Title', 'module_title'], 'Module 1')!,
      chunk_order: acc.getInt(['Chunk_Order', 'chunk_order', 'order'], 1),
      title: acc.getString(['Title', 'title'])!,
      duration: acc.getString(['Duration', 'duration'], '30 min'),
      content_summary: acc.getString(['Content_Summary', 'content_summary']),
      content_body: acc.getString(['Content_Body', 'content_body']),
      resource_url: acc.getString(['Resource_URL', 'resource_url', 'ResourceUrl']),
      is_published: acc.getBoolean(['Is_Published', 'is_published'], true),
    }),
  },

  // 6. STUDENTS
  {
    name: 'Students',
    csvFileName: 'students.csv',
    tableName: 'students',
    primaryKey: 'student_id',
    transform: (acc) => ({
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId', 'id'])!,
      user_id: acc.getString(['User_ID', 'user_id', 'UserId']),
      full_name: acc.getString(['Full_Name', 'full_name', 'Name', 'name'], 'Student')!,
      email: acc.getString(['Email', 'email'])!.toLowerCase(),
      phone: acc.getString(['Phone', 'phone']),
      college_name: acc.getString(['College_Name', 'college_name', 'CollegeName'], 'University'),
      degree: acc.getString(['Degree', 'degree'], 'Bachelor of Technology'),
      branch: acc.getString(['Branch', 'branch'], 'Computer Science'),
      graduation_year: acc.getString(['Graduation_Year', 'graduation_year'], '2026'),
      learning_level: acc.getString(['Learning_Level', 'learning_level'], 'Undergraduate'),
      skills: acc.getStringArray(['Skills', 'skills'], ['Python']),
      career_goal: acc.getString(['Career_Goal', 'career_goal'], 'Software Engineer'),
      current_course_id: acc.getString(['Current_Course_ID', 'current_course_id', 'Course_ID', 'course_id']),
      mentor_id: acc.getString(['Mentor_ID', 'mentor_id', 'MentorId']),
      status: acc.getString(['Status', 'status'], 'active')!.toLowerCase(),
    }),
  },

  // 7. STUDENT_FEATURES
  {
    name: 'Student Features',
    csvFileName: 'student_features.csv',
    tableName: 'student_features',
    primaryKey: 'student_id',
    transform: (acc) => ({
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      readiness_score: acc.getFloat(['Readiness_Score', 'readiness_score', 'readiness'], 45.0),
      job_ready_target: acc.getFloat(['Job_Ready_Target', 'job_ready_target', 'target'], 75.0),
      overall_progress: acc.getFloat(['Overall_Progress', 'overall_progress', 'progress'], 0.0),
      streak_days: acc.getInt(['Streak_Days', 'streak_days', 'streak'], 0),
      weekly_study_hours: acc.getFloat(['Weekly_Study_Hours', 'weekly_study_hours', 'study_hours'], 0.0),
      target_study_hours: acc.getFloat(['Target_Study_Hours', 'target_study_hours'], 15.0),
      avg_assessment_score: acc.getFloat(['Avg_Assessment_Score', 'avg_assessment_score'], 0.0),
      assignments_completed: acc.getInt(['Assignments_Completed', 'assignments_completed'], 0),
      total_assignments: acc.getInt(['Total_Assignments', 'total_assignments'], 0),
      attendance_rate: acc.getFloat(['Attendance_Rate', 'attendance_rate'], 85.0),
      risk_status: acc.getString(['Risk_Status', 'risk_status'], 'Good'),
      last_active_at: acc.getDate(['Last_Active_At', 'last_active_at']),
    }),
  },

  // 8. SKILL_ASSESSMENTS
  {
    name: 'Skill Assessments',
    csvFileName: 'skill_assessments.csv',
    tableName: 'skill_assessments',
    primaryKey: 'assessment_id',
    transform: (acc) => ({
      assessment_id: acc.getString(['Assessment_ID', 'assessment_id', 'AssessmentId', 'id'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      course_id: acc.getString(['Course_ID', 'course_id', 'CourseId']),
      skill_name: acc.getString(['Skill_Name', 'skill_name', 'Skill', 'skill'], 'General')!,
      category: acc.getString(['Category', 'category'], 'Technical Core'),
      score: acc.getFloat(['Score', 'score'], 0.0),
      benchmark_score: acc.getFloat(['Benchmark_Score', 'benchmark_score'], 75.0),
      target_score: acc.getFloat(['Target_Score', 'target_score'], 85.0),
      percentile: acc.getString(['Percentile', 'percentile']),
      assessment_date: acc.getDate(['Assessment_Date', 'assessment_date'], new Date().toISOString()),
      status: acc.getString(['Status', 'status'], 'passed'),
    }),
  },

  // 9. ASSIGNMENTS
  {
    name: 'Assignments',
    csvFileName: 'assignments.csv',
    tableName: 'assignments',
    primaryKey: 'assignment_id',
    transform: (acc) => ({
      assignment_id: acc.getString(['Assignment_ID', 'assignment_id', 'AssignmentId', 'id'])!,
      course_id: acc.getString(['Course_ID', 'course_id', 'CourseId'])!,
      trainer_id: acc.getString(['Trainer_ID', 'trainer_id', 'TrainerId']),
      title: acc.getString(['Title', 'title'])!,
      description: acc.getString(['Description', 'description']),
      due_date: acc.getDate(['Due_Date', 'due_date'], new Date(Date.now() + 86400000 * 7).toISOString()),
      total_points: acc.getInt(['Total_Points', 'total_points'], 100),
      passing_score: acc.getInt(['Passing_Score', 'passing_score'], 60),
      batch_name: acc.getString(['Batch_Name', 'batch_name'], 'Batch 2026-A'),
    }),
  },

  // 10. SUBMISSIONS
  {
    name: 'Submissions',
    csvFileName: 'submissions.csv',
    tableName: 'submissions',
    primaryKey: 'submission_id',
    transform: (acc) => ({
      submission_id: acc.getString(['Submission_ID', 'submission_id', 'SubmissionId', 'id'])!,
      assignment_id: acc.getString(['Assignment_ID', 'assignment_id', 'AssignmentId'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      evaluator_id: acc.getString(['Evaluator_ID', 'evaluator_id', 'Trainer_ID', 'trainer_id']),
      submission_url: acc.getString(['Submission_URL', 'submission_url']),
      score: acc.getFloat(['Score', 'score']),
      status: acc.getString(['Status', 'status'], 'submitted'),
      feedback: acc.getString(['Feedback', 'feedback']),
      submitted_at: acc.getDate(['Submitted_At', 'submitted_at'], new Date().toISOString()),
      graded_at: acc.getDate(['Graded_At', 'graded_at']),
    }),
  },

  // 11. WEEKLY_ENGAGEMENT
  {
    name: 'Weekly Engagement',
    csvFileName: 'weekly_engagement.csv',
    tableName: 'weekly_engagement',
    primaryKey: 'engagement_id',
    transform: (acc) => ({
      engagement_id: acc.getString(['Engagement_ID', 'engagement_id', 'EngagementId', 'id'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      week_label: acc.getString(['Week_Label', 'week_label', 'Week'], 'Wk 1')!,
      day_name: acc.getString(['Day_Name', 'day_name', 'Day'], 'Mon')!,
      study_hours: acc.getFloat(['Study_Hours', 'study_hours', 'hours'], 0.0),
      target_hours: acc.getFloat(['Target_Hours', 'target_hours'], 2.5),
      active_logins: acc.getInt(['Active_Logins', 'active_logins', 'logins'], 1),
      lessons_completed: acc.getInt(['Lessons_Completed', 'lessons_completed'], 0),
      recorded_date: acc.getString(['Recorded_Date', 'recorded_date', 'date'], new Date().toISOString().slice(0, 10)),
    }),
  },

  // 12. DOUBTS
  {
    name: 'Doubts',
    csvFileName: 'doubts.csv',
    tableName: 'doubts',
    primaryKey: 'doubt_id',
    transform: (acc) => ({
      doubt_id: acc.getString(['Doubt_ID', 'doubt_id', 'DoubtId', 'id'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      course_id: acc.getString(['Course_ID', 'course_id', 'CourseId']),
      mentor_id: acc.getString(['Mentor_ID', 'mentor_id', 'MentorId']),
      topic: acc.getString(['Topic', 'topic'], 'General')!,
      question: acc.getString(['Question', 'question'])!,
      priority: acc.getString(['Priority', 'priority'], 'normal'),
      resolution_status: acc.getString(['Resolution_Status', 'resolution_status', 'status'], 'pending'),
      solution: acc.getString(['Solution', 'solution']),
      asked_at: acc.getDate(['Asked_At', 'asked_at'], new Date().toISOString()),
      resolved_at: acc.getDate(['Resolved_At', 'resolved_at']),
    }),
  },

  // 13. PRACTICE_SESSIONS
  {
    name: 'Practice Sessions',
    csvFileName: 'practice_sessions.csv',
    tableName: 'practice_sessions',
    primaryKey: 'practice_id',
    transform: (acc) => ({
      practice_id: acc.getString(['Practice_ID', 'practice_id', 'PracticeId', 'id'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      course_id: acc.getString(['Course_ID', 'course_id', 'CourseId']),
      topic: acc.getString(['Topic', 'topic'])!,
      difficulty: acc.getString(['Difficulty', 'difficulty'], 'Medium'),
      questions_answered: acc.getInt(['Questions_Answered', 'questions_answered'], 0),
      correct_count: acc.getInt(['Correct_Count', 'correct_count'], 0),
      accuracy: acc.getFloat(['Accuracy', 'accuracy'], 0.0),
      is_weak: acc.getBoolean(['Is_Weak', 'is_weak'], false),
      recommendation: acc.getString(['Recommendation', 'recommendation']),
      practiced_at: acc.getDate(['Practiced_At', 'practiced_at'], new Date().toISOString()),
    }),
  },

  // 14. MOCK_INTERVIEWS
  {
    name: 'Mock Interviews',
    csvFileName: 'mock_interviews.csv',
    tableName: 'mock_interviews',
    primaryKey: 'interview_id',
    transform: (acc) => ({
      interview_id: acc.getString(['Interview_ID', 'interview_id', 'InterviewId', 'id'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      mentor_id: acc.getString(['Mentor_ID', 'mentor_id', 'MentorId']),
      attempt_label: acc.getString(['Attempt_Label', 'attempt_label', 'Attempt'], 'Attempt 1')!,
      role_title: acc.getString(['Role_Title', 'role_title'], 'Software Engineer')!,
      technical_score: acc.getFloat(['Technical_Score', 'technical_score'], 0.0),
      behavioral_score: acc.getFloat(['Behavioral_Score', 'behavioral_score'], 0.0),
      overall_score: acc.getFloat(['Overall_Score', 'overall_score'], 0.0),
      cohort_avg_score: acc.getFloat(['Cohort_Avg_Score', 'cohort_avg_score'], 65.0),
      feedback: acc.getString(['Feedback', 'feedback']),
      scheduled_at: acc.getDate(['Scheduled_At', 'scheduled_at']),
      completed_at: acc.getDate(['Completed_At', 'completed_at'], new Date().toISOString()),
    }),
  },

  // 15. MENTOR_ESCALATIONS
  {
    name: 'Mentor Escalations',
    csvFileName: 'mentor_escalations.csv',
    tableName: 'mentor_escalations',
    primaryKey: 'escalation_id',
    transform: (acc) => ({
      escalation_id: acc.getString(['Escalation_ID', 'escalation_id', 'EscalationId', 'id'])!,
      mentor_id: acc.getString(['Mentor_ID', 'mentor_id', 'MentorId'])!,
      student_id: acc.getString(['Student_ID', 'student_id', 'StudentId'])!,
      reason: acc.getString(['Reason', 'reason'], 'Doubt Resolution')!,
      severity: acc.getString(['Severity', 'severity'], 'Medium')!,
      description: acc.getString(['Description', 'description'])!,
      action_taken: acc.getString(['Action_Taken', 'action_taken']),
      status: acc.getString(['Status', 'status'], 'open'),
      created_at: acc.getDate(['Created_At', 'created_at'], new Date().toISOString()),
      resolved_at: acc.getDate(['Resolved_At', 'resolved_at']),
    }),
  },
];

/**
 * Standard CSV line parser handling embedded commas and quotes
 */
export function parseCsvLines(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const values: string[] = [];
    let insideQuotes = false;
    let curr = '';

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const c = rawLine[charIdx];
      if (c === '"') {
        insideQuotes = !insideQuotes;
      } else if (c === ',' && !insideQuotes) {
        values.push(curr.trim().replace(/^["']|["']$/g, ''));
        curr = '';
      } else {
        curr += c;
      }
    }
    values.push(curr.trim().replace(/^["']|["']$/g, ''));

    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      for (let h = 0; h < headers.length; h++) {
        row[headers[h]] = values[h];
      }
      records.push(row);
    }
  }

  return records;
}

/**
 * Executes validation and test/full batch import
 */
export async function runImport(isTestMode = false) {
  console.log('===============================================================');
  console.log(`LearnAI 15-Dataset Pipeline [Mode: ${isTestMode ? 'TEST BATCH (5 rows)' : 'FULL IMPORT'}]`);
  console.log('===============================================================\n');

  const client: SupabaseClient | null =
    SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  if (!client) {
    console.log('ℹ️ Running in local offline schema validation mode (no network credentials).');
  }

  const summary: any[] = [];

  for (const meta of DATASET_REGISTRY) {
    const filePath = path.join(DATA_DIR, meta.csvFileName);

    if (!fs.existsSync(filePath)) {
      summary.push({
        Table: meta.tableName,
        File: meta.csvFileName,
        Found: '❌ Missing',
        'Valid Rows': 0,
        'Imported/Tested': 0,
        Status: 'MISSING_FILE',
      });
      continue;
    }

    try {
      const rawText = fs.readFileSync(filePath, 'utf8');
      const parsed = parseCsvLines(rawText);

      // Transform all rows with case-insensitive accessor
      const validRecords: Record<string, any>[] = [];
      let rejected = 0;

      for (const row of parsed) {
        try {
          const acc = createRowAccessor(row);
          const transformed = meta.transform(acc);

          // Verify Primary Key is populated
          if (!transformed[meta.primaryKey]) {
            rejected++;
            continue;
          }

          validRecords.push(transformed);
        } catch {
          rejected++;
        }
      }

      // Batch to import (either small test batch of 5 or full)
      const toImport = isTestMode ? validRecords.slice(0, 5) : validRecords;
      let imported = 0;

      if (client && toImport.length > 0) {
        const BATCH_SIZE = 50;
        for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
          const chunk = toImport.slice(i, i + BATCH_SIZE);
          const { error } = await client
            .from(meta.tableName)
            .upsert(chunk, { onConflict: meta.primaryKey });

          if (error) {
            console.error(`  ⚠️ Table ${meta.tableName} error:`, error.message);
          } else {
            imported += chunk.length;
          }
        }
      } else {
        imported = toImport.length;
      }

      summary.push({
        Table: meta.tableName,
        File: meta.csvFileName,
        Found: '✅ Yes',
        'Valid Rows': validRecords.length,
        'Imported/Tested': imported,
        'Rejected Rows': rejected,
        Status: rejected === 0 ? 'VALID' : 'WITH_WARNINGS',
      });
    } catch (err: any) {
      summary.push({
        Table: meta.tableName,
        File: meta.csvFileName,
        Found: '✅ Yes',
        'Valid Rows': 0,
        'Imported/Tested': 0,
        Status: `ERROR: ${err.message}`,
      });
    }
  }

  console.table(summary);
  console.log('\n===============================================================');
  console.log('Pipeline run finished.');
  console.log('===============================================================\n');
}

// Direct invocation CLI runner
if (process.argv[1]?.endsWith('import_datasets.ts')) {
  const isTest = process.argv.includes('--test');
  runImport(isTest).catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
