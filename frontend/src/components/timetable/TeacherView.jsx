import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SearchInput } from '../ui/SearchInput';
import { PERIOD_TIMINGS } from '../../constants';
import { User, CheckCircle2, AlertCircle, ArrowDown, Clock, BookOpen, School } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const TeacherView = ({ teachers = [], timetableData = [] }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    teachers[0]?._id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTeacher = teachers.find((t) => t._id === selectedTeacherId) || teachers[0];

  // Map periods for active teacher today
  const teacherPeriodsMap = new Map();
  timetableData.forEach((entry) => {
    // Check either regular or assigned substitute
    const isRegular = entry.teacherId?._id === activeTeacher?._id;
    const isSub = entry.activeTeacher?._id === activeTeacher?._id && entry.status === 'substitute';
    if (isRegular || isSub) {
      teacherPeriodsMap.set(entry.periodNumber, {
        ...entry,
        isSubstituteDuty: isSub
      });
    }
  });

  const scheduledCount = Array.from(teacherPeriodsMap.values()).length;
  const freeCount = Math.max(0, 8 - scheduledCount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Teacher Selector */}
      <Card className="lg:col-span-1 p-4 flex flex-col h-[650px]">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Select Teacher
        </h4>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search teacher..."
          className="mb-3"
        />

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTeachers.map((teacher) => {
            const isSelected = teacher._id === activeTeacher?._id;
            return (
              <div
                key={teacher._id}
                onClick={() => setSelectedTeacherId(teacher._id)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <UserAvatar user={teacher} size="md" />
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {teacher.name} {teacher.shortName ? `(${teacher.shortName})` : ''}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {teacher.designation || teacher.subjects?.map((s) => s.marathiName || s.name).join(', ') || 'उपशिक्षक'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {teacher.todayLoad || 0} pds
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Right Column: Teacher Profile & Daily Timeline */}
      <div className="lg:col-span-2 space-y-6">
        {activeTeacher ? (
          <>
            {/* Teacher Profile Summary Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <UserAvatar user={activeTeacher} size="xl" className="rounded-2xl shadow-md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {activeTeacher.name} {activeTeacher.shortName && <span className="text-slate-400 font-normal">({activeTeacher.shortName})</span>}
                      </h3>
                      <Badge variant="indigo" size="sm">
                        {activeTeacher.designation || activeTeacher.employeeId}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {activeTeacher.subjects?.map((s) => s.name).join(' • ') || 'Faculty Member'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-center">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {scheduledCount}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Periods Today
                    </span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {freeCount}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                      Free Periods
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Daily Timeline */}
            <Card className="p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                Today's Timeline & Schedule
              </h4>

              <div className="space-y-3">
                {PERIOD_TIMINGS.map((p, idx) => {
                  const entry = teacherPeriodsMap.get(p.period);
                  const isFree = !entry;

                  return (
                    <React.Fragment key={p.period}>
                      <div
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isFree
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : entry.isSubstituteDuty
                            ? 'border-blue-300 dark:border-blue-900/80 bg-blue-50/40 dark:bg-blue-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle'
                        }`}
                      >
                        {/* Period & Timing */}
                        <div className="flex items-center gap-4 min-w-[140px]">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                            P{p.period}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                              {p.startTime} – {p.endTime}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-4">
                          {isFree ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                FREE PERIOD
                              </span>
                              <span className="text-xs text-slate-400 hidden sm:inline">
                                (Available for substitute duty)
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center gap-1">
                                <School className="w-3.5 h-3.5" />
                                {entry.classId?.displayName || `Class ${entry.classId?.className}-${entry.classId?.division}`}
                              </span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                {entry.subjectId?.marathiName || entry.subjectId?.name}
                              </span>
                              <span className="text-xs text-slate-400">
                                {entry.roomNumber}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isFree ? (
                            <Badge variant="emerald" dot>
                              Free
                            </Badge>
                          ) : entry.isSubstituteDuty ? (
                            <Badge variant="blue" dot>
                              Substitute Duty
                            </Badge>
                          ) : (
                            <Badge variant="indigo" dot>
                              Regular
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Timeline connecting arrow */}
                      {idx < PERIOD_TIMINGS.length - 1 && (
                        <div className="flex justify-center -my-1">
                          <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </Card>
          </>
        ) : (
          <div className="p-8 text-center text-slate-400">Select a teacher to view timeline</div>
        )}
      </div>
    </div>
  );
};
