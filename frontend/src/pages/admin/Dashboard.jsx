import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUsers, HiOutlineAcademicCap, HiOutlineSquares2X2,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineChartBar,
  HiOutlinePlus, HiOutlineArrowRight, HiOutlineDocumentChartBar,
  HiOutlineCalendar
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../../components/StatsCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/admin');
      setData(res.data.data);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
      </div>
    );
  }

  const pieData = [
    { name: t('dashboard.present', 'Present'), value: data?.presentToday || 0 },
    { name: t('dashboard.absent', 'Absent'), value: data?.absentToday || 0 },
    { name: t('dashboard.leave', 'Leave'), value: data?.leaveToday || 0 }
  ];

  const todayFormatted = new Date().toLocaleDateString(i18n.language === 'mr' ? 'mr-IN' : 'en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20"
      >
        <div className="relative z-10 flex items-center justify-between gap-6">
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
                {t('app.title')}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-0.5">
                {t('app.subtitle')} — {t('dashboard.overviewTitle', 'Admin Dashboard')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.totalClassTeachers', 'Total Class Teachers')}
          value={data?.totalClassTeachers ?? data?.totalTeachers ?? 18}
          icon={HiOutlineUsers}
          color="indigo"
        />
        <StatsCard
          title={t('dashboard.totalStudents', 'Total Students')}
          value={data?.totalStudents || 0}
          icon={HiOutlineAcademicCap}
          color="purple"
          subtitle={`👦 ${t('dashboard.boys', 'Boys')}: ${data?.totalBoys || 0} | 👧 ${t('dashboard.girls', 'Girls')}: ${data?.totalGirls || 0}`}
        />
        <StatsCard
          title={t('dashboard.totalClasses', 'Total Classes')}
          value={data?.totalClasses ?? data?.totalClassTeachers ?? 18}
          icon={HiOutlineSquares2X2}
          color="sky"
        />
        <StatsCard
          title={t('dashboard.attendancePct', 'Attendance %')}
          value={`${data?.attendancePercentage || 0}%`}
          icon={HiOutlineChartBar}
          color="emerald"
          subtitle={t('dashboard.todayAttendance', "Today's attendance")}
        />
      </div>

      {/* Boys & Girls Today's Attendance Highlight Card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/40 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📊</span> {t('dashboard.todayAttendance', "Today's Attendance Breakdown (आजची उपस्थिती विवरण)")}
          </h3>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            {todayFormatted}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">👦 {t('dashboard.boysPresent', 'Boys Present')}</p>
            <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{data?.boysPresentToday || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">👦 {t('dashboard.boysAbsent', 'Boys Absent')}</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{data?.boysAbsentToday || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40">
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">👧 {t('dashboard.girlsPresent', 'Girls Present')}</p>
            <p className="text-3xl font-black text-purple-700 dark:text-purple-300 mt-1">{data?.girlsPresentToday || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">👧 {t('dashboard.girlsAbsent', 'Girls Absent')}</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{data?.girlsAbsentToday || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex items-center gap-2">
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{t('dashboard.presentToday', 'Present Today')}</span>
            </div>
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{data?.presentToday || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40">
            <div className="flex items-center gap-2">
              <HiOutlineXCircle className="w-5 h-5 text-rose-600" />
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">{t('dashboard.absentToday', 'Absent Today')}</span>
            </div>
            <span className="text-lg font-bold text-rose-700 dark:text-rose-400">{data?.absentToday || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <div className="flex items-center gap-2">
              <HiOutlineUsers className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">{t('dashboard.onLeave', 'On Leave')}</span>
            </div>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{data?.leaveToday || 0}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📈</span> {t('dashboard.monthlyTrend', 'Monthly Attendance Trend')}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Today's Attendance Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🍕</span> {t('dashboard.todayAttendance', "Today's Attendance Ratio")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {entry.name}: <strong>{entry.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Standard-wise & Teacher-wise Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standard-wise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏫</span> {t('dashboard.standardWise', 'Standard-wise Attendance %')}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.standardWiseData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="standard" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="percentage" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Teacher-wise Attendance Progress List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>👨‍🏫</span> {t('dashboard.teacherWise', 'Teacher-wise Attendance')}
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              {data?.teacherWiseData?.length || 0} {isMarathi ? 'शिक्षक' : 'Teachers'}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1">
            {(!data?.teacherWiseData || data.teacherWiseData.length === 0) ? (
              <p className="text-xs font-medium text-slate-400 text-center py-10">
                {isMarathi ? 'शिक्षक माहिती उपलब्ध नाही' : 'No teacher data available'}
              </p>
            ) : (
              data.teacherWiseData.map((item, idx) => {
                const pct = item.percentage || 0;
                const badgeBg = pct >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                pct >= 75 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' :
                                            'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
                const barGradient = pct >= 90 ? 'from-emerald-500 to-teal-500' :
                                    pct >= 75 ? 'from-indigo-500 to-purple-600' :
                                                'from-amber-500 to-orange-500';

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.assignedClass && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] shrink-0 border border-indigo-200/60 dark:border-indigo-800/40">
                            {item.assignedClass}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.teacher}
                        </span>
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${badgeBg} shrink-0`}>
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
