import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { TimetableBuilderModal } from '../../components/timetable/TimetableBuilderModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { DAYS_OF_WEEK, DAY_NAMES_MARATHI, PERIOD_TIMINGS } from '../../constants';
import { Plus, Trash2, Edit2, Calendar, School, User, BookOpen, Filter } from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const TimetablePage = () => {
  const { success, error } = useToast();
  const [entries, setEntries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedClass, setSelectedClass] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [entriesRes, cRes, tRes, sRes] = await Promise.all([
        api.get(`/timetable?day=${selectedDay}${selectedClass !== 'all' ? `&classId=${selectedClass}` : ''}`),
        api.get('/classes'),
        api.get('/teachers'),
        api.get('/subjects')
      ]);

      if (entriesRes.data.success) setEntries(entriesRes.data.data);
      if (cRes.data.success) setClasses(sortClassesAsc(cRes.data.data));
      if (tRes.data.success) setTeachers(tRes.data.data);
      if (sRes.data.success) setSubjects(sRes.data.data);
    } catch (err) {
      console.error(err);
      error('Failed to load timetable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDay, selectedClass]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/timetable/${deleteTarget._id}`);
      if (res.data.success) {
        success('Timetable entry deleted');
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            वेळापत्रक व्यवस्थापन • Timetable Builder & Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure, edit, and organize master schedules with automated clash and double-booking prevention
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setIsBuilderOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Schedule Entry • नवीन तासिका जोडा
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5" /> वार (Day):
          </span>
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedDay === d
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {d} ({DAY_NAMES_MARATHI[d] || d})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
            <School className="w-3.5 h-3.5" /> वर्ग (Class):
          </span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Classes (सर्व वर्ग)</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                Class {c.className}-{c.division} ({c.roomNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">तासिका (Period)</th>
                  <th className="p-3.5">वर्ग (Class)</th>
                  <th className="p-3.5">विषय (Subject)</th>
                  <th className="p-3.5">शिक्षक (Teacher)</th>
                  <th className="p-3.5">खोली (Room)</th>
                  <th className="p-3.5 text-right">कृती (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No schedule entries found for {selectedDay} ({DAY_NAMES_MARATHI[selectedDay]}). Click "+ Add Schedule Entry" to create.
                    </td>
                  </tr>
                ) : (
                  entries.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-brand-600 dark:text-brand-400">
                        Period {item.periodNumber}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {item.startTime}–{item.endTime}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        Class {item.classId?.className}-{item.classId?.division}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {item.subjectId?.marathiName || item.subjectId?.name} ({item.subjectId?.code})
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                        {item.teacherId?.name}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono font-medium">
                        {item.roomNumber}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditTarget(item);
                              setIsBuilderOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                            title="तासिका बदला (Edit slot)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="तासिका हटवा (Delete slot)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Builder / Edit Modal */}
      <TimetableBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditTarget(null);
        }}
        editItem={editTarget}
        defaultDay={selectedDay}
        defaultClassId={selectedClass !== 'all' ? selectedClass : ''}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        onSuccess={(data, isEdit) => {
          success(isEdit ? 'वेळापत्रक तासिका यशस्वीरित्या बदलली (Schedule slot updated successfully)' : 'नवीन तासिका वेळापत्रकात जोडली (Schedule slot added successfully)');
          fetchData();
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Timetable Entry"
        message={`Are you sure you want to remove Class ${deleteTarget?.classId?.className}-${deleteTarget?.classId?.division} Period ${deleteTarget?.periodNumber} on ${deleteTarget?.day}?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
