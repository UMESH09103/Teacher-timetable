import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PERIOD_TIMINGS, DAYS_OF_WEEK, DAY_NAMES_MARATHI } from '../../constants';
import { AlertCircle, CheckCircle2, Calendar, Clock, School, BookOpen, User, MapPin } from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const TimetableBuilderModal = ({
  isOpen,
  onClose,
  onSuccess,
  editItem = null,
  defaultDay = 'Monday',
  defaultPeriod = 1,
  defaultClassId = '',
  defaultTeacherId = '',
  classes = [],
  subjects = [],
  teachers = []
}) => {
  const sortedClasses = sortClassesAsc(classes);
  const [day, setDay] = useState(defaultDay);
  const [periodNumber, setPeriodNumber] = useState(defaultPeriod);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editItem) {
      setDay(editItem.day || defaultDay);
      setPeriodNumber(editItem.periodNumber || defaultPeriod);
      setClassId(editItem.classId?._id || editItem.classId || '');
      setSubjectId(editItem.subjectId?._id || editItem.subjectId || '');
      setTeacherId(editItem.teacherId?._id || editItem.teacherId || '');
      setRoomNumber(editItem.roomNumber || '');
      setAcademicYear(editItem.academicYear || '2026-2027');
    } else {
      setDay(defaultDay || 'Monday');
      setPeriodNumber(defaultPeriod || 1);
      const initialClass = defaultClassId || classes[0]?._id || '';
      setClassId(initialClass);
      setSubjectId(subjects[0]?._id || '');
      setTeacherId(defaultTeacherId || teachers[0]?._id || '');
      const cls = classes.find((c) => c._id === initialClass);
      setRoomNumber(cls?.roomNumber || 'Room 101');
      setAcademicYear('2026-2027');
    }
    setErrorMessage('');
  }, [isOpen, editItem, defaultDay, defaultPeriod, defaultClassId, defaultTeacherId, classes, subjects, teachers]);

  // Auto-fill room number when class changes if not manually set
  const handleClassChange = (selectedId) => {
    setClassId(selectedId);
    const cls = classes.find((c) => c._id === selectedId);
    if (cls && cls.roomNumber) {
      setRoomNumber(cls.roomNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const payload = {
        day,
        periodNumber: Number(periodNumber),
        classId,
        subjectId,
        teacherId,
        roomNumber: roomNumber.trim() || 'Room 101',
        academicYear
      };

      let res;
      if (editItem?._id) {
        res = await api.put(`/timetable/${editItem._id}`, payload);
      } else {
        res = await api.post('/timetable', payload);
      }

      if (res.data.success) {
        if (onSuccess) onSuccess(res.data.data, !!editItem?._id);
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to save timetable slot. A schedule conflict was detected.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? 'Edit Timetable Slot • वेळापत्रक तासिका बदला' : 'Create Timetable Slot • नवीन तासिका जोडा'}
      subtitle={
        editItem
          ? `Modify subject, faculty, or room for ${editItem.day} (${DAY_NAMES_MARATHI[editItem.day] || ''}) Period ${editItem.periodNumber}`
          : 'Schedule classroom lectures with automatic double-booking prevention'
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" /> वार (Day of Week)
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d} ({DAY_NAMES_MARATHI[d]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" /> तासिका (Period)
            </label>
            <select
              value={periodNumber}
              onChange={(e) => setPeriodNumber(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            >
              {PERIOD_TIMINGS.map((p) => (
                <option key={p.period} value={p.period}>
                  Period {p.period} ({p.startTime}–{p.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-brand-600" /> वर्ग व तुकडी (Class)
            </label>
            <select
              value={classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            >
              <option value="" disabled>वर्ग निवडा...</option>
              {sortedClasses.map((c) => (
                <option key={c._id} value={c._id}>
                  Class {c.className}-{c.division} ({c.roomNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" /> विषय (Subject)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            >
              <option value="" disabled>विषय निवडा...</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.marathiName || s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" /> शिक्षक (Teacher)
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            >
              <option value="" disabled>शिक्षक निवडा...</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} {t.employeeId ? `(${t.employeeId})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" /> खोली क्र. (Room Number)
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. Room 101"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 font-mono"
              required
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            रद्द करा (Cancel)
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {editItem ? 'बदल जतन करा (Save Changes)' : 'तासिका जोडा (Schedule Slot)'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
