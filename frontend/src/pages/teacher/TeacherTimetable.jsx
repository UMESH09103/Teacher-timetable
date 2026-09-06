import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PERIOD_TIMINGS, DAYS_OF_WEEK, getSavedPeriodTimings } from '../../constants';
import { Calendar, School, Coffee, Utensils } from 'lucide-react';
import api from '../../services/api';

export const TeacherTimetable = () => {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodTimings, setPeriodTimings] = useState(() => getSavedPeriodTimings());

  useEffect(() => {
    const handleTimingsUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPeriodTimings(e.detail);
      }
    };
    window.addEventListener('periodTimingsUpdated', handleTimingsUpdate);
    return () => window.removeEventListener('periodTimingsUpdated', handleTimingsUpdate);
  }, []);

  const teacherId = user?.teacherId?._id || user?.teacherId;

  useEffect(() => {
    if (!teacherId) return;
    const fetchWeekly = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/timetable/weekly?type=teacher&id=${teacherId}`);
        if (res.data.success) {
          setScheduleData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeekly();
  }, [teacherId]);

  const matrix = new Map();
  scheduleData.forEach((entry) => {
    matrix.set(`${entry.day}_${entry.periodNumber}`, entry);
  });

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            My Weekly Teaching Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            5-Day overview of regular lectures and assigned rooms (Monday – Friday)
          </p>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-28 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10">
                  Period
                </th>
                {DAYS_OF_WEEK.map((d) => (
                  <th
                    key={d}
                    className="p-3.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-l border-slate-200/60 dark:border-slate-800/60"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {periodTimings.map((p) => {
                const isBreakAfter = p.period === 4;
                const p4 = periodTimings.find((item) => item.period === 4) || p;
                const p5 = periodTimings.find((item) => item.period === 5);
                const lunchTimingText = p5
                  ? `${p4.endTime} – ${p5.startTime}`
                  : '01:35 – 02:00';

                return (
                  <React.Fragment key={p.period}>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-xs text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                          P{p.period}
                        </div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          {p.startTime}–{p.endTime}
                        </div>
                      </td>

                      {DAYS_OF_WEEK.map((day) => {
                        const entry = matrix.get(`${day}_${p.period}`);

                        return (
                          <td
                            key={day}
                            className="p-2 border-l border-slate-100 dark:border-slate-800/60 align-top"
                          >
                            {entry ? (
                              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-brand-50/30 dark:bg-brand-950/20 text-left space-y-1">
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                                  {entry.subjectId?.name}
                                </span>
                                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 block truncate">
                                  Class {entry.classId?.className}-{entry.classId?.division}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {entry.roomNumber}
                                </span>
                              </div>
                            ) : (
                              <div className="p-3 text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                                FREE
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Lunch Break / Recess Row */}
                    {isBreakAfter && (
                      <tr className="bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 dark:from-amber-950/60 dark:via-orange-950/70 dark:to-amber-950/60 border-y-2 border-amber-300/80 dark:border-amber-700/80 shadow-inner">
                        <td className="p-2.5 font-black text-xs sticky left-0 bg-amber-100 dark:bg-amber-950 z-10 border-r border-amber-300/80 dark:border-amber-700/80 text-amber-900 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                            <Coffee className="w-3.5 h-3.5 animate-bounce shrink-0" />
                            <span>RECESS</span>
                          </div>
                          <div className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                            {lunchTimingText}
                          </div>
                        </td>
                        <td
                          colSpan={DAYS_OF_WEEK.length}
                          className="p-2.5 text-center"
                        >
                          <div className="flex items-center justify-center gap-3 text-xs font-extrabold tracking-wider text-amber-950 dark:text-amber-100">
                            <span className="hidden sm:inline-block w-12 h-[2px] bg-amber-300/80 dark:bg-amber-600/60 rounded-full" />
                            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-xs border border-amber-300/80 dark:border-amber-700/80 text-amber-900 dark:text-amber-200">
                              <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>🍽️ दुपारची मधली सुट्टी • LUNCH BREAK ({lunchTimingText}) • 25 MINS</span>
                            </div>
                            <span className="hidden sm:inline-block w-12 h-[2px] bg-amber-300/80 dark:bg-amber-600/60 rounded-full" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
