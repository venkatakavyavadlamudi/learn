import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService, StoredAccount } from '../services/authService';
import { User } from '../types';
import { AccountGatekeeper } from '../components/AccountGatekeeper';
import { Sidebar } from '../components/Sidebar';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardFilterBar } from '../components/dashboard/DashboardFilterBar';
import { KpiCard } from '../components/dashboard/KpiCard';
import { DonutChart } from '../components/dashboard/DonutChart';
import { SkillsComparisonChart } from '../components/dashboard/SkillsComparisonChart';
import { TopicDoubtsChart } from '../components/dashboard/TopicDoubtsChart';
import { PracticeAccuracyBarChart } from '../components/dashboard/PracticeAccuracyBarChart';
import { dashboardDataService, TrainerDashboardData } from '../services/dashboardDataService';
import {
  Layers,
  Users,
  FileCheck,
  Award,
  CheckCircle2,
  Clock,
  Search,
  BookOpen,
  TrendingUp,
  BarChart3,
  Calendar,
  Settings,
  ChevronRight,
  Eye,
  Check,
  AlertTriangle,
  HelpCircle,
  X,
  Plus,
  Send,
  Edit,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const TrainerDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDevPreview, setIsDevPreview] = useState(false);

  // Analytical data
  const [dashboardData, setDashboardData] = useState<TrainerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('30d');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');

  // Modals & Evaluation states
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const roleNormalized = String(user.role || '').toLowerCase().trim();
    if (roleNormalized === 'student') {
      navigate('/dashboard');
      return;
    }
    if (roleNormalized === 'mentor') {
      navigate('/mentor');
      return;
    }

    const isAdminUser =
      roleNormalized === 'admin' ||
      roleNormalized === 'institution_admin' ||
      roleNormalized.includes('admin');

    if (isAdminUser) {
      setIsDevPreview(true);
    }

    setCurrentUser(user);

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await dashboardDataService.getTrainerData(user.id, user.email);
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load trainer data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  if (!currentUser) return null;

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

  // Submission Status Donut Data
  const submissionStatusDonut = dashboardData
    ? [
        { label: 'Evaluated', count: dashboardData.submissionStatus.evaluated, color: '#32D6B0' },
        { label: 'Pending Review', count: dashboardData.submissionStatus.pendingReview, color: '#F2D64B' },
        { label: 'Submitted (New)', count: dashboardData.submissionStatus.submitted, color: '#78D98A' },
        { label: 'Late', count: dashboardData.submissionStatus.late, color: '#FF7272' },
      ]
    : [];

  // Skill gaps converted for SkillsComparisonChart
  const skillGapsFormatted =
    dashboardData?.largestSkillGaps.map((sg) => ({
      name: sg.skill,
      current: sg.currentAvg,
      target: sg.targetAvg,
      gap: sg.gap,
      category: 'Curriculum Deficit',
    })) || [];

  // Topic performance for PracticeAccuracyBarChart
  const topicPerformanceFormatted =
    dashboardData?.topicPerformance.map((tp) => ({
      topic: tp.topic,
      accuracy: tp.avgScore,
      questionsAnswered: 45,
      isWeak: tp.avgScore < 70,
      recommendation: tp.avgScore < 70 ? 'Schedule remedial lecture' : 'Meets cohort standard',
    })) || [];

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setEvaluatedSubmissions((prev) => [...prev, selectedSubmission.id]);
    showToast(`Graded ${selectedSubmission.studentName}'s assignment: ${gradeScore}/100 recorded.`);
    setSelectedSubmission(null);
    setGradeFeedback('');
  };

  const filteredAtRisk = (dashboardData?.atRiskStudents || []).filter(
    (st) =>
      st.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      st.email.toLowerCase().includes(searchStudent.toLowerCase()) ||
      st.course.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0D0C] text-[#F5F7F6] flex">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        activeItem={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Layout Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <DashboardHeader
          title="Trainer Academic Portal"
          subtitle="Batch curriculum delivery, submission evaluations & cohort skill gap telemetry"
          currentUser={currentUser}
          onMenuClick={() => setMobileSidebarOpen(true)}
          notificationsCount={
            (dashboardData?.pendingSubmissions.length || 0) - evaluatedSubmissions.length
          }
        />

        {/* Dev Preview Banner for Admins */}
        {isDevPreview && (
          <div className="bg-[#151A18] border-b border-[#32D6B0]/40 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded font-mono font-bold bg-[#32D6B0]/15 text-[#32D6B0] border border-[#32D6B0]/30 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Dev Preview Mode
              </span>
              <span className="text-[#F5F7F6] font-medium">
                Viewing Trainer Dashboard as <strong className="text-[#32D6B0]">{currentUser.name}</strong> ({currentUser.email})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#A3ADA7] text-[11px] hidden md:inline">
                Your role ({currentUser.role}) is unchanged in database
              </span>
              <button
                onClick={() => navigate('/admin')}
                className="px-3.5 py-1.5 bg-[#101412] hover:bg-[#1B211E] text-[#32D6B0] font-semibold rounded-lg border border-[#32D6B0]/30 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Return to Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 bg-[#151A18] border border-[#32D6B0] text-[#F5F7F6] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-[#32D6B0] shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Filter Bar with Batch Selector */}
          <DashboardFilterBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedCourse={selectedBatch}
            onCourseChange={setSelectedBatch}
            availableCourses={[
              { id: 'all', title: 'All Cohort Batches' },
              { id: 'batch_a', title: 'Batch 2026-A (Python AI)' },
              { id: 'batch_b', title: 'Batch 2026-B (Enterprise SQL)' },
              { id: 'batch_c', title: 'Batch 2026-C (GenAI & LLMs)' },
            ]}
            onResetFilters={() => {
              setDateRange('30d');
              setSelectedBatch('all');
              setSearchStudent('');
            }}
          />

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#32D6B0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#A3ADA7]">Loading academic telemetry data...</p>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: TRAINER OVERVIEW                                   */}
              {/* ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* 6 KPI CARDS PER SPECIFICATION */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
                    <KpiCard
                      title="Assigned Batches"
                  value={dashboardData?.kpis.assignedBatchesCount || 0}
                  subtitle="Active tracks"
                  icon={Layers}
                  accent="teal"
                />
                <KpiCard
                  title="Total Students"
                  value={dashboardData?.kpis.totalStudents || 0}
                  subtitle="Across all batches"
                  icon={Users}
                  accent="teal"
                  trend={{ value: 8, isPositive: true, label: 'new enrolls' }}
                />
                <KpiCard
                  title="Avg Assessment"
                  value={`${dashboardData?.kpis.avgAssessmentScore || 0}%`}
                  subtitle="Target: 75%"
                  icon={Award}
                  accent="lime"
                  trend={{ value: 3, isPositive: true, label: 'vs last test' }}
                />
                <KpiCard
                  title="Pending Submissions"
                  value={
                    (dashboardData?.kpis.pendingSubmissionsCount || 0) -
                    evaluatedSubmissions.length
                  }
                  subtitle="Requires grading"
                  icon={FileCheck}
                  accent="yellow"
                />
                <KpiCard
                  title="Needing Practice"
                  value={dashboardData?.kpis.studentsNeedingPracticeCount || 0}
                  subtitle="Score < 65%"
                  icon={AlertTriangle}
                  accent="red"
                />
                <KpiCard
                  title="Upcoming Deadlines"
                  value={dashboardData?.kpis.upcomingDeadlinesCount || 0}
                  subtitle="Within 5 days"
                  icon={Clock}
                  accent="teal"
                />
              </div>

              {/* ========================================================= */}
              {/* 5 CHARTS & ANALYTICAL VISUALIZATIONS                     */}
              {/* ========================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Assignment Submission Status */}
                <DonutChart
                  title="Assignment Submission Status"
                  subtitle="Distribution of completed, evaluated, pending, and overdue student submissions"
                  data={submissionStatusDonut}
                  centerLabel="Submissions"
                  centerValue={
                    (dashboardData?.submissionStatus.submitted || 0) +
                    (dashboardData?.submissionStatus.evaluated || 0)
                  }
                />

                {/* 2. Largest Skill Gaps */}
                <SkillsComparisonChart
                  skills={skillGapsFormatted}
                  title="Largest Skill Gaps Across Assigned Batches"
                  subtitle="Topics with the largest deficits between verified student mastery and the 80% target"
                />

                {/* 3. Most-Asked Doubt Topics */}
                <TopicDoubtsChart
                  data={dashboardData?.mostAskedDoubts || []}
                  title="Most-Asked Doubt Topics (Instructional Priorities)"
                  subtitle="High-frequency student struggle areas requiring remedial review sessions"
                />

                {/* 4. Assessment Performance by Topic */}
                <PracticeAccuracyBarChart
                  topics={topicPerformanceFormatted}
                  title="Assessment Performance by Topic"
                  subtitle="Average quiz and coding lab performance across curriculum modules"
                />
              </div>

              {/* 5. Course & Batch Progress Overview Cards */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 sm:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                  <div>
                    <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">
                      Course & Batch Progress Overview
                    </h3>
                    <p className="text-xs text-[#A3ADA7] mt-0.5">
                      Real-time syllabus completion velocity across active instructional cohorts
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0A0D0C] text-[#32D6B0] border border-[#29312C]">
                    {dashboardData?.courseProgressOverview.length || 0} Active Cohorts
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(dashboardData?.courseProgressOverview || []).map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-mono text-[#32D6B0]">
                            {course.batchName}
                          </span>
                          <span className="text-xs text-[#A3ADA7]">
                            {course.enrolledCount} Students
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#F5F7F6] mt-1 line-clamp-1">
                          {course.title}
                        </h4>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A3ADA7]">Syllabus Progress</span>
                          <span className="font-mono font-bold text-[#32D6B0]">
                            {course.avgProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#1B211E] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#32D6B0] to-[#78D98A] h-full rounded-full"
                            style={{ width: `${course.avgProgress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#A3ADA7] pt-1">
                          <span>Completion Rate</span>
                          <span className="text-[#78D98A] font-semibold">{course.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TABLES & WIDGETS FOR DASHBOARD, AT-RISK, AND EVALUATION  */}
              {/* ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 1. At-Risk Students Table */}
                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-5 border-b border-[#29312C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#FF7272]" />
                            <span>At-Risk Students Requiring Intervention</span>
                          </h3>
                          <p className="text-xs text-[#A3ADA7] mt-0.5">
                            Prioritized by weak skill deficit and attendance drop
                          </p>
                        </div>
                        <div className="relative w-full sm:w-44">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                          <input
                            type="text"
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                            placeholder="Search..."
                            className="w-full pl-7 pr-2.5 py-1 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                            <tr>
                              <th className="px-4 py-3">Student</th>
                              <th className="px-4 py-3">Score</th>
                              <th className="px-4 py-3">Weak Topic</th>
                              <th className="px-4 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#29312C]">
                            {filteredAtRisk.map((st) => (
                              <tr key={st.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                                <td className="px-4 py-3.5">
                                  <p className="font-semibold text-[#F5F7F6]">{st.name}</p>
                                  <p className="text-[11px] text-[#A3ADA7] font-mono">{st.email}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="font-bold text-[#FF7272]">{st.score}%</span>
                                  <span className="text-[10px] text-[#A3ADA7] block">Att: {st.attendance}%</span>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-[#F2D64B] font-medium">
                                  {st.weakSkill}
                                </td>
                                <td className="px-4 py-3.5 text-[11px] text-[#A3ADA7]">
                                  {st.recommendedAction}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pending Submissions & Evaluation Table */}
                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-5 border-b border-[#29312C] flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6] flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-[#32D6B0]" />
                            <span>Pending Submissions Awaiting Evaluation</span>
                          </h3>
                          <p className="text-xs text-[#A3ADA7] mt-0.5">
                            Grade student lab code, write review notes &amp; award points
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#F2D64B]">
                          {(dashboardData?.pendingSubmissions.length || 0) - evaluatedSubmissions.length} Left
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                            <tr>
                              <th className="px-4 py-3">Student &amp; Task</th>
                              <th className="px-4 py-3">Course</th>
                              <th className="px-4 py-3">Submitted</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#29312C]">
                            {(dashboardData?.pendingSubmissions || []).map((sub) => {
                              const isGraded = evaluatedSubmissions.includes(sub.id);
                              return (
                                <tr key={sub.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                                  <td className="px-4 py-3.5">
                                    <p className="font-semibold text-[#F5F7F6]">{sub.studentName}</p>
                                    <p className="text-[11px] text-[#A3ADA7] line-clamp-1">{sub.assignmentTitle}</p>
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-[#A3ADA7]">
                                    {sub.course}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-[#A3ADA7]">
                                    {sub.submittedAt}
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    {isGraded ? (
                                      <span className="text-[#78D98A] text-xs font-semibold flex items-center justify-end gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Graded
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setSelectedSubmission(sub);
                                          setGradeScore(88);
                                        }}
                                        className="px-3 py-1.5 bg-[#32D6B0] hover:opacity-90 text-[#0A0D0C] text-xs font-bold rounded-lg transition-opacity cursor-pointer"
                                      >
                                        Grade
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: MY COURSES                                           */}
              {/* ========================================================= */}
              {activeTab === 'my_courses' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Courses Under My Instruction</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Active curricula, enrolled students, lab completion rates, and syllabus status.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {(dashboardData?.courseProgressOverview || []).map((c) => (
                      <div key={c.id} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#101F1B] text-[#32D6B0]">
                            {c.enrolledCount} Enrolled
                          </span>
                          <span className="text-xs font-mono font-bold text-[#78D98A]">{c.completionRate}% Done</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#F5F7F6]">{c.title}</h3>
                        <p className="text-xs text-[#A3ADA7]">Batch: {c.batchName} • Passing Average: 82%</p>
                        <div className="w-full bg-[#0A0D0C] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#32D6B0] h-full rounded-full" style={{ width: `${c.completionRate}%` }} />
                        </div>
                        <button
                          onClick={() => setActiveTab('course_content')}
                          className="w-full py-2 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-xl border border-[#29312C] transition-colors cursor-pointer"
                        >
                          Manage Syllabus Content →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: MY BATCHES                                           */}
              {/* ========================================================= */}
              {activeTab === 'my_batches' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Assigned Cohort Batches</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Schedule and track performance across weekday, weekend, and evening cohorts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { name: 'Batch 2026-A (Morning)', course: 'Python Programming', students: 48, schedule: 'Mon-Wed-Fri, 9:00 AM - 11:30 AM', avgScore: 84 },
                      { name: 'Batch 2026-B (Evening)', course: 'SQL Fundamentals', students: 42, schedule: 'Tue-Thu, 6:00 PM - 8:30 PM', avgScore: 79 },
                      { name: 'Batch 2026-AI (Weekend)', course: 'Machine Learning & LLMs', students: 35, schedule: 'Sat-Sun, 10:00 AM - 1:00 PM', avgScore: 86 },
                    ].map((b, idx) => (
                      <div key={idx} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <h3 className="text-base font-bold text-[#F5F7F6]">{b.name}</h3>
                          <span className="font-mono font-bold text-[#32D6B0]">{b.students} Students</span>
                        </div>
                        <p className="text-xs text-[#32D6B0] font-semibold">{b.course}</p>
                        <p className="text-xs text-[#A3ADA7]">{b.schedule}</p>
                        <div className="pt-2 border-t border-[#29312C] flex items-center justify-between text-xs">
                          <span className="text-[#A3ADA7]">Batch Avg Exam Mark:</span>
                          <span className="font-bold text-[#78D98A] font-mono">{b.avgScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: MY STUDENTS                                          */}
              {/* ========================================================= */}
              {activeTab === 'my_students' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Students Under My Training</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Comprehensive attendance, lab test performance, and individual learning progress.
                    </p>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">Student</th>
                          <th className="px-6 py-3.5">Course &amp; Batch</th>
                          <th className="px-6 py-3.5">Assessment Avg</th>
                          <th className="px-6 py-3.5">Attendance</th>
                          <th className="px-6 py-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#29312C]">
                        {filteredAtRisk.concat([
                          { id: 'st-good-1', name: 'Rohan Deshmukh', email: 'rohan.d@example.com', course: 'Python Programming (Batch A)', score: 92, attendance: 98, weakSkill: 'None', recommendedAction: 'Advanced project' },
                          { id: 'st-good-2', name: 'Ananya Rao', email: 'ananya.r@example.com', course: 'SQL Fundamentals (Batch B)', score: 88, attendance: 94, weakSkill: 'None', recommendedAction: 'Lead lab mentor' },
                        ]).map((s) => (
                          <tr key={s.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#F5F7F6]">{s.name}</p>
                              <p className="text-[11px] text-[#A3ADA7] font-mono">{s.email}</p>
                            </td>
                            <td className="px-6 py-4 text-[#A3ADA7]">Python Programming (Batch A)</td>
                            <td className="px-6 py-4 font-mono font-bold text-[#32D6B0]">{s.score}%</td>
                            <td className="px-6 py-4 font-mono text-[#F5F7F6]">{s.attendance}%</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  s.score >= 80 ? 'bg-[#101F1B] text-[#78D98A]' : 'bg-[#261414] text-[#FF7272]'
                                }`}
                              >
                                {s.score >= 80 ? 'On Track' : 'Needs Practice'}
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
              {/* TAB: STUDENT PROGRESS                                     */}
              {/* ========================================================= */}
              {activeTab === 'student_progress' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Student Learning Progress &amp; Cohort Velocity</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Curriculum progression across assigned courses, average milestone completion, and weekly study consistency.
                    </p>
                  </div>

                  {/* Course velocity summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(dashboardData?.courseProgressOverview || []).map((crs) => (
                      <div key={crs.id} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#F5F7F6] truncate max-w-[180px]">{crs.title}</span>
                          <span className="font-mono font-bold text-[#32D6B0]">{crs.avgProgress}% Avg</span>
                        </div>
                        <div className="w-full bg-[#0A0D0C] rounded-full h-2 overflow-hidden border border-[#29312C]">
                          <div
                            className="bg-gradient-to-r from-[#32D6B0] to-[#B4E85A] h-full rounded-full transition-all duration-500"
                            style={{ width: `${crs.avgProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#A3ADA7]">
                          <span>{crs.enrolledCount} active students</span>
                          <span>{crs.completionRate}% completion rate</span>
                        </div>
                      </div>
                    ))}
                    {(!dashboardData?.courseProgressOverview || dashboardData.courseProgressOverview.length === 0) && (
                      <div className="col-span-3 p-8 rounded-2xl bg-[#151A18] border border-[#29312C] text-center">
                        <p className="text-sm font-semibold text-[#F5F7F6]">No Active Course Progress Records</p>
                        <p className="text-xs text-[#A3ADA7] mt-1">
                          Assigned curriculum tracks will automatically display student velocity metrics here.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cohort Progress Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 space-y-4 shadow-card">
                      <h3 className="text-base font-bold text-[#F5F7F6]">Topic Performance Across Cohort</h3>
                      <p className="text-xs text-[#A3ADA7]">Assessment scores across core modules compared to the 75% benchmark.</p>
                      <PracticeAccuracyBarChart
                        topics={topicPerformanceFormatted}
                        title="Cohort Topic Accuracy"
                        subtitle="Verified quiz and lab accuracy by subject matter"
                      />
                    </div>
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 space-y-4 shadow-card">
                      <h3 className="text-base font-bold text-[#F5F7F6]">Instructional Focus Areas</h3>
                      <p className="text-xs text-[#A3ADA7]">Topics generating the most student questions and requiring targeted instruction.</p>
                      <TopicDoubtsChart
                        data={dashboardData?.mostAskedDoubts || []}
                        title="Frequent Struggle Points"
                        subtitle="Questions asked during practice sessions and labs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: COURSE CONTENT                                       */}
              {/* ========================================================= */}
              {activeTab === 'course_content' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[#F5F7F6]">Course Curriculum &amp; Content Management</h1>
                      <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                        Upload lecture materials, interactive Jupyter notebooks, and lab instructions.
                      </p>
                    </div>
                    <button
                      onClick={() => showToast('New curriculum module created.')}
                      className="px-4 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Curriculum Module</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { module: 'Module 1: Advanced Python Data Structures & Algorithmic Complexity', lessons: 8, labs: 4, status: 'Published' },
                      { module: 'Module 2: Relational Databases, Normalization & Query Tuning', lessons: 10, labs: 6, status: 'Published' },
                      { module: 'Module 3: Feature Engineering with Scikit-Learn Pipelines', lessons: 6, labs: 3, status: 'Drafting' },
                    ].map((m, idx) => (
                      <div key={idx} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#F5F7F6] text-sm">{m.module}</h3>
                          <p className="text-xs text-[#A3ADA7] mt-0.5">{m.lessons} Lessons • {m.labs} Coding Labs</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-[#32D6B0] bg-[#101F1B] px-2.5 py-1 rounded">
                            {m.status}
                          </span>
                          <button
                            onClick={() => showToast('Opening module editor...')}
                            className="px-3 py-1.5 bg-[#1B211E] hover:bg-[#29312C] text-[#F5F7F6] text-xs font-semibold rounded-lg border border-[#29312C]"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: ASSIGNMENTS & EVALUATION                             */}
              {/* ========================================================= */}
              {(activeTab === 'assignments' || activeTab === 'assignment_evaluation') && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[#F5F7F6]">Assignment Evaluation Desk</h1>
                      <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                        Evaluate student submissions, review code quality, and publish grades with rubrics.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">Student &amp; Task</th>
                          <th className="px-6 py-3.5">Course</th>
                          <th className="px-6 py-3.5">Submitted</th>
                          <th className="px-6 py-3.5">Total Points</th>
                          <th className="px-6 py-3.5 text-right">Evaluation Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#29312C]">
                        {(dashboardData?.pendingSubmissions || []).map((sub) => {
                          const isGraded = evaluatedSubmissions.includes(sub.id);
                          return (
                            <tr key={sub.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-[#F5F7F6]">{sub.studentName}</p>
                                <p className="text-[11px] text-[#A3ADA7] line-clamp-1">{sub.assignmentTitle}</p>
                              </td>
                              <td className="px-6 py-4 text-xs text-[#A3ADA7]">{sub.course}</td>
                              <td className="px-6 py-4 text-xs font-mono text-[#A3ADA7]">{sub.submittedAt}</td>
                              <td className="px-6 py-4 text-xs font-mono font-bold text-[#32D6B0]">{sub.totalPoints} pts</td>
                              <td className="px-6 py-4 text-right">
                                {isGraded ? (
                                  <span className="text-[#78D98A] text-xs font-semibold flex items-center justify-end gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Graded &amp; Published
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedSubmission(sub);
                                      setGradeScore(88);
                                    }}
                                    className="px-3.5 py-1.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Evaluate &amp; Grade
                                  </button>
                                )}
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
              {/* TAB: ASSESSMENTS & RESULTS                                */}
              {/* ========================================================= */}
              {(activeTab === 'assessments' || activeTab === 'assessment_results') && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Assessments &amp; Examination Analytics</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Batch performance distributions, pass rates, and question item analysis.
                    </p>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                    <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">Assessment Performance by Topic</h3>
                    <div className="pt-2">
                      <PracticeAccuracyBarChart
                        topics={topicPerformanceFormatted}
                        title="Assessment Performance by Topic"
                        subtitle="Average quiz and coding lab performance across curriculum modules"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: SKILL GAPS & LEARNING ANALYTICS                      */}
              {/* ========================================================= */}
              {(activeTab === 'student_skill_gaps' || activeTab === 'learning_analytics') && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Cohort Skill Gaps &amp; Learning Analytics</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Deficit analysis between verified cohort competency levels and the 80% job-readiness bar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                      <SkillsComparisonChart
                        skills={skillGapsFormatted}
                        title="Largest Skill Gaps Across Assigned Batches"
                        subtitle="Topics with the largest deficits between verified student mastery and the 80% target"
                      />
                    </div>
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                      <TopicDoubtsChart
                        data={dashboardData?.mostAskedDoubts || []}
                        title="Most-Asked Doubt Topics (Instructional Priorities)"
                        subtitle="High-frequency student struggle areas requiring remedial review sessions"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: AT-RISK STUDENTS STANDALONE                          */}
              {/* ========================================================= */}
              {activeTab === 'at_risk_students' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">At-Risk Students Requiring Intervention</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Students prioritized by score deficits, low submission rates, and attendance drops.
                    </p>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] text-[11px] uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">Student</th>
                          <th className="px-6 py-3.5">Score</th>
                          <th className="px-6 py-3.5">Weak Topic</th>
                          <th className="px-6 py-3.5">Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#29312C]">
                        {filteredAtRisk.map((st) => (
                          <tr key={st.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#F5F7F6]">{st.name}</p>
                              <p className="text-[11px] text-[#A3ADA7] font-mono">{st.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-[#FF7272]">{st.score}%</span>
                              <span className="text-[10px] text-[#A3ADA7] block">Att: {st.attendance}%</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-[#F2D64B] font-medium">{st.weakSkill}</td>
                            <td className="px-6 py-4 text-xs text-[#A3ADA7]">{st.recommendedAction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: DOUBT REQUESTS                                       */}
              {/* ========================================================= */}
              {activeTab === 'doubt_requests' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Course Doubt Inquiries &amp; Lab Questions</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Technical blockers raised during lecture sessions and laboratory drills.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(dashboardData?.mostAskedDoubts || []).map((d, i) => (
                      <div key={i} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <h3 className="font-bold text-[#F5F7F6]">{d.topic}</h3>
                          <span className="font-mono font-bold text-[#32D6B0]">{d.count} Inquiries</span>
                        </div>
                        <p className="text-xs text-[#A3ADA7]">
                          Frequently reported during Module 2 labs. Consider dedicating a 20-minute live demonstration.
                        </p>
                        <div className="pt-2 border-t border-[#29312C] flex justify-end">
                          <button
                            onClick={() => showToast(`Added live demo slot for ${d.topic}.`)}
                            className="px-3 py-1 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#29312C]"
                          >
                            Add to Next Lecture
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB: NOTIFICATIONS & PROFILE & SETTINGS                   */}
              {/* ========================================================= */}
              {(activeTab === 'notifications' || activeTab === 'my_profile' || activeTab === 'settings') && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Trainer Profile &amp; Preferences</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Instructional credentials, course allocations, and evaluation thresholds.
                    </p>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Faculty Trainer</span>
                        <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block">{currentUser.name}</span>
                      </div>
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Email</span>
                        <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block truncate">{currentUser.email}</span>
                      </div>
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Courses Led</span>
                        <span className="font-bold text-[#32D6B0] text-sm mt-0.5 block">Python &amp; ML</span>
                      </div>
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Active Cohorts</span>
                        <span className="font-mono font-bold text-[#B4E85A] text-sm mt-0.5 block">3 Batches</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => showToast('Trainer settings saved.')}
                        className="px-5 py-2.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* GRADE SUBMISSION MODAL                                    */}
      {/* ========================================================= */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D0C]/80 backdrop-blur-xs">
          <div className="bg-[#151A18] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">
                  Evaluate Assignment Submission
                </h3>
                <p className="text-xs text-[#A3ADA7]">Student: {selectedSubmission.studentName}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C] space-y-1">
                <span className="text-[#A3ADA7] text-[11px] block">Assignment Title:</span>
                <p className="font-semibold text-[#F5F7F6]">{selectedSubmission.assignmentTitle}</p>
                <span className="text-[#32D6B0] text-[11px]">{selectedSubmission.course}</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[#F5F7F6] font-semibold">Awarded Score (out of {selectedSubmission.totalPoints})</label>
                  <span className="font-mono font-bold text-[#32D6B0] text-sm">{gradeScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full accent-[#32D6B0] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[#F5F7F6] font-semibold block mb-1">Trainer Feedback & Code Quality Notes:</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="e.g. Excellent algorithmic structure; consider vectorizing the inner loop for O(N) complexity..."
                  className="w-full p-3 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#29312C]">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-3 py-2 text-xs font-semibold text-[#A3ADA7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#32D6B0] text-[#0A0D0C] text-xs font-bold rounded-xl hover:opacity-90"
                >
                  Submit & Post Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
