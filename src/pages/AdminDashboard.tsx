import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService } from '../services/authService';
import { UserRole, User, VerificationCode, PendingRegistration, RoleChangeHistory } from '../types';
import { Sidebar } from '../components/Sidebar';
import { KpiCard } from '../components/dashboard/KpiCard';
import { StudentsByCourseChart } from '../components/dashboard/StudentsByCourseChart';
import { ReadinessMixChart } from '../components/dashboard/ReadinessMixChart';
import { InstitutionWeeklyActivityChart } from '../components/dashboard/InstitutionWeeklyActivityChart';
import { CourseCompletionFunnel } from '../components/dashboard/CourseCompletionFunnel';
import { AssessmentCourseChart } from '../components/dashboard/AssessmentCourseChart';
import { SkillsComparisonChart } from '../components/dashboard/SkillsComparisonChart';
import { dashboardDataService, AdminDashboardData } from '../services/dashboardDataService';
import { staffAllocationService } from '../services/staffAllocationService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { DoubtResolutionDonut } from '../components/dashboard/DoubtResolutionDonut';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  GraduationCap,
  Briefcase,
  Compass,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Mail,
  Calendar,
  Layers,
  BookOpen,
  Target,
  KeyRound,
  Clock,
  Check,
  Award,
  Settings,
  Database,
  History,
  Building,
  Phone,
  UserPlus,
  TrendingUp,
  BarChart3,
  Loader2,
  AlertCircle,
  Filter,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  initialTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'dashboard' }) => {
  const { navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());

  // Active tab state matching the Sidebar navigation
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isSuperAdmin = false; // Super Admin role has been removed per requirements

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleChangeHistory[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [verificationCodes, setVerificationCodes] = useState<VerificationCode[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<any | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);

  const checkSupabase = async () => {
    setIsCheckingSupabase(true);
    try {
      const status = await authService.getSupabaseStatus();
      setSupabaseStatus(status);
    } catch {
      setSupabaseStatus({ isConfigured: false, connected: false, error: 'Failed to test connection' });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  // Search & Filter state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');

  // Promote / Change Role Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [targetNewRole, setTargetNewRole] = useState<UserRole>('mentor');
  const [roleChangeConfirmed, setRoleChangeConfirmed] = useState(false);
  const [roleChangeReason, setRoleChangeReason] = useState('');
  const [isSavingRoleChange, setIsSavingRoleChange] = useState(false);

  // Mentor profile collection state
  const [mentorQualification, setMentorQualification] = useState('');
  const [mentorSpecialization, setMentorSpecialization] = useState('');
  const [mentorExperience, setMentorExperience] = useState('5');
  const [mentorExpertise, setMentorExpertise] = useState('');
  const [mentorAvailability, setMentorAvailability] = useState('');

  // Trainer profile collection state
  const [trainerQualification, setTrainerQualification] = useState('');
  const [trainerSpecialization, setTrainerSpecialization] = useState('');
  const [trainerExperience, setTrainerExperience] = useState('5');
  const [trainerSkills, setTrainerSkills] = useState('');
  const [trainerCoursesCanTeach, setTrainerCoursesCanTeach] = useState('');
  const [trainerAvailability, setTrainerAvailability] = useState('');

  // Create Institution Admin Modal (Super Admin only)
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organizationId: '',
    password: '',
  });

  // Create Organization Modal (Super Admin only)
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('College');

  // Selected Organization Overview Modal
  const [selectedOrgOverview, setSelectedOrgOverview] = useState<any | null>(null);

  // Selected User Dossier Modal
  const [selectedUserDossier, setSelectedUserDossier] = useState<any | null>(null);

  // Loading & Toast State
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [adminStudentSearch, setAdminStudentSearch] = useState('');
  const [courseHealthFilter, setCourseHealthFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Allocation State
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedStudentForAllocation, setSelectedStudentForAllocation] = useState<any | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminDashboardData | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live admin analytics from Supabase independently so secondary failures don't block KPI metrics
      try {
        const analytics = await dashboardDataService.getAdminData({
          dateRange: dateRangeFilter,
          courseId: selectedCourseFilter
        });
        setAdminAnalytics(analytics);
      } catch (err: any) {
        console.error('[LearnAI] Failed to load admin metrics:', err);
        showToast(err?.message || 'Failed to load live metrics.', 'error');
      }

      // 2. Fetch supporting datasets with Promise.allSettled so secondary failures don't wipe analytics
      const [allUsersRes, orgsRes, historyRes, pendingRes, codesRes] = await Promise.allSettled([
        authService.getAllUsers(),
        authService.getOrganizations(),
        authService.getRoleHistory(),
        authService.getPendingRegistrations(),
        authService.getVerificationCodes(),
      ]);

      if (allUsersRes.status === 'fulfilled') setUsers(allUsersRes.value);
      if (orgsRes.status === 'fulfilled') setOrganizationsList(orgsRes.value);
      if (historyRes.status === 'fulfilled') setRoleHistory(historyRes.value);
      if (pendingRes.status === 'fulfilled') setPendingRegistrations(pendingRes.value);
      if (codesRes.status === 'fulfilled') setVerificationCodes(codesRes.value);
    } catch {
      showToast('Failed to load administrative dataset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    loadData();

    // Auto-refresh fresh counts when the window regains focus
    const handleFocus = () => {
      dashboardDataService.getAdminData().then((fresh) => {
        setAdminAnalytics(fresh);
      }).catch(() => {});
    };

    window.addEventListener('focus', handleFocus);

    // Setup Supabase Realtime subscription for live metrics updates on public.learnai_users
    let realtimeChannel: any = null;
    if (isSupabaseConfigured() && supabase) {
      realtimeChannel = supabase
        .channel('admin_learnai_users_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'learnai_users' },
          (payload) => {
            console.log('[LearnAI Realtime] Postgres change on learnai_users detected:', payload);
            dashboardDataService.getAdminData().then((fresh) => {
              setAdminAnalytics(fresh);
            }).catch(() => {});
          }
        )
        .subscribe((status) => {
          console.log('[LearnAI Realtime] Subscription status for learnai_users:', status);
        });
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [navigate]);

  // Refresh fresh counts whenever user navigates back to the dashboard tab or filters change
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadData();
    }
  }, [activeTab, dateRangeFilter, selectedCourseFilter]);

  if (!currentUser) return null;

  const roleStr = String(currentUser.role || '').toLowerCase();
  const isInstitutionAdmin =
    roleStr === 'institution_admin' || roleStr === 'institution admin' || roleStr === 'admin';

  // Strict role check: students, mentors, trainers blocked
  if (!isInstitutionAdmin) {
    const redirectPath = authService.getRoleDashboardPath(currentUser.role);
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#FF7272] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A]">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Administrative privileges required to access this console.
          </p>
          <button
            onClick={() => navigate(redirectPath)}
            className="w-full py-2.5 px-4 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Scoped dataset for Institution Admin (isolated by Organization_ID)
  const scopedUsers = users.filter(
    (u) =>
      u.organizationId === currentUser.Organization_ID ||
      u.Organization_ID === currentUser.Organization_ID
  );

  // Counts
  const totalStudents = scopedUsers.filter((u) => u.role === 'student').length;
  const totalMentors = scopedUsers.filter((u) => u.role === 'mentor').length;
  const totalTrainers = scopedUsers.filter((u) => u.role === 'trainer').length;
  const totalAdmins = scopedUsers.filter(
    (u) => u.role === 'admin' || u.role === 'institution_admin'
  ).length;
  const totalOrganizations = organizationsList.length;

  // Filtered users for table
  const filteredUsers = scopedUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearchQuery));

    let effectiveRole = userRoleFilter;
    if (userRoleFilter === 'all') {
      if (activeTab === 'students') effectiveRole = 'student';
      else if (activeTab === 'mentors') effectiveRole = 'mentor';
      else if (activeTab === 'trainers') effectiveRole = 'trainer';
      else if (activeTab === 'admins') effectiveRole = 'admin';
    }

    const matchesRole =
      effectiveRole === 'all' ? true : u.role === effectiveRole;

    const matchesOrg =
      selectedOrgFilter === 'all'
        ? true
        : selectedOrgFilter === 'NONE'
        ? !u.organizationId && !u.Organization_ID
        : u.organizationId === selectedOrgFilter || u.Organization_ID === selectedOrgFilter;

    return matchesSearch && matchesRole && matchesOrg;
  });

  const handleOpenAllocation = (student: any) => {
    setSelectedStudentForAllocation(student);
    setSelectedTrainerId(student.trainerId || '');
    setSelectedMentorId(student.mentorId || '');
    setAllocationNotes('');
    setIsAllocationModalOpen(true);
  };

  const handleSaveAllocation = async () => {
    if (!selectedStudentForAllocation || isSavingAllocation) return;

    setIsSavingAllocation(true);
    try {
      const res = await staffAllocationService.allocateStaff({
        student_id: selectedStudentForAllocation.id,
        trainer_id: selectedTrainerId || undefined,
        mentor_id: selectedMentorId || undefined,
        allocated_by: currentUser.id,
        notes: allocationNotes.trim()
      });

      if (res.success) {
        showToast(`Allocation updated for ${selectedStudentForAllocation.name}!`);
        setIsAllocationModalOpen(false);
        await loadData();
      } else {
        showToast(res.error || 'Failed to update allocation.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving allocation.', 'error');
    } finally {
      setIsSavingAllocation(false);
    }
  };

  // Promote / Role Change Action
  const handleOpenPromote = (u: any, desiredRole?: UserRole) => {
    setEditingUser(u);
    const nextRole =
      desiredRole || (u.role === 'student' ? 'mentor' : u.role === 'mentor' ? 'trainer' : 'student');
    setTargetNewRole(nextRole);
    setRoleChangeConfirmed(false);
    setRoleChangeReason(`Assigned as ${nextRole}`);

    // Pre-populate fields
    setMentorQualification(u.profile?.qualification || 'B.Tech / Industry Professional');
    setMentorSpecialization(u.profile?.specialization || 'AI & Full Stack Mentorship');
    setMentorExperience('5');
    setMentorExpertise(
      Array.isArray(u.profile?.skills) ? u.profile.skills.join(', ') : 'Python, SQL, Algorithms'
    );
    setMentorAvailability('Weekdays (Evening) & Weekends');

    setTrainerQualification(u.profile?.qualification || 'Senior Technical Educator');
    setTrainerSpecialization(u.profile?.specialization || 'Curriculum Instruction');
    setTrainerExperience('6');
    setTrainerSkills('Python, Data Analysis, SQL');
    setTrainerCoursesCanTeach('Python Fundamentals, Applied AI');
    setTrainerAvailability('Cohort Sessions');
  };

  const handleSaveRoleChange = async () => {
    if (!editingUser || !roleChangeConfirmed || isSavingRoleChange) return;

    // Security check: Admin cannot promote users to Admin
    if (targetNewRole === 'admin' || targetNewRole === 'institution_admin') {
      showToast('Institution Admins cannot promote users to Admin.', 'error');
      return;
    }

    setIsSavingRoleChange(true);
    try {
      const payload: any = {
        userId: editingUser.userId || editingUser.id,
        email: editingUser.email,
        newRole: targetNewRole,
        reason: roleChangeReason.trim() || `Promoted role to ${targetNewRole}`,
      };

      if (targetNewRole === 'mentor') {
        payload.qualification = mentorQualification;
        payload.specialization = mentorSpecialization;
        payload.yearsOfExperience = Number(mentorExperience) || 5;
        payload.expertise = mentorExpertise.split(',').map((s) => s.trim());
        payload.availability = mentorAvailability;
      } else if (targetNewRole === 'trainer') {
        payload.qualification = trainerQualification;
        payload.specialization = trainerSpecialization;
        payload.yearsOfExperience = Number(trainerExperience) || 5;
        payload.skills = trainerSkills.split(',').map((s) => s.trim());
        payload.coursesCanTeach = trainerCoursesCanTeach.split(',').map((s) => s.trim());
        payload.availability = trainerAvailability;
      }

      const res = await authService.promoteUser(payload);
      if (res.success) {
        showToast(`User successfully updated to ${targetNewRole.toUpperCase()}!`);
        setEditingUser(null);
        await loadData();
      } else {
        showToast(res.error || 'Failed to update user role.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user role. Please try again.', 'error');
    } finally {
      setIsSavingRoleChange(false);
    }
  };

  // Create Institution Admin (Super Admin only)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.name || !adminFormData.email || !adminFormData.password) {
      showToast('Name, Email, and Password are required.', 'error');
      return;
    }

    const res = await authService.createInstitutionAdmin({
      name: adminFormData.name.trim(),
      email: adminFormData.email.trim(),
      phone: adminFormData.phone.trim(),
      organizationId: adminFormData.organizationId || undefined,
      password: adminFormData.password,
    });

    if (res.success) {
      showToast('Institution Admin created successfully!');
      setIsCreateAdminOpen(false);
      setAdminFormData({ name: '', email: '', phone: '', organizationId: '', password: '' });
      loadData();
    } else {
      showToast(res.error || 'Failed to create Institution Admin.', 'error');
    }
  };

  // Create Organization (Super Admin only)
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const res = await authService.createOrganization({
      name: newOrgName.trim(),
      type: newOrgType,
    });

    if (res.success) {
      showToast(`Organization "${newOrgName}" created successfully!`);
      setIsCreateOrgOpen(false);
      setNewOrgName('');
      loadData();
    } else {
      showToast(res.error || 'Failed to create organization.', 'error');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'institution_admin':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F9] text-[#32D6B0] border border-[#E2E8F0]">
            Admin
          </span>
        );
      case 'trainer':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            Trainer
          </span>
        );
      case 'mentor':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F0FDF4] text-[#78D98A] border border-[#BBF7D0]">
            Mentor
          </span>
        );
      case 'student':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            Student
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D0C] flex font-['Plus Jakarta Sans']">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 duration-150">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-[#151A18] text-[#32D6B0] border-[#32D6B0]/30 shadow-teal-900/10'
                : 'bg-[#151A18] text-[#FF7272] border-[#FF7272]/30 shadow-red-900/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 250px Fixed Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeItem={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">


          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#151A18] text-[#A3ADA7] border border-[#29312C]">
              {`Organization: ${currentUser.organizationName || 'Assigned College'}`}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F7F6] tracking-tight mt-1 font-['Outfit']">
                {'Institution Admin Dashboard'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A3ADA7] mt-0.5">
                {isSuperAdmin
                  ? 'Manage institutions, organization administrators, courses, and platform analytics.'
                  : `Managing isolated cohorts, trainers, mentors, and students for ${currentUser.organizationName || 'your institution'}.`}
              </p>
            </div>

            {/* Top Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-[#151A18] border border-[#29312C] rounded-xl text-xs font-semibold text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 appearance-none shadow-sm cursor-pointer hover:border-[#32D6B0]/30 transition-colors"
                >
                  <option value="all">All Courses</option>
                  {adminAnalytics?.studentsByCourse.map(c => (
                    <option key={c.courseTitle} value={c.courseTitle}>{c.courseTitle}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-[#151A18] border border-[#29312C] rounded-xl text-xs font-semibold text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 appearance-none shadow-sm cursor-pointer hover:border-[#32D6B0]/30 transition-colors"
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="semester">Last Semester</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. DASHBOARD OVERVIEW TAB                                 */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {adminAnalytics?.queryErrors && adminAnalytics.queryErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-[#1A1212] border border-[#FF7272]/20 text-[#FF7272] flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold">Database Query Warning</h4>
                    <p className="text-xs mt-1 text-[#FF7272]/70">
                      Some Supabase analytics queries encountered issues: {adminAnalytics.queryErrors.join('; ')}
                    </p>
                  </div>
                </div>
              )}


              {/* ========================================================= */}
              {/* 7 KPI CARDS PER SPECIFICATION                             */}
              {/* ========================================================= */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                <KpiCard
                  title="Enrolled Students"
                  value={
                    loading && !adminAnalytics
                      ? '...'
                      : adminAnalytics?.roleErrors?.totalStudents || adminAnalytics?.kpis.totalStudents === null
                      ? 'Error'
                      : adminAnalytics?.kpis.totalStudents ?? '...'
                  }
                  subtitle="Active cohort"
                  icon={Users}
                  accent="teal"
                />
                <KpiCard
                  title="Total Trainers"
                  value={
                    loading && !adminAnalytics
                      ? '...'
                      : adminAnalytics?.roleErrors?.totalTrainers || adminAnalytics?.kpis.totalTrainers === null
                      ? 'Error'
                      : adminAnalytics?.kpis.totalTrainers ?? '...'
                  }
                  subtitle="Faculty instructors"
                  icon={GraduationCap}
                  accent="teal"
                />
                <KpiCard
                  title="Total Mentors"
                  value={
                    loading && !adminAnalytics
                      ? '...'
                      : adminAnalytics?.roleErrors?.totalMentors || adminAnalytics?.kpis.totalMentors === null
                      ? 'Error'
                      : adminAnalytics?.kpis.totalMentors ?? '...'
                  }
                  subtitle="Industry guides"
                  icon={Award}
                  accent="teal"
                />
                <KpiCard
                  title="Total Admins"
                  value={adminAnalytics?.kpis.totalAdmins ?? 1}
                  subtitle="System governance"
                  icon={ShieldCheck}
                  accent="lime"
                />
                <KpiCard
                  title="Active Courses"
                  value={adminAnalytics ? adminAnalytics.kpis.activeCourses : 0}
                  subtitle="Accredited paths"
                  icon={BookOpen}
                  accent="lime"
                />
                <KpiCard
                  title="Students at Risk"
                  value={adminAnalytics ? adminAnalytics.kpis.studentsAtRisk : 0}
                  subtitle="Readiness < 60%"
                  icon={AlertTriangle}
                  accent="red"
                />
                <KpiCard
                  title="Readiness Score"
                  value={adminAnalytics ? `${adminAnalytics.kpis.overallReadiness}%` : '0%'}
                  subtitle="Average mastery"
                  icon={Target}
                  accent="yellow"
                />
              </div>

              {/* ========================================================= */}
              {/* 4 PRIMARY ANALYTICAL CHARTS (Power BI Order)             */}
              {/* ========================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Students by Course */}
                <StudentsByCourseChart
                  data={adminAnalytics?.studentsByCourse || []}
                  onCourseClick={(title) => {
                    setSelectedCourseFilter(title);
                    setActiveTab('students');
                  }}
                />

                {/* Chart 2: Readiness Mix by Course */}
                <ReadinessMixChart
                  data={adminAnalytics?.readinessMixByCourse || []}
                />

                {/* Chart 3: Weekly Activity */}
                <InstitutionWeeklyActivityChart
                  data={adminAnalytics?.weeklyActivity || []}
                />

                {/* Chart 4: Doubt Resolution Donut */}
                <DoubtResolutionDonut
                  data={adminAnalytics?.doubtResolution || []}
                />
              </div>

              {/* ========================================================= */}
              {/* SYSTEM NOTIFICATIONS & AT-RISK COHORT ALERTS             */}
              {/* ========================================================= */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-['Outfit'] text-[#0F172A]">
                        Academic Operational Alerts & Cohort Notices
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Automated threshold monitoring for at-risk cohorts and curriculum bottlenecks
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                    adminAnalytics && adminAnalytics.kpis.studentsAtRisk > 0 
                    ? 'bg-red-50 text-red-600 border-red-100' 
                    : 'bg-green-50 text-green-600 border-green-100'
                  }`}>
                    {adminAnalytics && adminAnalytics.kpis.studentsAtRisk > 0 ? 'Action Required' : 'All Cohorts Healthy'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#FF7272] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {adminAnalytics?.commonSkillGaps[0]
                          ? `Skill Gap Deficit: ${adminAnalytics.commonSkillGaps[0].skill}`
                          : 'Curriculum Competency Alert'}
                      </span>
                      <span className="text-[11px] font-mono text-[#A3ADA7]">
                        {adminAnalytics?.commonSkillGaps[0]
                          ? `Affects ${adminAnalytics.commonSkillGaps[0].affectedStudents} Students`
                          : '0 Affected'}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3ADA7] leading-relaxed">
                      {adminAnalytics?.commonSkillGaps[0]
                        ? `Average student mastery in ${adminAnalytics.commonSkillGaps[0].skill} has a ${adminAnalytics.commonSkillGaps[0].avgDeficit}% deficit below target benchmark. Review faculty workshops.`
                        : 'No critical skill deficits detected across current skill assessments.'}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                            if (adminAnalytics?.commonSkillGaps[0]) {
                                showToast(`Notifying relevant trainers about ${adminAnalytics.commonSkillGaps[0].skill} gap...`);
                            } else {
                                showToast('No trainers to notify.', 'error');
                            }
                        }}
                        className="text-xs font-semibold text-[#32D6B0] hover:text-[#78D98A] transition-colors cursor-pointer"
                      >
                        Notify Relevant Trainers →
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#F2D64B] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> At-Risk Cohort Monitoring
                      </span>
                      <span className="text-[11px] font-mono text-[#A3ADA7]">
                        {adminAnalytics ? `${adminAnalytics.kpis.studentsAtRisk} Students At Risk` : '0 At Risk'}
                      </span>
                    </div>
                    <p className="text-xs text-[#A3ADA7] leading-relaxed">
                      {adminAnalytics && adminAnalytics.kpis.studentsAtRisk > 0
                        ? `${adminAnalytics.kpis.studentsAtRisk} students currently have readiness scores below 60% or low course activity. Review mentor allocations.`
                        : 'All enrolled students currently meet baseline readiness thresholds.'}
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setActiveTab('mentors')}
                        className="text-xs font-semibold text-[#32D6B0] hover:text-[#78D98A] transition-colors cursor-pointer"
                      >
                        Review Mentor Allocations →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* STUDENT DIRECTORY & PROGRESS DIRECTORY PREVIEW            */}
              {/* ========================================================= */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold font-['Outfit'] text-[#0F172A]">
                      Student Academic Directory & Readiness Summary
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Overview of enrolled students, syllabus progress velocity, and job readiness
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type="text"
                        value={adminStudentSearch}
                        onChange={(e) => setAdminStudentSearch(e.target.value)}
                        placeholder="Search student or course..."
                        className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:border-[#32D6B0]"
                      />
                    </div>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#E2E8F0] transition-colors whitespace-nowrap"
                    >
                      Full Directory →
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px] font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Student</th>
                        <th className="px-6 py-3.5">Course / Track</th>
                        <th className="px-6 py-3.5">Curriculum Progress</th>
                        <th className="px-6 py-3.5">Readiness Score</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {(adminAnalytics?.studentsList || [])
                        .filter(
                          (s) =>
                            s.name.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                            s.email.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                            s.enrolledCourse.toLowerCase().includes(adminStudentSearch.toLowerCase())
                        )
                        .slice(0, 6)
                        .map((student) => (
                           <tr key={student.id} className="hover:bg-[#0A0D0C]/40 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#F5F7F6]">{student.name}</p>
                              <p className="text-[11px] text-[#A3ADA7] font-mono">{student.email}</p>
                            </td>
                            <td className="px-6 py-4 font-medium text-[#A3ADA7]">
                              {student.enrolledCourse}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-[#F5F7F6]">{student.progress}%</span>
                                <div className="w-20 bg-[#29312C] rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      student.progress < 40
                                        ? 'bg-[#FF7272]'
                                        : student.progress < 70
                                        ? 'bg-[#F2D64B]'
                                        : 'bg-[#32D6B0]'
                                    }`}
                                    style={{ width: `${student.progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  student.readinessScore >= 80
                                    ? 'text-[#32D6B0]'
                                    : student.readinessScore >= 60
                                    ? 'text-[#F2D64B]'
                                    : 'text-[#FF7272]'
                                }`}
                              >
                                {student.readinessScore} / 100
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-950/20 text-[#32D6B0] border border-teal-900/30">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-[11px] text-[#A3ADA7] font-mono">
                              {student.registeredDate}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================= */}
              {/* FACULTY ROSTER (MENTORS & TRAINERS) DIRECTORY CARDS      */}
              {/* ========================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mentors Preview */}
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                    <div>
                      <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                        Institution Mentors Roster
                      </h3>
                      <p className="text-xs text-[#A3ADA7] mt-0.5">
                        Active 1-on-1 industry advisors and assignment guides
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('mentors')}
                      className="text-xs text-[#32D6B0] hover:text-[#78D98A] font-semibold transition-colors"
                    >
                      View All ({adminAnalytics?.mentorsList.length || 0}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(adminAnalytics?.mentorsList || []).map((mentor) => (
                      <div
                        key={mentor.id}
                        className="p-3.5 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex items-center justify-between hover:border-[#32D6B0]/30 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#F5F7F6]">{mentor.name}</p>
                          <p className="text-[11px] text-[#A3ADA7] font-mono">{mentor.email}</p>
                          <p className="text-[11px] text-[#32D6B0] mt-1">{mentor.specialization}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-xs font-mono font-bold text-[#F5F7F6] block">
                            {mentor.assignedStudentsCount} Mentees
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-teal-950/20 text-[#32D6B0] border border-teal-900/30">
                            {mentor.availability}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trainers Preview */}
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                    <div>
                      <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                        Curriculum Trainers & Faculty
                      </h3>
                      <p className="text-xs text-[#A3ADA7] mt-0.5">
                        Course instructors and technical lab leads
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('trainers')}
                      className="text-xs text-[#32D6B0] hover:text-[#78D98A] font-semibold transition-colors"
                    >
                      View All ({adminAnalytics?.trainersList.length || 0}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(adminAnalytics?.trainersList || []).map((trainer) => (
                      <div
                        key={trainer.id}
                        className="p-3.5 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex items-center justify-between hover:border-[#32D6B0]/30 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#F5F7F6]">{trainer.name}</p>
                          <p className="text-[11px] text-[#A3ADA7] font-mono">{trainer.email}</p>
                          <p className="text-[11px] text-[#32D6B0] mt-1">{trainer.specialization}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-xs font-mono font-bold text-[#F5F7F6] block">
                            {trainer.activeCoursesCount} Courses Led
                          </span>
                          <span className="text-[10px] text-[#A3ADA7] font-mono block">
                            {trainer.experienceYears} Years Exp
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. USER MANAGEMENT / ALL USERS TAB                        */}
          {/* ========================================================= */}
          {(activeTab === 'users' ||
            activeTab === 'user_management' ||
            activeTab === 'all_users' ||
            activeTab === 'students' ||
            activeTab === 'mentors' ||
            activeTab === 'trainers' ||
            activeTab === 'admins') && (
            <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-sm overflow-hidden space-y-0">
              {/* Table Toolbar */}
              <div className="p-6 border-b border-[#29312C] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">
                    {activeTab === 'students'
                      ? 'Students Directory'
                      : activeTab === 'mentors'
                      ? 'Mentors Directory'
                      : activeTab === 'trainers'
                      ? 'Trainers Directory'
                      : activeTab === 'admins'
                      ? 'Institution Administrators'
                      : 'User Management'}
                  </h2>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">
                    {isSuperAdmin
                      ? 'Platform-wide user directory with promotion capabilities.'
                      : `Users scoped to ${currentUser.organizationName || 'your institution'}.`}
                  </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="pl-8 pr-3 py-1.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50 w-48 sm:w-60 placeholder:text-[#A3ADA7]/50"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="py-1.5 px-3 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs font-semibold text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50 cursor-pointer appearance-none"
                  >
                    <option key="role-all" value="all">All Roles</option>
                    <option key="role-student" value="student">Student</option>
                    <option key="role-mentor" value="mentor">Mentor</option>
                    <option key="role-trainer" value="trainer">Trainer</option>
                    {isSuperAdmin && <option key="role-admin" value="admin">Admin</option>}
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#F5F7F6]">
                  <thead className="bg-[#0A0D0C]/50 border-b border-[#29312C] text-[#A3ADA7] uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Phone</th>
                      <th className="px-6 py-3.5">Current Role</th>
                      <th className="px-6 py-3.5">Organization</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29312C]/50">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-xs text-[#A3ADA7]">
                          No users found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={user.userId || user.id || user.email || `usr-${index}`} className="hover:bg-[#0A0D0C]/40 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#F5F7F6]">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-[#A3ADA7]">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-[#A3ADA7]">
                            {user.phone || '—'}
                          </td>
                          <td className="px-6 py-4">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-6 py-4 text-[#A3ADA7]">
                            {user.organizationName ||
                              (user.organizationId
                                ? user.organizationId
                                : 'Public Student')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950/20 text-[#32D6B0] border border-teal-900/30">
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedUserDossier(user)}
                                className="px-2.5 py-1 text-xs text-[#A3ADA7] hover:text-[#F5F7F6] rounded border border-[#29312C] hover:bg-[#0A0D0C] transition-colors"
                              >
                                View
                              </button>

                              {/* Promote / Change Role Button (Admins cannot promote Super Admin) */}
                              {user.role !== 'super_admin' && (
                                <button
                                  onClick={() => handleOpenPromote(user)}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#32D6B0] bg-teal-950/10 hover:bg-teal-950/30 rounded border border-[#32D6B0]/40 transition-colors"
                                >
                                  Change Role
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. ORGANIZATIONS TAB (Super Admin)                        */}
          {/* ========================================================= */}
          {activeTab === 'organizations' && isSuperAdmin && (
            <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-sm overflow-hidden space-y-0">
              <div className="p-6 border-b border-[#29312C] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">Organizations Directory</h2>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">
                    Colleges, universities, and technical training institutes registered on LearnAI.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOrgOpen(true)}
                  className="px-3.5 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-lg shadow-glow transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Organization</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#F5F7F6]">
                  <thead className="bg-[#0A0D0C]/50 border-b border-[#29312C] text-[#A3ADA7] uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Organization</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Students</th>
                      <th className="px-6 py-3.5">Mentors</th>
                      <th className="px-6 py-3.5">Trainers</th>
                      <th className="px-6 py-3.5">Admin</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29312C]/50">
                    {organizationsList.map((org, index) => {
                      const orgId = org.Organization_ID || org.id || `org-${index}`;
                      const adminUser = users.find(
                        (u) =>
                          (u.organizationId === orgId || u.Organization_ID === orgId) &&
                          (u.role === 'admin' || u.role === 'institution_admin')
                      );

                      return (
                        <tr key={orgId} className="hover:bg-[#0A0D0C]/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#F5F7F6]">{org.name}</p>
                            <p className="text-[11px] text-[#A3ADA7] font-mono">{orgId}</p>
                          </td>
                          <td className="px-6 py-4 text-[#A3ADA7]">{org.type || 'College'}</td>
                          <td className="px-6 py-4 font-semibold">
                            {
                              users.filter(
                                (u) =>
                                  (u.organizationId === orgId || u.Organization_ID === orgId) &&
                                  u.role === 'student'
                              ).length
                            }
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            {
                              users.filter(
                                (u) =>
                                  (u.organizationId === orgId || u.Organization_ID === orgId) &&
                                  u.role === 'mentor'
                              ).length
                            }
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            {
                              users.filter(
                                (u) =>
                                  (u.organizationId === orgId || u.Organization_ID === orgId) &&
                                  u.role === 'trainer'
                              ).length
                            }
                          </td>
                          <td className="px-6 py-4">
                            {adminUser ? (
                              <div>
                                <p className="font-semibold text-[#F5F7F6]">{adminUser.name}</p>
                                <p className="text-[10px] text-[#A3ADA7] font-mono">{adminUser.email}</p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#F2D64B]">No Admin Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950/20 text-[#32D6B0] border border-teal-900/30">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedOrgOverview(org)}
                              className="px-3 py-1.5 bg-[#151A18] text-[#32D6B0] hover:bg-[#0A0D0C] font-semibold rounded-lg border border-[#29312C] transition-colors"
                            >
                              Overview
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. SETTINGS / OTHER TABS                                  */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">Administrator Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <label className="block text-[#A3ADA7] mb-1 uppercase tracking-wider text-[10px] font-bold">Signed in as</label>
                    <p className="font-bold text-[#F5F7F6] truncate">{currentUser.name}</p>
                    <p className="text-[#A3ADA7] text-[11px] truncate font-mono">{currentUser.email}</p>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <label className="block text-[#A3ADA7] mb-1 uppercase tracking-wider text-[10px] font-bold">Role Permission</label>
                    <p className="font-bold text-[#32D6B0]">{currentUser.role.toUpperCase()}</p>
                    <p className="text-[#A3ADA7] text-[11px]">Governs all entities</p>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <label className="block text-[#A3ADA7] mb-1 uppercase tracking-wider text-[10px] font-bold">Scope</label>
                    <p className="font-bold text-[#F5F7F6]">Single Institution</p>
                    <p className="text-[#A3ADA7] text-[11px]">LearnAI Platform</p>
                  </div>
                </div>
              </div>

              {/* Supabase Cloud Project & Database Status Panel */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#29312C]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-[#32D6B0]" />
                      <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">Supabase Project &amp; Database Connection</h3>
                    </div>
                    <p className="text-xs text-[#A3ADA7] mt-1">
                      Cloud PostgreSQL database, Supabase Auth, Row Level Security, and user role management.
                    </p>
                  </div>
                  <button
                    onClick={checkSupabase}
                    disabled={isCheckingSupabase}
                    className="self-start sm:self-auto px-4 py-2 bg-[#151A18] hover:bg-[#0A0D0C] text-[#32D6B0] text-xs font-bold rounded-xl border border-[#29312C] flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isCheckingSupabase ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Test Supabase Connection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Connection Status Result */}
                {supabaseStatus && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                      supabaseStatus.connected
                        ? 'bg-[#0A0D0C] border-[#32D6B0]/40 text-[#78D98A]'
                        : 'bg-[#1A1212] border-[#F2D64B]/40 text-[#F2D64B]'
                    }`}
                  >
                    {supabaseStatus.connected ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-[#32D6B0] mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 text-[#F2D64B] mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">
                        {supabaseStatus.connected
                          ? 'Supabase Connection Active'
                          : supabaseStatus.isConfigured
                          ? 'Supabase Credentials Detected (Checking Database)'
                          : 'Supabase Not Yet Configured in Environment'}
                      </p>
                      <p className="text-[11px] text-[#A3ADA7]">
                        {supabaseStatus.error ||
                          'The Supabase client successfully established communication with your project.'}
                      </p>
                      <p className="text-[10px] text-[#A3ADA7]/70 font-mono">
                        Host: {supabaseStatus.url}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#0A0D0C] rounded-xl border border-[#29312C] space-y-2">
                    <p className="font-semibold text-[#F5F7F6] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#32D6B0]" />
                      Environment Variables
                    </p>
                    <p className="text-[#A3ADA7] text-[11px]">
                      Configured in <code className="text-[#32D6B0]">.env</code>:
                    </p>
                    <div className="space-y-1 font-mono text-[10px] bg-[#151A18] p-2 rounded-lg border border-[#29312C] text-[#F5F7F6]">
                      <p>VITE_SUPABASE_URL</p>
                      <p>VITE_SUPABASE_ANON_KEY</p>
                    </div>
                    <p className="text-[10px] text-[#A3ADA7]">
                      Security: Only the public <code className="text-[#F5F7F6]">anon</code> key is used on the client. Secret service-role keys are never exposed.
                    </p>
                  </div>

                  <div className="p-4 bg-[#0A0D0C] rounded-xl border border-[#29312C] space-y-2">
                    <p className="font-semibold text-[#F5F7F6] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#78D98A]" />
                      Database Schema &amp; Policies
                    </p>
                    <p className="text-[#A3ADA7] text-[11px]">
                      Prepared SQL migration file in project root:
                    </p>
                    <div className="font-mono text-[10px] bg-[#151A18] p-2 rounded-lg border border-[#29312C] text-[#32D6B0]">
                      supabase-schema.sql
                    </div>
                    <p className="text-[10px] text-[#A3ADA7]">
                      Includes <code className="text-[#F5F7F6]">profiles</code>, <code className="text-[#F5F7F6]">students</code>, <code className="text-[#F5F7F6]">mentors</code>, <code className="text-[#F5F7F6]">trainers</code>, <code className="text-[#F5F7F6]">courses</code>, <code className="text-[#F5F7F6]">enrollments</code>, and RLS policies for each role.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#0A0D0C] rounded-xl border border-[#29312C] space-y-2 text-xs">
                  <p className="font-bold text-[#F5F7F6]">How to Complete Database Setup in Supabase:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#A3ADA7]">
                    <li>Open your Supabase Project Dashboard and go to the <strong className="text-[#F5F7F6]">SQL Editor</strong>.</li>
                    <li>Copy and paste the contents of <code className="text-[#32D6B0]">supabase-schema.sql</code> into a new query.</li>
                    <li>Click <strong className="text-[#F5F7F6]">Run</strong> to create all tables, user trigger, and Row Level Security policies.</li>
                    <li>Verify your <code className="text-[#32D6B0]">VITE_SUPABASE_URL</code> and <code className="text-[#32D6B0]">VITE_SUPABASE_ANON_KEY</code> from Project Settings → API.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: INSTITUTION ANALYTICS                                */}
          {/* ========================================================= */}
          {activeTab === 'institution_analytics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">Institution Learning Analytics</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Macro-level analytics on engagement velocity, weekly study volume, and retention funnel.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InstitutionWeeklyActivityChart
                  data={adminAnalytics?.weeklyActivity || []}
                  title="Weekly Learning Activity & Engagement Velocity"
                  subtitle="Total active study hours logged and daily student login volume"
                />
                <CourseCompletionFunnel
                  data={adminAnalytics?.courseCompletionFunnel || []}
                  title="Course Completion Funnel"
                  subtitle="Pipeline tracking from enrollment through midpoint to final certification"
                />
                <ReadinessMixChart
                  data={adminAnalytics?.readinessMixByCourse || []}
                  title="Readiness Mix by Course"
                  subtitle="Proportion of Job Ready (≥80%), On Track (60–79%), and At Risk (<60%) students"
                />
                <AssessmentCourseChart
                  data={adminAnalytics?.assessmentPerformanceByCourse || []}
                  title="Assessment Performance across Courses"
                  subtitle="Mean examination and assignment marks compared to passing bar (70%)"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: COURSES ACADEMIC MANAGEMENT                         */}
          {/* ========================================================= */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">Institutional Courses &amp; Curricula</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Accredited curriculum tracks, active cohorts, and student capacity limits.
                  </p>
                </div>
                <button
                  onClick={() => showToast('Course creation modal opened.')}
                  className="px-4 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-all shadow-glow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: 'Python Programming', category: 'Programming', students: 48, faculty: 'Ravi Kumar', progress: '64%', status: 'Active' },
                  { title: 'Enterprise SQL & Analytics', category: 'Databases', students: 42, faculty: 'Priya Sharma', progress: '72%', status: 'Active' },
                  { title: 'Machine Learning & AI', category: 'Data Science', students: 35, faculty: 'Ravi Kumar', progress: '58%', status: 'Active' },
                  { title: 'Generative AI & LLMs', category: 'Artificial Intelligence', students: 28, faculty: 'Priya Sharma', progress: '45%', status: 'Active' },
                  { title: 'Data Structures & Algorithms', category: 'Computer Science', students: 38, faculty: 'Ravi Kumar', progress: '80%', status: 'Active' },
                  { title: 'Cloud Infrastructure & DevOps', category: 'Cloud Computing', students: 25, faculty: 'Vikram Mehta', progress: '35%', status: 'Active' },
                ].map((c, i) => (
                  <div key={i} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 space-y-4 shadow-sm hover:border-[#32D6B0]/30 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#32D6B0] bg-teal-950/20 px-2.5 py-0.5 rounded border border-teal-900/30">
                        {c.category}
                      </span>
                      <span className="font-mono font-bold text-[#32D6B0]">{c.status}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">{c.title}</h3>
                    <div className="space-y-1 text-xs text-[#A3ADA7]">
                      <p>Lead Faculty: <strong className="text-[#F5F7F6]">{c.faculty}</strong></p>
                      <p>Enrollment: <strong className="text-[#F5F7F6]">{c.students} Students</strong></p>
                      <p>Cohort Avg Progress: <strong className="text-[#32D6B0]">{c.progress}</strong></p>
                    </div>
                    <div className="pt-2 border-t border-[#29312C] flex justify-end">
                      <button
                        onClick={() => showToast(`Course details loaded for ${c.title}.`)}
                        className="px-3 py-1.5 bg-[#151A18] hover:bg-[#0A0D0C] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#29312C] transition-colors"
                      >
                        Manage Curriculum
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: ENROLLMENTS                                          */}
          {/* ========================================================= */}
          {activeTab === 'enrollments' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">Student Enrollments Registry</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Active student course allocations, registration dates, and curriculum milestone status.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0D0C]/50 border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Enrolled Course</th>
                      <th className="px-6 py-3.5">Enrolled Date</th>
                      <th className="px-6 py-3.5">Progress</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29312C]/50">
                    {(adminAnalytics?.studentsList || []).map((s) => (
                      <tr key={s.id} className="hover:bg-[#0A0D0C]/40 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#F5F7F6]">{s.name}</p>
                          <p className="text-[11px] text-[#A3ADA7] font-mono">{s.email}</p>
                        </td>
                        <td className="px-6 py-4 text-[#F5F7F6] font-medium">{s.enrolledCourse}</td>
                        <td className="px-6 py-4 text-[#A3ADA7] font-mono">{s.registeredDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F7F6]">{s.progress}%</span>
                            <div className="w-16 bg-[#29312C] rounded-full h-1.5 overflow-hidden">
                              <div className="bg-[#32D6B0] h-full rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950/20 text-[#32D6B0] border border-teal-900/30">
                            Enrolled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: ASSIGNMENTS & ASSESSMENTS                            */}
          {/* ========================================================= */}
          {(activeTab === 'assignments' || activeTab === 'assessments') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">
                  {activeTab === 'assignments' ? 'Institutional Assignments' : 'Standardized Assessments & Quizzes'}
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Curriculum deliverables, examination schedules, and institution-wide pass percentages.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-sm space-y-4">
                <AssessmentCourseChart
                  data={adminAnalytics?.assessmentPerformanceByCourse || []}
                  title="Assessment Performance across Courses"
                  subtitle="Mean examination and assignment marks compared to passing bar (70%)"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: STUDENT PROGRESS & PERFORMANCE INSIGHTS              */}
          {/* ========================================================= */}
          {(activeTab === 'student_progress' || activeTab === 'course_performance') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">Student Progress &amp; Course Performance</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Retention trajectories, completion milestones, and departmental velocity benchmarks.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CourseCompletionFunnel
                  data={adminAnalytics?.courseCompletionFunnel || []}
                  title="Course Completion Funnel"
                  subtitle="Pipeline tracking from enrollment through midpoint to final certification"
                />
                <StudentsByCourseChart
                  data={adminAnalytics?.studentsByCourse || []}
                  title="Students by Course & Cohort Capacity"
                  subtitle="Real-time enrollment distribution across institution curricula"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: SKILL GAP & CAREER READINESS ANALYTICS               */}
          {/* ========================================================= */}
          {(activeTab === 'skill_gap_analytics' || activeTab === 'career_readiness_analytics') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">
                  {activeTab === 'skill_gap_analytics' ? 'Institution-Wide Skill Gap Analytics' : 'Career Placement Readiness Analytics'}
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Analysis of market readiness benchmarks, student skill deficits, and hiring bar alignment.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkillsComparisonChart
                  skills={(adminAnalytics?.commonSkillGaps || []).map((sg) => ({
                    name: sg.skill,
                    current: Math.max(0, 100 - sg.avgDeficit),
                    target: 85,
                  }))}
                  title="Common Skill Gaps Across Institution"
                  subtitle="Deficits between student averages and industry job readiness benchmarks"
                />
                <ReadinessMixChart
                  data={adminAnalytics?.readinessMixByCourse || []}
                  title="Readiness Mix by Course"
                  subtitle="Proportion of Job Ready (≥80%), On Track (60–79%), and At Risk (<60%) students"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: AT-RISK STUDENTS DEAN MONITORING                     */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* TAB: STUDENT STAFF ALLOCATION                            */}
          {/* ========================================================= */}
          {activeTab === 'staff_allocation' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Student Management & Staff Allocation</h1>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Assign responsible Trainers and Mentors to students for dedicated learning and career support.
                  </p>
                </div>
              </div>

              {/* Two-Panel Interface */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
                {/* Left Panel: Select Student (40%) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] flex flex-col overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#F1F5F9] space-y-3">
                    <h3 className="text-sm font-bold text-[#0F172A]">Select a Student</h3>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                      <input
                        type="text"
                        value={adminStudentSearch}
                        onChange={(e) => setAdminStudentSearch(e.target.value)}
                        placeholder="Search by student name, email, or ID..."
                        className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#32D6B0] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {(adminAnalytics?.studentsList || [])
                      .filter(s =>
                        s.name.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                        s.email.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                        s.id.toLowerCase().includes(adminStudentSearch.toLowerCase())
                      ).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                          <Users className="w-8 h-8 text-[#29312C]" />
                          <p className="text-xs text-[#64748B]">No students found matching your search.</p>
                        </div>
                      ) : (
                        (adminAnalytics?.studentsList || [])
                          .filter(s =>
                            s.name.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                            s.email.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                            s.id.toLowerCase().includes(adminStudentSearch.toLowerCase())
                          )
                          .map((student) => {
                            const isSelected = selectedStudentForAllocation?.id === student.id;
                            const hasTrainer = Boolean(student.trainerId);
                            const hasMentor = Boolean(student.mentorId);
                            const isFullyAssigned = hasTrainer && hasMentor;

                            return (
                              <button
                                key={student.id}
                                onClick={() => {
                                  setSelectedStudentForAllocation(student);
                                  setSelectedTrainerId(student.trainerId || '');
                                  setSelectedMentorId(student.mentorId || '');
                                  setAllocationNotes('');
                                }}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                                  isSelected
                                    ? 'bg-[#F1F5F9] border-[#32D6B0] shadow-[0_0_15px_rgba(50,214,176,0.1)]'
                                    : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#32D6B0]/50'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className={`text-sm font-bold transition-colors ${isSelected ? 'text-[#32D6B0]' : 'text-[#0F172A]'}`}>
                                    {student.name}
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                                    isFullyAssigned
                                      ? 'bg-[#101F1B] text-[#32D6B0] border border-[#32D6B0]/20'
                                      : 'bg-[#261414] text-[#FF7272] border border-[#FF7272]/20'
                                  }`}>
                                    {isFullyAssigned ? 'Assigned' : 'Not Assigned'}
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                                    <span className="font-mono">{student.id}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#29312C]" />
                                    <span className="truncate">{student.email}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <div className={`flex items-center gap-1 text-[10px] ${student.trainerId ? 'text-[#78D98A]' : 'text-[#64748B]'}`}>
                                      <GraduationCap className="w-3 h-3" />
                                      <span>{student.trainerName || 'No Trainer'}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 text-[10px] ${student.mentorId ? 'text-[#B4E85A]' : 'text-[#64748B]'}`}>
                                      <Compass className="w-3 h-3" />
                                      <span>{student.mentorName || 'No Mentor'}</span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                      )}
                  </div>
                </div>

                {/* Right Panel: Assignment Form (60%) */}
                <div className="lg:col-span-7 bg-[#151A18] rounded-2xl border border-[#29312C] flex flex-col overflow-hidden shadow-sm">
                  {selectedStudentForAllocation ? (
                    <div className="flex flex-col h-full">
                      {/* Form Header */}
                      <div className="p-6 border-b border-[#29312C] bg-[#0A0D0C]/30">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#32D6B0] text-[#0A0D0C] font-bold text-xl flex items-center justify-center shrink-0 shadow-glow">
                            {selectedStudentForAllocation.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">{selectedStudentForAllocation.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-[#A3ADA7]">
                              <span className="font-mono">{selectedStudentForAllocation.id}</span>
                              <span className="w-1 h-1 rounded-full bg-[#29312C]" />
                              <span>{selectedStudentForAllocation.enrolledCourse}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form Body */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Trainer Selection */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-[#F5F7F6] uppercase tracking-wider flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-[#32D6B0]" />
                              Responsible Trainer
                            </label>
                            <select
                              value={selectedTrainerId}
                              onChange={(e) => setSelectedTrainerId(e.target.value)}
                              className="w-full p-3 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select a Trainer</option>
                              {adminAnalytics?.trainersList.map((trainer) => (
                                <option key={trainer.id} value={trainer.id}>
                                  {trainer.name} ({trainer.specialization})
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-[#A3ADA7]">
                              Instructs curriculum, evaluates labs, and manages course progression.
                            </p>
                          </div>

                          {/* Mentor Selection */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-[#F5F7F6] uppercase tracking-wider flex items-center gap-2">
                              <Compass className="w-4 h-4 text-[#B4E85A]" />
                              Responsible Mentor
                            </label>
                            <select
                              value={selectedMentorId}
                              onChange={(e) => setSelectedMentorId(e.target.value)}
                              className="w-full p-3 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#B4E85A]/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Select a Mentor</option>
                              {adminAnalytics?.mentorsList.map((mentor) => (
                                <option key={mentor.id} value={mentor.id}>
                                  {mentor.name} ({mentor.specialization})
                                </option>
                              ))}
                            </select>
                            <p className="text-[10px] text-[#A3ADA7]">
                              Provides career guidance, industry advice, and 1-on-1 mental support.
                            </p>
                          </div>
                        </div>

                        {/* Allocation Notes */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#F5F7F6] uppercase tracking-wider">
                            Internal Allocation Notes (Optional)
                          </label>
                          <textarea
                            value={allocationNotes}
                            onChange={(e) => setAllocationNotes(e.target.value)}
                            placeholder="Add specific instructions or reasoning for this staff assignment..."
                            className="w-full p-4 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 min-h-[120px] resize-none placeholder:text-[#A3ADA7]/30"
                          />
                        </div>

                        {/* Current Staff Overview */}
                        <div className="bg-[#0A0D0C] rounded-xl border border-[#29312C] p-4 space-y-3">
                          <h4 className="text-[11px] font-bold text-[#A3ADA7] uppercase tracking-wider">Current Assignment State</h4>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#A3ADA7]">Staff Assigned:</span>
                            <span className={`font-bold ${(selectedTrainerId && selectedMentorId) ? 'text-[#32D6B0]' : 'text-[#FF7272]'}`}>
                              {(selectedTrainerId && selectedMentorId) ? 'Complete' : 'Incomplete'}
                            </span>
                          </div>
                          <div className="h-px bg-[#29312C]" />
                          <p className="text-[10px] text-[#A3ADA7] italic">
                            Updating staff allocation will immediately reflect in the Student's Support Team dashboard and provide access to assigned staff.
                          </p>
                        </div>
                      </div>

                      {/* Form Footer */}
                      <div className="p-6 border-t border-[#29312C] bg-[#0A0D0C]/30 flex justify-end items-center gap-4">
                        <button
                          onClick={() => setSelectedStudentForAllocation(null)}
                          className="px-6 py-2.5 text-xs font-bold text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAllocation}
                          disabled={isSavingAllocation || (!selectedTrainerId && !selectedMentorId)}
                          className="px-8 py-2.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                          {isSavingAllocation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving Allocation...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Assign Staff Members</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#0A0D0C] border border-[#29312C] flex items-center justify-center text-[#32D6B0] shadow-glow-sm">
                        <UserPlus className="w-8 h-8" />
                      </div>
                      <div className="max-w-xs">
                        <h3 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">No Student Selected</h3>
                        <p className="text-xs text-[#A3ADA7] mt-2 leading-relaxed">
                          Select a student from the left directory to manage their dedicated Trainer and Mentor assignments.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {activeTab === 'at_risk_students' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit'] flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-[#FF7272]" />
                  <span>Institutional At-Risk Student Monitoring</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Enrolled students with Readiness Score &lt; 60% or critical assignment delinquency.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0D0C]/50 border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Course</th>
                      <th className="px-6 py-3.5">Progress</th>
                      <th className="px-6 py-3.5">Readiness</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29312C]/50">
                    {(adminAnalytics?.studentsList || [])
                      .filter((s) => s.readinessScore < 65)
                      .map((st) => (
                        <tr key={st.id} className="hover:bg-[#0A0D0C]/40 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#F5F7F6]">{st.name}</p>
                            <p className="text-[11px] text-[#A3ADA7] font-mono">{st.email}</p>
                          </td>
                          <td className="px-6 py-4 text-[#A3ADA7]">{st.enrolledCourse}</td>
                          <td className="px-6 py-4 font-mono text-[#F5F7F6]">{st.progress}%</td>
                          <td className="px-6 py-4 font-mono font-bold text-[#FF7272]">
                            {st.readinessScore} / 100
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/20 text-[#FF7272] border border-red-900/30">
                              Critical Attention
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => showToast(`Escalated advising notice dispatched to mentor for ${st.name}.`)}
                              className="px-3 py-1.5 bg-[#151A18] hover:bg-[#0A0D0C] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#29312C] transition-colors"
                            >
                              Escalate to Mentor
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: NOTIFICATIONS & PROFILE                              */}
          {/* ========================================================= */}
          {(activeTab === 'notifications' || activeTab === 'my_profile') && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] font-['Outfit']">
                  {activeTab === 'notifications' ? 'System & Administrative Notifications' : 'Administrator Profile'}
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Governance credentials, audit trail, and institutional settings.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block uppercase tracking-wider text-[10px] font-bold">Admin Name</span>
                    <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block">{currentUser.name}</span>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block uppercase tracking-wider text-[10px] font-bold">Email</span>
                    <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block truncate font-mono">{currentUser.email}</span>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block uppercase tracking-wider text-[10px] font-bold">Governance Role</span>
                    <span className="font-bold text-[#32D6B0] text-sm mt-0.5 block">{currentUser.role.toUpperCase()}</span>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block uppercase tracking-wider text-[10px] font-bold">Assigned Institution</span>
                    <span className="font-bold text-[#32D6B0] text-sm mt-0.5 block truncate">
                      {currentUser.organizationName || 'LearnAI Platform'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-[#151A18] hover:bg-[#0A0D0C] text-[#32D6B0] text-xs font-semibold rounded-xl border border-[#29312C] transition-colors"
                  >
                    View System Settings &amp; Supabase Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: PROMOTE STUDENT UX (Sections 6 & 7)              */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151A18] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#29312C] space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">
                Change User Role
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C] text-xs">
              <p className="font-semibold text-[#F5F7F6]">{editingUser.name}</p>
              <p className="text-[#A3ADA7] font-mono">{editingUser.email}</p>
              <p className="text-[11px] text-[#32D6B0] mt-1 font-bold">Current Role: {editingUser.role.toUpperCase()}</p>
            </div>

            {/* Target Role Selector per specification: Student, Mentor, Trainer, Admin */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#A3ADA7] uppercase tracking-wider">
                Select New Role
              </label>
              <div className={`grid gap-2.5 ${isSuperAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                {(isSuperAdmin
                  ? (['student', 'mentor', 'trainer', 'admin'] as const)
                  : (['student', 'mentor', 'trainer'] as const)
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isSavingRoleChange}
                    onClick={() => {
                      setTargetNewRole(r as UserRole);
                      setRoleChangeConfirmed(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      targetNewRole === r
                        ? 'bg-teal-950/20 text-[#32D6B0] border-[#32D6B0] ring-2 ring-[#32D6B0]/10'
                        : 'bg-[#0A0D0C] text-[#A3ADA7] border-[#29312C] hover:border-[#32D6B0]/30'
                    } ${isSavingRoleChange ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Mentor Profile Data Collection (if target is Mentor) */}
            {targetNewRole === 'mentor' && (
              <div className="space-y-3 p-3.5 bg-teal-950/10 rounded-xl border border-teal-900/30 text-xs">
                <p className="font-bold text-[#32D6B0]">Mentor Profile Information</p>
                <div>
                  <label className="block text-[#A3ADA7] mb-1">Qualification</label>
                  <input
                    type="text"
                    value={mentorQualification}
                    onChange={(e) => setMentorQualification(e.target.value)}
                    className="w-full p-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50"
                  />
                </div>
                <div>
                  <label className="block text-[#A3ADA7] mb-1">Specialization</label>
                  <input
                    type="text"
                    value={mentorSpecialization}
                    onChange={(e) => setMentorSpecialization(e.target.value)}
                    className="w-full p-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#A3ADA7] mb-1">Years of Exp</label>
                    <input
                      type="number"
                      value={mentorExperience}
                      onChange={(e) => setMentorExperience(e.target.value)}
                      className="w-full p-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A3ADA7] mb-1">Availability</label>
                    <input
                      type="text"
                      value={mentorAvailability}
                      onChange={(e) => setMentorAvailability(e.target.value)}
                      className="w-full p-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Trainer Profile Data Collection (if target is Trainer) */}
            {targetNewRole === 'trainer' && (
              <div className="space-y-3 p-3.5 bg-[#1B211E] rounded-xl border border-[#29312C] text-xs">
                <p className="font-bold text-[#F2D64B]">Trainer Profile Information</p>
                <div>
                  <label className="block text-[#A3ADA7] mb-1">Qualification</label>
                  <input
                    type="text"
                    value={trainerQualification}
                    onChange={(e) => setTrainerQualification(e.target.value)}
                    className="w-full p-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50"
                  />
                </div>
                <div>
                  <label className="block text-[#A3ADA7] mb-1">Teachable Courses</label>
                  <input
                    type="text"
                    value={trainerCoursesCanTeach}
                    onChange={(e) => setTrainerCoursesCanTeach(e.target.value)}
                    className="w-full p-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]/50"
                  />
                </div>
              </div>
            )}

            {/* Confirmation Checkbox per specification */}
            <div className="p-3 bg-[#1B211E] rounded-xl border border-[#F2D64B]/20 text-xs text-[#F2D64B] flex items-center gap-2.5">
              <input
                type="checkbox"
                id="confirmRoleChange"
                disabled={isSavingRoleChange}
                checked={roleChangeConfirmed}
                onChange={(e) => setRoleChangeConfirmed(e.target.checked)}
                className="w-4 h-4 text-[#32D6B0] rounded bg-[#0A0D0C] border-[#29312C] focus:ring-2 focus:ring-[#32D6B0] disabled:opacity-50 cursor-pointer"
              />
              <label htmlFor="confirmRoleChange" className="font-semibold cursor-pointer">
                Are you sure you want to promote/change this user to {targetNewRole.toUpperCase()}?
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSavingRoleChange}
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-[#151A18] text-[#A3ADA7] hover:text-[#F5F7F6] disabled:opacity-50 rounded-lg text-xs font-semibold border border-[#29312C] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!roleChangeConfirmed || isSavingRoleChange}
                onClick={handleSaveRoleChange}
                className="inline-flex items-center justify-center px-5 py-2 bg-[#32D6B0] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavingRoleChange ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CREATE INSTITUTION ADMIN (Super Admin Only)      */}
      {/* ========================================================= */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151A18] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">
                Create Institution Admin
              </h3>
              <button
                onClick={() => setIsCreateAdminOpen(false)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Admin Name</label>
                <input
                  type="text"
                  required
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  placeholder="e.g. Ravi Kumar"
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 placeholder:text-[#A3ADA7]/30"
                />
              </div>

              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Email</label>
                <input
                  type="email"
                  required
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  placeholder="ravi.admin@college.edu"
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 placeholder:text-[#A3ADA7]/30"
                />
              </div>

              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Phone</label>
                <input
                  type="tel"
                  value={adminFormData.phone}
                  onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                  placeholder="+91 98765 12345"
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 placeholder:text-[#A3ADA7]/30"
                />
              </div>

              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Assigned Organization</label>
                <select
                  value={adminFormData.organizationId}
                  onChange={(e) => setAdminFormData({ ...adminFormData, organizationId: e.target.value })}
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 cursor-pointer appearance-none"
                >
                  <option key="org-default-option" value="">Select Institution...</option>
                  {organizationsList.map((org, index) => {
                    const orgId = org.Organization_ID || org.id || `org-${index}`;
                    return (
                      <option key={orgId} value={orgId}>
                        {org.name} ({orgId})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Password</label>
                <input
                  type="password"
                  required
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 placeholder:text-[#A3ADA7]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#29312C]">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="px-4 py-2 bg-[#151A18] text-[#A3ADA7] hover:text-[#F5F7F6] rounded-lg text-xs font-semibold border border-[#29312C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] rounded-lg text-xs font-bold shadow-glow transition-all"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE ORGANIZATION (Super Admin Only)           */}
      {/* ========================================================= */}
      {isCreateOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151A18] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">Add Organization</h3>
              <button
                onClick={() => setIsCreateOrgOpen(false)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Organization Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. ABC Engineering College"
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 placeholder:text-[#A3ADA7]/30"
                />
              </div>

              <div>
                <label className="block text-[#A3ADA7] font-semibold mb-1 uppercase tracking-wider text-[10px]">Organization Type</label>
                <select
                  value={newOrgType}
                  onChange={(e) => setNewOrgType(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#32D6B0]/50 cursor-pointer appearance-none"
                >
                  <option key="org-type-college" value="College">College / Engineering University</option>
                  <option key="org-type-institute" value="Institute">Training & Coaching Institute</option>
                  <option key="org-type-academy" value="Academy">Professional Corporate Academy</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#29312C]">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgOpen(false)}
                  className="px-4 py-2 bg-[#151A18] text-[#A3ADA7] hover:text-[#F5F7F6] rounded-lg text-xs font-semibold border border-[#29312C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] rounded-lg text-xs font-bold shadow-glow transition-all"
                >
                  Add Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ORGANIZATION OVERVIEW MODAL                      */}
      {/* ========================================================= */}
      {selectedOrgOverview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151A18] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">
                Organization Overview: {selectedOrgOverview.name}
              </h3>
              <button
                onClick={() => setSelectedOrgOverview(null)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                <p className="text-[#A3ADA7] uppercase tracking-wider text-[10px] font-bold">Students</p>
                <p className="text-lg font-bold text-[#32D6B0] font-mono">
                  {
                    users.filter(
                      (u) =>
                        (u.organizationId === (selectedOrgOverview.Organization_ID || selectedOrgOverview.id) ||
                          u.Organization_ID === (selectedOrgOverview.Organization_ID || selectedOrgOverview.id)) &&
                        u.role === 'student'
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                <p className="text-[#A3ADA7] uppercase tracking-wider text-[10px] font-bold">Mentors</p>
                <p className="text-lg font-bold text-[#78D98A] font-mono">
                  {
                    users.filter(
                      (u) =>
                        (u.organizationId === (selectedOrgOverview.Organization_ID || selectedOrgOverview.id) ||
                          u.Organization_ID === (selectedOrgOverview.Organization_ID || selectedOrgOverview.id)) &&
                        u.role === 'mentor'
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                <p className="text-[#A3ADA7] uppercase tracking-wider text-[10px] font-bold">Trainers</p>
                <p className="text-lg font-bold text-[#F2D64B] font-mono">
                  {
                    users.filter(
                      (u) =>
                        (u.organizationId === (selectedOrgOverview.Organization_ID || selectedOrgOverview.id) ||
                          u.Organization_ID === (selectedOrgOverview.Organization_ID || selectedOrgOverview.id)) &&
                        u.role === 'trainer'
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrgOverview(null)}
                className="px-4 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] rounded-lg text-xs font-bold transition-all shadow-glow"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: USER DOSSIER MODAL                               */}
      {/* ========================================================= */}
      {selectedUserDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151A18] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">
                User Dossier: {selectedUserDossier.name}
              </h3>
              <button
                onClick={() => setSelectedUserDossier(null)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-[#A3ADA7]">
              <div className="flex justify-between py-2 border-b border-[#29312C]">
                <span className="text-[#A3ADA7] font-medium uppercase tracking-wider text-[10px]">Email:</span>
                <span className="font-semibold text-[#F5F7F6] font-mono">{selectedUserDossier.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#29312C]">
                <span className="text-[#A3ADA7] font-medium uppercase tracking-wider text-[10px]">Phone:</span>
                <span className="font-semibold text-[#F5F7F6] font-mono">{selectedUserDossier.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#29312C]">
                <span className="text-[#A3ADA7] font-medium uppercase tracking-wider text-[10px]">Current Role:</span>
                <div>{getRoleBadge(selectedUserDossier.role)}</div>
              </div>
              <div className="flex justify-between py-2 border-b border-[#29312C]">
                <span className="text-[#A3ADA7] font-medium uppercase tracking-wider text-[10px]">Organization:</span>
                <span className="font-semibold text-[#F5F7F6]">
                  {selectedUserDossier.organizationName || selectedUserDossier.organizationId || 'Public Student'}
                </span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUserDossier(null)}
                className="px-4 py-2 bg-[#151A18] border border-[#29312C] text-[#A3ADA7] hover:text-[#F5F7F6] rounded-lg text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL 6: STAFF ALLOCATION MODAL                           */}
      {/* ========================================================= */}
      {isAllocationModalOpen && selectedStudentForAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#151A18] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <div>
                <h3 className="text-base font-bold text-[#F5F7F6] font-['Outfit']">
                  Allocate Staff
                </h3>
                <p className="text-[11px] text-[#A3ADA7]">Assign support team for {selectedStudentForAllocation.name}</p>
              </div>
              <button
                onClick={() => setIsAllocationModalOpen(false)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Trainer Selection */}
              <div>
                <label className="block text-[#F5F7F6] font-semibold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#32D6B0]" />
                  Responsible Trainer
                </label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-1 focus:ring-[#32D6B0]/50 appearance-none cursor-pointer"
                >
                  <option value="">-- Select Trainer --</option>
                  {(adminAnalytics?.trainersList || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#A3ADA7] mt-1">Responsible for curriculum delivery and lab evaluations.</p>
              </div>

              {/* Mentor Selection */}
              <div>
                <label className="block text-[#F5F7F6] font-semibold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Compass className="w-3.5 h-3.5 text-[#B4E85A]" />
                  Responsible Mentor
                </label>
                <select
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-1 focus:ring-[#B4E85A]/50 appearance-none cursor-pointer"
                >
                  <option value="">-- Select Mentor --</option>
                  {(adminAnalytics?.mentorsList || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.specialization})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#A3ADA7] mt-1">Responsible for career guidance and assignment support.</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#F5F7F6] font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Allocation Notes (Optional)</label>
                <textarea
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  placeholder="e.g. Assigned to specific morning batch or specialization track..."
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-1 focus:ring-[#32D6B0]/50 h-20 resize-none placeholder:text-[#A3ADA7]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#29312C]">
                <button
                  type="button"
                  onClick={() => setIsAllocationModalOpen(false)}
                  className="px-4 py-2 bg-[#151A18] text-[#A3ADA7] hover:text-[#F5F7F6] rounded-lg text-xs font-semibold border border-[#29312C] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllocation}
                  disabled={isSavingAllocation}
                  className="px-5 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] rounded-lg text-xs font-bold shadow-glow transition-all flex items-center gap-2"
                >
                  {isSavingAllocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Allocation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

