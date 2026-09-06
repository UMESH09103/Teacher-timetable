import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  School,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const MarkAttendance = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const teacherId = user?.teacherId?._id || user?.teacherId;
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(null);

  // Strength counts
  const [totalBoys, setTotalBoys] = useState(25);
  const [totalGirls, setTotalGirls] = useState(20);
  const [boysPresent, setBoysPresent] = useState(25);
  const [girlsPresent, setGirlsPresent] = useState(20);
  const [totalLeave, setTotalLeave] = useState(0);
  const [remarks, setRemarks] = useState('');

  // Load teacher's classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/classes');
        if (res.data.success) {
          const all = sortClassesAsc(res.data.data);
          setClasses(all);

          // Find if logged-in teacher is assigned class teacher
          const myClass = all.find(
            (c) => c.classTeacher?._id === teacherId || c.classTeacher === teacherId
          );
          if (myClass) {
            setSelectedClassId(myClass._id);
          } else if (all.length > 0) {
            setSelectedClassId(all[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
        error('Failed to load class list');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [teacherId]);

  // Load attendance data for selectedClassId and selectedDate
  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    const checkExistingAttendance = async () => {
      try {
        const res = await api.get(`/attendance/check?date=${selectedDate}&classId=${selectedClassId}`);
        const selectedCls = classes.find((c) => c._id === selectedClassId);

        const defaultBoys = selectedCls?.boysCount || 25;
        const defaultGirls = selectedCls?.girlsCount || 20;

        if (res.data.exists && res.data.data) {
          const att = res.data.data;
          setExistingAttendance(att);
          setTotalBoys(att.totalBoys || defaultBoys);
          setTotalGirls(att.totalGirls || defaultGirls);
          setBoysPresent(att.boysPresent !== undefined ? att.boysPresent : defaultBoys);
          setGirlsPresent(att.girlsPresent !== undefined ? att.girlsPresent : defaultGirls);
          setTotalLeave(att.totalLeave || 0);
          setRemarks(att.remarks || '');
        } else {
          setExistingAttendance(null);
          setTotalBoys(defaultBoys);
          setTotalGirls(defaultGirls);
          setBoysPresent(defaultBoys);
          setGirlsPresent(defaultGirls);
          setTotalLeave(0);
          setRemarks('');
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkExistingAttendance();
  }, [selectedClassId, selectedDate, classes]);

  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const isMyAssignedClass =
    selectedClass?.classTeacher?._id === teacherId || selectedClass?.classTeacher === teacherId;

  // Derived counts
  const boysAbsent = Math.max(0, totalBoys - boysPresent);
  const girlsAbsent = Math.max(0, totalGirls - girlsPresent);
  const totalEnrolled = totalBoys + totalGirls;
  const totalPresent = boysPresent + girlsPresent;
  const totalAbsent = boysAbsent + girlsAbsent;
  const percentage = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  const handleMarkAllPresent = () => {
    setBoysPresent(totalBoys);
    setGirlsPresent(totalGirls);
    setTotalLeave(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        classId: selectedClassId,
        totalBoys,
        totalGirls,
        boysPresent,
        boysAbsent,
        girlsPresent,
        girlsAbsent,
        totalLeave,
        remarks
      };

      const res = await api.post('/attendance', payload);
      if (res.data.success) {
        success(existingAttendance ? 'हजेरी अद्ययावत केली (Attendance updated successfully)' : 'दैनिक हजेरी नोंदवली (Daily attendance recorded successfully)');
        setExistingAttendance(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                विद्यार्थी हजेरी पोर्टल • Student Attendance
              </span>
              {existingAttendance ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> नोंद झाली आहे (Submitted)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> प्रलंबित (Pending)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              दैनिक विद्यार्थी उपस्थिती • Mark Daily Attendance
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              वर्गशिक्षकांनी दररोज आपल्या वर्गातील मुले व मुलींची स्वतंत्र उपस्थिती नोंदवावी.
            </p>
          </div>
        </div>

        {/* Date & Class Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              दिनांक (Date):
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              वर्ग (Class):
            </label>
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

      {isLoading ? (
        <CardSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                एकूण पटसंख्या (Total Strength)
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {totalEnrolled}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                मुले: {totalBoys} • मुली: {totalGirls}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 shadow-subtle">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                एकूण उपस्थित (Present Today)
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalPresent}
              </div>
              <span className="text-xs text-emerald-700/80 dark:text-emerald-300 font-medium">
                मुले: {boysPresent} • मुली: {girlsPresent}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 shadow-subtle">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-1">
                एकूण गैरहजर (Absent Today)
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {totalAbsent}
              </div>
              <span className="text-xs text-rose-700/80 dark:text-rose-300 font-medium">
                मुले: {boysAbsent} • मुली: {girlsAbsent}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/50 shadow-subtle">
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block mb-1">
                उपस्थिती टक्केवारी (Attendance %)
              </span>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                {percentage}%
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Main Counters Section: Boys & Girls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Boys Card */}
            <Card className="p-6 space-y-4 border-blue-200/80 dark:border-blue-900/50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xs">
                    मुले
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      मुलांची उपस्थिती (Boys Attendance)
                    </h3>
                    <p className="text-xs text-slate-400">एकूण मुले: {totalBoys}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">एकूण पट:</span>
                  <input
                    type="number"
                    min="0"
                    value={totalBoys}
                    onChange={(e) => {
                      const v = Math.max(0, parseInt(e.target.value) || 0);
                      setTotalBoys(v);
                      if (boysPresent > v) setBoysPresent(v);
                    }}
                    className="w-16 px-2 py-1 text-center font-bold text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    title="Change total registered boys in class"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  आज हजर असलेली मुले (Present Boys Count):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBoysPresent(Math.max(0, boysPresent - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="0"
                    max={totalBoys}
                    value={boysPresent}
                    onChange={(e) => {
                      const v = Math.min(totalBoys, Math.max(0, parseInt(e.target.value) || 0));
                      setBoysPresent(v);
                    }}
                    className="flex-1 px-4 py-2.5 text-center text-2xl font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setBoysPresent(Math.min(totalBoys, boysPresent + 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                  <span className="text-slate-500">गैरहजर मुले (Absent Boys):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {boysAbsent} मुले
                  </span>
                </div>
              </div>
            </Card>

            {/* Girls Card */}
            <Card className="p-6 space-y-4 border-pink-200/80 dark:border-pink-900/50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 font-black flex items-center justify-center text-xs">
                    मुली
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      मुलींची उपस्थिती (Girls Attendance)
                    </h3>
                    <p className="text-xs text-slate-400">एकूण मुली: {totalGirls}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400">एकूण पट:</span>
                  <input
                    type="number"
                    min="0"
                    value={totalGirls}
                    onChange={(e) => {
                      const v = Math.max(0, parseInt(e.target.value) || 0);
                      setTotalGirls(v);
                      if (girlsPresent > v) setGirlsPresent(v);
                    }}
                    className="w-16 px-2 py-1 text-center font-bold text-xs bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    title="Change total registered girls in class"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  आज हजर असलेली मुली (Present Girls Count):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGirlsPresent(Math.max(0, girlsPresent - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="0"
                    max={totalGirls}
                    value={girlsPresent}
                    onChange={(e) => {
                      const v = Math.min(totalGirls, Math.max(0, parseInt(e.target.value) || 0));
                      setGirlsPresent(v);
                    }}
                    className="flex-1 px-4 py-2.5 text-center text-2xl font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 focus:ring-2 focus:ring-pink-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setGirlsPresent(Math.min(totalGirls, girlsPresent + 1))}
                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                  <span className="text-slate-500">गैरहजर मुली (Absent Girls):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {girlsAbsent} मुली
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Remarks & Quick Actions */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                टीप / विशेष नोंद (Remarks / Reason for Absences):
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="उदा. आज काही विद्यार्थी आजारी असल्याने गैरहजर आहेत..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
              >
                सर्व हजर (All Present)
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {existingAttendance ? 'बदल जतन करा (Update Attendance)' : 'हजेरी जतन करा (Submit Attendance)'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
