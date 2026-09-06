import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { DAY_NAMES_MARATHI } from '../../constants';
import {
  Calendar,
  School,
  UserCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const AttendanceHistory = () => {
  const { user } = useAuth();
  const { error } = useToast();

  const teacherId = user?.teacherId?._id || user?.teacherId;
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        if (res.data.success) {
          const sortedCls = sortClassesAsc(res.data.data);
          setClasses(sortedCls);
          const myClass = sortedCls.find(
            (c) => c.classTeacher?._id === teacherId || c.classTeacher === teacherId
          );
          if (myClass) {
            setSelectedClassId(myClass._id);
          } else if (sortedCls.length > 0) {
            setSelectedClassId(sortedCls[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [teacherId]);

  // Load history
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/attendance/history?classId=${selectedClassId}&month=${selectedMonth}`);
        if (res.data.success) {
          setHistory(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
        error('Failed to load attendance history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [selectedClassId, selectedMonth]);

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  // Calculate monthly stats
  const totalDays = history.length;
  const avgPercentage =
    totalDays > 0
      ? Math.round(
          history.reduce((acc, h) => {
            const tot = (h.totalBoys || 0) + (h.totalGirls || 0);
            return acc + (tot > 0 ? (h.totalPresent / tot) * 100 : 0);
          }, 0) / totalDays
        )
      : 0;

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayEng = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dayMar = DAY_NAMES_MARATHI[dayEng] || dayEng;
    const formatted = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return `${dayMar}, ${formatted}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 mb-1">
            <Calendar className="w-3.5 h-3.5" /> उपस्थिती नोंदवही • Attendance Register
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            मासिक उपस्थिती इतिहास • Monthly Attendance History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            वर्गातील विद्यार्थ्यांच्या हजेरीचा तारीखनिहाय इतिहास, मुले/मुलींची उपस्थिती व मासिक टक्केवारी.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">महिना (Month):</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">वर्ग (Class):</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  Class {c.className}-{c.division} ({c.roomNumber})
                  {c.classTeacher?._id === teacherId ? ' ⭐ (My Class)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              नोंदवलेले दिवस (Working Days)
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalDays} दिवस
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              मासिक सरासरी टक्केवारी (Avg Attendance)
            </span>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
              {avgPercentage}%
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              वर्ग व वर्गशिक्षक (Class & Teacher)
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {selectedClass?.displayName || 'Selected Class'}
            </div>
            <span className="text-xs text-slate-500">
              शिक्षक: {selectedClass?.classTeacher?.name || 'Class Teacher'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <School className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* History Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            कोणतीही उपस्थिती नोंद आढळली नाही • No Attendance Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            निवडलेल्या महिन्यासाठी ({selectedMonth}) या वर्गाची उपस्थिती अद्याप नोंदवली गेलेली नाही.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">तारीख व वार (Date & Day)</th>
                  <th className="p-3.5">एकूण पट (Total)</th>
                  <th className="p-3.5">हजर मुले (Boys)</th>
                  <th className="p-3.5">हजर मुली (Girls)</th>
                  <th className="p-3.5">एकूण हजर (Present)</th>
                  <th className="p-3.5">एकूण गैरहजर (Absent)</th>
                  <th className="p-3.5">टक्केवारी (%)</th>
                  <th className="p-3.5">टीप (Remarks)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {history.map((record) => {
                  const totEnrolled = (record.totalBoys || 0) + (record.totalGirls || 0);
                  const pct = totEnrolled > 0 ? Math.round((record.totalPresent / totEnrolled) * 100) : 0;

                  return (
                    <tr key={record._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDateLabel(record.dateStr)}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {totEnrolled} <span className="text-[10px] text-slate-400">({record.totalBoys}M + {record.totalGirls}F)</span>
                      </td>
                      <td className="p-3.5 font-semibold text-blue-600 dark:text-blue-400">
                        {record.boysPresent} / {record.totalBoys}
                      </td>
                      <td className="p-3.5 font-semibold text-pink-600 dark:text-pink-400">
                        {record.girlsPresent} / {record.totalGirls}
                      </td>
                      <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {record.totalPresent}
                      </td>
                      <td className="p-3.5 font-extrabold text-rose-600 dark:text-rose-400">
                        {record.totalAbsent}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={pct >= 90 ? 'emerald' : pct >= 75 ? 'blue' : 'amber'}
                          size="sm"
                        >
                          {pct}%
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-400 truncate max-w-[200px]">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
