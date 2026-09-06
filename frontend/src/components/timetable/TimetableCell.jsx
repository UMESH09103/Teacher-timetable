import React from 'react';
import { User, Repeat, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const TimetableCell = ({
  subject,
  teacher,
  originalTeacher,
  roomNumber,
  status = 'normal', // 'normal' | 'substitute' | 'pending' | 'free'
  onClick,
  compact = false
}) => {
  if (status === 'free' || !subject) {
    return (
      <div
        className={`h-full min-h-[90px] p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center ${
          compact ? 'min-h-[70px] p-1.5' : ''
        }`}
      >
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> FREE
        </span>
      </div>
    );
  }

  const statusStyles = {
    normal: 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-slate-900',
    substitute: 'border-blue-300 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-400',
    pending: 'border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400 cursor-pointer shadow-sm hover:shadow'
  };

  return (
    <div
      onClick={onClick}
      className={`h-full min-h-[95px] p-3 rounded-xl border shadow-subtle flex flex-col justify-between transition-all duration-150 relative group ${
        statusStyles[status] || statusStyles.normal
      } ${compact ? 'min-h-[75px] p-2' : ''}`}
    >
      {/* Top: Subject & Status badge */}
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <span
            className="font-bold text-xs text-slate-900 dark:text-white truncate"
            title={subject?.name}
          >
            {subject?.marathiName || subject?.name || 'Subject'}
          </span>
          {status === 'normal' && (
            <Badge variant="emerald" size="sm" dot>
              Normal
            </Badge>
          )}
          {status === 'substitute' && (
            <Badge variant="blue" size="sm" dot>
              Sub
            </Badge>
          )}
          {status === 'pending' && (
            <Badge variant="amber" size="sm" dot>
              Needs Sub
            </Badge>
          )}
        </div>

        {/* Teacher display */}
        {status === 'substitute' ? (
          <div className="space-y-0.5">
            <p
              className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 truncate"
              title={`Substitute: ${teacher?.name || ''}`}
            >
              <Repeat className="w-3 h-3 text-blue-500 shrink-0" />
              {teacher?.shortName || teacher?.name || 'Substitute'}
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={`Original: ${originalTeacher?.name || ''}`}>
              Orig: {originalTeacher?.shortName || originalTeacher?.name || 'Teacher'}
            </p>
          </div>
        ) : status === 'pending' ? (
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
              Pending Assignment
            </p>
            <p className="text-[10px] text-slate-400 truncate" title={`Absent: ${originalTeacher?.name || ''}`}>
              Orig: {originalTeacher?.shortName || originalTeacher?.name || 'Absent'}
            </p>
          </div>
        ) : (
          <p
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate"
            title={teacher?.name}
          >
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            {teacher?.shortName || teacher?.name || 'Teacher'}
          </p>
        )}
      </div>

      {/* Bottom: Room Number */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>{roomNumber || 'Room —'}</span>
        {status === 'pending' && (
          <span className="text-brand-600 dark:text-brand-400 font-semibold group-hover:underline">
            Assign →
          </span>
        )}
      </div>
    </div>
  );
};
