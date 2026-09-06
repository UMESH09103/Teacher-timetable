import React from 'react';
import { TimetableCell } from './TimetableCell';
import { PERIOD_TIMINGS } from '../../constants';
import { sortClassesAsc } from '../../utils/sortUtils';

export const ClassView = ({ classes = [], timetableData = [], onSelectPendingSlot }) => {
  const sortedClasses = sortClassesAsc(classes);
  // Map timetable entries by classId + periodNumber
  const cellMap = new Map();
  timetableData.forEach((entry) => {
    const classId = entry.classId?._id || entry.classId;
    cellMap.set(`${classId}_${entry.periodNumber}`, entry);
  });

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-subtle">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <th className="p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider w-24 sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 backdrop-blur-sm">
              Class
            </th>
            {PERIOD_TIMINGS.map((p) => (
              <th
                key={p.period}
                className="p-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider min-w-[130px] border-l border-slate-200/60 dark:border-slate-800/60"
              >
                <div>P{p.period}</div>
                <div className="text-[10px] font-normal text-slate-400 mt-0.5 lowercase">
                  {p.startTime}–{p.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {sortedClasses.map((cls) => {
            const classLabel = `${cls.className}-${cls.division}`;
            return (
              <tr key={cls._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 font-bold text-xs text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                    {cls.displayName || classLabel}
                  </div>
                  <div className="text-[10px] font-normal text-slate-400 truncate mt-0.5">
                    {cls.roomNumber}
                  </div>
                </td>

                {PERIOD_TIMINGS.map((p) => {
                  const entry = cellMap.get(`${cls._id}_${p.period}`);
                  return (
                    <td
                      key={p.period}
                      className="p-2 border-l border-slate-100 dark:border-slate-800/60 align-top"
                    >
                      {entry ? (
                        <TimetableCell
                          subject={entry.subjectId}
                          teacher={entry.activeTeacher || entry.teacherId}
                          originalTeacher={entry.originalTeacher}
                          roomNumber={entry.roomNumber}
                          status={entry.status}
                          onClick={() => {
                            if (entry.status === 'pending' && onSelectPendingSlot) {
                              onSelectPendingSlot(entry);
                            }
                          }}
                        />
                      ) : (
                        <TimetableCell status="free" compact />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
