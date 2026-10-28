import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type UserRole =
  | 'super_admin'
  | 'institution_admin'
  | 'student'
  | 'public_user'
  | 'mentor'
  | 'trainer'
  | 'admin';

export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';
export type InstitutionStatus = 'Pending Approval' | 'Active' | 'Rejected';
export type InstitutionType =
  | 'College'
  | 'University'
  | 'Training Institute'
  | 'Educational Institution'
  | 'Coaching Institute'
  | 'Other';

export interface UserEntity {
  userId: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  Organization_ID?: string | null;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordHash: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface VerificationCodeEntity {
  codeId: string;
  codeHash: string;
  plainCodePrefix?: string;
  role: 'mentor' | 'trainer';
  createdAt: string;
  expiresAt: string;
  usageLimit: number;
  timesUsed: number;
  status: 'active' | 'revoked' | 'expired';
  note?: string;
  createdBy: string;
}

export interface OrganizationEntity {
  Organization_ID: string;
  name: string;
  type: InstitutionType;
  officialEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website: string;
  status: InstitutionStatus;
  adminName: string;
  adminEmail: string;
  createdAt: string;
  approvedAt?: string;
}

export interface StudentEntity {
  studentId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID?: string | null;
  collegeName: string;
  degree: string;
  branch: string;
  graduationYear: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  learningLevel: 'Foundation' | 'Undergraduate' | 'Postgraduate' | 'Professional';
  skills: string[];
  careerGoal: string;
  interestedCourse?: string;
  Course_ID?: string;
  Mentor_ID?: string;
  courseProgress: number;
  readinessScore: number;
  status: AccountStatus;
  createdAt: string;
}

export interface RoleChangeHistoryEntity {
  historyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  organizationId: string | null;
  changedDate: string;
  reason: string;
}

export interface PublicUserEntity {
  publicUserId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID: null;
  User_Type: 'Public User';
  skills: string[];
  careerGoal: string;
  learningLevel: 'Foundation' | 'Undergraduate' | 'Postgraduate' | 'Professional';
  interestedCourse?: string;
  requestedOrgId?: string | null;
  status: AccountStatus;
  createdAt: string;
}

export interface MentorEntity {
  mentorId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID?: string;
  qualification: string;
  specialization: string;
  yearsOfExperience: number;
  skills: string[];
  availability: string;
  status: AccountStatus;
  verificationStatus?: string;
  verificationCodeUsed?: string;
  createdAt: string;
}

export interface TrainerEntity {
  trainerId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID?: string;
  qualification: string;
  specialization: string;
  experience: number;
  skills: string[];
  status: AccountStatus;
  verificationStatus?: string;
  verificationCodeUsed?: string;
  createdAt: string;
}

export interface AdminEntity {
  adminId: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'institution_admin' | 'admin';
  Organization_ID?: string | null;
  status: 'active';
  createdAt: string;
}

export interface CourseEntity {
  Course_ID: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skillsCovered: string[];
  learningLevel: string;
  Organization_ID?: string | null;
  Trainer_ID?: string;
  enrolledCount: number;
  rating: number;
  totalLessons: number;
  completedLessons?: number;
  lessons: Array<{
    id: string;
    title: string;
    duration: string;
    completed: boolean;
    contentSummary: string;
  }>;
}

export interface AssignmentEntity {
  assignmentId: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  submittedCount: number;
  avgScore: number;
}

export interface MentorFeedbackEntity {
  feedbackId: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  notes: string;
  recommendation: string;
  createdAt: string;
}

export interface JoinRequestEntity {
  requestId: string;
  userId: string;
  publicUserName: string;
  publicUserEmail: string;
  targetOrgId: string;
  targetOrgName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ContactMessageEntity {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: string;
  organization?: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface DatabaseSchema {
  organizations: Record<string, OrganizationEntity>;
  users: Record<string, UserEntity>;
  admins: Record<string, AdminEntity>;
  students: Record<string, StudentEntity>;
  public_users: Record<string, PublicUserEntity>;
  mentors: Record<string, MentorEntity>;
  trainers: Record<string, TrainerEntity>;
  courses: Record<string, CourseEntity>;
  assignments: Record<string, AssignmentEntity>;
  mentor_feedbacks: Record<string, MentorFeedbackEntity>;
  join_requests: Record<string, JoinRequestEntity>;
  contact_messages: Record<string, ContactMessageEntity>;
  verification_codes: Record<string, VerificationCodeEntity>;
  role_history: Record<string, RoleChangeHistoryEntity>;
}

const DB_FILE = path.resolve(__dirname, '../data/secure_multitenant_db.json');

export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input + 'learnai_secure_salt_2026').digest('hex');
}

// Canonical Skill Gap mappings
export const CAREER_GOALS_SKILLS: Record<string, string[]> = {
  'Data Analyst': ['Python', 'SQL', 'Excel', 'Power BI', 'Statistics', 'Pandas'],
  'AI / ML Engineer': ['Python', 'PyTorch', 'Linear Algebra', 'Machine Learning', 'FastAPI', 'Docker', 'Git'],
  'Full-Stack Developer': ['React', 'TypeScript', 'Node.js', 'Express', 'SQL', 'Tailwind CSS', 'REST APIs'],
  'Cloud / DevOps Engineer': ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Networking'],
  'Software Engineer': ['Data Structures', 'Algorithms', 'Python', 'System Design', 'Git', 'SQL', 'OOP'],
  'Data Scientist': ['Python', 'R', 'Statistics', 'Machine Learning', 'Data Visualization', 'SQL', 'Deep Learning'],
  'Cybersecurity Analyst': ['Network Security', 'Linux', 'Ethical Hacking', 'Cryptography', 'SIEM', 'Python'],
};

class BackendDatabase {
  private db: DatabaseSchema = {
    organizations: {},
    users: {},
    admins: {},
    students: {},
    public_users: {},
    mentors: {},
    trainers: {},
    courses: {},
    assignments: {},
    mentor_feedbacks: {},
    join_requests: {},
    contact_messages: {},
    verification_codes: {},
    role_history: {},
  };

  constructor() {
    this.load();
    this.seedDefaultsIfEmpty();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.db = {
          organizations: parsed.organizations || {},
          users: parsed.users || {},
          admins: parsed.admins || {},
          students: parsed.students || {},
          public_users: parsed.public_users || {},
          mentors: parsed.mentors || {},
          trainers: parsed.trainers || {},
          courses: parsed.courses || {},
          assignments: parsed.assignments || {},
          mentor_feedbacks: parsed.mentor_feedbacks || {},
          join_requests: parsed.join_requests || {},
          contact_messages: parsed.contact_messages || {},
          verification_codes: parsed.verification_codes || {},
          role_history: parsed.role_history || {},
        };
      }
    } catch (err) {
      console.error('Error loading db, initializing fresh:', err);
    }
  }

  private save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db:', err);
    }
  }

  // --- SEED DEFAULTS ---
  public seedDefaultsIfEmpty() {
    // 1. Seed Organizations
    if (Object.keys(this.db.organizations).length === 0) {
      this.db.organizations['COL001'] = {
        Organization_ID: 'COL001',
        name: 'Stanford Institute of Technology',
        type: 'University',
        officialEmail: 'contact@stanford.edu',
        phone: '+1 (555) 019-2831',
        address: '450 Serra Mall',
        city: 'Stanford',
        state: 'California',
        country: 'United States',
        website: 'https://stanford.edu',
        status: 'Active',
        adminName: 'Dean Robert Harrison',
        adminEmail: 'admin@stanford.edu',
        createdAt: '2026-08-15T09:00:00.000Z',
        approvedAt: '2026-08-15T10:00:00.000Z',
      };

      this.db.organizations['COL002'] = {
        Organization_ID: 'COL002',
        name: 'National Engineering Academy',
        type: 'College',
        officialEmail: 'info@national.edu',
        phone: '+1 (555) 482-9102',
        address: '120 Science Park Blvd',
        city: 'Boston',
        state: 'Massachusetts',
        country: 'United States',
        website: 'https://national.edu',
        status: 'Active',
        adminName: 'Prof. Margaret Vance',
        adminEmail: 'admin@national.edu',
        createdAt: '2026-09-01T08:30:00.000Z',
        approvedAt: '2026-09-01T09:00:00.000Z',
      };

      this.db.organizations['COL003'] = {
        Organization_ID: 'COL003',
        name: 'Apex AI Coding Bootcamp',
        type: 'Training Institute',
        officialEmail: 'admissions@apexbootcamp.org',
        phone: '+1 (555) 831-2940',
        address: '742 Evergreen Terrace',
        city: 'Austin',
        state: 'Texas',
        country: 'United States',
        website: 'https://apexbootcamp.org',
        status: 'Pending Approval', // Awaiting Super Admin Approval!
        adminName: 'Jason Reed',
        adminEmail: 'admin@apexbootcamp.org',
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Seed Super Admin
    const superAdminEmail = 'superadmin@learnai.com';
    if (!this.getUserByEmail(superAdminEmail)) {
      const userId = 'usr_superadmin_01';
      const adminId = 'adm_super_01';
      this.db.users[userId] = {
        userId,
        email: superAdminEmail,
        role: 'super_admin',
        status: 'active',
        Organization_ID: null,
        emailVerified: true,
        passwordHash: hashString('SuperAdmin123!'),
        createdAt: '2026-08-01T08:00:00.000Z',
      };
      this.db.admins[adminId] = {
        adminId,
        userId,
        fullName: 'Chief Super Administrator',
        email: superAdminEmail,
        role: 'super_admin',
        Organization_ID: null,
        status: 'active',
        createdAt: '2026-08-01T08:00:00.000Z',
      };
    }

    // 3. Seed Institution Admins
    // Stanford Admin
    if (!this.getUserByEmail('admin@stanford.edu')) {
      const userId = 'usr_adm_stanford';
      const adminId = 'adm_col001';
      this.db.users[userId] = {
        userId,
        email: 'admin@stanford.edu',
        role: 'institution_admin',
        status: 'active',
        Organization_ID: 'COL001',
        emailVerified: true,
        passwordHash: hashString('Admin123!'),
        createdAt: '2026-08-15T09:00:00.000Z',
      };
      this.db.admins[adminId] = {
        adminId,
        userId,
        fullName: 'Dean Robert Harrison',
        email: 'admin@stanford.edu',
        role: 'institution_admin',
        Organization_ID: 'COL001',
        status: 'active',
        createdAt: '2026-08-15T09:00:00.000Z',
      };
    }

    // National Engineering Admin
    if (!this.getUserByEmail('admin@national.edu')) {
      const userId = 'usr_adm_national';
      const adminId = 'adm_col002';
      this.db.users[userId] = {
        userId,
        email: 'admin@national.edu',
        role: 'institution_admin',
        status: 'active',
        Organization_ID: 'COL002',
        emailVerified: true,
        passwordHash: hashString('Admin123!'),
        createdAt: '2026-09-01T08:30:00.000Z',
      };
      this.db.admins[adminId] = {
        adminId,
        userId,
        fullName: 'Prof. Margaret Vance',
        email: 'admin@national.edu',
        role: 'institution_admin',
        Organization_ID: 'COL002',
        status: 'active',
        createdAt: '2026-09-01T08:30:00.000Z',
      };
    }

    // 4. Seed Mentors
    if (Object.keys(this.db.mentors).length === 0) {
      const mentorUserId = 'usr_mentor_marcus';
      this.db.users[mentorUserId] = {
        userId: mentorUserId,
        email: 'marcus.vance@stanford.edu',
        role: 'mentor',
        status: 'approved',
        Organization_ID: 'COL001',
        emailVerified: true,
        passwordHash: hashString('Mentor123!'),
        createdAt: '2026-08-20T10:00:00.000Z',
      };
      this.db.mentors['mnt_marcus'] = {
        mentorId: 'mnt_marcus',
        userId: mentorUserId,
        fullName: 'Dr. Marcus Vance',
        email: 'marcus.vance@stanford.edu',
        phone: '+1 (555) 234-5678',
        Organization_ID: 'COL001',
        qualification: 'Ph.D. in Computer Science (MIT)',
        specialization: 'Staff AI Engineer & Career Guidance',
        yearsOfExperience: 9,
        skills: ['Python', 'PyTorch', 'System Design', 'Mock Interviews'],
        availability: 'Mon, Wed, Fri (Afternoons)',
        status: 'approved',
        createdAt: '2026-08-20T10:00:00.000Z',
      };
    }

    // 5. Seed Trainers
    if (Object.keys(this.db.trainers).length === 0) {
      const trainerUserId = 'usr_trainer_sarah';
      this.db.users[trainerUserId] = {
        userId: trainerUserId,
        email: 'sarah.jenkins@stanford.edu',
        role: 'trainer',
        status: 'approved',
        Organization_ID: 'COL001',
        emailVerified: true,
        passwordHash: hashString('Trainer123!'),
        createdAt: '2026-08-18T09:00:00.000Z',
      };
      this.db.trainers['trn_sarah'] = {
        trainerId: 'trn_sarah',
        userId: trainerUserId,
        fullName: 'Prof. Sarah Jenkins',
        email: 'sarah.jenkins@stanford.edu',
        phone: '+1 (555) 987-6543',
        Organization_ID: 'COL001',
        qualification: 'M.S. in Machine Learning, Senior Curriculum Lead',
        specialization: 'Python, Data Science & AI Curricula',
        experience: 8,
        skills: ['Python', 'SQL', 'FastAPI', 'Pedagogy', 'Machine Learning'],
        status: 'approved',
        createdAt: '2026-08-18T09:00:00.000Z',
      };
    }

    // 6. Seed Courses
    if (Object.keys(this.db.courses).length === 0) {
      this.db.courses['CRS001'] = {
        Course_ID: 'CRS001',
        title: 'Modern Python for AI & Data Analysis',
        description: 'Comprehensive foundational and advanced Python syntax, data structures, OOP, Pandas, and NumPy for career success.',
        category: 'Programming & AI',
        duration: '8 Weeks (32 Hours)',
        difficulty: 'Beginner',
        skillsCovered: ['Python', 'Pandas', 'NumPy', 'Data Structures', 'OOP'],
        learningLevel: 'Undergraduate',
        Organization_ID: 'COL001',
        Trainer_ID: 'trn_sarah',
        enrolledCount: 142,
        rating: 4.9,
        totalLessons: 16,
        completedLessons: 11,
        lessons: [
          { id: 'les_01', title: 'Python Syntax & Dynamic Typing', duration: '45m', completed: true, contentSummary: 'Core language keywords, type hints, and primitives' },
          { id: 'les_02', title: 'Data Structures: Lists, Dictionaries & Sets', duration: '50m', completed: true, contentSummary: 'Time complexities and hash lookups' },
          { id: 'les_03', title: 'Functional Programming & List Comprehensions', duration: '40m', completed: true, contentSummary: 'Map, filter, lambda and generator functions' },
          { id: 'les_04', title: 'Pandas DataFrames & Real-world Data Wrangling', duration: '60m', completed: false, contentSummary: 'Cleaning, merging, and grouping tabular datasets' },
        ],
      };

      this.db.courses['CRS002'] = {
        Course_ID: 'CRS002',
        title: 'Enterprise SQL & Relational Database Systems',
        description: 'Master relational schema design, complex joins, subqueries, indexing, window functions and query performance tuning.',
        category: 'Data & Databases',
        duration: '6 Weeks (24 Hours)',
        difficulty: 'Intermediate',
        skillsCovered: ['SQL', 'PostgreSQL', 'Query Optimization', 'Relational Design'],
        learningLevel: 'Undergraduate',
        Organization_ID: 'COL001',
        Trainer_ID: 'trn_sarah',
        enrolledCount: 98,
        rating: 4.8,
        totalLessons: 12,
        completedLessons: 6,
        lessons: [
          { id: 'les_sql_01', title: 'Relational Schemas & Foreign Key Constraints', duration: '40m', completed: true, contentSummary: 'Normalization to 3NF and constraint enforcement' },
          { id: 'les_sql_02', title: 'Advanced Window Functions (RANK, OVER, PARTITION)', duration: '55m', completed: false, contentSummary: 'Analytic computations over partitioned result sets' },
        ],
      };

      this.db.courses['CRS003'] = {
        Course_ID: 'CRS003',
        title: 'Generative AI & LLM Application Development',
        description: 'Build production-ready LLM agents, Retrieval-Augmented Generation (RAG) pipelines, and prompt architectures with Gemini.',
        category: 'Artificial Intelligence',
        duration: '10 Weeks (40 Hours)',
        difficulty: 'Advanced',
        skillsCovered: ['Python', 'FastAPI', 'RAG', 'Vector Search', 'Prompt Engineering', 'LangChain'],
        learningLevel: 'Professional',
        Organization_ID: null, // Platform-level course available to public & all institutions!
        enrolledCount: 310,
        rating: 5.0,
        totalLessons: 20,
        completedLessons: 4,
        lessons: [
          { id: 'les_genai_01', title: 'Transformer Self-Attention Foundations', duration: '50m', completed: true, contentSummary: 'Tokenization, attention weights, and context windows' },
          { id: 'les_genai_02', title: 'Building Scalable RAG Architectures', duration: '65m', completed: false, contentSummary: 'Embeddings, vector indexing, and hybrid retrieval' },
        ],
      };
    }

    // 7. Seed Students (Colleges COL001 & COL002)
    if (Object.keys(this.db.students).length === 0) {
      // Alex Morgan (Stanford student)
      const alexUserId = 'usr_stu_alex';
      this.db.users[alexUserId] = {
        userId: alexUserId,
        email: 'alex.morgan@stanford.edu',
        role: 'student',
        status: 'approved',
        Organization_ID: 'COL001',
        emailVerified: true,
        passwordHash: hashString('Student123!'),
        createdAt: '2026-08-25T11:00:00.000Z',
      };
      this.db.students['stu_alex'] = {
        studentId: 'stu_alex',
        userId: alexUserId,
        fullName: 'Alex Morgan',
        email: 'alex.morgan@stanford.edu',
        phone: '+1 (555) 782-9301',
        Organization_ID: 'COL001',
        collegeName: 'Stanford Institute of Technology',
        degree: 'B.S. in Computer Science',
        branch: 'Artificial Intelligence & Systems',
        graduationYear: '2026',
        experienceLevel: 'Intermediate',
        learningLevel: 'Undergraduate',
        skills: ['Python', 'SQL', 'FastAPI', 'Algorithms'],
        careerGoal: 'Data Analyst',
        interestedCourse: 'CRS001',
        Course_ID: 'CRS001',
        Mentor_ID: 'mnt_marcus',
        courseProgress: 68,
        readinessScore: 82,
        status: 'approved',
        createdAt: '2026-08-25T11:00:00.000Z',
      };

      // Priya Patel (Stanford student)
      const priyaUserId = 'usr_stu_priya';
      this.db.users[priyaUserId] = {
        userId: priyaUserId,
        email: 'priya.patel@stanford.edu',
        role: 'student',
        status: 'approved',
        Organization_ID: 'COL001',
        emailVerified: true,
        passwordHash: hashString('Student123!'),
        createdAt: '2026-08-28T14:00:00.000Z',
      };
      this.db.students['stu_priya'] = {
        studentId: 'stu_priya',
        userId: priyaUserId,
        fullName: 'Priya Patel',
        email: 'priya.patel@stanford.edu',
        phone: '+1 (555) 619-2049',
        Organization_ID: 'COL001',
        collegeName: 'Stanford Institute of Technology',
        degree: 'B.S. in Data Engineering',
        branch: 'Information Systems',
        graduationYear: '2027',
        experienceLevel: 'Beginner',
        learningLevel: 'Undergraduate',
        skills: ['Python', 'Statistics', 'Excel'],
        careerGoal: 'AI / ML Engineer',
        interestedCourse: 'CRS001',
        Course_ID: 'CRS001',
        Mentor_ID: 'mnt_marcus',
        courseProgress: 45,
        readinessScore: 70,
        status: 'approved',
        createdAt: '2026-08-28T14:00:00.000Z',
      };

      // Rahul Sharma (National Engineering Academy student)
      const rahulUserId = 'usr_stu_rahul';
      this.db.users[rahulUserId] = {
        userId: rahulUserId,
        email: 'rahul.sharma@national.edu',
        role: 'student',
        status: 'approved',
        Organization_ID: 'COL002',
        emailVerified: true,
        passwordHash: hashString('Student123!'),
        createdAt: '2026-09-05T09:00:00.000Z',
      };
      this.db.students['stu_rahul'] = {
        studentId: 'stu_rahul',
        userId: rahulUserId,
        fullName: 'Rahul Sharma',
        email: 'rahul.sharma@national.edu',
        phone: '+1 (555) 304-1829',
        Organization_ID: 'COL002',
        collegeName: 'National Engineering Academy',
        degree: 'B.Tech in Information Technology',
        branch: 'Software Systems',
        graduationYear: '2026',
        experienceLevel: 'Intermediate',
        learningLevel: 'Undergraduate',
        skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
        careerGoal: 'Full-Stack Developer',
        interestedCourse: 'CRS002',
        Course_ID: 'CRS002',
        courseProgress: 52,
        readinessScore: 78,
        status: 'approved',
        createdAt: '2026-09-05T09:00:00.000Z',
      };
    }

    // 8. Seed Public User (Independent Learner, Organization_ID = null)
    if (Object.keys(this.db.public_users).length === 0) {
      const publicUserId = 'usr_pub_david';
      this.db.users[publicUserId] = {
        userId: publicUserId,
        email: 'david.chen@independent.io',
        role: 'public_user',
        status: 'approved',
        Organization_ID: null,
        emailVerified: true,
        passwordHash: hashString('Public123!'),
        createdAt: '2026-09-12T16:00:00.000Z',
      };
      this.db.public_users['pub_david'] = {
        publicUserId: 'pub_david',
        userId: publicUserId,
        fullName: 'David Chen',
        email: 'david.chen@independent.io',
        phone: '+1 (555) 412-9831',
        Organization_ID: null,
        User_Type: 'Public User',
        skills: ['Python', 'SQL', 'Git'],
        careerGoal: 'Data Analyst',
        learningLevel: 'Professional',
        interestedCourse: 'CRS001',
        status: 'approved',
        createdAt: '2026-09-12T16:00:00.000Z',
      };
    }

    // 9. Seed Assignments
    if (Object.keys(this.db.assignments).length === 0) {
      this.db.assignments['asg_01'] = {
        assignmentId: 'asg_01',
        courseId: 'CRS001',
        courseTitle: 'Modern Python for AI & Data Analysis',
        title: 'Building a Modular ETL Pipeline with Pandas',
        description: 'Read JSON logs, transform timestamps, calculate user engagement metrics, and write cleaned Parquet outputs.',
        dueDate: '2026-10-25T23:59:59.000Z',
        totalPoints: 100,
        submittedCount: 88,
        avgScore: 91,
      };

      this.db.assignments['asg_02'] = {
        assignmentId: 'asg_02',
        courseId: 'CRS002',
        courseTitle: 'Enterprise SQL & Relational Database Systems',
        title: 'Multi-Tenant Analytics Query Optimization',
        description: 'Write window ranking queries across million-row transactional tables with explain plans.',
        dueDate: '2026-10-28T23:59:59.000Z',
        totalPoints: 100,
        submittedCount: 64,
        avgScore: 84,
      };
    }

    // 10. Seed Feedback
    if (Object.keys(this.db.mentor_feedbacks).length === 0) {
      this.db.mentor_feedbacks['fb_01'] = {
        feedbackId: 'fb_01',
        mentorId: 'mnt_marcus',
        mentorName: 'Dr. Marcus Vance',
        studentId: 'stu_alex',
        studentName: 'Alex Morgan',
        notes: 'Alex demonstrates strong Python and SQL foundations. Recommended focusing on Power BI and statistical modeling for senior analyst interviews.',
        recommendation: 'Complete Statistics & Power BI module before next mock technical interview session.',
        createdAt: '2026-10-02T15:30:00.000Z',
      };
    }

    // 10. Seed Sample Role Change History
    if (!this.db.role_history || Object.keys(this.db.role_history).length === 0) {
      this.db.role_history = {
        rh_sample_01: {
          historyId: 'rh_sample_01',
          userId: 'usr_mentor_marcus',
          userName: 'Dr. Marcus Vance',
          userEmail: 'marcus.vance@stanford.edu',
          previousRole: 'student',
          newRole: 'mentor',
          changedBy: 'admin@stanford.edu',
          organizationId: 'COL001',
          changedDate: '2026-08-20T10:00:00.000Z',
          reason: 'Promoted to Lead AI & Python Mentor after academic credential review',
        },
        rh_sample_02: {
          historyId: 'rh_sample_02',
          userId: 'usr_trainer_sarah',
          userName: 'Prof. Sarah Jenkins',
          userEmail: 'sarah.jenkins@stanford.edu',
          previousRole: 'student',
          newRole: 'trainer',
          changedBy: 'admin@stanford.edu',
          organizationId: 'COL001',
          changedDate: '2026-08-18T09:00:00.000Z',
          reason: 'Assigned as Course Trainer for Python & AI Curriculum delivery',
        },
      };
    }

    this.save();
  }

  // --- QUERY METHODS ---

  public getUserByEmail(email: string): UserEntity | null {
    const normalized = email.trim().toLowerCase();
    return Object.values(this.db.users).find((u) => u.email.toLowerCase() === normalized) || null;
  }

  public getUserById(userId: string): UserEntity | null {
    return this.db.users[userId] || null;
  }

  public getOrganizationById(orgId: string): OrganizationEntity | null {
    return this.db.organizations[orgId] || null;
  }

  public getAllOrganizations(): OrganizationEntity[] {
    return Object.values(this.db.organizations).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getApprovedOrganizations(): OrganizationEntity[] {
    return Object.values(this.db.organizations).filter((o) => o.status === 'Active');
  }

  public approveOrganization(orgId: string): { success: boolean; organization?: OrganizationEntity; error?: string } {
    const org = this.db.organizations[orgId];
    if (!org) return { success: false, error: 'Organization not found.' };

    org.status = 'Active';
    org.approvedAt = new Date().toISOString();

    // Activate the corresponding institution admin user
    const adminUser = this.getUserByEmail(org.adminEmail);
    if (adminUser) {
      adminUser.status = 'active';
    }

    this.save();
    return { success: true, organization: org };
  }

  public rejectOrganization(orgId: string, reason?: string): { success: boolean; error?: string } {
    const org = this.db.organizations[orgId];
    if (!org) return { success: false, error: 'Organization not found.' };

    org.status = 'Rejected';
    const adminUser = this.getUserByEmail(org.adminEmail);
    if (adminUser) {
      adminUser.status = 'rejected';
    }

    this.save();
    return { success: true };
  }

  // --- MULTI-TENANT FILTERED GETTERS ---

  public getStudents(orgId?: string | null): StudentEntity[] {
    const all = Object.values(this.db.students);
    if (!orgId) return all;
    return all.filter((s) => s.Organization_ID === orgId);
  }

  public getMentors(orgId?: string | null): MentorEntity[] {
    const all = Object.values(this.db.mentors);
    if (!orgId) return all;
    return all.filter((m) => m.Organization_ID === orgId);
  }

  public getTrainers(orgId?: string | null): TrainerEntity[] {
    const all = Object.values(this.db.trainers);
    if (!orgId) return all;
    return all.filter((t) => t.Organization_ID === orgId);
  }

  public getCourses(orgId?: string | null): CourseEntity[] {
    const all = Object.values(this.db.courses);
    if (!orgId) return all;
    // Return organization-specific courses plus platform-wide courses (Organization_ID === null)
    return all.filter((c) => c.Organization_ID === orgId || c.Organization_ID === null);
  }

  public getPublicUsers(): PublicUserEntity[] {
    return Object.values(this.db.public_users);
  }

  public getStudentByUserId(userId: string): StudentEntity | null {
    return Object.values(this.db.students).find((s) => s.userId === userId) || null;
  }

  public getPublicUserByUserId(userId: string): PublicUserEntity | null {
    return Object.values(this.db.public_users).find((p) => p.userId === userId) || null;
  }

  public getMentorByUserId(userId: string): MentorEntity | null {
    return Object.values(this.db.mentors).find((m) => m.userId === userId) || null;
  }

  public getTrainerByUserId(userId: string): TrainerEntity | null {
    return Object.values(this.db.trainers).find((t) => t.userId === userId) || null;
  }

  public getAdminByUserId(userId: string): AdminEntity | null {
    return Object.values(this.db.admins).find((a) => a.userId === userId) || null;
  }

  // --- REGISTRATION SERVICES ---

  // 1. Institution Registration (Section 10)
  public registerInstitution(data: {
    institutionName: string;
    institutionType: InstitutionType;
    officialEmail: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    website: string;
    adminName: string;
    adminEmail: string;
    password: string;
  }): { success: boolean; organization?: OrganizationEntity; error?: string } {
    const emailNorm = data.adminEmail.trim().toLowerCase();
    const officialNorm = data.officialEmail.trim().toLowerCase();

    if (this.getUserByEmail(emailNorm)) {
      return { success: false, error: 'An account with this administrator email already exists.' };
    }

    const orgId = 'COL' + (Object.keys(this.db.organizations).length + 1).toString().padStart(3, '0');
    const userId = 'usr_adm_' + crypto.randomUUID().substring(0, 8);
    const adminId = 'adm_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();

    const organization: OrganizationEntity = {
      Organization_ID: orgId,
      name: data.institutionName.trim(),
      type: data.institutionType,
      officialEmail: officialNorm,
      phone: data.phone.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      country: data.country.trim(),
      website: data.website.trim(),
      status: 'Pending Approval', // Super Admin must approve it!
      adminName: data.adminName.trim(),
      adminEmail: emailNorm,
      createdAt: now,
    };

    const user: UserEntity = {
      userId,
      email: emailNorm,
      role: 'institution_admin',
      status: 'pending', // Pending organization approval
      Organization_ID: orgId,
      emailVerified: true,
      passwordHash: hashString(data.password),
      createdAt: now,
    };

    const admin: AdminEntity = {
      adminId,
      userId,
      fullName: data.adminName.trim(),
      email: emailNorm,
      role: 'institution_admin',
      Organization_ID: orgId,
      status: 'active',
      createdAt: now,
    };

    this.db.organizations[orgId] = organization;
    this.db.users[userId] = user;
    this.db.admins[adminId] = admin;
    this.save();

    return { success: true, organization };
  }

  // 2. Student Signup (Section 2 & 3: Normal Signup always becomes Student)
  public registerStudent(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    Organization_ID?: string | null;
    organization?: string;
    college?: string;
    collegeName?: string;
    degree?: string;
    branch?: string;
    graduationYear?: string;
    experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
    learningLevel?: 'Foundation' | 'Undergraduate' | 'Postgraduate' | 'Professional';
    skills?: string[];
    careerGoal?: string;
    interestedCourse?: string;
  }): { success: boolean; student?: StudentEntity; user?: UserEntity; error?: string } {
    const emailNorm = data.email.trim().toLowerCase();
    if (this.getUserByEmail(emailNorm)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    let finalOrgId: string | null = null;
    let finalCollegeName = 'Independent Public Student';

    const rawOrg = (data.Organization_ID || data.organization || data.college || data.collegeName || '').trim();

    if (rawOrg && rawOrg.toLowerCase() !== 'null' && rawOrg.toLowerCase() !== 'none' && rawOrg.toLowerCase() !== 'public' && rawOrg.toLowerCase() !== 'public student') {
      // Check if existing org matches by ID or Name
      let matchedOrg = this.getOrganizationById(rawOrg);
      if (!matchedOrg) {
        matchedOrg = Object.values(this.db.organizations).find(
          (o) => o.name.toLowerCase() === rawOrg.toLowerCase() || o.Organization_ID.toLowerCase() === rawOrg.toLowerCase()
        ) || null;
      }

      if (matchedOrg) {
        finalOrgId = matchedOrg.Organization_ID;
        finalCollegeName = matchedOrg.name;
      } else {
        // Auto-register institution with clean ID
        const generatedOrgId = rawOrg.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || ('ORG_' + crypto.randomUUID().slice(0, 4).toUpperCase());
        const newOrg: OrganizationEntity = {
          Organization_ID: generatedOrgId,
          name: rawOrg,
          type: 'College',
          officialEmail: `info@${rawOrg.toLowerCase().replace(/[^a-z0-9]/g, '') || 'institution'}.edu`,
          phone: data.phone || '+1 (555) 012-3456',
          address: 'Campus Main Blvd',
          city: 'Academic City',
          state: 'State',
          country: 'Country',
          website: `https://${rawOrg.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
          status: 'Active',
          adminName: 'Academic Administration',
          adminEmail: `admin@${rawOrg.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        };
        this.db.organizations[generatedOrgId] = newOrg;
        finalOrgId = generatedOrgId;
        finalCollegeName = rawOrg;
      }
    }

    const userId = 'usr_stu_' + crypto.randomUUID().substring(0, 8);
    const studentId = 'stu_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();
    const verificationToken = 'VERIFY_' + crypto.randomUUID().substring(0, 8).toUpperCase();

    const user: UserEntity = {
      userId,
      email: emailNorm,
      role: 'student',
      status: 'active',
      Organization_ID: finalOrgId,
      emailVerified: true,
      emailVerificationToken: verificationToken,
      passwordHash: hashString(data.password),
      createdAt: now,
    };

    const student: StudentEntity = {
      studentId,
      userId,
      fullName: data.fullName.trim(),
      email: emailNorm,
      phone: (data.phone || '').trim(),
      Organization_ID: finalOrgId,
      collegeName: finalCollegeName,
      degree: data.degree || 'B.S. in Computer Science',
      branch: data.branch || 'Computer Science & Engineering',
      graduationYear: data.graduationYear || '2026',
      experienceLevel: data.experienceLevel || 'Beginner',
      learningLevel: data.learningLevel || 'Undergraduate',
      skills: Array.isArray(data.skills) ? data.skills : ['Python', 'SQL'],
      careerGoal: data.careerGoal || 'AI / Software Engineer',
      interestedCourse: data.interestedCourse || 'CRS001',
      Course_ID: data.interestedCourse || 'CRS001',
      courseProgress: 15,
      readinessScore: 65,
      status: 'active',
      createdAt: now,
    };

    this.db.users[userId] = user;
    this.db.students[studentId] = student;
    this.save();

    return { success: true, student, user };
  }

  // 3. Public User Signup (Section 9)
  public registerPublicUser(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    skills?: string[];
    careerGoal?: string;
    learningLevel?: 'Foundation' | 'Undergraduate' | 'Postgraduate' | 'Professional';
    interestedCourse?: string;
  }): { success: boolean; publicUser?: PublicUserEntity; user?: UserEntity; error?: string } {
    const emailNorm = data.email.trim().toLowerCase();
    if (this.getUserByEmail(emailNorm)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const userId = 'usr_pub_' + crypto.randomUUID().substring(0, 8);
    const publicUserId = 'pub_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();
    const verificationToken = 'VERIFY_' + crypto.randomUUID().substring(0, 8).toUpperCase();

    const user: UserEntity = {
      userId,
      email: emailNorm,
      role: 'public_user',
      status: 'approved',
      Organization_ID: null, // Public user has Organization_ID = null!
      emailVerified: true,
      emailVerificationToken: verificationToken,
      passwordHash: hashString(data.password),
      createdAt: now,
    };

    const publicUser: PublicUserEntity = {
      publicUserId,
      userId,
      fullName: data.fullName.trim(),
      email: emailNorm,
      phone: data.phone.trim(),
      Organization_ID: null,
      User_Type: 'Public User',
      skills: Array.isArray(data.skills) ? data.skills : ['Python'],
      careerGoal: data.careerGoal || 'Data Analyst',
      learningLevel: data.learningLevel || 'Professional',
      interestedCourse: data.interestedCourse || 'CRS003',
      status: 'approved',
      createdAt: now,
    };

    this.db.users[userId] = user;
    this.db.public_users[publicUserId] = publicUser;
    this.save();

    return { success: true, publicUser, user };
  }

  // 4. Mentor Signup (Section 11)
  public registerMentor(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    Organization_ID?: string;
    qualification?: string;
    specialization?: string;
    yearsOfExperience?: number;
    skills?: string[];
    expertSkills?: string[];
    availability?: string;
    verificationCode?: string;
  }): { success: boolean; mentor?: MentorEntity; user?: UserEntity; error?: string } {
    const emailNorm = data.email.trim().toLowerCase();
    if (this.getUserByEmail(emailNorm)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    if (data.Organization_ID) {
      const org = this.getOrganizationById(data.Organization_ID);
      if (!org || org.status !== 'Active') {
        return { success: false, error: 'Selected institution is not active.' };
      }
    }

    const userId = 'usr_mnt_' + crypto.randomUUID().substring(0, 8);
    const mentorId = 'mnt_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();
    const verificationToken = 'VERIFY_' + crypto.randomUUID().substring(0, 8).toUpperCase();

    const user: UserEntity = {
      userId,
      email: emailNorm,
      role: 'mentor',
      status: 'approved',
      Organization_ID: data.Organization_ID || null,
      emailVerified: true,
      emailVerificationToken: verificationToken,
      passwordHash: hashString(data.password),
      createdAt: now,
    };

    const mentorSkills = data.expertSkills || data.skills || ['Python', 'System Design'];

    const mentor: MentorEntity = {
      mentorId,
      userId,
      fullName: data.fullName.trim(),
      email: emailNorm,
      phone: (data.phone || '').trim(),
      Organization_ID: data.Organization_ID,
      qualification: data.qualification || 'M.S. in Computer Science',
      specialization: data.specialization || 'Technical Career Mentorship',
      yearsOfExperience: Number(data.yearsOfExperience) || 5,
      skills: Array.isArray(mentorSkills) ? mentorSkills : ['Python', 'System Design'],
      availability: data.availability || 'Weekdays (Afternoons)',
      status: 'approved',
      verificationStatus: 'verified',
      verificationCodeUsed: data.verificationCode,
      createdAt: now,
    };

    this.db.users[userId] = user;
    this.db.mentors[mentorId] = mentor;
    this.save();

    return { success: true, mentor, user };
  }

  // 5. Trainer Signup (Section 11)
  public registerTrainer(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    Organization_ID?: string;
    qualification?: string;
    specialization?: string;
    experience?: number;
    skills?: string[];
    verificationCode?: string;
  }): { success: boolean; trainer?: TrainerEntity; user?: UserEntity; error?: string } {
    const emailNorm = data.email.trim().toLowerCase();
    if (this.getUserByEmail(emailNorm)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    if (data.Organization_ID) {
      const org = this.getOrganizationById(data.Organization_ID);
      if (!org || org.status !== 'Active') {
        return { success: false, error: 'Selected institution is not active.' };
      }
    }

    const userId = 'usr_trn_' + crypto.randomUUID().substring(0, 8);
    const trainerId = 'trn_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();
    const verificationToken = 'VERIFY_' + crypto.randomUUID().substring(0, 8).toUpperCase();

    const user: UserEntity = {
      userId,
      email: emailNorm,
      role: 'trainer',
      status: 'approved',
      Organization_ID: data.Organization_ID || null,
      emailVerified: true,
      emailVerificationToken: verificationToken,
      passwordHash: hashString(data.password),
      createdAt: now,
    };

    const trainer: TrainerEntity = {
      trainerId,
      userId,
      fullName: data.fullName.trim(),
      email: emailNorm,
      phone: (data.phone || '').trim(),
      Organization_ID: data.Organization_ID,
      qualification: data.qualification || 'Senior Technical Educator',
      specialization: data.specialization || 'Instruction & Curriculum Architecture',
      experience: Number(data.experience) || 6,
      skills: Array.isArray(data.skills) ? data.skills : ['Python', 'SQL', 'FastAPI'],
      status: 'approved',
      verificationStatus: 'verified',
      verificationCodeUsed: data.verificationCode,
      createdAt: now,
    };

    this.db.users[userId] = user;
    this.db.trainers[trainerId] = trainer;
    this.save();

    return { success: true, trainer, user };
  }

  // 6. Request to join an institution (Section 16 for Public Users)
  public requestJoinInstitution(userId: string, targetOrgId: string): { success: boolean; error?: string } {
    const pub = this.getPublicUserByUserId(userId);
    if (!pub) return { success: false, error: 'Public user profile not found.' };

    const org = this.getOrganizationById(targetOrgId);
    if (!org) return { success: false, error: 'Target institution not found.' };

    const requestId = 'req_' + crypto.randomUUID().substring(0, 8);
    this.db.join_requests[requestId] = {
      requestId,
      userId,
      publicUserName: pub.fullName,
      publicUserEmail: pub.email,
      targetOrgId,
      targetOrgName: org.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    pub.requestedOrgId = targetOrgId;
    this.save();
    return { success: true };
  }

  // 7. Add Feedback from Mentor
  public addMentorFeedback(params: {
    mentorId: string;
    mentorName: string;
    studentId: string;
    studentName: string;
    notes: string;
    recommendation: string;
  }): MentorFeedbackEntity {
    const feedbackId = 'fb_' + crypto.randomUUID().substring(0, 8);
    const fb: MentorFeedbackEntity = {
      feedbackId,
      mentorId: params.mentorId,
      mentorName: params.mentorName,
      studentId: params.studentId,
      studentName: params.studentName,
      notes: params.notes,
      recommendation: params.recommendation,
      createdAt: new Date().toISOString(),
    };
    this.db.mentor_feedbacks[feedbackId] = fb;
    this.save();
    return fb;
  }

  public getFeedbacksForStudent(studentId: string): MentorFeedbackEntity[] {
    return Object.values(this.db.mentor_feedbacks).filter((f) => f.studentId === studentId);
  }

  // 8. Add Assignment from Trainer
  public addAssignment(params: {
    courseId: string;
    courseTitle: string;
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
  }): AssignmentEntity {
    const assignmentId = 'asg_' + crypto.randomUUID().substring(0, 8);
    const asg: AssignmentEntity = {
      assignmentId,
      courseId: params.courseId,
      courseTitle: params.courseTitle,
      title: params.title,
      description: params.description,
      dueDate: params.dueDate,
      totalPoints: params.totalPoints,
      submittedCount: 0,
      avgScore: 0,
    };
    this.db.assignments[assignmentId] = asg;
    this.save();
    return asg;
  }

  public getAssignments(): AssignmentEntity[] {
    return Object.values(this.db.assignments);
  }

  // 9. Skill Gap Engine (Section 20 & 21)
  public analyzeSkillGap(userSkills: string[], careerGoal: string) {
    const required = CAREER_GOALS_SKILLS[careerGoal] || [
      'Python',
      'SQL',
      'Problem Solving',
      'Git',
      'System Architecture',
    ];

    const lowerHave = new Set((userSkills || []).map((s) => s.toLowerCase().trim()));
    const skillsHave = required.filter((r) => lowerHave.has(r.toLowerCase()));
    const skillsNeed = required.filter((r) => !lowerHave.has(r.toLowerCase()));
    const matchPercentage = Math.round((skillsHave.length / Math.max(required.length, 1)) * 100);

    // Recommend courses matching the missing skills
    const courses = Object.values(this.db.courses);
    const recommendedCourses = courses
      .map((c) => {
        const addressed = c.skillsCovered.filter((sc) =>
          skillsNeed.some((sn) => sn.toLowerCase() === sc.toLowerCase())
        );
        return {
          courseId: c.Course_ID,
          title: c.title,
          category: c.category,
          difficulty: c.difficulty,
          missingSkillsAddressed: addressed,
        };
      })
      .filter((rc) => rc.missingSkillsAddressed.length > 0)
      .slice(0, 3);

    return {
      careerGoal,
      skillsHave,
      skillsNeed,
      matchPercentage,
      recommendedCourses,
    };
  }

  // 10. Contact Message Storage
  public recordContactMessage(data: {
    name: string;
    email: string;
    phone?: string;
    userType: string;
    organization?: string;
    subject: string;
    message: string;
  }): ContactMessageEntity {
    const id = 'msg_' + crypto.randomUUID().substring(0, 8);
    const entity: ContactMessageEntity = {
      id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      userType: data.userType,
      organization: data.organization,
      subject: data.subject,
      message: data.message,
      createdAt: new Date().toISOString(),
    };
    this.db.contact_messages[id] = entity;
    this.save();
    return entity;
  }

  // --- FIRST ADMIN & ADMIN STATUS METHODS ---

  public getAdminCount(): number {
    return Object.keys(this.db.admins).length;
  }

  public hasAdmin(): boolean {
    return this.getAdminCount() > 0;
  }

  public setupFirstAdmin(data: {
    fullName: string;
    email: string;
    password: string;
  }): { success: boolean; user?: UserEntity; admin?: AdminEntity; error?: string } {
    if (this.hasAdmin()) {
      return { success: false, error: 'Administrator setup has already been completed.' };
    }

    const emailNorm = data.email.trim().toLowerCase();
    const userId = 'usr_admin_' + crypto.randomUUID().substring(0, 8);
    const adminId = 'adm_' + crypto.randomUUID().substring(0, 8);
    const now = new Date().toISOString();

    const user: UserEntity = {
      userId,
      email: emailNorm,
      role: 'super_admin',
      status: 'active',
      Organization_ID: null,
      emailVerified: true,
      passwordHash: hashString(data.password),
      createdAt: now,
    };

    const admin: AdminEntity = {
      adminId,
      userId,
      fullName: data.fullName.trim(),
      email: emailNorm,
      role: 'super_admin',
      Organization_ID: null,
      status: 'active',
      createdAt: now,
    };

    this.db.users[userId] = user;
    this.db.admins[adminId] = admin;
    this.save();

    return { success: true, user, admin };
  }

  // --- VERIFICATION CODE MANAGEMENT METHODS ---

  public validateCode(
    plainCode: string,
    requestedRole: 'mentor' | 'trainer'
  ): { valid: boolean; error?: string } {
    if (!plainCode) return { valid: false, error: 'Verification code is required.' };
    const trimmed = plainCode.trim();

    // Default demo codes
    if (requestedRole === 'mentor' && (trimmed === 'CODE_MENTOR_2026' || trimmed === 'MENTOR-AI-2026')) {
      return { valid: true };
    }
    if (requestedRole === 'trainer' && (trimmed === 'CODE_TRAINER_2026' || trimmed === 'TRAINER-PRO-2026')) {
      return { valid: true };
    }

    const inputHash = hashString(trimmed);
    const found = Object.values(this.db.verification_codes).find(
      (c) => c.codeHash === inputHash || c.codeId === trimmed || c.plainCodePrefix === trimmed
    );

    if (!found) {
      return { valid: false, error: `Invalid ${requestedRole} verification code. Please check your authorization code.` };
    }

    if (found.status !== 'active') {
      return { valid: false, error: `This verification code is ${found.status}.` };
    }

    if (new Date(found.expiresAt).getTime() < Date.now()) {
      found.status = 'expired';
      this.save();
      return { valid: false, error: 'This verification code has expired.' };
    }

    if (found.role !== requestedRole) {
      return { valid: false, error: `This code was issued for ${found.role}s, not ${requestedRole}s.` };
    }

    if (found.timesUsed >= found.usageLimit) {
      return { valid: false, error: 'This verification code has reached its maximum usage limit.' };
    }

    return { valid: true };
  }

  public getAllVerificationCodes(): VerificationCodeEntity[] {
    return Object.values(this.db.verification_codes).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createVerificationCode(
    role: 'mentor' | 'trainer',
    customCode?: string,
    expiresInDays: number = 30,
    usageLimit: number = 5,
    note?: string,
    createdBy: string = 'superadmin@learnai.com'
  ): { codeId: string; plainCode: string; entity: VerificationCodeEntity } {
    const plain =
      (customCode && customCode.trim()) ||
      `${role.toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}-2026`;
    const codeId = 'vc_' + crypto.randomUUID().substring(0, 8);
    const codeHash = hashString(plain);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const entity: VerificationCodeEntity = {
      codeId,
      codeHash,
      plainCodePrefix: plain.substring(0, 6) + '***',
      role,
      createdAt: now.toISOString(),
      expiresAt,
      usageLimit,
      timesUsed: 0,
      status: 'active',
      note: note || `Issued for ${role} registration intake`,
      createdBy,
    };

    this.db.verification_codes[codeId] = entity;
    this.save();

    return { codeId, plainCode: plain, entity };
  }

  public revokeVerificationCode(codeId: string): boolean {
    const code = this.db.verification_codes[codeId];
    if (!code) return false;
    code.status = 'revoked';
    this.save();
    return true;
  }

  public regenerateVerificationCode(codeId: string): { plainCode: string; entity: VerificationCodeEntity } | null {
    const existing = this.db.verification_codes[codeId];
    if (!existing) return null;

    const freshPlain = `${existing.role.toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}-2026`;
    existing.codeHash = hashString(freshPlain);
    existing.plainCodePrefix = freshPlain.substring(0, 6) + '***';
    existing.timesUsed = 0;
    existing.status = 'active';
    existing.createdAt = new Date().toISOString();
    this.save();

    return { plainCode: freshPlain, entity: existing };
  }

  // --- EMAIL VERIFICATION ---

  public verifyEmail(email: string, token?: string): { success: boolean; error?: string } {
    const user = this.getUserByEmail(email);
    if (!user) return { success: false, error: 'User not found.' };

    user.emailVerified = true;
    if (user.status === 'pending') {
      user.status = 'approved';
    }
    this.save();
    return { success: true };
  }

  // --- REGISTRATION APPROVAL & DOSSIER MANAGEMENT ---

  public getPendingRegistrations(): Array<{
    user: UserEntity;
    profile: any;
    registeredRole: UserRole;
    verificationCodeUsed?: string;
  }> {
    const pendingUsers = Object.values(this.db.users).filter((u) => u.status === 'pending');
    return pendingUsers.map((user) => {
      let profile: any = null;
      let verificationCodeUsed: string | undefined = undefined;

      if (user.role === 'student') profile = this.getStudentByUserId(user.userId);
      else if (user.role === 'mentor') {
        const m = this.getMentorByUserId(user.userId);
        profile = m;
        verificationCodeUsed = m?.verificationCodeUsed;
      } else if (user.role === 'trainer') {
        const t = this.getTrainerByUserId(user.userId);
        profile = t;
        verificationCodeUsed = t?.verificationCodeUsed;
      } else if (user.role === 'public_user') profile = this.getPublicUserByUserId(user.userId);
      else if (user.role === 'institution_admin' || user.role === 'super_admin' || user.role === 'admin')
        profile = this.getAdminByUserId(user.userId);

      return {
        user,
        profile,
        registeredRole: user.role,
        verificationCodeUsed,
      };
    });
  }

  public approveRegistration(userId: string, approvedBy?: string): { success: boolean; error?: string } {
    const user = this.db.users[userId];
    if (!user) return { success: false, error: 'User not found.' };

    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    user.approvedBy = approvedBy || 'superadmin@learnai.com';

    if (user.role === 'student') {
      const s = this.getStudentByUserId(userId);
      if (s) s.status = 'approved';
    } else if (user.role === 'mentor') {
      const m = this.getMentorByUserId(userId);
      if (m) m.status = 'approved';
    } else if (user.role === 'trainer') {
      const t = this.getTrainerByUserId(userId);
      if (t) t.status = 'approved';
    } else if (user.role === 'public_user') {
      const p = this.getPublicUserByUserId(userId);
      if (p) p.status = 'approved';
    }

    this.save();
    return { success: true };
  }

  public rejectRegistration(userId: string, reason?: string): { success: boolean; error?: string } {
    const user = this.db.users[userId];
    if (!user) return { success: false, error: 'User not found.' };

    user.status = 'rejected';

    if (user.role === 'student') {
      const s = this.getStudentByUserId(userId);
      if (s) s.status = 'rejected';
    } else if (user.role === 'mentor') {
      const m = this.getMentorByUserId(userId);
      if (m) m.status = 'rejected';
    } else if (user.role === 'trainer') {
      const t = this.getTrainerByUserId(userId);
      if (t) t.status = 'rejected';
    } else if (user.role === 'public_user') {
      const p = this.getPublicUserByUserId(userId);
      if (p) p.status = 'rejected';
    }

    this.save();
    return { success: true };
  }

  public getAllUserDossiers(organizationId?: string | null): Array<{
    userId: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    status: AccountStatus;
    Organization_ID: string | null;
    organizationName: string;
    emailVerified: boolean;
    createdAt: string;
    profile: any;
  }> {
    return Object.values(this.db.users)
      .filter((u) => {
        if (!organizationId) return true;
        return u.Organization_ID === organizationId;
      })
      .map((u) => {
        let profile: any = null;
        if (u.role === 'student') profile = this.getStudentByUserId(u.userId);
        else if (u.role === 'mentor') profile = this.getMentorByUserId(u.userId);
        else if (u.role === 'trainer') profile = this.getTrainerByUserId(u.userId);
        else if (u.role === 'public_user') profile = this.getPublicUserByUserId(u.userId);
        else if (u.role === 'institution_admin' || u.role === 'super_admin' || u.role === 'admin')
          profile = this.getAdminByUserId(u.userId);

        const org = u.Organization_ID ? this.getOrganizationById(u.Organization_ID) : null;
        const orgName = org ? org.name : (u.Organization_ID ? u.Organization_ID : 'Public Student');
        const fullName = profile?.fullName || profile?.name || u.email.split('@')[0];
        const phone = profile?.phone || '';

        return {
          userId: u.userId,
          name: fullName,
          email: u.email,
          phone,
          role: u.role,
          status: u.status,
          Organization_ID: u.Organization_ID || null,
          organizationName: orgName,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
          profile,
        };
      });
  }

  public getAllRoleChangeHistory(organizationId?: string | null): RoleChangeHistoryEntity[] {
    const list = Object.values(this.db.role_history || {});
    const filtered = organizationId
      ? list.filter((r) => r.organizationId === organizationId)
      : list;
    return filtered.sort(
      (a, b) => new Date(b.changedDate).getTime() - new Date(a.changedDate).getTime()
    );
  }

  public updateUserRoleWithHistory(params: {
    userId: string;
    newRole: UserRole;
    changedBy: string;
    operatorRole?: UserRole;
    email?: string;
    reason?: string;
    qualification?: string;
    specialization?: string;
    yearsOfExperience?: number;
    expertise?: string[];
    skills?: string[];
    availability?: string;
    coursesCanTeach?: string[];
    updateOrgId?: string | null;
  }): { success: boolean; error?: string; user?: UserEntity } {
    let user: UserEntity | null = this.db.users[params.userId] || null;
    if (!user && params.email) {
      user = this.getUserByEmail(params.email);
    }
    if (!user && params.userId.includes('@')) {
      user = this.getUserByEmail(params.userId);
    }
    if (!user) {
      // Create user entry for external/Supabase user if not currently in local memory
      user = {
        userId: params.userId,
        email: params.email || (params.userId.includes('@') ? params.userId : `${params.userId}@learnai.com`),
        role: params.newRole,
        status: 'active',
        Organization_ID: params.updateOrgId || null,
        emailVerified: true,
        passwordHash: '',
        createdAt: new Date().toISOString(),
      };
      this.db.users[user.userId] = user;
    }

    const previousRole = user.role;
    const isSuperAdmin =
      params.operatorRole === 'super_admin' ||
      params.changedBy === 'superadmin@learnai.com';

    // Disallow regular institution admin from assigning Admin or Super Admin roles
    if (
      (params.newRole === 'admin' ||
        params.newRole === 'super_admin' ||
        params.newRole === 'institution_admin') &&
      !isSuperAdmin
    ) {
      return {
        success: false,
        error: 'Permission denied: Only Super Administrator can create or manage Administrator roles.',
      };
    }

    if (params.updateOrgId !== undefined) {
      user.Organization_ID = params.updateOrgId;
    }

    user.role = params.newRole;

    let existingProfile: any = null;
    if (previousRole === 'student') existingProfile = this.getStudentByUserId(user.userId);
    else if (previousRole === 'mentor') existingProfile = this.getMentorByUserId(user.userId);
    else if (previousRole === 'trainer') existingProfile = this.getTrainerByUserId(user.userId);
    else if (previousRole === 'public_user') existingProfile = this.getPublicUserByUserId(user.userId);
    else if (
      previousRole === 'institution_admin' ||
      previousRole === 'super_admin' ||
      previousRole === 'admin'
    )
      existingProfile = this.getAdminByUserId(user.userId);

    const userName = existingProfile?.fullName || user.email.split('@')[0];
    const userPhone = existingProfile?.phone || '';

    // If new role is mentor, provision / update mentor entity
    if (params.newRole === 'mentor') {
      const existingMentor = this.getMentorByUserId(user.userId);
      if (existingMentor) {
        if (params.qualification) existingMentor.qualification = params.qualification;
        if (params.specialization) existingMentor.specialization = params.specialization;
        if (params.yearsOfExperience) existingMentor.yearsOfExperience = Number(params.yearsOfExperience);
        if (params.expertise) existingMentor.skills = params.expertise;
        if (params.availability) existingMentor.availability = params.availability;
        existingMentor.status = 'approved';
        if (user.Organization_ID) existingMentor.Organization_ID = user.Organization_ID;
      } else {
        const mentorId = 'men_' + crypto.randomUUID().substring(0, 8);
        this.db.mentors[mentorId] = {
          mentorId,
          userId: user.userId,
          fullName: userName,
          email: user.email,
          phone: userPhone,
          Organization_ID: user.Organization_ID || undefined,
          qualification: params.qualification || 'Certified Industry Professional',
          specialization: params.specialization || 'Technical Career Mentorship',
          yearsOfExperience: Number(params.yearsOfExperience) || 5,
          skills: params.expertise || ['Mentorship', 'Code Review', 'Career Growth'],
          availability: params.availability || 'Weekdays (Evening) & Weekends',
          status: 'approved',
          createdAt: new Date().toISOString(),
        };
      }
    }

    // If new role is trainer, provision / update trainer entity
    if (params.newRole === 'trainer') {
      const existingTrainer = this.getTrainerByUserId(user.userId);
      if (existingTrainer) {
        if (params.qualification) existingTrainer.qualification = params.qualification;
        if (params.specialization) existingTrainer.specialization = params.specialization;
        if (params.yearsOfExperience) existingTrainer.experience = Number(params.yearsOfExperience);
        if (params.skills) existingTrainer.skills = params.skills;
        existingTrainer.status = 'approved';
        if (user.Organization_ID) existingTrainer.Organization_ID = user.Organization_ID;
      } else {
        const trainerId = 'trn_' + crypto.randomUUID().substring(0, 8);
        this.db.trainers[trainerId] = {
          trainerId,
          userId: user.userId,
          fullName: userName,
          email: user.email,
          phone: userPhone,
          Organization_ID: user.Organization_ID || undefined,
          qualification: params.qualification || 'Senior Technical Trainer',
          specialization: params.specialization || 'Curriculum Instruction',
          experience: Number(params.yearsOfExperience) || 5,
          skills: params.skills || ['Python', 'System Architecture', 'FastAPI'],
          status: 'approved',
          createdAt: new Date().toISOString(),
        };
      }
    }

    // If new role is student, ensure student entity exists
    if (params.newRole === 'student') {
      const existingStudent = this.getStudentByUserId(user.userId);
      if (existingStudent) {
        existingStudent.status = 'approved';
        if (user.Organization_ID) existingStudent.Organization_ID = user.Organization_ID;
      } else {
        const studentId = 'stu_' + crypto.randomUUID().substring(0, 8);
        const org = user.Organization_ID ? this.getOrganizationById(user.Organization_ID) : null;
        this.db.students[studentId] = {
          studentId,
          userId: user.userId,
          fullName: userName,
          email: user.email,
          phone: userPhone,
          Organization_ID: user.Organization_ID || null,
          collegeName: org ? org.name : 'Independent Public Student',
          degree: 'B.S.',
          branch: 'Computer Science',
          graduationYear: '2026',
          experienceLevel: 'Intermediate',
          learningLevel: 'Undergraduate',
          skills: ['Python', 'SQL'],
          careerGoal: 'Software Engineer',
          courseProgress: 25,
          readinessScore: 70,
          status: 'approved',
          createdAt: new Date().toISOString(),
        };
      }
    }

    // Record Role Change History per Section 9
    if (!this.db.role_history) {
      this.db.role_history = {};
    }
    const historyId = 'rh_' + crypto.randomUUID().substring(0, 8);
    const historyRecord: RoleChangeHistoryEntity = {
      historyId,
      userId: user.userId,
      userName,
      userEmail: user.email,
      previousRole,
      newRole: params.newRole,
      changedBy: params.changedBy,
      organizationId: user.Organization_ID || null,
      changedDate: new Date().toISOString(),
      reason: params.reason || `Changed role from ${previousRole} to ${params.newRole}`,
    };
    this.db.role_history[historyId] = historyRecord;

    this.save();
    return { success: true, user };
  }

  public updateUserRoleByAdmin(userId: string, newRole: UserRole): { success: boolean; error?: string } {
    return this.updateUserRoleWithHistory({
      userId,
      newRole,
      changedBy: 'admin@learnai.com',
      reason: `Updated to ${newRole} via admin panel`,
    });
  }

  public toggleUserSuspension(userId: string): { success: boolean; error?: string } {
    const user = this.db.users[userId];
    if (!user) return { success: false, error: 'User not found.' };

    user.status = user.status === 'suspended' ? 'approved' : 'suspended';
    this.save();
    return { success: true };
  }

  public deleteUserPermanently(userId: string): { success: boolean; error?: string } {
    if (!this.db.users[userId]) return { success: false, error: 'User not found.' };

    delete this.db.users[userId];

    Object.keys(this.db.students).forEach((k) => {
      if (this.db.students[k].userId === userId) delete this.db.students[k];
    });
    Object.keys(this.db.mentors).forEach((k) => {
      if (this.db.mentors[k].userId === userId) delete this.db.mentors[k];
    });
    Object.keys(this.db.trainers).forEach((k) => {
      if (this.db.trainers[k].userId === userId) delete this.db.trainers[k];
    });
    Object.keys(this.db.public_users).forEach((k) => {
      if (this.db.public_users[k].userId === userId) delete this.db.public_users[k];
    });
    Object.keys(this.db.admins).forEach((k) => {
      if (this.db.admins[k].userId === userId) delete this.db.admins[k];
    });

    this.save();
    return { success: true };
  }

  public resetToFirstAdminBootstrap(): void {
    this.db.admins = {};
    Object.keys(this.db.users).forEach((uid) => {
      const u = this.db.users[uid];
      if (u.role === 'admin' || u.role === 'super_admin' || u.role === 'institution_admin') {
        delete this.db.users[uid];
      }
    });
    this.save();
  }

  public seedSampleData(): void {
    this.seedDefaultsIfEmpty();
  }
}

export const backendDb = new BackendDatabase();
