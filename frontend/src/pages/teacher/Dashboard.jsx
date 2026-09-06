import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineAcademicCap, HiOutlineClipboardDocumentCheck,
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineChartBar,
  HiOutlinePencilSquare, HiOutlineArrowRight, HiOutlineCalendar,
  HiOutlineUsers
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/teacher');
      setData(res.data.data);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString(i18n.language === 'mr' ? 'mr-IN' : 'en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={4} />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Teacher Hero Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/school-logo.png"
              alt="School Emblem"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner flex-shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-indigo-100 mb-2">
                <HiOutlineCalendar className="w-3.5 h-3.5" />
                {todayFormatted}
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">
                {t('teacherDashboard.welcomeMsg', 'Welcome back!')} {user?.name}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-0.5">
                {t('app.title')} — {t('topbar.teacherPanel', 'Teacher Panel')}
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={() => navigate('/teacher/mark-attendance')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-indigo-900 bg-white hover:bg-indigo-50 transition-all shadow-lg shadow-black/10 active:scale-95"
            >
              <HiOutlinePencilSquare className="w-5 h-5 text-indigo-600" />
              {t('sidebar.markAttendance', 'Mark Attendance Now')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('teacherDashboard.totalStudents', 'Total Students')}
          value={data?.totalStudents || 0}
          icon={HiOutlineAcademicCap}
          color="indigo"
          subtitle={`👦 ${t('dashboard.boys', 'Boys')}: ${data?.totalBoys || 0} | 👧 ${t('dashboard.girls', 'Girls')}: ${data?.totalGirls || 0}`}
        />
        <StatsCard
          title={t('teacherDashboard.attendancePending', 'Attendance Pending')}
          value={data?.attendancePending || 0}
          icon={HiOutlineClock}
          color="amber"
        />
        <StatsCard
          title={t('teacherDashboard.attendanceDone', 'Attendance Done')}
          value={data?.attendanceCompleted || 0}
          icon={HiOutlineCheckCircle}
          color="emerald"
        />
        <StatsCard
          title={t('teacherDashboard.attendancePct', 'Attendance %')}
          value={`${data?.attendancePercentage || 0}%`}
          icon={HiOutlineChartBar}
          color="purple"
          subtitle={t('dashboard.todayAttendance', 'Today')}
        />
      </div>

      {/* Today's Boys & Girls Attendance Summary */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-5 backdrop-blur-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span>📊</span> {t('dashboard.todayAttendance', "Today's Attendance Summary (आजचा तपशील)")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">👦 {t('dashboard.boysPresent', 'Boys Present')}</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{data?.boysPresentToday || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">👦 {t('dashboard.boysAbsent', 'Boys Absent')}</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{data?.boysAbsentToday || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">👧 {t('dashboard.girlsPresent', 'Girls Present')}</p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{data?.girlsPresentToday || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">👧 {t('dashboard.girlsAbsent', 'Girls Absent')}</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{data?.girlsAbsentToday || 0}</p>
          </div>
        </div>
      </div>

      {/* Assigned Classes Cards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🏫</span> {t('teacherDashboard.assignedClasses', 'Your Assigned Classes (तुमचे नियुक्त केलेले वर्ग)')}
          </h3>
          <span className="text-xs font-medium text-slate-500">
            Click any class card to fill attendance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.assignedClasses?.map((cls, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => navigate(`/teacher/mark-attendance?standard=${cls.standard._id}&division=${cls.division._id}`)}
              className="relative overflow-hidden p-6 rounded-3xl cursor-pointer
                bg-white dark:bg-slate-800/50
                border-2 border-slate-200/80 dark:border-slate-700/60
                hover:border-indigo-500 dark:hover:border-indigo-500
                backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-slate-900/30
                group transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              {/* Top Row: Icon + Class Title & Student Count */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30 flex-shrink-0">
                    {cls.standard?.name}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">
                      Standard {cls.standard?.name} - {cls.division?.name}
                    </h4>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {t('teacherDashboard.studentsCount', { count: cls.studentCount, defaultValue: `${cls.studentCount} Total Students` })}
                    </p>
                  </div>
                </div>

                {cls.attendanceDone ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    {t('teacherDashboard.completed', 'Completed')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                    <HiOutlineClock className="w-4 h-4" />
                    {t('teacherDashboard.pending', 'Pending')}
                  </span>
                )}
              </div>

              {/* Action Button Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 transition-colors">
                <span>{t('attendance.title', 'Fill Attendance')}</span>
                <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <span>Open Class</span>
                  <HiOutlineArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {(!data?.assignedClasses || data.assignedClasses.length === 0) && (
          <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40">
            <HiOutlineClipboardDocumentCheck className="w-12 h-12 mx-auto mb-3 opacity-50 text-indigo-500" />
            <p className="text-sm font-semibold">{t('teacherDashboard.noAssignedClasses', 'No classes assigned yet. Contact your administrator.')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeacherDashboard;
