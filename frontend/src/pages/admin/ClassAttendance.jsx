import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUserGroup, HiOutlineCalendar, HiOutlineFunnel,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineAcademicCap
} from 'react-icons/hi2';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ClassAttendance = () => {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [loading, setLoading] = useState(true);
  const [classSummary, setClassSummary] = useState([]);
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchClassSummary();
  }, [selectedDate, selectedStandard, selectedDivision]);

  const fetchMetadata = async () => {
    try {
      const [stdRes, divRes] = await Promise.all([
        api.get('/standards'),
        api.get('/divisions')
      ]);
      setStandards(stdRes.data.data || []);
      setDivisions(divRes.data.data || []);
    } catch (error) {
      console.error('Failed to load standards/divisions metadata');
    }
  };

  const fetchClassSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/class-summary', {
        params: {
          date: selectedDate,
          standard: selectedStandard,
          division: selectedDivision
        }
      });
      setClassSummary(res.data.data || []);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load class attendance data'));
    } finally {
      setLoading(false);
    }
  };

  const isMarathi = i18n.language === 'mr';

  // Overall calculations for the selected date
  const submittedClasses = classSummary.filter(c => c.isSubmitted);
  const pendingClasses = classSummary.filter(c => !c.isSubmitted);

  const totalBoysRegistered = classSummary.reduce((acc, c) => acc + (c.totalBoys || 0), 0);
  const totalGirlsRegistered = classSummary.reduce((acc, c) => acc + (c.totalGirls || 0), 0);

  const totalBoysPresent = submittedClasses.reduce((acc, c) => acc + (c.boysPresent || 0), 0);
  const totalBoysAbsent = submittedClasses.reduce((acc, c) => acc + (c.boysAbsent || 0), 0);

  const totalGirlsPresent = submittedClasses.reduce((acc, c) => acc + (c.girlsPresent || 0), 0);
  const totalGirlsAbsent = submittedClasses.reduce((acc, c) => acc + (c.girlsAbsent || 0), 0);

  const overallPresent = totalBoysPresent + totalGirlsPresent;
  const overallAbsent = totalBoysAbsent + totalGirlsAbsent;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineUserGroup className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{isMarathi ? 'वर्ग निहाय उपस्थिती माहिती' : 'Class-wise Attendance Breakdown'}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isMarathi ? 'प्रत्येक इयत्ता व तुकडीनुसार मुले व मुलींची स्वतंत्र उपस्थिती पहा' : 'View detailed Boys & Girls attendance by Standard & Division'}
          </p>
        </div>
      </motion.div>

      {/* Date & Class Filter Bar */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-700/40 pb-2">
          <HiOutlineFunnel className="w-4 h-4 text-indigo-500" />
          <span>{isMarathi ? 'तारीख व वर्ग निवडा (Filter by Date & Class)' : 'Filter Date & Class'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {isMarathi ? 'तारीख (Select Date)' : 'Select Date'}
            </label>
            <div className="relative">
              <HiOutlineCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {isMarathi ? 'इयत्ता (Standard)' : 'Standard'}
            </label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">{isMarathi ? 'सर्व इयत्ता (All Standards)' : 'All Standards'}</option>
              {standards.map(s => <option key={s._id} value={s._id}>Std {s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {isMarathi ? 'तुकडी (Division)' : 'Division'}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">{isMarathi ? 'सर्व तुकड्या (All Divisions)' : 'All Divisions'}</option>
              {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Date Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Classes Progress */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/40 backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isMarathi ? 'उपस्थिती नोंद स्थिती' : 'Submission Status'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{submittedClasses.length} Done</span>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              {pendingClasses.length} Pending
            </span>
          </div>
        </div>

        {/* Boys Overall Summary */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-indigo-100 dark:border-indigo-900/30 backdrop-blur-xl">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            👦 {isMarathi ? 'मुले उपस्थिती (Boys Today)' : 'Boys Attendance Today'}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalBoysPresent} Present</span>
            <span className="text-xs font-bold text-red-500">{totalBoysAbsent} Absent</span>
          </div>
        </div>

        {/* Girls Overall Summary */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-purple-100 dark:border-purple-900/30 backdrop-blur-xl">
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            👧 {isMarathi ? 'मुली उपस्थिती (Girls Today)' : 'Girls Attendance Today'}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalGirlsPresent} Present</span>
            <span className="text-xs font-bold text-red-500">{totalGirlsAbsent} Absent</span>
          </div>
        </div>

        {/* Overall Total Summary */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
            {isMarathi ? 'एकूण उपस्थित विद्यार्थी' : 'Overall Present Total'}
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black">{overallPresent}</span>
            <span className="text-xs font-semibold text-indigo-200">Total Absent: {overallAbsent}</span>
          </div>
        </div>
      </div>

      {/* Class Attendance Breakdown Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : classSummary.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
          <HiOutlineAcademicCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{isMarathi ? 'निवडलेल्या निकषांसाठी कोणताही वर्ग आढळला नाही.' : 'No class breakdown records found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classSummary.map((item, index) => {
            const classTitle = `Std ${item.standard?.name}-${item.division?.name}`;
            const pct = item.totalStudents > 0 && item.isSubmitted
              ? Math.round((item.totalPresent / item.totalStudents) * 100)
              : 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-slate-800/70 rounded-3xl p-5 border-2 transition-all backdrop-blur-xl shadow-md ${
                  item.isSubmitted
                    ? 'border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400'
                    : 'border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400">
                      {item.standard?.name}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{classTitle}</h3>
                      <p className="text-xs font-medium text-slate-500">
                        {item.teacher ? item.teacher.fullName : (isMarathi ? 'शिक्षक: नियुक्त नाही' : 'No teacher assigned')}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    item.isSubmitted
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {item.isSubmitted ? <HiOutlineCheckCircle className="w-4 h-4" /> : <HiOutlineClock className="w-4 h-4" />}
                    {item.isSubmitted ? (isMarathi ? 'पूर्ण (Submitted)' : 'Submitted') : (isMarathi ? 'बाकी (Pending)' : 'Pending')}
                  </span>
                </div>

                {/* Detailed Attendance Numbers (Boys vs Girls) */}
                <div className="space-y-3">
                  {/* Boys Breakdown Row */}
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <span>👦 {isMarathi ? 'मुले (Boys)' : 'Boys'}</span>
                        <span className="text-[10px] text-indigo-500 font-medium">({item.totalBoys} Registered)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      {item.isSubmitted ? (
                        <p className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                          <span className="text-emerald-600 dark:text-emerald-400">{item.boysPresent} Present</span>
                          <span className="text-xs text-red-500 font-bold ml-2">({item.boysAbsent} Absent)</span>
                        </p>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">—</span>
                      )}
                    </div>
                  </div>

                  {/* Girls Breakdown Row */}
                  <div className="bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl p-3 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <span>👧 {isMarathi ? 'मुली (Girls)' : 'Girls'}</span>
                        <span className="text-[10px] text-purple-500 font-medium">({item.totalGirls} Registered)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      {item.isSubmitted ? (
                        <p className="text-sm font-black text-purple-900 dark:text-purple-200">
                          <span className="text-emerald-600 dark:text-emerald-400">{item.girlsPresent} Present</span>
                          <span className="text-xs text-red-500 font-bold ml-2">({item.girlsAbsent} Absent)</span>
                        </p>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">—</span>
                      )}
                    </div>
                  </div>

                  {/* Combined Class Totals & Progress Bar */}
                  {item.isSubmitted && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700 dark:text-slate-300">
                          {isMarathi ? 'एकूण उपस्थिती' : 'Total Attendance'}: {item.totalPresent}/{item.totalStudents}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassAttendance;
