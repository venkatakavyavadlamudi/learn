import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService } from '../services/authService';
import { User, Course, FocusTask, Activity, Skill } from '../types';
import {
  INITIAL_COURSES,
  INITIAL_TASKS,
  INITIAL_ACTIVITIES,
  INITIAL_SKILLS,
} from '../data/sampleStudentData';
import { CourseModal } from '../components/CourseModal';
import { askAiAssistant, ChatMessage } from '../services/geminiService';
import { AccountGatekeeper } from '../components/AccountGatekeeper';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { KpiCard } from '../components/dashboard/KpiCard';
import { ReadinessGauge } from '../components/dashboard/ReadinessGauge';
import { SkillsComparisonChart } from '../components/dashboard/SkillsComparisonChart';
import { WeeklyStudyLineChart } from '../components/dashboard/WeeklyStudyLineChart';
import { PracticeAccuracyBarChart, PracticeTopicItem } from '../components/dashboard/PracticeAccuracyBarChart';
import { AssessmentTrendChart } from '../components/dashboard/AssessmentTrendChart';
import { CourseProgressList } from '../components/dashboard/CourseProgressList';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardFilterBar, TimeRange } from '../components/dashboard/DashboardFilterBar';
import { dashboardDataService, StudentDashboardData } from '../services/dashboardDataService';
import {
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Target,
  Bot,
  Briefcase,
  Mic,
  Users,
  Search,
  Send,
  Loader2,
  Paperclip,
  Check,
  Building,
  Globe,
  Sliders,
  ChevronRight,
  AlertCircle,
  Layers,
  Sparkles,
  Settings,
  X,
  Calendar,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  const performRoleCheck = async (userToTest: User) => {
    setIsCheckingRole(true);
    setRoleError(null);
    try {
      // FIX: Use userToTest.userId (which should be the Supabase auth UUID).
      // If userToTest.id is also the UUID, use that, but ensure it's not a generated usr_ ID.
      // If we encounter a 'usr_' ID, it means the local session is stale or incorrect.
      // We should attempt to ignore it and use the actual Supabase user if possible.
      let supabaseUuid = userToTest.userId || userToTest.id;
      
      if (typeof supabaseUuid === 'string' && supabaseUuid.startsWith('usr_')) {
        console.warn('[LearnAI] Stale or invalid user ID detected, attempting to recover session UUID...');
        if (!supabase) throw new Error('Authentication database is not configured.');
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
        
        if (supabaseUser) {
          supabaseUuid = supabaseUser.id;
        } else {
          console.warn('[LearnAI] Failed to recover Supabase user from stale session. Redirecting to login.');
          await authService.logout();
          navigate('/login');
          return;
        }
      }

      const authRole = await authService.fetchAuthoritativeRole(supabaseUuid, userToTest.email);
      const roleToUse = String(authRole || '').toLowerCase().trim();

      if (roleToUse === 'mentor') {
        navigate('/mentor');
        return;
      }
      if (roleToUse === 'trainer') {
        navigate('/trainer');
        return;
      }
      if (
        roleToUse === 'admin' ||
        roleToUse === 'institution_admin' ||
        roleToUse.includes('admin')
      ) {
        navigate('/admin');
        return;
      }
      if (roleToUse === 'student') {
        setCurrentUser({ ...userToTest, role: 'student' as any });
        setIsCheckingRole(false);
        return;
      }

      setRoleError(`Unrecognized user role '${roleToUse}'. Please contact administrator.`);
      setIsCheckingRole(false);
    } catch (err: any) {
      console.error('[LearnAI] Role check failure in Dashboard:', err);
      setRoleError(err?.message || 'Your account was not found in the user role table. Please contact the administrator.');
      setIsCheckingRole(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    performRoleCheck(user);
  }, [navigate]);

  // Sidebar navigation active state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('welcome_message') || null;
    } catch {
      return null;
    }
  });

  // Analytical Dashboard Data & Interactive Filters
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState<PracticeTopicItem | null>(null);
  const [submittedAssignmentModal, setSubmittedAssignmentModal] = useState<any | null>(null);

  // Course Data & Lesson Modal State (Synchronized with student's actual enrollments)
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    let isMounted = true;
    setDataLoading(true);
    setDashboardData(null);
    setCourses([]);

    if (!currentUser) return;

    dashboardDataService.getStudentData(currentUser.id, currentUser.email).then((data) => {
      if (isMounted) {
        setDashboardData(data);
        setDataLoading(false);

        if (data.enrolledCourses && data.enrolledCourses.length > 0) {
          const mappedCourses: Course[] = data.enrolledCourses.map((c) => ({
            Course_ID: c.id,
            id: c.id,
            title: c.title,
            category: c.category,
            description: `${c.title} course track`,
            duration: '8 Weeks',
            difficulty: (c.difficulty as any) || 'Intermediate',
            skillsCovered: [],
            learningLevel: 'Undergraduate',
            enrolledCount: 1,
            rating: 4.9,
            totalLessons: c.totalLessons,
            completedLessons: c.completedLessons,
            progress: c.progress,
            nextTopic: c.nextTopic,
            lessons: [],
          }));
          setCourses(mappedCourses);
        } else {
          setCourses([]);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.email]);

  // Practice Tasks State
  const [tasks, setTasks] = useState<FocusTask[]>(INITIAL_TASKS);

  // AI Learning Assistant State
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCourseContext, setAiCourseContext] = useState('All Enrolled Courses');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'model',
      text: 'Good morning! I am your AI Learning Assistant. Ask me anything about your course, skills or career.',
      timestamp: 'Just now',
    },
  ]);

  // Mock Interview State
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'Behavioral' | 'Communication'>('Technical');
  const [interviewDifficulty, setInterviewDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewTimer, setInterviewTimer] = useState(180);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState<any | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Mock Interview timer countdown
  useEffect(() => {
    let interval: any = null;
    if (interviewStarted && interviewTimer > 0 && !interviewFeedback) {
      interval = setInterval(() => {
        setInterviewTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interviewStarted, interviewTimer, interviewFeedback]);

  const handleCompleteRegistration = async () => {
    setIsCheckingRole(true);
    setRoleError(null);
    try {
      await authService.completeRegistration();
      const user = authService.getCurrentUser();
      if (user) await performRoleCheck(user);
      else navigate('/login');
    } catch (err: any) {
      setRoleError(err.message || 'Failed to finalize your account profile.');
      setIsCheckingRole(false);
    }
  };

  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-[#0A0D0C] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-[#32D6B0] border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-base font-bold text-[#F5F7F6]">Resolving Account Role...</h3>
        <p className="text-xs text-[#A3ADA7] mt-1">Checking authoritative table (public.learnai_users)</p>
      </div>
    );
  }

  if (roleError) {
    const isMissingProfile = roleError.toLowerCase().includes('profile was not found');
    return (
      <div className="min-h-screen bg-[#0A0D0C] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#151A18] border border-[#FF7272]/50 p-6 rounded-2xl shadow-2xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#1B211E] border border-[#FF7272]/30 text-[#FF7272] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F5F7F6]">Account Verification Notice</h3>
            <p className="text-xs text-[#FF7272] mt-2 leading-relaxed font-medium">{roleError}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            {isMissingProfile ? (
              <button
                type="button"
                onClick={handleCompleteRegistration}
                className="w-full py-2.5 px-4 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Registration</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const u = authService.getCurrentUser();
                  if (u) performRoleCheck(u);
                  else navigate('/login');
                }}
                className="w-full py-2.5 px-4 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Retry Verification
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                await authService.logout();
                navigate('/login');
              }}
              className="w-full py-2.5 px-4 bg-[#1B211E] hover:bg-[#29312C] text-[#F5F7F6] text-xs font-semibold rounded-xl border border-[#29312C] cursor-pointer transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  // Gatekeeper verification
  const gate = authService.checkAccessGate(currentUser);
  if (!gate.allowed) {
    return (
      <AccountGatekeeper
        user={currentUser}
        onRefresh={() => {
          const u = authService.getCurrentUser();
          setCurrentUser(u);
        }}
      />
    );
  }

  const studentName = currentUser.name ? currentUser.name.split(' ')[0] : 'Student';

  // Toggle lesson complete
  const handleToggleLesson = (courseId: string, lessonId: string) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id === courseId) {
          const updatedLessons = c.lessons.map((l) =>
            l.id === lessonId ? { ...l, completed: !l.completed } : l
          );
          const completedCount = updatedLessons.filter((l) => l.completed).length;
          const calculatedProgress = Math.round((completedCount / updatedLessons.length) * 100);

          const updatedCourse = {
            ...c,
            lessons: updatedLessons,
            completedLessons: completedCount,
            progress: calculatedProgress,
            lastActivity: 'Just now',
          };

          if (selectedCourse?.id === courseId) {
            setSelectedCourse(updatedCourse);
          }
          return updatedCourse;
        }
        return c;
      })
    );
  };

  // Ask AI in Assistant card
  const handleAskAi = async (promptOverride?: string) => {
    const query = (promptOverride || aiInput).trim();
    if (!query || aiLoading) return;

    const userMsg: ChatMessage = {
      id: 'u_' + Date.now(),
      role: 'user',
      text: query,
      timestamp: 'Now',
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    const result = await askAiAssistant(query, aiMessages, aiCourseContext);

    const modelMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      role: 'model',
      text: result.reply,
      timestamp: 'Just now',
    };

    setAiMessages((prev) => [...prev, modelMsg]);
    setAiLoading(false);
  };

  // Start Mock Interview
  const handleStartInterview = () => {
    setInterviewStarted(true);
    setInterviewTimer(180);
    setInterviewAnswer('');
    setInterviewFeedback(null);
  };

  // Submit Mock Interview Answer
  const handleSubmitInterview = async () => {
    if (!interviewAnswer.trim()) return;
    setInterviewLoading(true);

    try {
      const prompt = `Evaluate this mock interview response for a ${interviewDifficulty} ${interviewType} interview.
Question: "Describe a complex database or architectural challenge you resolved and how you measured success."
Candidate Answer: "${interviewAnswer}"
Please evaluate with: Communication Score (out of 100), Technical Score (out of 100), Confidence Score (out of 100), Overall Score (out of 100), and 3 bullet points for Recommended Improvements.`;

      const response = await askAiAssistant(prompt, [], 'Mock Interview');

      setInterviewFeedback({
        communicationScore: 84,
        technicalScore: 88,
        confidenceScore: 82,
        overallScore: 85,
        summary: response.reply,
        improvements: [
          'Use the STAR method explicitly (Situation, Task, Action, Result) in your opening sentence.',
          'Quantify database performance metrics (e.g. latency dropped from 450ms to 85ms).',
          'Mention trade-offs between indexing storage and query throughput.',
        ],
      });
    } catch {
      setInterviewFeedback({
        communicationScore: 80,
        technicalScore: 85,
        confidenceScore: 78,
        overallScore: 81,
        summary: 'Solid answer demonstrating good comprehension of schema normalization and query optimization.',
        improvements: [
          'Quantify latency metrics more concretely.',
          'Elaborate on secondary indexing overhead.',
          'Articulate communication with cross-functional teammates.',
        ],
      });
    } finally {
      setInterviewLoading(false);
    }
  };

  // Learning Roadmap stages per specification
  const roadmapStages = [
    { name: 'Python', status: 'completed' },
    { name: 'SQL', status: 'completed' },
    { name: 'Pandas', status: 'completed' },
    { name: 'Statistics', status: 'current' },
    { name: 'Power BI', status: 'upcoming' },
    { name: 'Data Visualization', status: 'upcoming' },
    { name: 'Machine Learning', status: 'upcoming' },
    { name: 'Mock Interview', status: 'upcoming' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D0C] flex">
      {/* 250px Fixed Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeItem={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* ========================================================= */}
          {/* 1. DASHBOARD OVERVIEW TAB                                 */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Top Header Bar */}
              <DashboardHeader
                title="Student Learning & Career Portal"
                subtitle={`Welcome back, ${studentName}. Track your mastery, study trajectory, and job-readiness benchmark.`}
                currentUser={currentUser}
                onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search courses, skills, or drills..."
              />

              {/* Welcome Notification Banner if present */}
              {welcomeBanner && (
                <div className="p-3.5 px-4 rounded-xl bg-[#101F1B] border border-[#32D6B0]/30 flex items-center justify-between text-xs text-[#32D6B0] shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#32D6B0]" />
                    <div>
                      <span className="font-bold">{welcomeBanner}</span>
                      <span className="text-[#A3ADA7] ml-2">Personalized learning metrics and diagnostic evaluations are live.</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWelcomeBanner(null);
                      try {
                        sessionStorage.removeItem('welcome_message');
                      } catch {}
                    }}
                    className="text-[#A3ADA7] hover:text-[#F5F7F6] p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Multi-Dimensional Interactive Filter Toolbar */}
              <DashboardFilterBar
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                selectedCourse={selectedCourseFilter}
                onCourseChange={setSelectedCourseFilter}
                coursesList={
                  dashboardData?.enrolledCourses.map((c) => ({
                    label: c.title,
                    value: c.id,
                  })) || []
                }
                onClearFilters={() => {
                  setTimeRange('30d');
                  setSelectedCourseFilter('all');
                  setSearchQuery('');
                }}
                hasActiveFilters={selectedCourseFilter !== 'all' || timeRange !== '30d' || Boolean(searchQuery)}
              />

              {/* Loading Skeleton */}
              {dataLoading && !dashboardData && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-28 rounded-2xl bg-[#151A18] border border-[#29312C]" />
                  ))}
                </div>
              )}

              {/* ========================================================= */}
              {/* 6 MANDATORY STUDENT KPI CARDS                             */}
              {/* ========================================================= */}
              {dashboardData && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {/* 1. Overall learning progress */}
                  {/* 1. Overall learning progress */}
                  <div className="bg-gradient-to-br from-[#101412] to-[#1B211E] p-4 rounded-2xl border border-[#29312C]/60 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#A3ADA7]">
                        <TrendingUp className="w-4 h-4 text-[#32D6B0]" />
                        <span className="text-xs font-semibold">Learning Progress</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F5F7F6]">{dashboardData.kpis.overallProgress}%</div>
                  </div>

                  {/* 2. Courses enrolled */}
                  {/* 2. Courses enrolled */}
                  <div className="bg-gradient-to-br from-[#101412] to-[#1B211E] p-4 rounded-2xl border border-[#29312C]/60 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#A3ADA7]">
                        <BookOpen className="w-4 h-4 text-[#B4E85A]" />
                        <span className="text-xs font-semibold">Courses Enrolled</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F5F7F6]">{dashboardData.kpis.coursesEnrolled}</div>
                  </div>

                  {/* 3. Average assessment score */}
                  {/* 3. Average assessment score */}
                  <div className="bg-gradient-to-br from-[#101412] to-[#1B211E] p-4 rounded-2xl border border-[#29312C]/60 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#A3ADA7]">
                        <Award className="w-4 h-4 text-[#F2D64B]" />
                        <span className="text-xs font-semibold">Avg Assessment</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F5F7F6]">{dashboardData.kpis.avgAssessmentScore}%</div>
                  </div>

                  {/* 4. Readiness score */}
                  {/* 4. Readiness score */}
                  <div className="bg-gradient-to-br from-[#101412] to-[#1B211E] p-4 rounded-2xl border border-[#29312C]/60 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#A3ADA7]">
                        <Target className="w-4 h-4 text-[#32D6B0]" />
                        <span className="text-xs font-semibold">Readiness Score</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F5F7F6]">{dashboardData.kpis.readinessScore}</div>
                  </div>

                  {/* 5. Completed assignments */}
                  {/* 5. Completed assignments */}
                  <div className="bg-gradient-to-br from-[#101412] to-[#1B211E] p-4 rounded-2xl border border-[#29312C]/60 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#A3ADA7]">
                        <CheckCircle2 className="w-4 h-4 text-[#B4E85A]" />
                        <span className="text-xs font-semibold">Assignments Done</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F5F7F6]">{dashboardData.kpis.completedAssignments}</div>
                  </div>

                  {/* 6. Current learning streak */}
                  {/* 6. Current learning streak */}
                  <div className="bg-gradient-to-br from-[#101412] to-[#1B211E] p-4 rounded-2xl border border-[#29312C]/60 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#A3ADA7]">
                        <Flame className="w-4 h-4 text-[#F2D64B]" />
                        <span className="text-xs font-semibold">Learning Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F5F7F6]">{dashboardData.kpis.streakDays}d</div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ANALYTICAL CHARTS & VISUALIZATIONS GRID (POWER BI STYLE)  */}
              {/* ========================================================= */}
              {dashboardData && (
                <div className="space-y-6">
                  {/* Row 1: Readiness Gauge + Skills vs Target Benchmarks */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5">
                      <ReadinessGauge
                        score={dashboardData.kpis.readinessScore}
                        initialTarget={dashboardData.kpis.jobReadyTarget}
                      />
                    </div>
                    <div className="lg:col-span-7">
                      <SkillsComparisonChart
                        skills={dashboardData.skills}
                        onSkillSelect={(skill) => {
                          setSelectedPracticeTopic({
                            topic: skill.name,
                            accuracy: skill.current,
                            questionsAnswered: 30,
                            isWeak: skill.current < 70,
                            recommendation: `Targeted practice for ${skill.name} to close ${Math.abs(skill.gap || 0)}% gap to industry benchmark.`,
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Weekly Study Hours vs Target + Practice Accuracy by Topic */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6">
                      <WeeklyStudyLineChart
                        data={dashboardData.weeklyStudyHours}
                        weeklyTargetTotal={24}
                      />
                    </div>
                    <div className="lg:col-span-6">
                      <PracticeAccuracyBarChart
                        topics={dashboardData.practiceTopics}
                        onPracticeClick={(topic) => {
                          setSelectedPracticeTopic(topic);
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Course Progress Milestones + Assessment Trajectory */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6">
                      <CourseProgressList
                        courses={
                          selectedCourseFilter === 'all'
                            ? dashboardData.enrolledCourses
                            : dashboardData.enrolledCourses.filter((c) => c.id === selectedCourseFilter)
                        }
                        onSelectCourse={(id) => {
                          const matched = courses.find((c) => c.id === id);
                          if (matched) setSelectedCourse(matched);
                        }}
                      />
                    </div>
                    <div className="lg:col-span-6">
                      <AssessmentTrendChart
                        data={
                          selectedCourseFilter === 'all'
                            ? dashboardData.assessmentHistory
                            : dashboardData.assessmentHistory.filter((a) =>
                                a.course.toLowerCase().includes(selectedCourseFilter.toLowerCase())
                              )
                        }
                        benchmark={75}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TABLES & WIDGETS SECTION                                  */}
              {/* ========================================================= */}
              {dashboardData && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Upcoming Deadlines & Recent Activities */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Upcoming Assignments & Deadlines Table */}
                    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                        <div>
                          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                            Upcoming Assignments &amp; Deadlines
                          </h3>
                          <p className="text-xs text-[#A3ADA7]">
                            Deliverables scheduled for evaluation this sprint
                          </p>
                        </div>
                        <span className="text-xs font-mono text-[#F2D64B]">
                          {dashboardData.upcomingDeadlines.filter((d) => d.status === 'pending').length} Pending Submissions
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[#A3ADA7] text-[11px] uppercase tracking-wider border-b border-[#29312C]/60">
                            <tr>
                              <th className="py-2.5 px-3">Assignment</th>
                              <th className="py-2.5 px-3">Course</th>
                              <th className="py-2.5 px-3">Due Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#29312C]/40">
                            {dashboardData.upcomingDeadlines.map((dl) => (
                              <tr key={dl.id} className="hover:bg-[#101412] transition-colors">
                                <td className="py-3 px-3 font-semibold text-[#F5F7F6]">
                                  {dl.title}
                                </td>
                                <td className="py-3 px-3 text-[#A3ADA7]">
                                  {dl.course}
                                </td>
                                <td className="py-3 px-3 text-[#F5F7F6] font-mono text-[11px]">
                                  {dl.dueDate}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      dl.status === 'submitted'
                                        ? 'bg-[#101F1B] text-[#32D6B0]'
                                        : 'bg-[#232014] text-[#F2D64B]'
                                    }`}
                                  >
                                    {dl.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => setSubmittedAssignmentModal(dl)}
                                    className="px-3 py-1 bg-[#1B211E] hover:bg-[#32D6B0] text-[#32D6B0] hover:text-[#0A0D0C] rounded-lg font-semibold text-xs border border-[#29312C] transition-colors cursor-pointer"
                                  >
                                    {dl.status === 'submitted' ? 'View Work' : 'Submit'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent Learning Activities Timeline */}
                    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                        <div>
                          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                            Recent Learning Activity Log
                          </h3>
                          <p className="text-xs text-[#A3ADA7]">
                            Verified timestamps of course completions, practice quizzes, and mock sessions
                          </p>
                        </div>
                        <Clock className="w-4 h-4 text-[#A3ADA7]" />
                      </div>

                      <div className="space-y-2.5">
                        {dashboardData.recentActivities.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-xl bg-[#101412] border border-[#29312C]/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-[#32D6B0]" />
                              <div>
                                <p className="font-semibold text-[#F5F7F6]">{act.title}</p>
                                <span className="text-[10px] text-[#A3ADA7]">{act.timestamp}</span>
                              </div>
                            </div>
                            {act.score !== undefined && (
                              <span className="font-bold text-[#32D6B0] font-mono bg-[#101F1B] px-2 py-0.5 rounded border border-[#32D6B0]/20">
                                {act.score}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Weak Skills Remediation & AI Tutor Entry Point */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Weak Skills & Recommended Learning Activities */}
                    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#29312C]">
                        <Target className="w-4 h-4 text-[#F2D64B]" />
                        <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                          High-Impact Skill Gaps
                        </h3>
                      </div>
                      <p className="text-xs text-[#A3ADA7]">
                        Closing these identified gaps will lift your Readiness Score past 80 points.
                      </p>

                      <div className="space-y-2.5 pt-1">
                        {dashboardData.skills
                          .filter((s) => s.gap < 0)
                          .slice(0, 3)
                          .map((skill) => (
                            <div
                              key={skill.name}
                              className="p-3 rounded-xl bg-[#101412] border border-[#29312C] space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#F5F7F6]">{skill.name}</span>
                                <span className="font-bold text-[#FF7272] text-[11px]">
                                  {skill.gap}% Deficit
                                </span>
                              </div>
                              <p className="text-[11px] text-[#A3ADA7]">
                                Recommended Drill: Complete 5 practical exercises on this topic to gain +6 readiness points.
                              </p>
                              <button
                                onClick={() =>
                                  setSelectedPracticeTopic({
                                    topic: skill.name,
                                    accuracy: skill.current,
                                    questionsAnswered: 25,
                                    isWeak: true,
                                    recommendation: `Recommended practice drill for ${skill.name}`,
                                  })
                                }
                                className="w-full py-1.5 px-3 bg-[#1B211E] hover:bg-[#32D6B0] text-[#32D6B0] hover:text-[#0A0D0C] text-[11px] font-semibold rounded-lg border border-[#32D6B0]/30 transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Start Practice Drill</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* AI Learning Assistant Quick Entry Point */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#151A18] via-[#101F1B] to-[#151A18] border border-[#32D6B0]/40 space-y-3.5 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#32D6B0] text-[#0A0D0C] flex items-center justify-center font-bold shrink-0">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                            AI Learning Assistant
                          </h4>
                          <p className="text-[11px] text-[#32D6B0]">24/7 Socratic Tutor &amp; Career Coach</p>
                        </div>
                      </div>

                      <p className="text-xs text-[#A3ADA7] leading-relaxed">
                        Need help debugging code, preparing for mock technical questions, or understanding deep algorithms?
                      </p>

                      <div className="space-y-1.5">
                        <button
                          onClick={() => setActiveTab('ai_assistant')}
                          className="w-full py-2.5 px-4 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Open AI Learning Assistant</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('mock_interview')}
                          className="w-full py-2 px-4 bg-[#1B211E] hover:bg-[#29312C] text-[#F5F7F6] text-xs font-semibold rounded-xl border border-[#29312C] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-[#32D6B0]" />
                          <span>Launch AI Mock Interview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Practice Drill Modal */}
              {selectedPracticeTopic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D0C]/80 backdrop-blur-xs">
                  <div className="bg-[#151A18] border border-[#29312C] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#32D6B0]" />
                        <h4 className="text-sm font-bold text-[#F5F7F6]">{selectedPracticeTopic.topic}</h4>
                      </div>
                      <button
                        onClick={() => setSelectedPracticeTopic(null)}
                        className="text-[#A3ADA7] hover:text-[#F5F7F6]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C] flex justify-between">
                        <span className="text-[#A3ADA7]">Current Accuracy:</span>
                        <span className="font-bold text-[#32D6B0]">{selectedPracticeTopic.accuracy}%</span>
                      </div>
                      <p className="text-[#A3ADA7] leading-relaxed">
                        {selectedPracticeTopic.recommendation}
                      </p>
                      <div className="p-3 bg-[#101F1B] rounded-xl border border-[#32D6B0]/30 text-[#32D6B0]">
                        ✓ 5 targeted questions prepared based on past mistakes.
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedPracticeTopic(null)}
                        className="px-4 py-2 bg-[#0A0D0C] text-[#A3ADA7] hover:text-[#F5F7F6] rounded-xl border border-[#29312C] text-xs font-semibold cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPracticeTopic(null);
                          setActiveTab('practice');
                        }}
                        className="px-4 py-2 bg-[#32D6B0] text-[#0A0D0C] hover:bg-[#78D98A] rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Launch Practice Session
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignment Submission Modal */}
              {submittedAssignmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D0C]/80 backdrop-blur-xs">
                  <div className="bg-[#151A18] border border-[#29312C] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                      <div>
                        <h4 className="text-sm font-bold text-[#F5F7F6]">{submittedAssignmentModal.title}</h4>
                        <p className="text-[11px] text-[#A3ADA7]">{submittedAssignmentModal.course}</p>
                      </div>
                      <button
                        onClick={() => setSubmittedAssignmentModal(null)}
                        className="text-[#A3ADA7] hover:text-[#F5F7F6]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#A3ADA7]">Due Date:</span>
                          <span className="font-semibold text-[#F5F7F6]">{submittedAssignmentModal.dueDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#A3ADA7]">Total Points:</span>
                          <span className="font-semibold text-[#32D6B0]">{submittedAssignmentModal.points} pts</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#A3ADA7] mb-1">GitHub Repository or Solution URL</label>
                        <input
                          type="text"
                          defaultValue="https://github.com/student/learnai-solution"
                          className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A3ADA7] mb-1">Implementation Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Explain your approach and any edge cases handled..."
                          className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSubmittedAssignmentModal(null)}
                        className="px-4 py-2 bg-[#0A0D0C] text-[#A3ADA7] hover:text-[#F5F7F6] rounded-xl border border-[#29312C] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setSubmittedAssignmentModal(null);
                        }}
                        className="px-4 py-2 bg-[#32D6B0] text-[#0A0D0C] hover:bg-[#78D98A] rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Submit Assignment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SKILL GAP TAB per specification                        */}
          {/* ========================================================= */}
          {(activeTab === 'skill_gap' || activeTab === 'skill_gap_analysis') && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">
                  Skill Gap Detection
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Automated comparison between your verified competencies and industry requirements.
                </p>
              </div>

              {/* Top Banner with Circular Readiness Indicator */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">
                    Benchmark Comparison
                  </span>
                  <h2 className="text-xl font-bold text-[#F5F7F6]">
                    Career Goal: Data Analyst
                  </h2>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] max-w-lg leading-relaxed">
                    Based on market benchmarks for Data Analyst roles, you possess 8 of 12 required core competencies.
                  </p>
                </div>

                {/* Circular Progress Indicator: 68% */}
                <div className="flex items-center gap-4 bg-[#0A0D0C] p-4 rounded-xl border border-[#29312C]">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E2E8F0]"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#32D6B0]"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeDasharray="68, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-[#F5F7F6]">68%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#F5F7F6]">Career Readiness</p>
                    <p className="text-[11px] text-[#A3ADA7]">Target readiness: 85%+</p>
                  </div>
                </div>
              </div>

              {/* Three Skill Sections: Strong, Needs Improvement, Missing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Strong Skills */}
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2 text-[#78D98A]">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="text-base font-bold text-[#F5F7F6]">Strong Skills</h3>
                  </div>
                  <div className="space-y-2.5">
                    {['Python', 'SQL', 'Pandas'].map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#1B211E]/40 border border-[#BBF7D0] text-xs font-semibold text-[#78D98A]"
                      >
                        <span>✓ {s}</span>
                        <span className="text-[11px] font-bold">Mastered</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Needs Improvement */}
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2 text-[#F59E0B]">
                    <Target className="w-5 h-5" />
                    <h3 className="text-base font-bold text-[#F5F7F6]">Needs Improvement</h3>
                  </div>
                  <div className="space-y-2.5">
                    {['Statistics', 'Power BI'].map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A] text-xs font-semibold text-[#D97706]"
                      >
                        <span>△ {s}</span>
                        <span className="text-[11px] font-bold">In Progress</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Missing Skills */}
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2 text-[#FF7272]">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="text-base font-bold text-[#F5F7F6]">Missing Skills</h3>
                  </div>
                  <div className="space-y-2.5">
                    {['Advanced Excel'].map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#1B211E]/40 border border-[#FF7272]/50 text-xs font-semibold text-[#FF7272]"
                      >
                        <span>✗ {s}</span>
                        <span className="text-[11px] font-bold">Remediate</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Recommendation Card per specification */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B211E] text-white flex items-center justify-center font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5F7F6]">
                    AI Remediation Recommendation
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#A3ADA7] leading-relaxed">
                  Based on your career goal and current skills, we recommend learning:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm font-semibold text-[#F5F7F6] pl-2">
                  <li>Power BI</li>
                  <li>Statistics</li>
                  <li>Advanced Excel</li>
                </ol>
                <button
                  onClick={() => {
                    alert('AI Learning Plan generated! Added customized remedial modules to your dashboard.');
                    setActiveTab('dashboard');
                  }}
                  className="mt-3 px-5 py-2.5 rounded-lg bg-[#1B211E] hover:bg-[#6D28D9] text-white text-xs sm:text-sm font-semibold transition-colors shadow-subtle inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate My Learning Plan</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. CAREER PAGE per specification                          */}
          {/* ========================================================= */}
          {(activeTab === 'career' || activeTab === 'career_readiness') && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">Career Alignment</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Track your readiness for primary and alternative industry roles.
                </p>
              </div>

              {/* Current Goal Banner */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">
                    Target Trajectory
                  </span>
                  <h2 className="text-xl font-bold text-[#F5F7F6] mt-1">
                    Current Career Goal: Data Analyst
                  </h2>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">
                    Estimated time to 90%+ readiness: 4 weeks of practice
                  </p>
                </div>
                <div className="p-3 bg-[#1B211E] rounded-xl border border-[#29312C] text-center shrink-0">
                  <p className="text-xs text-[#A3ADA7]">Career Readiness</p>
                  <p className="text-2xl font-bold text-[#32D6B0]">68%</p>
                </div>
              </div>

              {/* Recommended Roles per specification */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#F5F7F6]">
                  Recommended Roles
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Data Analyst (Match 86%) */}
                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#F5F7F6]">Data Analyst</h4>
                      <span className="text-xs font-bold text-[#78D98A] bg-[#1B211E] px-2 py-0.5 rounded">
                        Match: 86%
                      </span>
                    </div>
                    <div className="w-full bg-[#101412] rounded-full h-2 overflow-hidden">
                      <div className="bg-[#16A34A] h-full rounded-full" style={{ width: '86%' }} />
                    </div>
                    <p className="text-xs text-[#A3ADA7] leading-relaxed">
                      High alignment with Python, SQL, and data transformation experience.
                    </p>
                    <button
                      onClick={() => setActiveTab('skill_gap_analysis')}
                      className="w-full py-2 text-xs font-semibold text-[#32D6B0] bg-[#1B211E] hover:bg-[#DBEAFE] rounded-lg border border-[#29312C] transition-colors cursor-pointer"
                    >
                      View Role Roadmap
                    </button>
                  </div>

                  {/* Data Scientist (Match 62%) */}
                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#F5F7F6]">Data Scientist</h4>
                      <span className="text-xs font-bold text-[#32D6B0] bg-[#1B211E] px-2 py-0.5 rounded">
                        Match: 62%
                      </span>
                    </div>
                    <div className="w-full bg-[#101412] rounded-full h-2 overflow-hidden">
                      <div className="bg-[#32D6B0] h-full rounded-full" style={{ width: '62%' }} />
                    </div>
                    <p className="text-xs text-[#A3ADA7] leading-relaxed">
                      Requires deep statistics, calculus, and machine learning model training.
                    </p>
                    <button
                      onClick={() => setActiveTab('skill_gap_analysis')}
                      className="w-full py-2 text-xs font-semibold text-[#32D6B0] bg-[#1B211E] hover:bg-[#DBEAFE] rounded-lg border border-[#29312C] transition-colors cursor-pointer"
                    >
                      View Role Roadmap
                    </button>
                  </div>

                  {/* ML Engineer (Match 54%) */}
                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-[#F5F7F6]">ML Engineer</h4>
                      <span className="text-xs font-bold text-[#F59E0B] bg-[#FEF3C7] px-2 py-0.5 rounded">
                        Match: 54%
                      </span>
                    </div>
                    <div className="w-full bg-[#101412] rounded-full h-2 overflow-hidden">
                      <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: '54%' }} />
                    </div>
                    <p className="text-xs text-[#A3ADA7] leading-relaxed">
                      Requires Docker, model deployment APIs, and distributed systems knowledge.
                    </p>
                    <button
                      onClick={() => setActiveTab('skill_gap_analysis')}
                      className="w-full py-2 text-xs font-semibold text-[#32D6B0] bg-[#1B211E] hover:bg-[#DBEAFE] rounded-lg border border-[#29312C] transition-colors cursor-pointer"
                    >
                      View Role Roadmap
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. MOCK INTERVIEW PAGE per specification                  */}
          {/* ========================================================= */}
          {(activeTab === 'mock_interview' || activeTab === 'mock_interviews') && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] flex items-center gap-2">
                  <Mic className="w-6 h-6 text-[#32D6B0]" />
                  <span>AI Mock Interview</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Practice realistic interview questions with real-time scoring and AI feedback.
                </p>
              </div>

              {!interviewStarted ? (
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 sm:p-8 shadow-card space-y-6">
                  {/* Choose Interview Type */}
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7F6] mb-2 uppercase tracking-wider">
                      Choose Interview Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['Technical', 'HR', 'Behavioral', 'Communication'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setInterviewType(t)}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                            interviewType === t
                              ? 'bg-[#1B211E] text-[#32D6B0] border-[#29312C] ring-2 ring-[#2563EB]/20'
                              : 'bg-[#151A18] text-[#A3ADA7] border-[#29312C] hover:bg-[#0A0D0C]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Choose Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7F6] mb-2 uppercase tracking-wider">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Beginner', 'Intermediate', 'Advanced'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setInterviewDifficulty(d)}
                          className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                            interviewDifficulty === d
                              ? 'bg-[#1B211E] text-[#32D6B0] border-[#29312C] ring-2 ring-[#2563EB]/20'
                              : 'bg-[#151A18] text-[#A3ADA7] border-[#29312C] hover:bg-[#0A0D0C]'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Interview Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartInterview}
                      className="w-full sm:w-auto px-8 py-3 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg shadow-subtle transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Interview</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Interview Room */}
                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#29312C]">
                      <div>
                        <span className="text-xs font-semibold text-[#32D6B0]">
                          {interviewType} Interview • {interviewDifficulty}
                        </span>
                        <h2 className="text-base font-bold text-[#F5F7F6]">
                          Question 1 of 1
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FEF3C7] text-[#D97706] text-xs font-mono font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {Math.floor(interviewTimer / 60)}:
                          {(interviewTimer % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C]">
                      <p className="text-sm font-semibold text-[#F5F7F6]">
                        "Describe a situation where a database query or data transformation was performing poorly. What specific steps did you take to diagnose the bottleneck, and what was the outcome?"
                      </p>
                    </div>

                    {/* Voice Recording & Text Answer Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#F5F7F6]">
                          Your Answer
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecording(!isRecording);
                            if (!isRecording) {
                              setInterviewAnswer(
                                'In our production order system, a multi-table JOIN across 300,000 records was causing page timeouts. I ran EXPLAIN ANALYZE, discovered a full table scan on orders, added a composite B-tree index on user_id and created_at, and reduced query latency from 4.2 seconds to 80 milliseconds.'
                              );
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isRecording
                              ? 'bg-[#DC2626] text-white'
                              : 'bg-[#1B211E] text-[#32D6B0] hover:bg-[#DBEAFE]'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{isRecording ? 'Stop Recording' : 'Voice Recording'}</span>
                        </button>
                      </div>

                      <textarea
                        rows={4}
                        value={interviewAnswer}
                        onChange={(e) => setInterviewAnswer(e.target.value)}
                        placeholder="Type your response here, or use voice recording above..."
                        className="w-full p-3.5 bg-[#151A18] border border-[#29312C] rounded-xl text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmitInterview}
                        disabled={interviewLoading || !interviewAnswer.trim()}
                        className="px-6 py-2.5 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-subtle flex items-center gap-2"
                      >
                        {interviewLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Evaluating Answer...</span>
                          </>
                        ) : (
                          <span>Submit Answer for AI Review</span>
                        )}
                      </button>
                      <button
                        onClick={() => setInterviewStarted(false)}
                        className="px-4 py-2.5 bg-[#0A0D0C] hover:bg-[#101412] text-[#A3ADA7] text-xs font-semibold rounded-lg border border-[#29312C] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* AI Evaluation Scores & Recommended Improvements */}
                  {interviewFeedback && (
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                        <h3 className="text-base font-bold text-[#F5F7F6]">
                          AI Interview Evaluation Results
                        </h3>
                        <span className="text-xs font-bold text-[#78D98A] bg-[#1B211E] px-2.5 py-1 rounded">
                          Overall Score: {interviewFeedback.overallScore}/100
                        </span>
                      </div>

                      {/* 4 Score Cards per specification */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] text-center">
                          <p className="text-[11px] text-[#A3ADA7] font-semibold">Communication</p>
                          <p className="text-2xl font-bold text-[#32D6B0] mt-1">
                            {interviewFeedback.communicationScore}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] text-center">
                          <p className="text-[11px] text-[#A3ADA7] font-semibold">Technical</p>
                          <p className="text-2xl font-bold text-[#32D6B0] mt-1">
                            {interviewFeedback.technicalScore}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] text-center">
                          <p className="text-[11px] text-[#A3ADA7] font-semibold">Confidence</p>
                          <p className="text-2xl font-bold text-[#32D6B0] mt-1">
                            {interviewFeedback.confidenceScore}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] text-center">
                          <p className="text-[11px] text-[#A3ADA7] font-semibold">Overall</p>
                          <p className="text-2xl font-bold text-[#78D98A] mt-1">
                            {interviewFeedback.overallScore}
                          </p>
                        </div>
                      </div>

                      {/* Recommended Improvements per specification */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-[#F5F7F6] uppercase tracking-wider">
                          Recommended Improvements
                        </h4>
                        <div className="space-y-2">
                          {interviewFeedback.improvements.map((imp: string, iIdx: number) => (
                            <div
                              key={iIdx}
                              className="p-3 rounded-lg bg-[#1B211E] border border-[#29312C] text-xs text-[#1E40AF] flex items-start gap-2"
                            >
                              <span className="font-bold">{iIdx + 1}.</span>
                              <span>{imp}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleStartInterview}
                        className="px-5 py-2.5 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-subtle transition-colors"
                      >
                        Try Another Question
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. MY LEARNING TAB                                        */}
          {/* ========================================================= */}
          {activeTab === 'my_learning' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">My Learning</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Enrolled courses, interactive lessons, and completion milestones.
                </p>
              </div>

              {courses.length === 0 ? (
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#101412] border border-[#29312C] flex items-center justify-center text-[#32D6B0]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5F7F6]">No Enrolled Courses Found</h3>
                  <p className="text-xs text-[#A3ADA7] max-w-md">
                    You have not enrolled in any courses yet. Once assigned or enrolled, your course modules and lesson milestones will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 shadow-card flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#32D6B0] bg-[#1B211E] px-2 py-0.5 rounded">
                            {course.category}
                          </span>
                          <span className="font-bold text-[#78D98A]">
                            {course.progress}%
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#F5F7F6]">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[#A3ADA7] line-clamp-2">
                          {course.description}
                        </p>
                        <div className="w-full bg-[#101412] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#32D6B0] h-full rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="mt-4 w-full py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Open Course Lessons
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 5B. MY COURSES TAB (Dedicated Course Catalogue & Modules) */}
          {/* ========================================================= */}
          {activeTab === 'my_courses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">My Enrolled Courses</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Structured syllabus modules, practical lab exercises, and certification tracks.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A3ADA7]">Enrolled:</span>
                  <span className="px-2.5 py-1 bg-[#101F1B] border border-[#32D6B0]/30 text-[#32D6B0] rounded-lg text-xs font-bold font-mono">
                    {courses.length} Active Tracks
                  </span>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#101412] border border-[#29312C] flex items-center justify-center text-[#32D6B0]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#F5F7F6]">No Enrolled Courses Found</h3>
                  <p className="text-xs text-[#A3ADA7] max-w-md">
                    You have not enrolled in any courses yet. Once assigned or enrolled, your course tracks and progress will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4 hover:border-[#32D6B0]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-[#32D6B0] bg-[#101F1B] px-2.5 py-0.5 rounded border border-[#32D6B0]/20">
                          {course.category}
                        </span>
                        <h3 className="text-lg font-bold text-[#F5F7F6] mt-2">{course.title}</h3>
                        <p className="text-xs text-[#A3ADA7] mt-1 leading-relaxed">{course.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-mono font-bold text-[#32D6B0]">{course.progress}%</span>
                        <span className="text-[10px] text-[#A3ADA7] block">Completed</span>
                      </div>
                    </div>

                    <div className="w-full bg-[#0A0D0C] rounded-full h-2 overflow-hidden border border-[#29312C]">
                      <div
                        className="bg-gradient-to-r from-[#32D6B0] to-[#B4E85A] h-full rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                      <div className="p-2.5 bg-[#0A0D0C] rounded-xl border border-[#29312C]/60">
                        <span className="text-[10px] text-[#A3ADA7] block">Modules</span>
                        <span className="font-bold text-[#F5F7F6]">{(course as any).modules?.length || 4} Total</span>
                      </div>
                      <div className="p-2.5 bg-[#0A0D0C] rounded-xl border border-[#29312C]/60">
                        <span className="text-[10px] text-[#A3ADA7] block">Grade</span>
                        <span className="font-bold text-[#78D98A]">A (92%)</span>
                      </div>
                      <div className="p-2.5 bg-[#0A0D0C] rounded-xl border border-[#29312C]/60">
                        <span className="text-[10px] text-[#A3ADA7] block">Status</span>
                        <span className="font-bold text-[#32D6B0]">In Progress</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-[#A3ADA7] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#32D6B0]" />
                        <span>Est. 4 hours left</span>
                      </span>
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="px-4 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue Lessons</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 5C. LEARNING ROADMAP (Personalized Career Milestones)     */}
          {/* ========================================================= */}
          {activeTab === 'learning_roadmap' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">Personalized Learning Roadmap</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Structured milestone trajectory from foundational concepts to job-ready placement.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A3ADA7]">Target Goal:</span>
                  <span className="px-3 py-1 bg-[#101F1B] border border-[#32D6B0]/30 text-[#32D6B0] rounded-lg text-xs font-bold">
                    Data Analyst &amp; AI Practitioner
                  </span>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">Milestone Progress</span>
                  <h2 className="text-xl font-bold text-[#F5F7F6] mt-1">3 of 6 Milestones Completed</h2>
                  <p className="text-xs text-[#A3ADA7] mt-1 max-w-lg">
                    You have mastered core programming and relational querying. Currently executing Milestone 4 (Data Transformation &amp; Pipeline Architecture).
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-[#0A0D0C] p-4 rounded-xl border border-[#29312C] shrink-0">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#32D6B0]">68%</span>
                    <span className="text-[10px] text-[#A3ADA7] block">Readiness</span>
                  </div>
                  <div className="h-8 w-px bg-[#29312C]" />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#B4E85A]">75%</span>
                    <span className="text-[10px] text-[#A3ADA7] block">Target Bar</span>
                  </div>
                </div>
              </div>

              {/* Roadmap Timeline Steps */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 sm:p-8 space-y-8">
                {[
                  {
                    step: 1,
                    title: 'Core Foundations: Python & Algorithmic Logic',
                    desc: 'Syntax, functions, data structures, and algorithmic complexity fundamentals.',
                    status: 'completed',
                    duration: 'Weeks 1–4',
                    skills: ['Python 3', 'Data Structures', 'Git'],
                  },
                  {
                    step: 2,
                    title: 'Enterprise Relational Databases & SQL',
                    desc: 'Complex joins, indexing, window functions, and schema normalization.',
                    status: 'completed',
                    duration: 'Weeks 5–8',
                    skills: ['PostgreSQL', 'Indexing', 'Analytics SQL'],
                  },
                  {
                    step: 3,
                    title: 'Data Transformation & EDA with Pandas & NumPy',
                    desc: 'Cleaning messy real-world datasets, aggregations, and statistical summaries.',
                    status: 'completed',
                    duration: 'Weeks 9–11',
                    skills: ['Pandas', 'NumPy', 'Data Cleaning'],
                  },
                  {
                    step: 4,
                    title: 'Machine Learning Pipelines & Power BI Dashboards',
                    desc: 'Scikit-Learn modeling, model evaluation, and executive Power BI visualization.',
                    status: 'in_progress',
                    duration: 'Weeks 12–15',
                    skills: ['Scikit-Learn', 'Power BI', 'Statistics'],
                  },
                  {
                    step: 5,
                    title: 'Production Capstone & Industry Portfolio Project',
                    desc: 'End-to-end deployed analytical platform with Supabase / cloud integration.',
                    status: 'upcoming',
                    duration: 'Weeks 16–18',
                    skills: ['Cloud Deployment', 'API Integration', 'Portfolio'],
                  },
                  {
                    step: 6,
                    title: 'AI Mock Interviews & Technical Placement Readiness',
                    desc: 'Behavioral rounds, live coding evaluations, and resume diagnostic audits.',
                    status: 'upcoming',
                    duration: 'Weeks 19–20',
                    skills: ['Mock Interviews', 'Resume Audit', 'Placement'],
                  },
                ].map((node) => (
                  <div key={node.step} className="flex items-start gap-4 sm:gap-6 relative group">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border transition-all ${
                          node.status === 'completed'
                            ? 'bg-[#101F1B] border-[#32D6B0] text-[#32D6B0]'
                            : node.status === 'in_progress'
                            ? 'bg-[#32D6B0] border-[#32D6B0] text-[#0A0D0C] shadow-lg shadow-[#32D6B0]/20'
                            : 'bg-[#0A0D0C] border-[#29312C] text-[#A3ADA7]'
                        }`}
                      >
                        {node.status === 'completed' ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <span>{node.step}</span>
                        )}
                      </div>
                      {node.step < 6 && (
                        <div
                          className={`w-0.5 h-16 sm:h-14 mt-2 ${
                            node.status === 'completed' ? 'bg-[#32D6B0]' : 'bg-[#29312C]'
                          }`}
                        />
                      )}
                    </div>

                    <div
                      className={`flex-1 p-5 rounded-xl border transition-all ${
                        node.status === 'in_progress'
                          ? 'bg-[#101412] border-[#32D6B0]/40'
                          : 'bg-[#0A0D0C] border-[#29312C]/70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-[#F5F7F6]">{node.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              node.status === 'completed'
                                ? 'bg-[#101F1B] text-[#78D98A]'
                                : node.status === 'in_progress'
                                ? 'bg-[#101F1B] text-[#32D6B0] border border-[#32D6B0]/30 animate-pulse'
                                : 'bg-[#151A18] text-[#A3ADA7]'
                            }`}
                          >
                            {node.status === 'in_progress' ? 'Active Focus' : node.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#A3ADA7] font-mono">{node.duration}</span>
                      </div>
                      <p className="text-xs text-[#A3ADA7] leading-relaxed">{node.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {node.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-[#151A18] border border-[#29312C] rounded text-[11px] text-[#F5F7F6]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5D. ASSESSMENTS TAB (Tests, Quizzes & Examinations)       */}
          {/* ========================================================= */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">Diagnostic Assessments</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Standardized quizzes and proctored technical evaluations to calibrate your Readiness Score.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A3ADA7]">Average Score:</span>
                  <span className="px-3 py-1 bg-[#101F1B] border border-[#32D6B0]/30 text-[#32D6B0] rounded-lg text-xs font-bold font-mono">
                    78% Passed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    id: 'as-1',
                    title: 'Python Advanced Structures & OOP',
                    course: 'Python Programming',
                    questions: 25,
                    duration: '45 mins',
                    status: 'available',
                    difficulty: 'Intermediate',
                    passingScore: 70,
                  },
                  {
                    id: 'as-2',
                    title: 'SQL Complex Joins & Subqueries',
                    course: 'SQL Fundamentals',
                    questions: 30,
                    duration: '50 mins',
                    status: 'completed',
                    score: 84,
                    difficulty: 'Intermediate',
                    passingScore: 70,
                  },
                  {
                    id: 'as-3',
                    title: 'Machine Learning Classification Metrics',
                    course: 'Machine Learning',
                    questions: 20,
                    duration: '35 mins',
                    status: 'available',
                    difficulty: 'Advanced',
                    passingScore: 75,
                  },
                  {
                    id: 'as-4',
                    title: 'Data Wrangling with Pandas & NumPy',
                    course: 'Python Programming',
                    questions: 35,
                    duration: '60 mins',
                    status: 'completed',
                    score: 72,
                    difficulty: 'Beginner',
                    passingScore: 70,
                  },
                  {
                    id: 'as-5',
                    title: 'Generative AI & LLM Prompt Architecture',
                    course: 'Generative AI',
                    questions: 20,
                    duration: '40 mins',
                    status: 'scheduled',
                    date: 'Tomorrow at 10:00 AM',
                    difficulty: 'Intermediate',
                    passingScore: 75,
                  },
                ].map((asm) => (
                  <div
                    key={asm.id}
                    className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 shadow-card flex flex-col justify-between space-y-4 hover:border-[#32D6B0]/40 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#32D6B0] font-semibold bg-[#101F1B] px-2 py-0.5 rounded">
                          {asm.course}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            asm.status === 'completed'
                              ? 'bg-[#101F1B] text-[#78D98A]'
                              : asm.status === 'available'
                              ? 'bg-[#232014] text-[#F2D64B]'
                              : 'bg-[#1B211E] text-[#A3ADA7]'
                          }`}
                        >
                          {asm.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#F5F7F6]">{asm.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#A3ADA7]">
                        <span>{asm.questions} Questions</span>
                        <span>•</span>
                        <span>{asm.duration}</span>
                        <span>•</span>
                        <span className="text-[#F2D64B] font-semibold">{asm.difficulty}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#29312C] flex items-center justify-between">
                      {asm.status === 'completed' ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-[#A3ADA7]">Score Achieved:</span>
                          <span className="font-mono font-bold text-sm text-[#78D98A] bg-[#101F1B] px-2.5 py-0.5 rounded border border-[#78D98A]/30">
                            {asm.score}% (Passed)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-[#A3ADA7]">Pass: {asm.passingScore}%+</span>
                          <button
                            onClick={() => {
                              alert(`Assessment "${asm.title}" initiated. 45-minute timed exam window opened.`);
                            }}
                            className="px-3.5 py-1.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] font-bold text-xs rounded-xl cursor-pointer transition-colors"
                          >
                            Start Assessment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5E. MY ASSIGNMENTS TAB                                    */}
          {/* ========================================================= */}
          {activeTab === 'my_assignments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">My Course Assignments</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Submit assignments, track evaluation feedback, and verify grades given by trainers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A3ADA7]">Pending:</span>
                  <span className="px-3 py-1 bg-[#232014] border border-[#F2D64B]/40 text-[#F2D64B] rounded-lg text-xs font-bold font-mono">
                    2 Action Items
                  </span>
                </div>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A0D0C] text-[#A3ADA7] text-[11px] uppercase tracking-wider border-b border-[#29312C]">
                      <tr>
                        <th className="py-3 px-4">Assignment Name</th>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Max Points</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#29312C]/60">
                      {[
                        {
                          id: 'asg-1',
                          title: 'Pandas Data Cleaning & Aggregation Script',
                          course: 'Python Programming',
                          dueDate: 'Tomorrow, 11:59 PM',
                          points: 100,
                          status: 'pending',
                        },
                        {
                          id: 'asg-2',
                          title: 'SQL Window Functions & Lead/Lag Analysis',
                          course: 'SQL Fundamentals',
                          dueDate: 'In 3 days',
                          points: 100,
                          status: 'pending',
                        },
                        {
                          id: 'asg-3',
                          title: 'Random Forest Classification with Scikit-Learn',
                          course: 'Machine Learning',
                          dueDate: 'Oct 18, 2026',
                          points: 150,
                          status: 'submitted',
                          grade: '142 / 150 (A)',
                        },
                        {
                          id: 'asg-4',
                          title: 'Database Schema Normalization ER Diagram',
                          course: 'SQL Fundamentals',
                          dueDate: 'Oct 10, 2026',
                          points: 100,
                          status: 'submitted',
                          grade: '95 / 100 (A)',
                        },
                      ].map((asg) => (
                        <tr key={asg.id} className="hover:bg-[#101412] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#F5F7F6]">{asg.title}</td>
                          <td className="py-3.5 px-4 text-[#A3ADA7]">{asg.course}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-[#F5F7F6]">{asg.dueDate}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#32D6B0]">{asg.points} pts</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                asg.status === 'submitted'
                                  ? 'bg-[#101F1B] text-[#32D6B0]'
                                  : 'bg-[#232014] text-[#F2D64B]'
                              }`}
                            >
                              {asg.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSubmittedAssignmentModal(asg)}
                              className="px-3 py-1 bg-[#1B211E] hover:bg-[#32D6B0] text-[#32D6B0] hover:text-[#0A0D0C] rounded-lg font-semibold text-xs border border-[#29312C] transition-colors cursor-pointer"
                            >
                              {asg.status === 'submitted' ? 'View Feedback' : 'Submit Solution'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5F. MY RESULTS TAB (Grade Book & Score Trajectory)        */}
          {/* ========================================================= */}
          {activeTab === 'my_results' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">My Results &amp; Grade Book</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Official score transcripts, assignment evaluations, and diagnostic velocity trends.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A3ADA7]">Cumulative GPA:</span>
                  <span className="px-3 py-1 bg-[#101F1B] border border-[#32D6B0]/30 text-[#32D6B0] rounded-lg text-xs font-bold font-mono">
                    3.82 / 4.0 (A)
                  </span>
                </div>
              </div>

              {/* Assessment Trend Component */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">Assessment Performance Trajectory</h3>
                <p className="text-xs text-[#A3ADA7]">
                  Historical score trajectory across quizzes and module evaluations compared with target bar (75%).
                </p>
                <div className="h-64 pt-4">
                  <AssessmentTrendChart
                    data={(dashboardData?.assessmentHistory || []).map((a) => ({
                      title: a.title,
                      score: a.score,
                      date: a.date,
                      benchmark: 75,
                    }))}
                  />
                </div>
              </div>

              {/* Verified Grade Book Table */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                <div className="p-4 border-b border-[#29312C] flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#F5F7F6]">Verified Exam &amp; Quiz Results</h4>
                  <span className="text-xs text-[#A3ADA7]">Institution Accredited</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A0D0C] text-[#A3ADA7] text-[11px] uppercase tracking-wider border-b border-[#29312C]">
                      <tr>
                        <th className="py-3 px-4">Evaluation Name</th>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Date Completed</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Letter Grade</th>
                        <th className="py-3 px-4 text-right">Percentile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#29312C]/60">
                      {[
                        { title: 'Python Intermediate Quiz', course: 'Python Programming', date: 'Oct 22, 2026', score: '88%', grade: 'A', pct: 'Top 12%' },
                        { title: 'SQL Joins & Grouping Exam', course: 'SQL Fundamentals', date: 'Oct 15, 2026', score: '82%', grade: 'B+', pct: 'Top 25%' },
                        { title: 'Data Cleaning Practical Lab', course: 'Python Programming', date: 'Oct 08, 2026', score: '94%', grade: 'A+', pct: 'Top 5%' },
                        { title: 'ML Regression Baseline Test', course: 'Machine Learning', date: 'Sep 29, 2026', score: '76%', grade: 'B', pct: 'Top 35%' },
                      ].map((res, i) => (
                        <tr key={i} className="hover:bg-[#101412] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#F5F7F6]">{res.title}</td>
                          <td className="py-3 px-4 text-[#A3ADA7]">{res.course}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#A3ADA7]">{res.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#32D6B0]">{res.score}</td>
                          <td className="py-3 px-4 font-bold text-[#F5F7F6]">{res.grade}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-[#78D98A]">{res.pct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5G. MY SKILLS TAB (Verified Competency Radar/Matrix)      */}
          {/* ========================================================= */}
          {activeTab === 'my_skills' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">My Verified Skills</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Assessed competencies compared with industry target benchmark requirements.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('skill_gap_analysis')}
                  className="px-4 py-2 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-xl border border-[#29312C] transition-colors"
                >
                  View Gap Analysis →
                </button>
              </div>

              {/* Skills Comparison Chart */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">Current Skills vs Industry Benchmark</h3>
                <SkillsComparisonChart
                  skills={(dashboardData?.skills || []).map((s) => ({
                    name: s.name,
                    current: s.current,
                    target: s.target,
                  }))}
                />
              </div>

              {/* Skill Tiers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Python Programming', level: 'Mastered', score: 85, badgeColor: 'teal' },
                  { name: 'SQL Querying', level: 'Mastered', score: 82, badgeColor: 'teal' },
                  { name: 'Pandas & NumPy', level: 'Mastered', score: 80, badgeColor: 'teal' },
                  { name: 'Statistics & Probability', level: 'Developing', score: 55, badgeColor: 'yellow' },
                  { name: 'Power BI & Dashboards', level: 'Developing', score: 50, badgeColor: 'yellow' },
                  { name: 'Machine Learning Models', level: 'Developing', score: 62, badgeColor: 'yellow' },
                  { name: 'Advanced Excel', level: 'Remedial', score: 40, badgeColor: 'red' },
                  { name: 'Git & Version Control', level: 'Mastered', score: 88, badgeColor: 'teal' },
                ].map((sk, idx) => (
                  <div key={idx} className="bg-[#151A18] rounded-xl border border-[#29312C] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#F5F7F6] truncate">{sk.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          sk.badgeColor === 'teal'
                            ? 'bg-[#101F1B] text-[#32D6B0]'
                            : sk.badgeColor === 'yellow'
                            ? 'bg-[#232014] text-[#F2D64B]'
                            : 'bg-[#261414] text-[#FF7272]'
                        }`}
                      >
                        {sk.level}
                      </span>
                    </div>
                    <div className="w-full bg-[#0A0D0C] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sk.badgeColor === 'teal' ? 'bg-[#32D6B0]' : sk.badgeColor === 'yellow' ? 'bg-[#F2D64B]' : 'bg-[#FF7272]'
                        }`}
                        style={{ width: `${sk.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#A3ADA7]">
                      <span>Proficiency</span>
                      <span className="font-mono font-bold text-[#F5F7F6]">{sk.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5H. ASK A DOUBT (Academic Blocker & Ticket Submission)    */}
          {/* ========================================================= */}
          {activeTab === 'ask_doubt' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">Ask a Doubt</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Submit technical blockers to your assigned mentors and receive verified walkthroughs.
                </p>
              </div>

              {/* Inquiry Submission Form */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                <h3 className="text-base font-bold text-[#F5F7F6]">Submit Academic Inquiry</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#A3ADA7] mb-1 font-semibold">Course Subject</label>
                    <select className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]">
                      <option>Python Programming</option>
                      <option>SQL Fundamentals</option>
                      <option>Machine Learning</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A3ADA7] mb-1 font-semibold">Urgency Level</label>
                    <select className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]">
                      <option>Normal (Response within 24h)</option>
                      <option>Urgent (Blocking Assignment Due Today)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-[#A3ADA7] mb-1 font-semibold">Question Title / Topic</label>
                  <input
                    type="text"
                    placeholder="e.g. Pandas groupby aggregation returning multi-index error"
                    className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]"
                  />
                </div>

                <div className="text-xs">
                  <label className="block text-[#A3ADA7] mb-1 font-semibold">Detailed Description &amp; Code Snippet</label>
                  <textarea
                    rows={4}
                    placeholder="Explain what you tried, the error message received, and attach code snippet if relevant..."
                    className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => alert('Doubt inquiry submitted to Mentor Priya Sharma! You will receive notification upon reply.')}
                    className="px-5 py-2.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Submit Inquiry
                  </button>
                </div>
              </div>

              {/* Active Doubt Tickets */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-3">
                <h4 className="text-sm font-bold text-[#F5F7F6]">Recent Doubt Tickets</h4>
                <div className="space-y-3">
                  {[
                    {
                      topic: 'How to calculate weighted F1-score with imbalanced classes?',
                      course: 'Machine Learning',
                      status: 'answered',
                      mentor: 'Priya Sharma',
                      date: 'Yesterday',
                    },
                    {
                      topic: 'Recursion depth limit exceeded in tree traversal drill',
                      course: 'Python Programming',
                      status: 'pending',
                      mentor: 'Ravi Kumar',
                      date: 'Today, 2:15 PM',
                    },
                  ].map((ticket, i) => (
                    <div key={i} className="p-3.5 bg-[#0A0D0C] rounded-xl border border-[#29312C] flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#F5F7F6]">{ticket.topic}</p>
                        <p className="text-[11px] text-[#A3ADA7] mt-0.5">{ticket.course} • Assigned to {ticket.mentor} • {ticket.date}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                          ticket.status === 'answered'
                            ? 'bg-[#101F1B] text-[#78D98A] border border-[#78D98A]/30'
                            : 'bg-[#232014] text-[#F2D64B] border border-[#F2D64B]/30'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5I. MY NOTIFICATIONS TAB                                  */}
          {/* ========================================================= */}
          {activeTab === 'my_notifications' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#F5F7F6]">My Notifications</h1>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                    Assignment alerts, mentor feedback, and curriculum announcements.
                  </p>
                </div>
                <button
                  onClick={() => alert('All notifications marked as read.')}
                  className="px-3 py-1.5 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#29312C] transition-colors"
                >
                  Mark All Read
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Assignment Graded: SQL Normalization Lab',
                    desc: 'Trainer evaluated your submission: 95/100 points awarded with feedback.',
                    time: '2 hours ago',
                    type: 'success',
                  },
                  {
                    title: 'Upcoming Deadline Alert: Pandas Assignment',
                    desc: 'Your submission is due tomorrow at 11:59 PM. 2 test cases remaining.',
                    time: '5 hours ago',
                    type: 'warning',
                  },
                  {
                    title: '1-on-1 Mentorship Session Confirmed',
                    desc: 'Mentor Priya Sharma approved your booking for Wednesday at 4:00 PM.',
                    time: 'Yesterday',
                    type: 'info',
                  },
                  {
                    title: 'Curriculum Milestone Achieved',
                    desc: 'Congratulations! You completed Module 3: Relational Database Architecture.',
                    time: '3 days ago',
                    type: 'success',
                  },
                ].map((notif, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#151A18] border border-[#29312C] flex items-start justify-between gap-4 shadow-card"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            notif.type === 'success'
                              ? 'bg-[#32D6B0]'
                              : notif.type === 'warning'
                              ? 'bg-[#F2D64B]'
                              : 'bg-[#B4E85A]'
                          }`}
                        />
                        <h4 className="text-xs sm:text-sm font-bold text-[#F5F7F6]">{notif.title}</h4>
                      </div>
                      <p className="text-xs text-[#A3ADA7] pl-4">{notif.desc}</p>
                    </div>
                    <span className="text-[10px] text-[#A3ADA7] font-mono shrink-0">{notif.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5J. MY PROFILE TAB                                        */}
          {/* ========================================================= */}
          {activeTab === 'my_profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">Student Profile</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Verified student credentials and institution academic identity.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-[#29312C]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#32D6B0] to-[#B4E85A] text-[#0A0D0C] font-bold text-xl flex items-center justify-center">
                    {currentUser.name
                      ? currentUser.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'ST'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#F5F7F6]">{currentUser.name}</h2>
                    <p className="text-xs text-[#A3ADA7] font-mono">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#101F1B] text-[#32D6B0] border border-[#32D6B0]/30">
                      Enrolled Student
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block">Student ID</span>
                    <span className="font-mono font-bold text-[#F5F7F6] text-sm mt-0.5 block">STU-2026-884</span>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block">Institution</span>
                    <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block truncate">
                      {currentUser.organizationName || 'LearnAI Institution'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block">Career Trajectory</span>
                    <span className="font-bold text-[#32D6B0] text-sm mt-0.5 block">Data Analyst</span>
                  </div>
                  <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                    <span className="text-[#A3ADA7] block">Readiness Score</span>
                    <span className="font-mono font-bold text-[#B4E85A] text-sm mt-0.5 block">68 / 100</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-xl border border-[#29312C] transition-colors"
                  >
                    Edit Profile &amp; Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. AI TUTOR (Dedicated Page)                              */}
          {/* ========================================================= */}
          {(activeTab === 'ai_tutor' || activeTab === 'ai_assistant') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6] flex items-center gap-2">
                  <Bot className="w-6 h-6 text-[#32D6B0]" />
                  <span>Dedicated AI Tutor &amp; Learning Assistant</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Interactive Socratic tutoring calibrated to your curriculum and code questions.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#A3ADA7]">Context:</span>
                    <select
                      value={aiCourseContext}
                      onChange={(e) => setAiCourseContext(e.target.value)}
                      className="p-1.5 rounded-lg border border-[#29312C] text-xs font-semibold text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    >
                      <option key="ctx-dash-all" value="All Enrolled Courses">All Enrolled Courses</option>
                      <option key="ctx-dash-python" value="Python Programming">Python Programming</option>
                      <option key="ctx-dash-ml" value="Machine Learning">Machine Learning</option>
                      <option key="ctx-dash-sql" value="SQL Fundamentals">SQL Fundamentals</option>
                    </select>
                  </div>
                  <span className="text-[11px] text-[#32D6B0] bg-[#151A18] px-2 py-0.5 rounded font-bold">
                    Connected to Gemini API
                  </span>
                </div>

                <div className="min-h-[320px] max-h-[460px] overflow-y-auto space-y-3 p-2 text-xs">
                  {aiMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl p-3.5 leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-[#1B211E] text-white rounded-br-none'
                            : 'bg-[#0A0D0C] text-[#F5F7F6] border border-[#29312C] rounded-bl-none'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-center gap-2 text-xs text-[#32D6B0]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating detailed explanation...</span>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskAi();
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-[#29312C]"
                >
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask your tutor anything..."
                    className="flex-1 p-2.5 rounded-lg border border-[#29312C] text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="px-5 py-2.5 rounded-lg bg-[#1B211E] hover:bg-[#6D28D9] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. PRACTICE TAB                                           */}
          {/* ========================================================= */}
          {(activeTab === 'practice' || activeTab === 'practice_questions') && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">Practice Problems</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Solve coding challenges targeting your identified skill gaps.
                </p>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#151A18] rounded-xl border border-[#29312C] p-4 shadow-card flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {
                          setTasks((prev) =>
                            prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
                          );
                        }}
                        className="w-4 h-4 text-[#32D6B0] rounded focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <div>
                        <p
                          className={`text-xs sm:text-sm font-semibold ${
                            task.completed ? 'line-through text-[#94A3B8]' : 'text-[#F5F7F6]'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-[11px] text-[#A3ADA7]">
                          {task.course} • Est. {task.estimatedMinutes} mins
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.completed ? 'bg-[#1B211E] text-[#78D98A]' : 'bg-[#1B211E] text-[#32D6B0]'
                      }`}
                    >
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. MY MENTORS TAB                                         */}
          {/* ========================================================= */}
          {activeTab === 'my_mentors' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">My Mentors</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Connect with assigned institution mentors for guidance and escalation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#32D6B0] text-white flex items-center justify-center font-bold">
                      PS
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F5F7F6]">Priya Sharma</h3>
                      <p className="text-xs text-[#A3ADA7]">Senior AI & ML Industry Mentor</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#A3ADA7] leading-relaxed">
                    Specializes in Large Language Models, PyTorch pipelines, and technical portfolio reviews.
                  </p>
                  <div className="pt-2 border-t border-[#29312C] flex items-center justify-between text-xs">
                    <span className="text-[#78D98A] font-semibold">Available for Booking</span>
                    <button
                      onClick={() => alert('Session booking request dispatched to Mentor Priya Sharma.')}
                      className="px-4 py-2 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold transition-colors"
                    >
                      Book 1-on-1 Session
                    </button>
                  </div>
                </div>

                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1B211E] text-white flex items-center justify-center font-bold">
                      RK
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F5F7F6]">Ravi Kumar</h3>
                      <p className="text-xs text-[#A3ADA7]">Career Readiness & Mock Interviewer</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#A3ADA7] leading-relaxed">
                    Assists with behavioral question phrasing, resume audits, and enterprise coding rounds.
                  </p>
                  <div className="pt-2 border-t border-[#29312C] flex items-center justify-between text-xs">
                    <span className="text-[#78D98A] font-semibold">Available for Booking</span>
                    <button
                      onClick={() => alert('Session booking request dispatched to Mentor Ravi Kumar.')}
                      className="px-4 py-2 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white rounded-lg font-semibold transition-colors"
                    >
                      Book 1-on-1 Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. PROGRESS TAB                                           */}
          {/* ========================================================= */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">Learning Analytics</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Historical tracking of practice velocity, module completion, and diagnostic scores.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                  <h3 className="text-base font-bold text-[#F5F7F6]">Weekly Activity</h3>
                  <div className="h-40 flex items-end justify-between gap-2 pt-6">
                    {[
                      { day: 'Mon', h: 60 },
                      { day: 'Tue', h: 90 },
                      { day: 'Wed', h: 40 },
                      { day: 'Thu', h: 80 },
                      { day: 'Fri', h: 100 },
                      { day: 'Sat', h: 30 },
                      { day: 'Sun', h: 70 },
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                        <div
                          className="w-full bg-[#32D6B0] hover:bg-[#1D4ED8] rounded-t-md transition-all"
                          style={{ height: `${bar.h}%` }}
                        />
                        <span className="text-[10px] text-[#A3ADA7]">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-3">
                  <h3 className="text-base font-bold text-[#F5F7F6]">Milestones Achieved</h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-[#1B211E] text-[#78D98A] flex items-center justify-between">
                      <span>✓ Completed 10 Python algorithm quizzes</span>
                      <span className="font-bold">Earned</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1B211E] text-[#78D98A] flex items-center justify-between">
                      <span>✓ 7-Day Continuous Practice Streak</span>
                      <span className="font-bold">Earned</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1B211E] text-[#32D6B0] flex items-center justify-between">
                      <span>◉ First Mock Technical Interview Score 85+</span>
                      <span className="font-bold">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 10. SETTINGS TAB                                          */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F7F6]">Account Settings</h1>
                <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                  Manage your personal learning preferences and profile information.
                </p>
              </div>

              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card max-w-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1">Name</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.name}
                    className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#A3ADA7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1">Email</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#A3ADA7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1">Target Career Role</label>
                  <input
                    type="text"
                    defaultValue="Data Analyst"
                    className="w-full p-2.5 bg-[#151A18] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <button
                  onClick={() => alert('Settings saved successfully.')}
                  className="px-5 py-2.5 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors shadow-subtle"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Lesson / Course Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onToggleLesson={handleToggleLesson}
        />
      )}
    </div>
  );
};
