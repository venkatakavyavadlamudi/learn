import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService } from '../services/authService';
import { User } from '../types';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Compass,
  HelpCircle,
  CheckCircle2,
  FileText,
  Award,
  Target,
  TrendingUp,
  Briefcase,
  Mic,
  Bot,
  MessageSquare,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  BarChart3,
  Calendar,
  GraduationCap,
  Sparkles,
  Users,
} from 'lucide-react';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: 'teal' | 'lime' | 'yellow' | 'red';
  isAi?: boolean;
}

export interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}

interface SidebarProps {
  currentUser: User | null;
  activeItem: string;
  onSelect: (item: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeItem,
  onSelect,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { navigate } = useRouter();

  // Desktop collapsible state (persisted in localStorage for convenience)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('learnai_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Track expanded/collapsed menu groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Logout Confirmation Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleDesktopCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('learnai_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  if (!currentUser) return null;

  const roleNormalized = String(currentUser.role || 'student').toLowerCase();
  const isSuperAdmin =
    roleNormalized === 'super_admin' || roleNormalized === 'super admin' || roleNormalized.includes('super');
  const isAdmin =
    isSuperAdmin ||
    roleNormalized === 'admin' ||
    roleNormalized === 'institution_admin' ||
    roleNormalized === 'institution admin';
  const isTrainer = roleNormalized === 'trainer';
  const isMentor = roleNormalized === 'mentor';
  const isStudent = !isAdmin && !isTrainer && !isMentor;

  // Clean, displayable role label (Strictly NO internal role codes or "Public Learner" / "Public Student")
  const getRoleDisplayName = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Institution Admin';
    if (isTrainer) return 'Trainer';
    if (isMentor) return 'Mentor';
    return 'Student';
  };

  // 1. STUDENT MENU ITEMS
  const studentMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_learning', label: 'My Learning', icon: BookOpen },
        { id: 'my_courses', label: 'My Courses', icon: Layers },
        { id: 'learning_roadmap', label: 'Learning Roadmap', icon: Compass },
      ],
    },
    {
      title: 'Practice & Assessment',
      items: [
        { id: 'practice_questions', label: 'Practice Questions', icon: HelpCircle },
        { id: 'assessments', label: 'Assessments', icon: CheckCircle2 },
        { id: 'my_assignments', label: 'My Assignments', icon: FileText, badge: '2', badgeColor: 'yellow' },
        { id: 'my_results', label: 'My Results', icon: Award },
      ],
    },
    {
      title: 'Career Development',
      items: [
        { id: 'my_skills', label: 'My Skills', icon: Target },
        { id: 'skill_gap_analysis', label: 'Skill Gap Analysis', icon: TrendingUp },
        { id: 'career_readiness', label: 'Career Readiness', icon: Briefcase },
        { id: 'mock_interviews', label: 'Mock Interviews', icon: Mic, isAi: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'ai_assistant', label: 'AI Learning Assistant', icon: Bot, isAi: true },
        { id: 'ask_doubt', label: 'Ask a Doubt', icon: MessageSquare },
        { id: 'my_notifications', label: 'My Notifications', icon: Bell },
        { id: 'my_profile', label: 'My Profile', icon: UserIcon },
      ],
    },
    {
      title: 'Settings',
      items: [{ id: 'settings', label: 'Settings', icon: Settings }],
    },
  ];

  // 2. MENTOR MENU ITEMS
  const mentorMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_mentees', label: 'My Mentees', icon: Users },
        { id: 'student_progress', label: 'Student Progress', icon: TrendingUp },
      ],
    },
    {
      title: 'Mentoring',
      items: [
        { id: 'doubt_requests', label: 'Doubt Requests', icon: HelpCircle, badge: '4', badgeColor: 'yellow' },
        { id: 'student_skill_gaps', label: 'Student Skill Gaps', icon: Target },
        { id: 'at_risk_students', label: 'At-Risk Students', icon: AlertTriangle, badge: '3', badgeColor: 'red' },
        { id: 'mentoring_sessions', label: 'Mentoring Sessions', icon: Calendar },
        { id: 'feedback_recommendations', label: 'Feedback & Recommendations', icon: Award },
      ],
    },
    {
      title: 'Communication',
      items: [{ id: 'messages_notifications', label: 'Messages & Notifications', icon: MessageSquare }],
    },
    {
      title: 'Account',
      items: [
        { id: 'my_profile', label: 'My Profile', icon: UserIcon },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // 3. TRAINER MENU ITEMS
  const trainerMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_courses', label: 'My Courses', icon: Layers },
        { id: 'my_batches', label: 'My Batches or Classes', icon: Building },
        { id: 'my_students', label: 'My Students', icon: Users },
      ],
    },
    {
      title: 'Teaching & Evaluation',
      items: [
        { id: 'course_content', label: 'Course Content', icon: BookOpen },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'assignment_evaluation', label: 'Assignment Evaluation', icon: FileCheck, badge: '12', badgeColor: 'yellow' },
        { id: 'assessments', label: 'Assessments', icon: CheckCircle2 },
        { id: 'assessment_results', label: 'Assessment Results', icon: BarChart3 },
        { id: 'student_skill_gaps', label: 'Student Skill Gaps', icon: Target },
      ],
    },
    {
      title: 'Monitoring',
      items: [
        { id: 'student_progress', label: 'Student Progress', icon: TrendingUp },
        { id: 'doubt_requests', label: 'Doubt Requests', icon: HelpCircle },
        { id: 'at_risk_students', label: 'At-Risk Students', icon: AlertTriangle, badge: '4', badgeColor: 'red' },
        { id: 'learning_analytics', label: 'Learning Analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'my_profile', label: 'My Profile', icon: UserIcon },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // 4. ADMIN MENU ITEMS
  const adminMenuGroups: SidebarMenuGroup[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'institution_analytics', label: 'Institution Analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'User Management',
      items: [
        { id: 'students', label: 'Students', icon: Users },
        { id: 'mentors', label: 'Mentors', icon: Compass },
        { id: 'trainers', label: 'Trainers', icon: Award },
        { id: 'user_management', label: 'User Role Management', icon: ShieldCheck },
      ],
    },
    {
      title: 'Academic Management',
      items: [
        { id: 'courses', label: 'Courses', icon: Layers },
        { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'assessments', label: 'Assessments', icon: CheckCircle2 },
      ],
    },
    {
      title: 'Performance & Insights',
      items: [
        { id: 'student_progress', label: 'Student Progress', icon: TrendingUp },
        { id: 'skill_gap_analytics', label: 'Skill Gap Analytics', icon: Target },
        { id: 'career_readiness_analytics', label: 'Career Readiness Analytics', icon: Briefcase },
        { id: 'course_performance', label: 'Course Performance', icon: BarChart3 },
        { id: 'at_risk_students', label: 'At-Risk Students', icon: AlertTriangle, badge: '16', badgeColor: 'red' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'my_profile', label: 'My Profile', icon: UserIcon },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  // Pick menu configuration based on verified role
  const activeMenuGroups: SidebarMenuGroup[] = isAdmin
    ? adminMenuGroups
    : isTrainer
    ? trainerMenuGroups
    : isMentor
    ? mentorMenuGroups
    : studentMenuGroups;

  const handleNavClick = (itemId: string) => {
    // If user clicked profile, route or select
    if (itemId === 'my_profile') {
      navigate('/profile');
      if (onCloseMobile) onCloseMobile();
      return;
    }

    onSelect(itemId);
    if (onCloseMobile) onCloseMobile();
  };

  const confirmLogout = () => {
    authService.logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  // User avatar initials
  const initials =
    currentUser.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'LA';

  const roleDisplay = getRoleDisplayName();

  const renderBadge = (badge?: string | number, color?: 'teal' | 'lime' | 'yellow' | 'red') => {
    if (!badge) return null;
    let colorClasses = 'bg-[#151A18] text-[#32D6B0] border-[#32D6B0]/30';
    if (color === 'red') colorClasses = 'bg-[#261517] text-[#FF7272] border-[#FF7272]/40';
    if (color === 'yellow') colorClasses = 'bg-[#232014] text-[#F2D64B] border-[#F2D64B]/40';
    if (color === 'lime') colorClasses = 'bg-[#152317] text-[#B4E85A] border-[#B4E85A]/40';

    return (
      <span
        className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${colorClasses}`}
      >
        {badge}
      </span>
    );
  };

  const sidebarContent = (
    <div
      className={`h-full flex flex-col bg-[#101412] border-r border-[#29312C] select-none transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#29312C] shrink-0">
        <button
          onClick={() => {
            const path = authService.getRoleDashboardPath(currentUser.role);
            navigate(path);
          }}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none min-w-0"
        >
          <div className="w-8 h-8 rounded-lg gradient-uniconnect flex items-center justify-center text-[#0A0D0C] font-black shrink-0 transition-transform group-hover:scale-105">
            <svg
              className="w-4 h-4 text-[#0A0D0C]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-sm font-bold text-[#F5F7F6] tracking-tight block leading-tight font-['Outfit'] truncate">
                LearnAI
              </span>
              <span className="text-[10px] text-[#32D6B0] block font-medium truncate">
                {roleDisplay} Portal
              </span>
            </div>
          )}
        </button>

        {/* Mobile close button */}
        {isOpenMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#A3ADA7] hover:text-[#F5F7F6] rounded-lg hover:bg-[#151A18] cursor-pointer"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleDesktopCollapse}
          className="hidden md:flex p-1 text-[#A3ADA7] hover:text-[#32D6B0] rounded-md hover:bg-[#151A18] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin scrollbar-thumb-[#29312C]">
        {activeMenuGroups.map((group) => {
          const isGroupCollapsed = Boolean(collapsedGroups[group.title]);

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A3ADA7] hover:text-[#F5F7F6] transition-colors group cursor-pointer"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 text-[#A3ADA7] group-hover:text-[#F5F7F6] ${
                      isGroupCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                  />
                </button>
              )}

              {/* Group separator line if collapsed */}
              {isCollapsed && <div className="h-px bg-[#29312C]/60 my-2 mx-1" />}

              {!isGroupCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeItem === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer group ${
                          isActive
                            ? 'bg-[#151A18] text-[#32D6B0] border border-[#29312C] font-semibold shadow-xs'
                            : 'text-[#A3ADA7] hover:bg-[#151A18] hover:text-[#F5F7F6]'
                        }`}
                      >
                        <div className="relative shrink-0 flex items-center justify-center">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-[#32D6B0]'
                                : item.isAi
                                ? 'text-[#B4E85A]'
                                : 'text-[#A3ADA7] group-hover:text-[#F5F7F6]'
                            }`}
                          />
                          {/* Mini badge dot when collapsed */}
                          {isCollapsed && item.badge && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#32D6B0]" />
                          )}
                        </div>

                        {!isCollapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.isAi && !isActive && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#101F1B] text-[#B4E85A] border border-[#B4E85A]/30">
                                AI
                              </span>
                            )}
                            {renderBadge(item.badge, item.badgeColor)}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Profile & Logout Bottom Card */}
      <div className="p-2.5 border-t border-[#29312C] bg-[#101412] shrink-0 space-y-1.5">
        <button
          onClick={() => navigate('/profile')}
          title="Open Profile"
          className={`w-full p-2 rounded-xl bg-[#151A18] hover:bg-[#1B211E] border border-[#29312C] transition-all text-left cursor-pointer flex items-center gap-2.5 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg gradient-uniconnect text-[#0A0D0C] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#F5F7F6] truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#32D6B0] font-medium truncate mt-0.5">
                {roleDisplay}
              </p>
            </div>
          )}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          title="Sign Out"
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#FF7272] hover:bg-[#261517] hover:border-[#FF7272]/30 border border-transparent rounded-lg transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D0C]/80 backdrop-blur-xs">
          <div className="bg-[#151A18] rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#261517] border border-[#FF7272]/30 text-[#FF7272] flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                  Confirm Sign Out
                </h3>
                <p className="text-xs text-[#A3ADA7] mt-0.5">
                  Are you sure you want to end your current LearnAI session?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#29312C]">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-[#A3ADA7] hover:text-[#F5F7F6] rounded-xl hover:bg-[#1B211E] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 bg-[#FF7272] hover:bg-[#FF7272]/90 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#0A0D0C]/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 max-w-[260px] w-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
