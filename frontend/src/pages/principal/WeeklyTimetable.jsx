import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { TimetableBuilderModal } from '../../components/timetable/TimetableBuilderModal';
import { useToast } from '../../context/ToastContext';
import { PERIOD_TIMINGS, DAYS_OF_WEEK, DAY_NAMES_MARATHI, getSavedPeriodTimings } from '../../constants';
import { Calendar, School, User, BookOpen, Edit2, Plus, Coffee, Utensils } from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const WeeklyTimetable = () => {
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'teacher' ? 'teacher' : 'class';
  const [viewType, setViewType] = useState(initialView); // 'class' | 'teacher'
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodTimings, setPeriodTimings] = useState(() => getSavedPeriodTimings());

  // Listen for period timings updates
  useEffect(() => {
    const handleTimingsUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setPeriodTimings(e.detail);
      }
    };
    window.addEventListener('periodTimingsUpdated', handleTimingsUpdate);
    return () => window.removeEventListener('periodTimingsUpdated', handleTimingsUpdate);
  }, []);

  // Modal state for editing or creating slots directly from the matrix
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [modalDefaultDay, setModalDefaultDay] = useState('Monday');
  const [modalDefaultPeriod, setModalDefaultPeriod] = useState(1);

  // Load classes, teachers, and subjects list
  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, tRes, sRes] = await Promise.all([
          api.get('/classes'),
          api.get('/teachers'),
          api.get('/subjects')
        ]);
        if (cRes.data.success) {
          const sortedCls = sortClassesAsc(cRes.data.data);
          setClasses(sortedCls);
          if (viewType === 'class' && sortedCls.length > 0) {
            setSelectedId(sortedCls[0]._id);
          }
        }
        if (tRes.data.success) {
          setTeachers(tRes.data.data);
          if (viewType === 'teacher' && tRes.data.data.length > 0) {
            setSelectedId(tRes.data.data[0]._id);
          }
        }
        if (sRes.data.success) {
          setSubjects(sRes.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const fetchWeekly = async () => {
    if (!selectedId) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/timetable/weekly?type=${viewType}&id=${selectedId}`);
      if (res.data.success) {
        setScheduleData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load weekly schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch weekly entries when selectedId or viewType changes
  useEffect(() => {
    fetchWeekly();
  }, [viewType, selectedId]);

  const handleToggleView = (type) => {
    setViewType(type);
    setSearchParams({ view: type });
    if (type === 'class' && classes.length > 0) {
      setSelectedId(classes[0]._id);
    } else if (type === 'teacher' && teachers.length > 0) {
      setSelectedId(teachers[0]._id);
    }
  };

  useEffect(() => {
    const v = searchParams.get('view');
    if (v && (v === 'class' || v === 'teacher') && v !== viewType) {
      setViewType(v);
      if (v === 'class' && classes.length > 0) {
        setSelectedId(classes[0]._id);
      } else if (v === 'teacher' && teachers.length > 0) {
        setSelectedId(teachers[0]._id);
      }
    }
  }, [searchParams, classes, teachers]);

  const handleCardClick = (entry) => {
    setEditSlot(entry);
    setModalDefaultDay(entry.day);
    setModalDefaultPeriod(entry.periodNumber);
    setIsModalOpen(true);
  };

  const handleFreeSlotClick = (day, period) => {
    setEditSlot(null);
    setModalDefaultDay(day);
    setModalDefaultPeriod(period);
    setIsModalOpen(true);
  };

  // Map entries by day + periodNumber
  const matrix = new Map();
  scheduleData.forEach((entry) => {
    matrix.set(`${entry.day}_${entry.periodNumber}`, entry);
  });

  const activeEntity =
    viewType === 'class'
      ? classes.find((c) => c._id === selectedId)
      : teachers.find((t) => t._id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header and Filter Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            साप्ताहिक वेळापत्रक • Weekly Master Timetable
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            6-Day academic calendar (Monday – Saturday, Periods 1 to 8). Click any slot to edit or assign.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle View Type */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => handleToggleView('class')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewType === 'class'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              वर्गनिहाय (Class)
            </button>
            <button
              onClick={() => handleToggleView('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewType === 'teacher'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              शिक्षकानिहाय (Teacher)
            </button>
          </div>

          {/* Select Dropdown based on view type */}
          <div className="min-w-[220px]">
            {viewType === 'class' ? (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    Class {c.className}-{c.division} ({c.roomNumber})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.employeeId})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Target Details Strip */}
      {activeEntity && (
        <div className="px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>सध्याचे वेळापत्रक:</span>
            <h3 className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
              {viewType === 'class'
                ? `Class ${activeEntity.className}-${activeEntity.division} (Room: ${activeEntity.roomNumber})`
                : `${activeEntity.name} (${activeEntity.employeeId})`}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Academic Year: 2026-2027 • 6 Working Days</span>
        </div>
      )}

      {/* Timetable Matrix Grid */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-28 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10">
                  तासिका (Period)
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day}
                    className="p-3.5 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-l border-slate-200/60 dark:border-slate-800/60"
                  >
                    <div>{day}</div>
                    <div className="text-[11px] font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                      {DAY_NAMES_MARATHI[day]}
                    </div>
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
                              <div
                                onClick={() => handleCardClick(entry)}
                                className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-left space-y-1 cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-950/20 hover:shadow-md transition-all relative"
                                title="Click to edit this slot • बदलण्यासाठी क्लिक करा"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span
                                    className="text-xs font-extrabold text-slate-900 dark:text-white block truncate"
                                    title={entry.subjectId?.name}
                                  >
                                    {entry.subjectId?.marathiName || entry.subjectId?.name}
                                  </span>
                                  <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-brand-600" />
                                </div>
                                <span
                                  className="text-[11px] text-slate-600 dark:text-slate-300 block truncate font-medium"
                                  title={viewType === 'class' ? entry.teacherId?.name : ''}
                                >
                                  {viewType === 'class'
                                    ? (entry.teacherId?.shortName || entry.teacherId?.name)
                                    : (entry.classId?.displayName || `Class ${entry.classId?.className}-${entry.classId?.division}`)}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {entry.roomNumber}
                                </span>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleFreeSlotClick(day, p.period)}
                                className="p-3 text-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 cursor-pointer hover:border-brand-500 hover:bg-brand-50/20 hover:text-brand-600 transition-all flex items-center justify-center gap-1 group"
                                title="Click to schedule a lecture here • येथे तासिका जोडण्यासाठी क्लिक करा"
                              >
                                <span>FREE</span>
                                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Interactive Modal for Editing/Creating Slots from Matrix */}
      <TimetableBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditSlot(null);
        }}
        editItem={editSlot}
        defaultDay={modalDefaultDay}
        defaultPeriod={modalDefaultPeriod}
        defaultClassId={viewType === 'class' ? selectedId : ''}
        defaultTeacherId={viewType === 'teacher' ? selectedId : ''}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        onSuccess={(data, isEdit) => {
          success(
            isEdit
              ? 'वेळापत्रक तासिका यशस्वीरित्या बदलली (Schedule slot updated successfully)'
              : 'नवीन तासिका वेळापत्रकात जोडली (Schedule slot scheduled successfully)'
          );
          fetchWeekly();
        }}
      />
    </div>
  );
};
