import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import { PERIOD_TIMINGS } from '../../constants';
import {
  Clock,
  School,
  BookOpen,
  Repeat,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Bell,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import api from '../../services/api';
import { UserAvatar } from '../../components/common/UserAvatar';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [teacherData, setTeacherData] = useState(null);
  const [assignedSubs, setAssignedSubs] = useState([]);
  const [classTeacherOf, setClassTeacherOf] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const teacherId = user?.teacherId?._id || user?.teacherId;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTeacherPortalData = async () => {
    if (!teacherId) return;
    try {
      setIsLoading(true);
      const [tRes, subRes, cRes] = await Promise.all([
        api.get(`/teachers/${teacherId}?date=${selectedDate}`),
        api.get(`/substitutions?teacherId=${teacherId}`),
        api.get('/classes')
      ]);

      if (tRes.data.success) setTeacherData(tRes.data.data);
      if (subRes.data.success) {
        // Filter substitutions assigned to this teacher
        const subsForMe = subRes.data.data.filter(
          (s) => s.substituteTeacherId?._id === teacherId || s.substituteTeacherId === teacherId
        );
        setAssignedSubs(subsForMe);
      }
      if (cRes.data.success) {
        const myClass = cRes.data.data.find(
          (c) => c.classTeacher?._id === teacherId || c.classTeacher === teacherId
        );
        setClassTeacherOf(myClass || null);
        if (myClass) {
          try {
            const attRes = await api.get(`/attendance/check?date=${selectedDate}&classId=${myClass._id}`);
            if (attRes.data.success) {
              setAttendanceStatus(attRes.data.exists ? attRes.data.data : null);
            }
          } catch (e) {
            // silent ignore
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherPortalData();
  }, [teacherId, selectedDate]);

  const handleMarkCompleted = async (subId) => {
    setUpdatingId(subId);
    try {
      const res = await api.put(`/substitutions/${subId}/status`, {
        status: 'completed'
      });
      if (res.data.success) {
        success('Class substitution marked as completed. Thank you!');
        fetchTeacherPortalData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Find next upcoming class from schedule
  const schedule = teacherData?.schedule || [];
  const nextClass = schedule[0] || null;
  const isSunday = teacherData?.isHoliday || new Date(selectedDate).getDay() === 0;

  // Substitutions strictly for selectedDate
  const todaySubs = isSunday
    ? []
    : assignedSubs.filter((s) => s.date === selectedDate && s.status !== 'cancelled');

  // Active substitutions for selectedDate that need to be taught
  const activeTodaySubs = todaySubs.filter((s) => s.status === 'assigned');

  // Upcoming substitutions for future dates (e.g. tomorrow Monday)
  const upcomingSubs = assignedSubs.filter(
    (s) => s.date > selectedDate && s.status === 'assigned'
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Sunday Holiday Banner */}
      {isSunday && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                आज रविवार आहे - साप्ताहिक शाळा सुट्टी (Sunday Weekly Holiday)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white tracking-wide">
                  WEEKLY OFF
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                School is closed today. No regular lectures or substitution duties. Regular classes resume on Monday (सोमवार).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            सोमवारचे वेळापत्रक पहा (View Monday) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Greeting & Date Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-3.5">
          <UserAvatar user={user} size="xl" className="rounded-2xl shadow-md" />
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Good Morning, {user?.name || 'Faculty'} 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Employee ID: <strong>{teacherData?.employeeId}</strong> • Selected Date:{' '}
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Date Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              आज (Today)
            </button>
            <button
              onClick={() => {
                const d = new Date();
                const daysUntilMon = (1 + 7 - d.getDay()) % 7 || 7;
                d.setDate(d.getDate() + daysUntilMon);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDate === '2026-09-07'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              सोमवार (Monday)
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />

          <div className="px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-center">
            <span className="text-base font-black text-brand-600 dark:text-brand-400">
              {isSunday ? 0 : schedule.length}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Classes
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
            <span className="text-base font-black text-blue-600 dark:text-blue-400">
              {activeTodaySubs.length}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Today's Subs
            </span>
          </div>
        </div>
      </div>

      {/* TODAY'S ACTIVE SUBSTITUTION ALERT (Only if assigned for selectedDate!) */}
      {activeTodaySubs.map((sub) => (
        <div
          key={sub._id}
          className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 border-2 border-blue-300 dark:border-blue-800 shadow-md animate-in slide-in-from-top-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 mb-1">
                  TODAY'S SUBSTITUTION DUTY • आजचा तासिका बदल
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Period {sub.periodNumber}: Class {sub.classId?.displayName || `${sub.classId?.className}-${sub.classId?.division}`} ({sub.subjectId?.marathiName || sub.subjectId?.name})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Original Faculty: <strong>{sub.originalTeacherId?.name}</strong> • Room: <strong>{sub.roomNumber || sub.classId?.roomNumber}</strong> • Date: <strong>{sub.date}</strong>
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              isLoading={updatingId === sub._id}
              onClick={() => handleMarkCompleted(sub._id)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Mark Completed
            </Button>
          </div>
        </div>
      ))}

      {/* UPCOMING FUTURE SUBSTITUTION ALERT (e.g. Assigned for Monday while today is Sunday) */}
      {upcomingSubs.length > 0 && activeTodaySubs.length === 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  UPCOMING DUTY • आगामी तासिका बदल
                </span>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {upcomingSubs[0].date} ({new Date(upcomingSubs[0].date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })})
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Period {upcomingSubs[0].periodNumber}: Class {upcomingSubs[0].classId?.displayName || `${upcomingSubs[0].classId?.className}-${upcomingSubs[0].classId?.division}`} ({upcomingSubs[0].subjectId?.marathiName || upcomingSubs[0].subjectId?.name})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Covering for {upcomingSubs[0].originalTeacherId?.name} • Room: {upcomingSubs[0].roomNumber || upcomingSubs[0].classId?.roomNumber}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedDate(upcomingSubs[0].date)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            या दिवसाचे वेळापत्रक पहा (View {upcomingSubs[0].date}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CLASS TEACHER ATTENDANCE QUICK ACTION */}
      {classTeacherOf && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  वर्गशिक्षक जबाबदारी • Class Teacher Portal
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {classTeacherOf.displayName || `इयत्ता ${classTeacherOf.className}-${classTeacherOf.division}`}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                दैनिक विद्यार्थी उपस्थिती (Daily Attendance)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                एकूण विद्यार्थी: <strong>{classTeacherOf.totalStudents || (classTeacherOf.boysCount + classTeacherOf.girlsCount) || 45}</strong> (मुलगे: {classTeacherOf.boysCount || 25}, मुली: {classTeacherOf.girlsCount || 20})
                {attendanceStatus ? (
                  <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                    • आजची उपस्थिती: {attendanceStatus.totalPresent} हजर ({attendanceStatus.percentage || Math.round((attendanceStatus.totalPresent / (classTeacherOf.totalStudents || 45)) * 100)}%)
                  </span>
                ) : (
                  <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">
                    • आजची हजेरी अजून नोंदवलेली नाही (Pending)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate('/teacher/category-strength')}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              वर्ग प्रवर्ग संख्या
            </button>
            <button
              onClick={() => navigate('/teacher/attendance/history')}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              हजेरी अहवाल
            </button>
            <button
              onClick={() => navigate('/teacher/attendance/mark')}
              className={`px-4 py-2 rounded-xl text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all ${
                attendanceStatus
                  ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 animate-pulse'
              }`}
            >
              {attendanceStatus ? 'हजेरी पहा / बदला' : 'हजेरी नोंदवा (Mark Now)'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Next Class Highlight (Section 27) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isSunday ? (
          <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white border-0 shadow-xl shadow-amber-500/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-200 block mb-2">
                WEEKLY STATUS
              </span>
              <div className="text-2xl font-black mb-1">
                रविवार साप्ताहिक सुट्टी
              </div>
              <p className="text-xs text-amber-100 font-medium mb-6">
                Sunday Weekly Holiday • School Closed
              </p>

              <div className="space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs">
                <p className="text-amber-100 leading-relaxed">
                  आज शाळेला साप्ताहिक सुट्टी आहे. आपले नियमित वर्ग उद्या म्हणजेच सोमवारी नेहमीप्रमाणे सुरू होतील.
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between font-bold text-white">
                  <span>Next Working Day:</span>
                  <span>सोमवार (Monday)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-amber-200 font-semibold">
              <span>Weekly Rest & Recharge</span>
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            </div>
          </Card>
        ) : nextClass ? (
          <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-brand-600 to-indigo-700 text-white border-0 shadow-xl shadow-brand-500/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-200 block mb-2">
                NEXT UPCOMING LECTURE
              </span>
              <div className="text-3xl font-black mb-1">
                Period {nextClass.periodNumber}
              </div>
              <p className="text-xs text-brand-100 font-mono mb-6">
                {nextClass.startTime} – {nextClass.endTime}
              </p>

              <div className="space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-100">Class:</span>
                  <span className="text-sm font-extrabold">
                    Class {nextClass.classId?.className}-{nextClass.classId?.division}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-100">Subject:</span>
                  <span className="text-sm font-bold">
                    {nextClass.subjectId?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-100">Room:</span>
                  <span className="text-sm font-bold font-mono">
                    {nextClass.roomNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-200">
              <span>Ready for instruction</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </Card>
        ) : null}

        {/* Today's Timeline */}
        <Card className={`${nextClass || isSunday ? 'lg:col-span-2' : 'lg:col-span-3'} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Schedule & Periods for{' '}
              <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </h3>
            {isSunday && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                साप्ताहिक सुट्टी
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {PERIOD_TIMINGS.map((p) => {
              // 1. If Sunday, it is ALWAYS a weekly holiday for all periods!
              if (isSunday) {
                return (
                  <div
                    key={p.period}
                    className="p-3 rounded-xl border border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
                        P{p.period}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">
                        साप्ताहिक शाळा सुट्टी • Sunday Holiday ({p.startTime}–{p.endTime})
                      </span>
                    </div>
                    <Badge variant="amber" dot size="sm">
                      सुट्टी
                    </Badge>
                  </div>
                );
              }

              // 2. Only check substitutions matching selectedDate!
              const subDuty = todaySubs.find((s) => s.periodNumber === p.period);
              if (subDuty) {
                return (
                  <div
                    key={p.period}
                    className="p-3.5 rounded-xl border border-blue-300 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                        P{p.period}
                      </span>
                      <div>
                        <span className="font-extrabold text-blue-900 dark:text-blue-200 block">
                          Substitute: {subDuty.classId?.displayName || `Class ${subDuty.classId?.className}-${subDuty.classId?.division}`} ({subDuty.subjectId?.marathiName || subDuty.subjectId?.name})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.startTime}–{p.endTime} • Covering for {subDuty.originalTeacherId?.shortName || subDuty.originalTeacherId?.name} • Room: {subDuty.roomNumber || subDuty.classId?.roomNumber}
                        </span>
                      </div>
                    </div>

                    <Badge variant={subDuty.status === 'completed' ? 'emerald' : 'blue'} dot>
                      {subDuty.status === 'completed' ? 'Completed' : 'Duty Assigned'}
                    </Badge>
                  </div>
                );
              }

              // 3. Regular class from timetable
              const regularEntry = schedule.find((s) => s.periodNumber === p.period);
              if (regularEntry) {
                return (
                  <div
                    key={p.period}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs">
                        P{p.period}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {regularEntry.classId?.displayName || `Class ${regularEntry.classId?.className}-${regularEntry.classId?.division}`} • {regularEntry.subjectId?.marathiName || regularEntry.subjectId?.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.startTime}–{p.endTime} • {regularEntry.roomNumber}
                        </span>
                      </div>
                    </div>

                    <Badge variant="indigo" dot>
                      Regular Lecture
                    </Badge>
                  </div>
                );
              }

              // 4. Free period
              return (
                <div
                  key={p.period}
                  className="p-2.5 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between text-xs text-slate-500"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-semibold flex items-center justify-center text-xs">
                      P{p.period}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      FREE PERIOD ({p.startTime}–{p.endTime})
                    </span>
                  </div>
                  <Badge variant="emerald" dot size="sm">
                    Available
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
