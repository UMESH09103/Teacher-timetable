import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PERIOD_TIMINGS } from '../../constants';
import { 
  Clock, 
  User, 
  Repeat, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  UserCheck, 
  School, 
  BookOpen, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { sortClassesAsc } from '../../utils/sortUtils';

export const PeriodView = ({
  classes = [],
  teachers = [],
  timetableData = [],
  activePeriod = 1,
  onPeriodChange,
  onAssignSubstitute
}) => {
  const sortedClasses = sortClassesAsc(classes);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const currentTiming = PERIOD_TIMINGS.find((p) => p.period === activePeriod) || PERIOD_TIMINGS[0];

  // Map period entries by classId
  const periodEntries = timetableData.filter((e) => e.periodNumber === activePeriod);
  const entryMap = new Map();
  const busyTeacherIds = new Set();
  const pendingEntries = [];

  periodEntries.forEach((e) => {
    const cid = e.classId?._id || e.classId;
    entryMap.set(cid, e);

    if (e.status === 'pending') {
      pendingEntries.push(e);
    }

    // A teacher actively in classroom (regular or assigned substitute)
    const activeTid = (e.activeTeacher?._id || e.teacherId?._id || e.activeTeacher || e.teacherId)?.toString();
    if (activeTid && e.status !== 'pending') {
      busyTeacherIds.add(activeTid);
    }
  });

  // Combine with classes
  const classCards = sortedClasses.map((cls) => {
    const entry = entryMap.get(cls._id);
    return {
      class: cls,
      entry: entry || null,
      status: entry ? entry.status : 'free'
    };
  });

  // Identify Free / Available Teachers in this active period
  const freeTeachers = teachers.filter((t) => {
    const tId = (t._id || t.id)?.toString();
    if (busyTeacherIds.has(tId)) return false;

    // Check if teacher is absent during this period
    if (t.isAbsentToday) {
      const affected = t.absenceDetails?.affectedPeriods || [];
      if (affected.length === 0 || affected.includes(activePeriod)) {
        return false;
      }
    }
    return true;
  });

  // Class & Teacher counts
  const freeClassesCount = classCards.filter((c) => c.status === 'free').length;
  const counts = {
    all: classCards.length,
    normal: classCards.filter((c) => c.status === 'normal').length,
    substitute: classCards.filter((c) => c.status === 'substitute').length,
    pending: classCards.filter((c) => c.status === 'pending').length,
    free: freeTeachers.length + freeClassesCount
  };

  // Filter classrooms based on status & search
  const filteredClasses = classCards.filter((item) => {
    if (statusFilter !== 'all' && statusFilter !== 'free' && item.status !== statusFilter) return false;
    if (statusFilter === 'free' && item.status !== 'free') return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const cName = `${item.class.className}-${item.class.division}`.toLowerCase();
      const sName = item.entry?.subjectId?.name?.toLowerCase() || '';
      const tName = (item.entry?.activeTeacher?.name || item.entry?.teacherId?.name || '').toLowerCase();
      return cName.includes(q) || sName.includes(q) || tName.includes(q);
    }
    return true;
  });

  // Filter free teachers by search
  const filteredFreeTeachers = freeTeachers.filter((t) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    const tName = (t.name || '').toLowerCase();
    const sName = (t.shortName || '').toLowerCase();
    const dName = (t.designation || '').toLowerCase();
    const subjects = (t.subjects || []).map((s) => (s.marathiName || s.name || '').toLowerCase()).join(' ');
    return tName.includes(q) || sName.includes(q) || dName.includes(q) || subjects.includes(q);
  });

  const filterTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'normal', label: 'Normal', count: counts.normal },
    { id: 'substitute', label: 'Substitute', count: counts.substitute },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'free', label: 'Free (मोकळे)', count: counts.free }
  ];

  return (
    <div className="space-y-5">
      {/* Period Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              PERIOD {activePeriod} ({currentTiming.startTime} – {currentTiming.endTime})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              सर्व वर्गांची सद्यस्थिती व या तासिकेत उपलब्ध असणारे शिक्षक
            </p>
          </div>
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIOD_TIMINGS.map((p) => (
            <button
              key={p.period}
              onClick={() => onPeriodChange(p.period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePeriod === p.period
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20 scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              P{p.period}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Insight Ribbon (shown when in 'all' view) */}
      {statusFilter === 'all' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border border-emerald-200/70 dark:border-emerald-900/40 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              तासिका <span className="font-black text-slate-900 dark:text-white">क्र. {activePeriod}</span> :{' '}
              <span className="font-bold text-slate-900 dark:text-white">{counts.normal + counts.substitute}</span> वर्ग भरले आहेत •{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{freeTeachers.length} शिक्षक</span> मोकळे (उपलब्ध) आहेत.
            </p>
          </div>
          {freeTeachers.length > 0 && (
            <button
              onClick={() => setStatusFilter('free')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs transition-all shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{freeTeachers.length} मोकळे शिक्षक पहा</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <div className="flex items-center gap-1.5">
            {filterTabs.map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm scale-102'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    statusFilter === st.id
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900 font-black'
                      : st.id === 'free' && st.count > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by teacher, subject, class..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. FREE VIEW (Shows Free Teachers & Any Free Classrooms)       */}
      {/* ------------------------------------------------------------- */}
      {statusFilter === 'free' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner for Free View */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    तासिका क्र. {activePeriod} मधील मोकळे (उपलब्ध) शिक्षक
                  </h3>
                  <Badge variant="emerald" size="sm" dot>
                    {filteredFreeTeachers.length} Available
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  वेळ: <span className="font-bold text-slate-900 dark:text-white">{currentTiming.startTime} – {currentTiming.endTime}</span> • हे शिक्षक या तासिकेत कोणत्याही वर्गावर शिकवत नाहीत व बदली तासिका (Substitution) साठी उपलब्ध आहेत.
                </p>
              </div>
            </div>

            {pendingEntries.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{pendingEntries.length} तासिका बदलीची वाट पाहत आहेत!</span>
              </div>
            )}
          </div>

          {/* Free Teachers Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                उपलब्ध शिक्षक यादी (Free Faculty • {filteredFreeTeachers.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Period {activePeriod} Free Faculty
              </span>
            </div>

            {filteredFreeTeachers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFreeTeachers.map((teacher) => (
                  <Card
                    key={teacher._id}
                    className="p-4.5 border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-900 dark:via-emerald-950/10 dark:to-slate-900 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={teacher} size="md" className="rounded-xl shadow-xs" />
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {teacher.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {teacher.designation || 'उपशिक्षक'} {teacher.shortName && `(${teacher.shortName})`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="emerald" size="sm" dot>
                        मोकळा तास
                      </Badge>
                    </div>

                    {/* Subject Tags */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        teacher.subjects.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {sub.marathiName || sub.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">सर्व विषय</span>
                      )}
                    </div>

                    {/* Footer Info & Action */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">
                        आजचे एकूण तास:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {teacher.todayLoad || 0} / 8
                        </strong>
                      </span>

                      {pendingEntries.length > 0 && onAssignSubstitute ? (
                        <Button
                          size="xs"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => onAssignSubstitute(pendingEntries[0])}
                        >
                          बदली द्या
                        </Button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          Available
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                {searchFilter
                  ? `"${searchFilter}" नावाने कोणताही मोकळा शिक्षक सापडला नाही.`
                  : `तासिका क्र. ${activePeriod} मध्ये सर्व शिक्षक व्यस्त आहेत.`}
              </div>
            )}
          </div>

          {/* Free Classrooms (if any) */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-4 h-4 text-slate-500" />
                मोकळे वर्ग (Free Classrooms • {filteredClasses.length})
              </h4>
            </div>

            {filteredClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredClasses.map(({ class: cls }) => (
                  <Card key={cls._id} className="p-4 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <span className="text-base font-black text-slate-900 dark:text-white block">
                      {cls.displayName || `${cls.className}-${cls.division}`}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">{cls.roomNumber}</span>
                    <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      कोणतीही तासिका नाही (Free Period)
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 text-xs flex items-center gap-2.5 font-medium">
                <Info className="w-4 h-4 text-brand-500 shrink-0" />
                <span>
                  सर्व {sortedClasses.length} वर्गांमध्ये नियमित तासिका सुरू आहेत (All classrooms have scheduled lectures in Period {activePeriod}). कोणताही वर्ग रिकामा नाही.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REGULAR / SUBSTITUTE / PENDING / ALL CLASS CARDS GRID       */}
      {/* ------------------------------------------------------------- */}
      {statusFilter !== 'free' && (
        <>
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
              {filteredClasses.map(({ class: cls, entry, status }) => {
                const classLabel = `${cls.className}-${cls.division}`;

                return (
                  <Card
                    key={cls._id}
                    className={`p-4 transition-all duration-200 border ${
                      status === 'pending'
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                        : status === 'substitute'
                        ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {cls.displayName || classLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{cls.roomNumber}</span>
                      </div>
                      {status === 'normal' && (
                        <Badge variant="emerald" dot>
                          Normal
                        </Badge>
                      )}
                      {status === 'substitute' && (
                        <Badge variant="blue" dot>
                          Substitute
                        </Badge>
                      )}
                      {status === 'pending' && (
                        <Badge variant="amber" dot>
                          Sub Pending
                        </Badge>
                      )}
                      {status === 'free' && (
                        <Badge variant="slate" dot>
                          Free Slot
                        </Badge>
                      )}
                    </div>

                    {entry ? (
                      <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Subject:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {entry.subjectId?.marathiName || entry.subjectId?.name || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Teacher:</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {entry.activeTeacher?.name || entry.teacherId?.name || '—'}
                          </span>
                        </div>

                        {status === 'substitute' && (
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg font-medium">
                            Covering for: {entry.originalTeacher?.name}
                          </p>
                        )}

                        {status === 'pending' && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="primary"
                              className="w-full"
                              onClick={() => onAssignSubstitute && onAssignSubstitute(entry)}
                            >
                              Find Substitute
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-400 font-medium">
                        No scheduled lecture
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Empty state when 0 matches */
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                कोणताही वर्ग आढळला नाही
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {statusFilter !== 'all'
                  ? `तासिका क्र. ${activePeriod} मध्ये "${statusFilter}" स्थिती असलेला एकही वर्ग नाही.`
                  : `दिलेल्या शोध संज्ञेशी जुळणारा वर्ग नाही.`}
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchFilter('');
                  }}
                >
                  सर्व वर्ग पहा (Show All Classes)
                </Button>
              </div>
            </div>
          )}

          {/* Bottom Free Teachers Strip when on 'all' view */}
          {statusFilter === 'all' && freeTeachers.length > 0 && (
            <div className="mt-8 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    या तासिकेत मोकळे असणारे शिक्षक ({freeTeachers.length} Available Faculty in Period {activePeriod})
                  </h4>
                </div>
                <button
                  onClick={() => setStatusFilter('free')}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <span>तपशील पहा</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {freeTeachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    onClick={() => setStatusFilter('free')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/60 cursor-pointer transition-all"
                  >
                    <UserAvatar user={teacher} size="xs" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {teacher.shortName || teacher.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
