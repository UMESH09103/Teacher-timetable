import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PERIOD_TIMINGS } from '../../constants';
import { Clock, User, Repeat, AlertTriangle, CheckCircle2, Search, Filter } from 'lucide-react';
import { sortClassesAsc } from '../../utils/sortUtils';

export const PeriodView = ({
  classes = [],
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
  periodEntries.forEach((e) => {
    const cid = e.classId?._id || e.classId;
    entryMap.set(cid, e);
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

  // Filter
  const filtered = classCards.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const cName = `${item.class.className}-${item.class.division}`.toLowerCase();
      const sName = item.entry?.subjectId?.name?.toLowerCase() || '';
      const tName = (item.entry?.activeTeacher?.name || item.entry?.teacherId?.name || '').toLowerCase();
      return cName.includes(q) || sName.includes(q) || tName.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Period Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              PERIOD {activePeriod} ({currentTiming.startTime} – {currentTiming.endTime})
            </h4>
            <p className="text-xs text-slate-400">Classrooms status across the school</p>
          </div>
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIOD_TIMINGS.map((p) => (
            <button
              key={p.period}
              onClick={() => onPeriodChange(p.period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'normal', 'substitute', 'pending', 'free'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by class, subject, teacher..."
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(({ class: cls, entry, status }) => {
          const classLabel = `${cls.className}-${cls.division}`;

          return (
            <Card
              key={cls._id}
              className={`p-4 transition-all duration-200 border ${
                status === 'pending'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                  : status === 'substitute'
                  ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10'
                  : 'border-slate-200 dark:border-slate-800'
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
                      {entry.subjectId?.name || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Teacher:</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {entry.activeTeacher?.name || entry.teacherId?.name || '—'}
                    </span>
                  </div>

                  {status === 'substitute' && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg">
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
    </div>
  );
};
