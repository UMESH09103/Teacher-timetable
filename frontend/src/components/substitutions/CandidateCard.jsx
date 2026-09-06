import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, CheckCircle2, AlertCircle, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export const CandidateCard = ({
  candidate,
  onAssign,
  isAssigning = false
}) => {
  const { teacher, score, matchPercentage, workloadToday, reasons, isBestMatch } = candidate;

  // Determine color theme based on score/percentage
  const isHighMatch = matchPercentage >= 80;
  const isMidMatch = matchPercentage >= 60;

  return (
    <Card
      className={`p-5 transition-all duration-200 border ${
        isBestMatch
          ? 'ring-2 ring-brand-500/40 border-brand-500/60 bg-gradient-to-br from-brand-50/40 to-white dark:from-brand-950/20 dark:to-slate-900 shadow-md'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Header with Match % and Best Match Pill */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={teacher} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {teacher.name}
              </h4>
              {isBestMatch && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                  <Star className="w-3 h-3 fill-current" /> Best Match
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {teacher.subjects?.map((s) => s.name).join(', ') || 'Faculty'} • {teacher.employeeId}
            </p>
          </div>
        </div>

        {/* Match Percentage Pill */}
        <div className="text-right shrink-0">
          <span
            className={`text-lg font-black block leading-none ${
              isHighMatch
                ? 'text-emerald-600 dark:text-emerald-400'
                : isMidMatch
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {matchPercentage}%
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase">
            Match
          </span>
        </div>
      </div>

      {/* Reasons Checklist (Why recommended) */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-xl">
        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
          Match Breakdown & Availability
        </p>
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            {r.positive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span
              className={`leading-snug ${
                r.positive
                  ? 'text-slate-700 dark:text-slate-200 font-medium'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {r.text}
            </span>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Today's Load: <strong>{workloadToday}</strong> pds</span>
        </div>

        <Button
          size="sm"
          variant={isBestMatch ? 'primary' : 'outline'}
          isLoading={isAssigning}
          onClick={() => onAssign(candidate)}
        >
          Assign Substitute
        </Button>
      </div>
    </Card>
  );
};
