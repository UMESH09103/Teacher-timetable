import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PERIOD_TIMINGS, DAY_NAMES_MARATHI } from '../../constants';
import {
  Repeat,
  CheckCircle2,
  School,
  Clock,
  User,
  AlertCircle,
  Calendar,
  Filter,
  Check,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

export const TeacherSubstitutions = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [substitutions, setSubstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Date & status filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'assigned' | 'completed'

  const teacherId = user?.teacherId?._id || user?.teacherId;

  // Calculate next Monday date if today is Sunday
  const getNextMondayStr = () => {
    const d = new Date();
    const daysUntilMon = (1 + 7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMon);
    return d.toISOString().split('T')[0];
  };
  const nextMondayStr = getNextMondayStr();

  const fetchSubs = async () => {
    if (!teacherId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/substitutions?teacherId=${teacherId}`);
      if (res.data.success) {
        const myAssigned = res.data.data.filter(
          (s) => s.substituteTeacherId?._id === teacherId || s.substituteTeacherId === teacherId
        );
        setSubstitutions(myAssigned);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load substitutions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, [teacherId]);

  const handleMarkCompleted = async (subId) => {
    setUpdatingId(subId);
    try {
      const res = await api.put(`/substitutions/${subId}/status`, {
        status: 'completed'
      });
      if (res.data.success) {
        success('Class substitution marked as completed. Well done!');
        fetchSubs();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered substitutions
  const filteredSubs = useMemo(() => {
    return substitutions.filter((sub) => {
      // Date filter
      if (selectedDateFilter === 'today' && sub.date !== todayStr) return false;
      if (selectedDateFilter === 'tomorrow' && sub.date !== nextMondayStr) return false;
      if (selectedDateFilter === 'custom' && customDate && sub.date !== customDate) return false;

      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

      return true;
    });
  }, [substitutions, selectedDateFilter, customDate, statusFilter, todayStr, nextMondayStr]);

  // Group by Date
  const groupedByDate = useMemo(() => {
    const groups = {};
    // Sort chronological: future dates first, then by periodNumber
    const sorted = [...filteredSubs].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.periodNumber - b.periodNumber;
    });

    sorted.forEach((sub) => {
      if (!groups[sub.date]) {
        groups[sub.date] = [];
      }
      groups[sub.date].push(sub);
    });

    return groups;
  }, [filteredSubs]);

  // Metrics
  const totalCount = substitutions.length;
  const todayCount = substitutions.filter((s) => s.date === todayStr && s.status === 'assigned').length;
  const upcomingCount = substitutions.filter((s) => s.date > todayStr && s.status === 'assigned').length;
  const completedCount = substitutions.filter((s) => s.status === 'completed').length;

  const formatDateLabel = (dateStr) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayNameEng = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNameMar = DAY_NAMES_MARATHI[dayNameEng] || dayNameEng;
    const formatted = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const isToday = dateStr === todayStr;
    const isTomorrow = dateStr === nextMondayStr;

    return {
      marathiDay: dayNameMar,
      englishDay: dayNameEng,
      formatted,
      isToday,
      isTomorrow
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
              <CalendarDays className="w-3.5 h-3.5" /> Datewise Substitution Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            माझे तासिका बदल • My Assigned Substitutions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            View your delegated substitution duties grouped date-by-date, inspect upcoming class duties, and mark lectures completed after teaching.
          </p>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-center">
            <span className="text-lg font-black text-brand-600 dark:text-brand-400 block leading-tight">
              {totalCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Duties</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block leading-tight">
              {upcomingCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Upcoming</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
              {completedCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Date & Status Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setSelectedDateFilter('all');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDateFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              सर्व तारखा (All Dates)
            </button>

            <button
              onClick={() => {
                setSelectedDateFilter('today');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDateFilter === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              आज (Today)
            </button>

            <button
              onClick={() => {
                setSelectedDateFilter('tomorrow');
                setCustomDate('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDateFilter === 'tomorrow'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              सोमवार ({nextMondayStr})
            </button>
          </div>

          {/* Custom Date Input */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setSelectedDateFilter(e.target.value ? 'custom' : 'all');
              }}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {customDate && (
              <button
                onClick={() => {
                  setCustomDate('');
                  setSelectedDateFilter('all');
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'assigned'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pending Duty
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Datewise Grouped Content */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : Object.keys(groupedByDate).length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            कोणताही तासिका बदल नाही • No Substitution Duties Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedDateFilter === 'today'
              ? 'आजच्या तारखेसाठी आपल्याकडे कोणताही तासिका बदल नेमून दिलेला नाही.'
              : selectedDateFilter === 'tomorrow'
              ? 'सोमवारच्या तारखेसाठी आपल्याकडे कोणताही तासिका बदल नेमून दिलेला नाही.'
              : 'निवडलेल्या फिल्टरनुसार कोणताही तासिका बदल उपलब्ध नाही.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateKey, items]) => {
            const { marathiDay, englishDay, formatted, isToday, isTomorrow } = formatDateLabel(dateKey);

            return (
              <div
                key={dateKey}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle overflow-hidden"
              >
                {/* Date Group Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-100/50 to-white dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                          {marathiDay}, {formatted} ({englishDay})
                        </h2>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-sm">
                            TODAY • आज
                          </span>
                        )}
                        {isTomorrow && !isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500 text-white shadow-sm">
                            UPCOMING • आगामी
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        तारीख: <strong>{dateKey}</strong> • एकूण {items.length} तासिका बदल नेमले आहेत
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                    {items.length} Duty Slot{items.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Duty Table for this Date */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-3.5">Period & Time</th>
                        <th className="p-3.5">Class & Room</th>
                        <th className="p-3.5">Subject</th>
                        <th className="p-3.5">Original Faculty</th>
                        <th className="p-3.5">Remarks / Reason</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {items.map((sub) => {
                        const timing = PERIOD_TIMINGS.find((p) => p.period === sub.periodNumber);
                        const isPending = sub.status === 'assigned';

                        return (
                          <tr
                            key={sub._id}
                            className={`transition-colors ${
                              isPending
                                ? 'bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40'
                                : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                                  P{sub.periodNumber}
                                </span>
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-white block">
                                    Period {sub.periodNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {timing ? `${timing.startTime} – ${timing.endTime}` : 'Regular slot'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                              Class {sub.classId?.displayName || `${sub.classId?.className}-${sub.classId?.division}`}
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {sub.roomNumber || sub.classId?.roomNumber || 'Regular Room'}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                                {sub.subjectId?.marathiName || sub.subjectId?.name}
                              </span>
                            </td>

                            <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                              {sub.originalTeacherId?.name}
                              <span className="text-[10px] text-slate-400 block">
                                {sub.originalTeacherId?.employeeId}
                              </span>
                            </td>

                            <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px] italic max-w-xs truncate">
                              {sub.remarks || 'Assigned by Principal for faculty coverage'}
                            </td>

                            <td className="p-3.5">
                              {sub.status === 'completed' ? (
                                <Badge variant="emerald" dot>
                                  Completed (पूर्ण झाली)
                                </Badge>
                              ) : (
                                <Badge variant="blue" dot>
                                  Duty Assigned (नेमली)
                                </Badge>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              {sub.status === 'assigned' ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  isLoading={updatingId === sub._id}
                                  onClick={() => handleMarkCompleted(sub._id)}
                                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                >
                                  Mark Completed
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                  <Check className="w-4 h-4" /> Taught
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
