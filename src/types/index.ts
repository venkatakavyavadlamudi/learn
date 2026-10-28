/**
 * AI Student Learning & Career Success Platform
 * Data Models & Multi-Tenant Types
 */

export type UserRole =
  | 'institution_admin'
  | 'student'
  | 'Student'
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

export interface Organization {
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
  studentCount?: number;
  mentorCount?: number;
  trainerCount?: number;
  courseCount?: number;
}

export interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  Organization_ID?: string | null;
  organizationName?: string;
  organization?: string;
  college?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  verificationStatus?: string;
  avatarUrl?: string;
  createdAt: string;
  approvedAt?: string;
  authProvider?: 'supabase' | 'local';
  profile?: any;
}

export interface StudentProfile {
  id?: string;
  studentId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID?: string | null;
  accountType?: 'College Student' | 'Public Student';
  collegeName: string;
  college?: string;
  degree: string;
  branch?: string;
  graduationYear?: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  learningLevel: 'Foundation' | 'Undergraduate' | 'Postgraduate' | 'Professional';
  skills: string[];
  careerGoal: string;
  targetRole?: string;
  interestedCourse?: string;
  Course_ID?: string;
  Mentor_ID?: string;
  mentorName?: string;
  courseProgress?: number;
  readinessScore?: number;
  status: AccountStatus;
  createdAt: string;
}

export interface RoleChangeHistory {
  historyId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  organizationId?: string | null;
  organizationName?: string;
  changedDate: string;
  reason: string;
}

export interface PublicUserProfile {
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

export interface MentorProfile {
  mentorId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID?: string;
  organizationName?: string;
  qualification: string;
  specialization: string;
  yearsOfExperience: number;
  skills: string[];
  availability: string;
  assignedStudentCount?: number;
  status: AccountStatus;
  createdAt: string;
}

export interface TrainerProfile {
  trainerId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  Organization_ID?: string;
  organizationName?: string;
  qualification: string;
  specialization: string;
  experience: number;
  skills: string[];
  assignedCourseCount?: number;
  status: AccountStatus;
  createdAt: string;
}

export interface AdminProfile {
  adminId: string;
  userId: string;
  fullName: string;
  email: string;
  role: 'institution_admin' | 'admin';
  Organization_ID?: string | null;
  organizationName?: string;
  createdAt: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  contentSummary: string;
}

export interface Course {
  Course_ID: string;
  id?: string; // alias
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  level?: string;
  skills?: string[];
  skillsCovered: string[];
  learningLevel: string;
  Organization_ID?: string | null; // null = platform-wide public course
  organizationName?: string;
  Trainer_ID?: string;
  trainerName?: string;
  instructor?: string;
  enrolledCount: number;
  rating: number;
  totalLessons: number;
  completedLessons?: number;
  progress?: number;
  lastActivity?: string;
  nextTopic?: string;
  lessons: CourseLesson[];
  badgeColor?: string;
}

export interface VerificationCode {
  codeId: string;
  codeHash: string;
  plainCodePrefix?: string;
  plainCodeMasked?: string;
  role: 'mentor' | 'trainer';
  createdAt: string;
  expiresAt: string;
  usageLimit: number;
  timesUsed: number;
  usageCount?: number;
  status: 'active' | 'revoked' | 'expired';
  note?: string;
  createdBy: string;
}

export interface PendingRegistration {
  user: User;
  profile: any;
  registeredRole: UserRole;
  verificationCodeUsed?: string;
  roleDetails?: any;
  verificationDetails?: any;
}

export interface Skill {
  id?: string;
  name: string;
  level?: number;
  proficiency?: number;
  targetProficiency?: number;
  category: string;
  verified?: boolean;
  verifiedStatus?: string;
}

export interface FocusTask {
  id: string;
  title: string;
  course?: string;
  dueTime?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  category?: string;
  completed: boolean;
}

export interface Activity {
  id: string;
  studentId?: string;
  title: string;
  description?: string;
  time?: string;
  timestamp?: string;
  type?: string;
  activityType?: string;
  iconType?: string;
}

export interface Assignment {
  assignmentId: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  submittedCount?: number;
  avgScore?: number;
}

export interface SkillGapAnalysis {
  careerGoal: string;
  skillsHave: string[];
  skillsNeed: string[];
  matchPercentage: number;
  recommendedCourses: Array<{
    courseId: string;
    title: string;
    category: string;
    difficulty: string;
    missingSkillsAddressed: string[];
  }>;
}

export interface MentorFeedback {
  feedbackId: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  notes: string;
  recommendation: string;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  role: string;
  question: string;
  category: 'Technical' | 'Behavioral' | 'System Design' | 'Problem Solving';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  userType: string;
  organization?: string;
  subject: string;
  message: string;
  createdAt?: string;
}
