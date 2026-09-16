import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/Button';
import { ClassView } from '../../components/timetable/ClassView';
import { PeriodView } from '../../components/timetable/PeriodView';
import { TeacherView } from '../../components/timetable/TeacherView';
import { AbsenceDrawer } from '../../components/substitutions/AbsenceDrawer';
import { Drawer } from '../../components/ui/Drawer';
import { CandidateCard } from '../../components/substitutions/CandidateCard';
import { ConfirmAssignModal } from '../../components/substitutions/ConfirmAssignModal';
import { CardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { PERIOD_TIMINGS, DAY_NAMES_MARATHI, getLiveBellPeriodInfo } from '../../constants';
import {
  Users,
  School,
  UserX,
  Repeat,
  CheckCircle2,
  Clock,
  Plus,
  Radio,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  UserCheck,
  Activity,
  ChevronRight,
  CalendarDays,
  Layers,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const Dashboard = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from current route URL
  const getTabFromPath = (pathname) => {
    if (pathname.includes('/timetable/period')) return 'period';
    if (pathname.includes('/timetable/teacher')) return 'teacher';
    if (pathname.includes('/timetable/class')) return 'class';
    return 'class';
  };

  // State
  const [kpis, setKpis] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [activePeriod, setActivePeriod] = useState(() => getLiveBellPeriodInfo(new Date()).period || 1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker for live time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Synchronize activeTab whenever route pathname changes
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    setActiveTab(tab);
  }, [location.pathname]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/principal/timetable/${newTab}`);
  };

  // Absence Drawer state
  const [isAbsenceDrawerOpen, setIsAbsenceDrawerOpen] = useState(false);

  // Substitute Finder Drawer state
  const [isCandidateDrawerOpen, setIsCandidateDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Confirm Assign Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch Dashboard Data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [kpiRes, attStatsRes, classRes, teacherRes, subjectRes, timetableRes] = await Promise.all([
        api.get(`/reports/kpis?date=${selectedDate}`),
        api.get(`/attendance/stats?date=${selectedDate}`).catch(() => ({ data: { success: false } })),
        api.get('/classes'),
        api.get(`/teachers?date=${selectedDate}`),
        api.get('/subjects'),
        api.get(`/timetable/today?date=${selectedDate}`)
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data.data);
      if (attStatsRes.data?.success) setAttendanceStats(attStatsRes.data.data);
      if (classRes.data.success) setClasses(sortClassesAsc(classRes.data.data));
      if (teacherRes.data.success) setTeachers(teacherRes.data.data);
      if (subjectRes.data.success) setSubjects(subjectRes.data.data);
      if (timetableRes.data.success) setTimetableData(timetableRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      error('Failed to load dashboard data. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  // Open substitute candidate finder for a pending timetable cell or ticket
  const handleOpenSubstituteFinder = async (entry) => {
    setSelectedTicket(entry);
    setIsCandidateDrawerOpen(true);
    setIsLoadingCandidates(true);

    try {
      const classId = entry.classId?._id || entry.classId;
      const subjectId = entry.subjectId?._id || entry.subjectId;
      const absentTeacherId = entry.originalTeacher?._id || entry.teacherId?._id;

      const res = await api.get('/substitutions/candidates', {
        params: {
          date: selectedDate,
          periodNumber: entry.periodNumber,
          classId,
          subjectId,
          absentTeacherId
        }
      });

      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (err) {
      console.error(err);
      error('Failed to find substitute candidates');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  // Initiate confirmation
  const handleInitiateAssign = (candidate) => {
    setSelectedCandidate(candidate);
    setIsConfirmModalOpen(true);
  };

  // Confirm substitute assignment
  const handleConfirmAssignment = async ({ substitutionId, substituteTeacherId, remarks }) => {
    setIsAssigning(true);
    try {
      let targetSubId = selectedTicket?.substitution?._id || selectedTicket?._id;

      if (!targetSubId || selectedTicket?.status === 'pending') {
        const subRes = await api.get(
          `/substitutions?date=${selectedDate}&periodNumber=${selectedTicket.periodNumber}&classId=${selectedTicket.classId?._id || selectedTicket.classId}`
        );
        if (subRes.data.data?.length > 0) {
          targetSubId = subRes.data.data[0]._id;
        }
      }

      const res = await api.post('/substitutions/assign', {
        substitutionId: targetSubId,
        substituteTeacherId,
        remarks
      });

      if (res.data.success) {
        success(res.data.message, 'Substitute Assigned Successfully');
        setIsConfirmModalOpen(false);
        setIsCandidateDrawerOpen(false);
        loadDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Assignment failed due to conflict');
    } finally {
      setIsAssigning(false);
    }
  };

  // Date parsing
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayNameEnglish = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNameMarathi = DAY_NAMES_MARATHI[dayNameEnglish] || dayNameEnglish;
  const isSunday = selectedDateObj.getDay() === 0 || kpis?.isHoliday;

  // Active Bell Period computation
  const getLivePeriodStatus = () => {
    if (isSunday) {
      return { status: 'holiday', label: 'रविवार साप्ताहिक सुट्टी (Sunday Holiday)', timing: 'शाळा बंद' };
    }
    const bell = getLiveBellPeriodInfo(currentTime, PERIOD_TIMINGS);
    return {
      status: bell.liveStatus === 'in_session' ? 'running' : bell.liveStatus,
      period: bell.period,
      label: bell.label,
      timing: bell.timing
    };
  };

  const periodStatus = getLivePeriodStatus();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. HERO COMMAND CENTER HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        {/* Ambient decorative glowing shapes */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Top School Breadcrumb Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md border border-white/10 text-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>के. व्ही. एन. नाईक संस्था • माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-2.5">
              सुप्रभात, प्राचार्य {user?.name || 'श्री. गिते एस.एस.'} 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              शाळा वेळापत्रक व उपस्थिती नियंत्रण कक्ष. आज{' '}
              <strong className="text-amber-300 font-bold">{dayNameMarathi}, {selectedDateObj.toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
              आहे. सर्व माहिती रिअल-टाइम सुरू आहे.
            </p>

            {/* Quick Context Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <CalendarDays className="w-3 h-3 text-indigo-400" /> शैक्षणिक वर्ष 2026-2027
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <Users className="w-3 h-3 text-brand-400" /> {teachers.length || 24} शिक्षक
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <School className="w-3 h-3 text-blue-400" /> 12 वर्ग (5-A ते 10-B)
              </span>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            <button
              onClick={() => navigate('/principal/timetable/live')}
              className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
            >
              <Radio className="w-4 h-4 text-white animate-pulse" />
              <span>थेट वेळापत्रक (Live Broadcast)</span>
            </button>

            <button
              onClick={() => setIsAbsenceDrawerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md"
            >
              <Plus className="w-4 h-4 text-brand-300" />
              <span>रजा नोंदवा (Absence)</span>
            </button>

            <button
              onClick={() => navigate('/principal/substitutions')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Repeat className="w-4 h-4 text-indigo-200" />
              <span>तासिका बदल (Subs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sunday Weekly Off Notice */}
      {isSunday && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                आज रविवार आहे - साप्ताहिक शाळा सुट्टी (Sunday Weekly Holiday)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white tracking-wide">
                  WEEKLY OFF
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                शाळेला आज साप्ताहिक सुट्टी आहे. वर्ग व तासिका सोमवार ते शनिवार या कालावधीत नियमित सुरू असतात.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            सोमवारचे वेळापत्रक पहा (View Monday) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. REAL-TIME INTELLIGENCE STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strip 1: Bell Schedule Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                तासिका घंटा वेळ (Bell Schedule)
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {periodStatus.label}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {periodStatus.timing}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> Live
          </span>
        </div>

        {/* Strip 2: Student Attendance Quick Glance */}
        <div
          onClick={() => navigate('/principal/attendance')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                दैनिक विद्यार्थी उपस्थिती (Student Attendance)
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {attendanceStats ? `${attendanceStats.percentage}% हजेरी (${attendanceStats.totalPresent} हजर)` : 'हजेरी नोंदणी सुरू'}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {attendanceStats ? `${attendanceStats.submittedCount}/${attendanceStats.totalClasses} वर्ग नोंदवले` : 'तपशील पाहण्यासाठी क्लिक करा'}
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        {/* Strip 3: Substitution Balance Quick Glance */}
        <div
          onClick={() => navigate('/principal/substitutions')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                तासिका बदल सद्यस्थिती (Substitution Balance)
              </span>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {kpis?.pendingSubstitutions > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">{kpis.pendingSubstitutions} तासिका बदल आवश्यक</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">सर्व तासिका सुरळीत (0 प्रलंबित)</span>
                )}
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {kpis?.assignedSubstitutions || 0} बदली तासिका नियुक्त
              </span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </div>

      {/* 3. EXECUTIVE METRIC KPI CARDS (6 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="एकूण शिक्षक"
              value={kpis?.totalTeachers || teachers.length || 24}
              subtext="सक्रिय शिक्षक वर्ग"
              variant="brand"
              onClick={() => navigate('/principal/teachers')}
            />
            <StatCard
              icon={<School className="w-5 h-5" />}
              label="एकूण वर्ग"
              value={kpis?.totalClasses || classes.length || 12}
              subtext="इ. 5-A ते 10-B"
              variant="blue"
              onClick={() => navigate('/principal/classes')}
            />
            <StatCard
              icon={<UserX className="w-5 h-5" />}
              label="आज रजेवर शिक्षक"
              value={kpis?.absentToday || 0}
              subtext={kpis?.absentToday > 0 ? 'लक्ष द्या' : 'सर्व शिक्षक हजर'}
              variant="rose"
              onClick={() => navigate('/principal/absences')}
            />
            <StatCard
              icon={<Repeat className="w-5 h-5" />}
              label="प्रलंबित बदल"
              value={kpis?.pendingSubstitutions || 0}
              subtext={kpis?.pendingSubstitutions > 0 ? 'बदली शिक्षक आवश्यक' : 'सर्व पूर्ण'}
              variant="amber"
              onClick={() => navigate('/principal/substitutions')}
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="बदली नियुक्त"
              value={kpis?.assignedSubstitutions || 0}
              subtext="तासिका नियोजन पूर्ण"
              variant="emerald"
              onClick={() => navigate('/principal/substitutions')}
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="उपलब्ध शिक्षक"
              value={kpis?.freeTeachers || 0}
              subtext="सध्या रिकामी तासिका"
              variant="purple"
            />
          </>
        )}
      </div>

      {/* 4. MAIN SECTION: MASTER TIMETABLE VIEW & CONTROLLER */}
      <div className="space-y-4">
        {/* Navigation & Control Header */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'class'
                  ? "दैनिक वेळापत्रक (Class View • वर्गनिहाय)"
                  : activeTab === 'period'
                  ? "दैनिक वेळापत्रक (Period View • तासिकानिहाय)"
                  : "दैनिक वेळापत्रक (Teacher View • शिक्षकानिहाय)"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeTab === 'class'
                ? "इयत्ता 5-A ते 10-B सर्व वर्गांचे 8 तासिकांचे थेट वेळापत्रक व शिक्षक वाटप"
                : activeTab === 'period'
                ? "प्रत्येक तासिका निवडून सर्व वर्गांची सद्यस्थिती व तासिका बदल व्यवस्थापन"
                : "सर्व 24 शिक्षकांचे तासिका नियोजन, मोकळ्या तासिका व बदली जबाबदारी"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* View Switcher Tabs with Marathi + English */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => handleTabChange('class')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'class'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>वर्गनिहाय</span>
              </button>
              <button
                onClick={() => handleTabChange('period')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'period'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>तासिकानिहाय</span>
              </button>
              <button
                onClick={() => handleTabChange('teacher')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'teacher'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>शिक्षकानिहाय</span>
              </button>
            </div>

            {/* Quick Date Switcher Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                आज
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  const daysUntilMon = (1 + 7 - d.getDay()) % 7 || 7;
                  d.setDate(d.getDate() + daysUntilMon);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  selectedDate === '2026-09-07'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                सोमवार
              </button>
            </div>

            {/* Custom Date Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Timetable Body */}
        {isLoading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : isSunday ? (
          <div className="p-12 text-center rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/40 via-amber-50/20 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-subtle animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-2">
              साप्ताहिक शाळा सुट्टी • Weekly Holiday
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              आज रविवार आहे - साप्ताहिक शाळा सुट्टी (Sunday School Holiday)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              विद्यामंदिर, राजापूर येथे रविवारी साप्ताहिक सुट्टी असते. वर्ग व तासिका सोमवार ते शनिवार या कालावधीत नियमितपणे भरतात.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                सोमवारचे वेळापत्रक पहा (View Monday Schedule)
              </Button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'class' && (
              <ClassView
                classes={classes}
                timetableData={timetableData}
                onSelectPendingSlot={handleOpenSubstituteFinder}
              />
            )}

            {activeTab === 'period' && (
              <PeriodView
                classes={classes}
                teachers={teachers}
                timetableData={timetableData}
                activePeriod={activePeriod}
                onPeriodChange={setActivePeriod}
                onAssignSubstitute={handleOpenSubstituteFinder}
              />
            )}

            {activeTab === 'teacher' && (
              <TeacherView teachers={teachers} timetableData={timetableData} />
            )}
          </>
        )}
      </div>

      {/* 5. DRAWERS & MODALS */}
      <AbsenceDrawer
        isOpen={isAbsenceDrawerOpen}
        onClose={() => setIsAbsenceDrawerOpen(false)}
        teachers={teachers}
        onAbsenceLogged={() => loadDashboardData()}
        onOpenSubstitutions={() => navigate('/principal/substitutions')}
      />

      <Drawer
        isOpen={isCandidateDrawerOpen}
        onClose={() => setIsCandidateDrawerOpen(false)}
        title="Smart Substitute Teacher Recommendation"
        subtitle={
          selectedTicket
            ? `Finding conflict-free candidates for ${selectedTicket.classId?.displayName || `Class ${selectedTicket.classId?.className}-${selectedTicket.classId?.division}`} • Period ${selectedTicket.periodNumber} (${selectedTicket.subjectId?.marathiName || selectedTicket.subjectId?.name})`
            : 'Candidate Matcher'
        }
        width="max-w-xl"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200/70 dark:border-brand-900/60 text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Our automated allocation algorithm evaluates real-time faculty availability, subject expertise, class familiarity, and daily workload balancing to prevent fatigue and double booking.
            </p>
          </div>

          {isLoadingCandidates ? (
            <div className="space-y-3 py-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No available substitute teachers for this period. All active teachers are either absent or teaching another class.
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.teacher._id}
                  candidate={candidate}
                  onAssign={handleInitiateAssign}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>

      <ConfirmAssignModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        substitutionTicket={selectedTicket}
        selectedCandidate={selectedCandidate}
        onConfirm={handleConfirmAssignment}
        isLoading={isAssigning}
      />
    </div>
  );
};
