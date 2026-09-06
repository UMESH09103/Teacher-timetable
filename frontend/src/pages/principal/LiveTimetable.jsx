import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { PERIOD_TIMINGS } from '../../constants';
import { Radio, Clock, School, User, Repeat, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const LiveTimetable = () => {
  const [liveData, setLiveData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const fetchLiveTimetable = async (period = null) => {
    try {
      setIsLoading(true);
      const url = period ? `/timetable/live?periodNumber=${period}` : '/timetable/live';
      const res = await api.get(url);
      if (res.data.success) {
        setLiveData(res.data);
        if (!selectedPeriod) {
          setSelectedPeriod(res.data.activePeriod);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live timetable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTimetable(selectedPeriod);
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, [selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* Live Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {liveData?.isHoliday ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> SUNDAY HOLIDAY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <Radio className="w-3.5 h-3.5" /> LIVE ON-AIR
                </span>
              )}
              <span className="text-xs text-slate-400">
                {liveData?.isHoliday ? 'साप्ताहिक शाळा सुट्टी (Weekly Holiday)' : 'School In Session'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {liveData?.isHoliday ? 'शाळा साप्ताहिक सुट्टी • Sunday Weekly Holiday' : 'Live School Timetable & Monitoring'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              {liveData?.isHoliday
                ? 'School is closed on Sunday. All classrooms are free and faculty members are off-duty. Regular classes resume Monday.'
                : "Real-time bird's-eye view of all classroom lectures, active substitute teachers, and coverage vacancies right now."}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-300 uppercase font-semibold block">
                Local Time
              </span>
              <span className="text-lg font-black tracking-tight text-white font-mono">
                {currentTime}
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-300 uppercase font-semibold block">
                Active Period
              </span>
              <span className="text-lg font-black tracking-tight text-brand-300">
                Period {liveData?.activePeriod || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Quick Nav Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Inspect School During:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {PERIOD_TIMINGS.map((p) => (
            <button
              key={p.period}
              onClick={() => setSelectedPeriod(p.period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === p.period
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              P{p.period}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLiveTimetable(selectedPeriod)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Classroom Status Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveData?.classes?.map((item) => {
            const classLabel = `${item.class.className}-${item.class.division}`;

            return (
              <Card
                key={item.class._id}
                className={`p-5 border transition-all duration-200 ${
                  item.status === 'substitute'
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20'
                    : item.status === 'pending'
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      Class {classLabel}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {item.roomNumber || item.class.roomNumber}
                    </span>
                  </div>

                  {item.status === 'normal' && (
                    <Badge variant="emerald" dot>
                      In Session
                    </Badge>
                  )}
                  {item.status === 'substitute' && (
                    <Badge variant="blue" dot>
                      Substitute
                    </Badge>
                  )}
                  {item.status === 'pending' && (
                    <Badge variant="amber" dot>
                      Sub Required
                    </Badge>
                  )}
                  {item.status === 'free' && (
                    <Badge variant="slate" dot>
                      Free Period
                    </Badge>
                  )}
                  {item.status === 'holiday' && (
                    <Badge variant="amber" dot>
                      साप्ताहिक सुट्टी
                    </Badge>
                  )}
                </div>

                {item.subject ? (
                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Subject:</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.subject.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {item.status === 'substitute' ? 'Substitute:' : 'Faculty:'}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {item.activeTeacher?.name || '—'}
                      </span>
                    </div>

                    {item.status === 'substitute' && (
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950/40 p-1.5 rounded-lg">
                        Original Faculty: {item.originalTeacher?.name}
                      </p>
                    )}

                    {item.status === 'pending' && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40 p-1.5 rounded-lg flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                        Teacher absent. Class awaiting supervisor.
                      </p>
                    )}
                  </div>
                ) : item.status === 'holiday' ? (
                  <div className="py-6 text-center text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-950/20 rounded-xl mt-3">
                    रविवार साप्ताहिक सुट्टी (Sunday Weekly Holiday)
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No lecture assigned for this period
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
