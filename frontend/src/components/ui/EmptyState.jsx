import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 mb-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button onClick={onAction} leftIcon={actionIcon} size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};
