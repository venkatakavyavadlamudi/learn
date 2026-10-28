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
import { MockInterviewTrendChart } from '../components/dashboard/MockInterviewTrendChart';
import { ProgressTrendChart } from '../components/dashboard/ProgressTrendChart';
import { dashboardDataService, MentorDashboardData } from '../services/dashboardDataService';
import {
  Users,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Search,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Target,
  Layers,
  Settings,
  X,
  Plus,
  Send,
  HelpCircle,
  Award,
  Sparkles,
} from 'lucide-react';

export const MentorDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Analytical data state
  const [dashboardData, setDashboardData] = useState<MentorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'at_risk' | 'needs_attention' | 'job_ready'>('all');

  // Modals & Interactive States
  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [mentoringNotes, setMentoringNotes] = useState('');
  const [resolvedDoubts, setResolvedDoubts] = useState<string[]>([]);
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
    setCurrentUser(user);

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await dashboardDataService.getMentorData(user.id, user.email);
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load mentor dashboard data', err);
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

  // Filter mentees
  const filteredMentees = (dashboardData?.mentees || []).filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.course.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'all' || m.course.toLowerCase().includes(selectedCourse.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'at_risk' && m.riskStatus === 'At Risk') ||
      (statusFilter === 'needs_attention' && m.riskStatus === 'Needs Attention') ||
      (statusFilter === 'job_ready' && m.riskStatus === 'Good');

    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Students needing attention (urgent list)
  const priorityStudents = (dashboardData?.mentees || []).filter(
    (m) => m.riskStatus === 'At Risk' || m.riskStatus === 'Needs Attention'
  );

  // Readiness donut segments
  const readinessDonutData = dashboardData
    ? [
        {
          label: 'Job Ready (≥80%)',
          count: dashboardData.readinessDistribution.jobReady,
          color: '#32D6B0',
        },
        {
          label: 'On Track (60–79%)',
          count: dashboardData.readinessDistribution.onTrack,
          color: '#B4E85A',
        },
        {
          label: 'Needs Support (<60%)',
          count: dashboardData.readinessDistribution.needsSupport,
          color: '#FF7272',
        },
      ]
    : [];

  // Escalations donut segments
  const escalationsDonutData = dashboardData?.escalationsByReason.map((e) => ({
    label: e.reason,
    count: e.count,
    color: e.color,
  })) || [];

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTopic || !sessionDate) {
      showToast('Please provide both topic and scheduled time');
      return;
    }
    showToast(`1-on-1 Mentorship session successfully booked with ${selectedMentee?.name || 'student'}`);
    setIsScheduleModalOpen(false);
    setSessionTopic('');
    setSessionDate('');
  };

  const handleResolveDoubt = (id: string, studentName: string) => {
    setResolvedDoubts((prev) => [...prev, id]);
    showToast(`Doubt query from ${studentName} marked as resolved!`);
  };

  const handleSaveNotes = () => {
    if (!mentoringNotes.trim()) return;
    showToast(`Mentoring notes saved to ${selectedMentee?.name}'s permanent dossier.`);
    setMentoringNotes('');
    setSelectedMentee(null);
  };

  const getStatusBadge = (status: 'Good' | 'Needs Attention' | 'At Risk') => {
    switch (status) {
      case 'Good':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#101412] text-[#78D98A] border border-[#78D98A]/30">
            Job Ready
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#101412] text-[#F2D64B] border border-[#F2D64B]/30">
            Needs Attention
          </span>
        );
      case 'At Risk':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#101412] text-[#FF7272] border border-[#FF7272]/30">
            At Risk
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D0C] text-[#F5F7F6] flex">
      {/* Mentor Sidebar (250px fixed left) */}
      <Sidebar
        currentUser={currentUser}
        activeItem={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <DashboardHeader
          title="Mentor Analytical Portal"
          subtitle="Cohort readiness tracking, 1-on-1 interventions & skill diagnostics"
          currentUser={currentUser}
          onMenuClick={() => setMobileSidebarOpen(true)}
          notificationsCount={dashboardData?.pendingDoubts.filter((d) => !resolvedDoubts.includes(d.id)).length || 0}
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 bg-[#151A18] border border-[#32D6B0] text-[#F5F7F6] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-[#32D6B0] shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Filter Bar */}
          <DashboardFilterBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedCourse={selectedCourse}
            onCourseChange={setSelectedCourse}
            availableCourses={[
              { id: 'python', title: 'Python Programming' },
              { id: 'ml', title: 'Machine Learning' },
              { id: 'genai', title: 'Generative AI & LLMs' },
              { id: 'sql', title: 'Enterprise SQL' },
            ]}
            onResetFilters={() => {
              setDateRange('30d');
              setSelectedCourse('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
          />

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#32D6B0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[#A3ADA7]">Loading mentee analytical metrics from database...</p>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* 1. OVERVIEW DASHBOARD                                     */}
              {/* ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* 5 KPI CARDS PER SPECIFICATION */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                <KpiCard
                  title="Assigned Students"
                  value={dashboardData?.kpis.totalAssignedStudents || 0}
                  subtitle="Active cohort"
                  icon={Users}
                  accent="teal"
                  trend={{ value: 4, isPositive: true, label: 'this month' }}
                />
                <KpiCard
                  title="Needing Attention"
                  value={dashboardData?.kpis.studentsNeedingAttention || 0}
                  subtitle="Readiness < 65%"
                  icon={AlertTriangle}
                  accent="red"
                  trend={{ value: 2, isPositive: false, label: 'new alerts' }}
                />
                <KpiCard
                  title="Avg Student Readiness"
                  value={`${dashboardData?.kpis.avgStudentReadiness || 0}%`}
                  subtitle="Target: 75%"
                  icon={Award}
                  accent="lime"
                  trend={{ value: 5, isPositive: true, label: 'vs last week' }}
                />
                <KpiCard
                  title="Pending Requests"
                  value={
                    (dashboardData?.kpis.pendingRequests || 0) -
                    resolvedDoubts.length
                  }
                  subtitle="Doubts & blockers"
                  icon={MessageSquare}
                  accent="yellow"
                />
                <KpiCard
                  title="Upcoming Sessions"
                  value={dashboardData?.kpis.upcomingSessions || 0}
                  subtitle="1-on-1 reviews"
                  icon={Calendar}
                  accent="teal"
                />
              </div>

              {/* ========================================================= */}
              {/* 4 CHARTS & ANALYTICAL VISUALIZATIONS                     */}
              {/* ========================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Student Readiness Distribution */}
                <DonutChart
                  title="Student Readiness Distribution"
                  subtitle="Breakdown by job-readiness tiers across assigned mentees"
                  data={readinessDonutData}
                  centerLabel="Mentees"
                  centerValue={dashboardData?.kpis.totalAssignedStudents}
                />

                {/* 2. Mock Interview Scores by Attempt */}
                <MockInterviewTrendChart
                  data={dashboardData?.mockInterviewTrends || []}
                  title="Mock Interview Scores by Attempt"
                  subtitle="Score progression across interview rounds compared to target benchmark"
                />

                {/* 3. Open Escalations or Requests by Reason */}
                <DonutChart
                  title="Open Inquiries & Escalations by Reason"
                  subtitle="Categorized by student blocker type for targeted intervention"
                  data={escalationsDonutData}
                  centerLabel="Requests"
                  centerValue={dashboardData?.escalationsByReason.reduce((acc, c) => acc + c.count, 0)}
                />

                {/* 4. Student Progress Trends */}
                <ProgressTrendChart
                  data={dashboardData?.progressTrends || []}
                  title="Student Progress Trends (Cohort vs At-Risk)"
                  subtitle="Weekly curriculum completion trajectory tracking"
                />
              </div>

              {/* ========================================================= */}
              {/* PRIORITY ATTENTION ALERT BANNER                          */}
              {/* ========================================================= */}
              {priorityStudents.length > 0 && (
                <div className="bg-[#151A18] border border-[#FF7272]/30 rounded-2xl p-5 shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#FF7272]/10 border border-[#FF7272]/30 flex items-center justify-center text-[#FF7272]">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">
                          Priority Attention Required ({priorityStudents.length} Students)
                        </h3>
                        <p className="text-xs text-[#A3ADA7]">
                          These learners have readiness or progress deficits that require immediate mentoring intervention.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStatusFilter(statusFilter === 'at_risk' ? 'all' : 'at_risk')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#101412] text-[#FF7272] border border-[#FF7272]/40 hover:bg-[#FF7272]/10 transition-colors"
                    >
                      {statusFilter === 'at_risk' ? 'Show All' : 'Filter At-Risk Only'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {priorityStudents.slice(0, 3).map((st) => (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#F5F7F6]">{st.name}</span>
                            {getStatusBadge(st.riskStatus)}
                          </div>
                          <p className="text-[11px] text-[#A3ADA7] mt-0.5">{st.course}</p>
                          <p className="text-xs text-[#FF7272] mt-2 font-medium line-clamp-2">
                            {st.attentionReason || 'Lagging behind expected benchmark score.'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#29312C] text-[11px]">
                          <span className="text-[#A3ADA7]">Readiness: <strong className="text-[#F5F7F6]">{st.readinessScore}%</strong></span>
                          <button
                            onClick={() => setSelectedMentee(st)}
                            className="text-[#32D6B0] hover:underline font-semibold"
                          >
                            Open Dossier →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: MENTEE DIRECTORY TABLE WITH QUICK FILTERS          */}
              {/* ========================================================= */}
              {(activeTab === 'dashboard' || activeTab === 'my_mentees') && (
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-[#29312C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">
                      Assigned Mentee Cohort
                    </h2>
                    <p className="text-xs text-[#A3ADA7] mt-0.5">
                      Showing {filteredMentees.length} of {dashboardData?.mentees.length || 0} assigned students
                    </p>
                  </div>

                  {/* Filter chips & Search */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg bg-[#0A0D0C] p-1 border border-[#29312C] text-xs">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          statusFilter === 'all'
                            ? 'bg-[#151A18] text-[#32D6B0] shadow-xs'
                            : 'text-[#A3ADA7] hover:text-[#F5F7F6]'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter('at_risk')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          statusFilter === 'at_risk'
                            ? 'bg-[#151A18] text-[#FF7272] shadow-xs'
                            : 'text-[#A3ADA7] hover:text-[#F5F7F6]'
                        }`}
                      >
                        At Risk
                      </button>
                      <button
                        onClick={() => setStatusFilter('needs_attention')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          statusFilter === 'needs_attention'
                            ? 'bg-[#151A18] text-[#F2D64B] shadow-xs'
                            : 'text-[#A3ADA7] hover:text-[#F5F7F6]'
                        }`}
                      >
                        Needs Attention
                      </button>
                      <button
                        onClick={() => setStatusFilter('job_ready')}
                        className={`px-3 py-1 rounded-md transition-all font-medium ${
                          statusFilter === 'job_ready'
                            ? 'bg-[#151A18] text-[#78D98A] shadow-xs'
                            : 'text-[#A3ADA7] hover:text-[#F5F7F6]'
                        }`}
                      >
                        Job Ready
                      </button>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student or course..."
                        className="w-full pl-8 pr-3 py-1.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0]"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] uppercase tracking-wider text-[11px] font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Student</th>
                        <th className="px-6 py-3.5">Course / Pathway</th>
                        <th className="px-6 py-3.5">Progress</th>
                        <th className="px-6 py-3.5">Readiness</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#29312C]">
                      {filteredMentees.map((mentee) => (
                        <tr key={mentee.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#F5F7F6]">{mentee.name}</p>
                            <p className="text-[11px] text-[#A3ADA7] font-mono">{mentee.email}</p>
                          </td>
                          <td className="px-6 py-4 font-medium text-[#A3ADA7]">
                            {mentee.course}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs">{mentee.progress}%</span>
                              <div className="w-20 bg-[#101412] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    mentee.progress < 40
                                      ? 'bg-[#FF7272]'
                                      : mentee.progress < 70
                                      ? 'bg-[#F2D64B]'
                                      : 'bg-[#32D6B0]'
                                  }`}
                                  style={{ width: `${mentee.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[#F5F7F6]">
                                {mentee.readinessScore}
                              </span>
                              <span className="text-[10px] text-[#A3ADA7]">/100</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(mentee.riskStatus)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedMentee(mentee)}
                                className="px-2.5 py-1.5 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#29312C] transition-colors"
                              >
                                Review Dossier
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMentee(mentee);
                                  setIsScheduleModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-[#32D6B0] hover:opacity-90 text-[#0A0D0C] text-xs font-bold rounded-lg transition-opacity flex items-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>1-on-1</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredMentees.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#A3ADA7] text-xs">
                            No mentees found matching your current filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: PENDING DOUBTS & REQUESTS WIDGET                   */}
              {/* ========================================================= */}
              {(activeTab === 'dashboard' || activeTab === 'doubt_requests') && (
                <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 sm:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
                  <div>
                    <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">
                      Student Inquiries & Technical Doubt Tickets
                    </h3>
                    <p className="text-xs text-[#A3ADA7] mt-0.5">
                      Direct academic blockers submitted by your assigned mentees
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#101412] text-[#32D6B0] border border-[#29312C]">
                    {(dashboardData?.pendingDoubts || []).filter((d) => !resolvedDoubts.includes(d.id)).length} Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dashboardData?.pendingDoubts || []).map((doubt) => {
                    const isResolved = resolvedDoubts.includes(doubt.id);
                    return (
                      <div
                        key={doubt.id}
                        className={`p-4 rounded-xl bg-[#0A0D0C] border transition-all ${
                          isResolved ? 'border-[#78D98A]/30 opacity-60' : 'border-[#29312C]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F5F7F6]">{doubt.studentName}</span>
                            <span className="text-[10px] text-[#A3ADA7]">· {doubt.course}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              doubt.status === 'urgent'
                                ? 'bg-[#FF7272]/10 text-[#FF7272] border border-[#FF7272]/30'
                                : 'bg-[#1B211E] text-[#A3ADA7]'
                            }`}
                          >
                            {isResolved ? 'Resolved' : doubt.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#32D6B0] mt-2">
                          {doubt.topic}
                        </h4>
                        <p className="text-xs text-[#A3ADA7] mt-1 leading-relaxed">
                          "{doubt.question}"
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#29312C] text-[11px]">
                          <span className="text-[#A3ADA7]">{doubt.requestedAt}</span>
                          {!isResolved ? (
                            <button
                              onClick={() => handleResolveDoubt(doubt.id, doubt.studentName)}
                              className="px-2.5 py-1 rounded bg-[#1B211E] hover:bg-[#32D6B0] text-[#32D6B0] hover:text-[#0A0D0C] font-semibold text-xs border border-[#29312C] transition-colors"
                            >
                              Mark Resolved
                            </button>
                          ) : (
                            <span className="text-[#78D98A] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: STUDENT PROGRESS ANALYTICS                         */}
              {/* ========================================================= */}
              {activeTab === 'student_progress' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Student Learning Progress</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Historical tracking of mentee velocity, curriculum completion rates, and mock diagnostic scores.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                      <h3 className="text-base font-bold text-[#F5F7F6]">Average Mentee Learning Progress</h3>
                      <div className="h-64 pt-2">
                        <ProgressTrendChart data={dashboardData?.progressTrends || []} />
                      </div>
                    </div>
                    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                      <h3 className="text-base font-bold text-[#F5F7F6]">Mock Interview Score Trends</h3>
                      <div className="h-64 pt-2">
                        <MockInterviewTrendChart data={dashboardData?.mockInterviewTrends || []} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: STUDENT SKILL GAPS MATRIX                          */}
              {/* ========================================================= */}
              {activeTab === 'student_skill_gaps' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Cohort Skill Gaps Matrix</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Aggregated competency deficiencies across assigned mentees to tailor group coaching sessions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      { skill: 'Data Structures & Algorithms', studentsCount: 4, severity: 'High', avgProficiency: 44 },
                      { skill: 'System Design Patterns', studentsCount: 3, severity: 'Medium', avgProficiency: 58 },
                      { skill: 'SQL Optimization & Indexing', studentsCount: 5, severity: 'High', avgProficiency: 41 },
                      { skill: 'Asynchronous Programming', studentsCount: 2, severity: 'Medium', avgProficiency: 62 },
                      { skill: 'REST API Authentication', studentsCount: 3, severity: 'Medium', avgProficiency: 54 },
                      { skill: 'Cloud Deployment (Docker)', studentsCount: 4, severity: 'High', avgProficiency: 48 },
                    ].map((gap, idx) => (
                      <div key={idx} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-[#F5F7F6] text-sm">{gap.skill}</h3>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#261414] text-[#FF7272] border border-[#FF7272]/30">
                            {gap.studentsCount} Students
                          </span>
                        </div>
                        <p className="text-xs text-[#A3ADA7] leading-relaxed">
                          Identified shortfall in practical exercises and recent assessments. Average cohort proficiency is {gap.avgProficiency}%.
                        </p>
                        <div className="pt-2 border-t border-[#29312C] flex items-center justify-between">
                          <span className="text-[11px] text-[#A3ADA7]">Severity: {gap.severity}</span>
                          <button
                            onClick={() => showToast(`Targeted coaching drill suggested for ${gap.skill}.`)}
                            className="px-3 py-1 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-lg border border-[#29312C] cursor-pointer"
                          >
                            Schedule Drill
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: AT-RISK STUDENTS INTERVENTION                      */}
              {/* ========================================================= */}
              {activeTab === 'at_risk_students' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6] flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-[#FF7272]" />
                      <span>At-Risk Students Intervention Desk</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Students requiring urgent academic advisement due to low readiness scores or lagging assignments.
                    </p>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0A0D0C] border-b border-[#29312C] text-[#A3ADA7] uppercase tracking-wider text-[11px] font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">Student</th>
                          <th className="px-6 py-3.5">Course</th>
                          <th className="px-6 py-3.5">Readiness Score</th>
                          <th className="px-6 py-3.5">Attention Flag</th>
                          <th className="px-6 py-3.5 text-right">Intervention</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#29312C]">
                        {priorityStudents.map((st) => (
                          <tr key={st.id} className="hover:bg-[#0A0D0C]/80 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#F5F7F6]">{st.name}</p>
                              <p className="text-[11px] text-[#A3ADA7] font-mono">{st.email}</p>
                            </td>
                            <td className="px-6 py-4 text-[#A3ADA7]">{st.course}</td>
                            <td className="px-6 py-4 font-mono font-bold text-[#FF7272]">
                              {st.readinessScore} / 100
                            </td>
                            <td className="px-6 py-4 text-[#FF7272] font-medium">
                              {st.attentionReason || 'Needs immediate 1-on-1 coaching'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedMentee(st);
                                  setIsScheduleModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Schedule 1-on-1 Call
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
              {/* TAB 7: MENTORING SESSIONS                                 */}
              {/* ========================================================= */}
              {activeTab === 'mentoring_sessions' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-[#F5F7F6]">1-on-1 Mentoring Sessions</h1>
                      <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                        Upcoming and historical advisory appointments with assigned mentees.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="px-4 py-2 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule New Session</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        mentee: 'Arjun Verma',
                        course: 'Python Programming',
                        date: 'Today, 4:00 PM',
                        topic: 'Pandas Data Transformation & Pipeline Debugging',
                        status: 'upcoming',
                      },
                      {
                        mentee: 'Sneha Patel',
                        course: 'SQL Fundamentals',
                        date: 'Tomorrow, 11:00 AM',
                        topic: 'Complex Joins & Subqueries Exam Prep',
                        status: 'upcoming',
                      },
                      {
                        mentee: 'Vikram Joshi',
                        course: 'Machine Learning',
                        date: 'Yesterday, 3:00 PM',
                        topic: 'Model Overfitting Remediation Review',
                        status: 'completed',
                      },
                    ].map((sess, idx) => (
                      <div key={idx} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#F5F7F6] text-sm">{sess.mentee}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sess.status === 'upcoming'
                                ? 'bg-[#101F1B] text-[#32D6B0] border border-[#32D6B0]/30'
                                : 'bg-[#151A18] text-[#A3ADA7]'
                            }`}
                          >
                            {sess.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#32D6B0] font-semibold">{sess.topic}</p>
                        <p className="text-xs text-[#A3ADA7]">{sess.course} • {sess.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 8: FEEDBACK & RECOMMENDATIONS                         */}
              {/* ========================================================= */}
              {activeTab === 'feedback_recommendations' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Feedback &amp; Recommendations Log</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Actionable remediation feedback and study plan recommendations dispatched to mentees.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        student: 'Arjun Verma',
                        date: 'Oct 24, 2026',
                        feedback: 'Demonstrated strong command of Python dictionaries and list comprehensions. Recommended focusing on vectorization with NumPy before advancing to Pandas merge operations.',
                        status: 'Active Plan',
                      },
                      {
                        student: 'Sneha Patel',
                        date: 'Oct 21, 2026',
                        feedback: 'Need to strengthen SQL window functions (ROW_NUMBER and DENSE_RANK). Assigned 3 custom practice drills on LeetCode database patterns.',
                        status: 'In Progress',
                      },
                    ].map((fb, idx) => (
                      <div key={idx} className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#F5F7F6]">{fb.student}</span>
                          <span className="text-[#A3ADA7] font-mono">{fb.date}</span>
                        </div>
                        <p className="text-xs text-[#A3ADA7] leading-relaxed">"{fb.feedback}"</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#101F1B] text-[#32D6B0]">
                          {fb.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 9: MESSAGES & NOTIFICATIONS                           */}
              {/* ========================================================= */}
              {activeTab === 'messages_notifications' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Messages &amp; Advising Notifications</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Direct student inquiries, session confirmations, and institutional updates.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { title: 'New Doubt Ticket Assigned: Pandas Vectorization', time: '1 hour ago', student: 'Arjun Verma' },
                      { title: '1-on-1 Session Confirmed for Tomorrow at 11 AM', time: '3 hours ago', student: 'Sneha Patel' },
                      { title: 'Midterm Assessment Scores Published', time: 'Yesterday', student: 'System' },
                    ].map((msg, i) => (
                      <div key={i} className="p-4 rounded-xl bg-[#151A18] border border-[#29312C] flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#F5F7F6]">{msg.title}</p>
                          <p className="text-[11px] text-[#A3ADA7] mt-0.5">Sender: {msg.student}</p>
                        </div>
                        <span className="text-[10px] text-[#A3ADA7] font-mono">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 10: MY PROFILE & SETTINGS                             */}
              {/* ========================================================= */}
              {(activeTab === 'my_profile' || activeTab === 'settings') && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h1 className="text-2xl font-bold text-[#F5F7F6]">Mentor Profile &amp; Preferences</h1>
                    <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
                      Manage your advisory credentials, weekly calendar availability, and notification alerts.
                    </p>
                  </div>

                  <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Mentor Name</span>
                        <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block">{currentUser.name}</span>
                      </div>
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Email</span>
                        <span className="font-bold text-[#F5F7F6] text-sm mt-0.5 block truncate">{currentUser.email}</span>
                      </div>
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Specialization</span>
                        <span className="font-bold text-[#32D6B0] text-sm mt-0.5 block">AI &amp; Data Science</span>
                      </div>
                      <div className="p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C]">
                        <span className="text-[#A3ADA7] block">Assigned Mentees</span>
                        <span className="font-mono font-bold text-[#B4E85A] text-sm mt-0.5 block">
                          {dashboardData?.kpis.totalAssignedStudents || 12} Students
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => showToast('Mentor settings updated successfully.')}
                        className="px-5 py-2.5 bg-[#32D6B0] hover:bg-[#78D98A] text-[#0A0D0C] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Save Availability Changes
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
      {/* STUDENT PROFILE DOSSIER & REVIEW MODAL                    */}
      {/* ========================================================= */}
      {selectedMentee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D0C]/80 backdrop-blur-xs">
          <div className="bg-[#151A18] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#29312C] space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <div>
                <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">
                  Mentee Diagnostic Dossier: {selectedMentee.name}
                </h3>
                <p className="text-xs text-[#A3ADA7]">{selectedMentee.email}</p>
              </div>
              <button
                onClick={() => setSelectedMentee(null)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6] p-1 rounded-lg hover:bg-[#1B211E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#0A0D0C] border border-[#29312C]">
                <span className="text-[11px] text-[#A3ADA7] block">Readiness</span>
                <span className="text-lg font-bold font-mono text-[#32D6B0]">{selectedMentee.readinessScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0D0C] border border-[#29312C]">
                <span className="text-[11px] text-[#A3ADA7] block">Progress</span>
                <span className="text-lg font-bold font-mono text-[#F2D64B]">{selectedMentee.progress}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0D0C] border border-[#29312C]">
                <span className="text-[11px] text-[#A3ADA7] block">Latest Quiz</span>
                <span className="text-lg font-bold font-mono text-[#78D98A]">{selectedMentee.latestScore}%</span>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="p-4 bg-[#0A0D0C] rounded-xl border border-[#29312C] space-y-1.5 text-xs">
              <span className="font-semibold text-[#F5F7F6] block">Intervention Reason:</span>
              <p className="text-[#A3ADA7] leading-relaxed">
                {selectedMentee.attentionReason || 'Consistent progress maintained. Eligible for advanced mock technical interview.'}
              </p>
            </div>

            {/* Record Mentoring Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#F5F7F6]">Record Mentoring Feedback / Intervention Plan:</label>
              <textarea
                value={mentoringNotes}
                onChange={(e) => setMentoringNotes(e.target.value)}
                rows={3}
                placeholder="Enter targeted guidance, recommended practice problems, or session outcomes..."
                className="w-full p-3 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#29312C]">
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-3.5 py-2 bg-[#1B211E] hover:bg-[#29312C] text-[#32D6B0] text-xs font-semibold rounded-xl border border-[#29312C] flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule 1-on-1</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMentee(null)}
                  className="px-3 py-2 text-xs font-semibold text-[#A3ADA7] hover:text-[#F5F7F6]"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-[#32D6B0] text-[#0A0D0C] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Save Dossier Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCHEDULE 1-ON-1 MODAL                                     */}
      {/* ========================================================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0D0C]/80 backdrop-blur-xs">
          <div className="bg-[#151A18] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#29312C] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
              <h3 className="text-base font-bold font-['Outfit'] text-[#F5F7F6]">
                Schedule Mentorship Session
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-[#A3ADA7] hover:text-[#F5F7F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#A3ADA7] block mb-1">Student</label>
                <input
                  type="text"
                  disabled
                  value={selectedMentee ? `${selectedMentee.name} (${selectedMentee.email})` : 'Select a student'}
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-[#F5F7F6] text-xs opacity-80"
                />
              </div>

              <div>
                <label className="text-[#A3ADA7] block mb-1">Topic / Agenda *</label>
                <input
                  type="text"
                  required
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="e.g. Dynamic Programming review & Mock Interview"
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-[#F5F7F6] text-xs focus:outline-none focus:border-[#32D6B0]"
                />
              </div>

              <div>
                <label className="text-[#A3ADA7] block mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-[#F5F7F6] text-xs focus:outline-none focus:border-[#32D6B0]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#29312C]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-[#A3ADA7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#32D6B0] text-[#0A0D0C] text-xs font-bold rounded-lg hover:opacity-90"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
