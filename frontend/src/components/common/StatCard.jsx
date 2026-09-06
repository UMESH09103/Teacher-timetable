import React from 'react';
import { Card } from '../ui/Card';
import { ArrowUpRight } from 'lucide-react';

export const StatCard = ({
  icon,
  label,
  value,
  subtext,
  badge,
  badgeVariant = 'slate',
  variant = 'brand',
  onClick
}) => {
  const variantStyles = {
    brand: {
      border: 'hover:border-brand-300 dark:hover:border-brand-700/60',
      glow: 'from-brand-500/10 via-indigo-500/5 to-transparent',
      topLine: 'bg-gradient-to-r from-brand-500 to-indigo-600',
      icon: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-200/80 dark:border-brand-800/60 shadow-sm shadow-brand-500/10'
    },
    emerald: {
      border: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
      glow: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      topLine: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60 shadow-sm shadow-emerald-500/10'
    },
    amber: {
      border: 'hover:border-amber-300 dark:hover:border-amber-700/60',
      glow: 'from-amber-500/10 via-orange-500/5 to-transparent',
      topLine: 'bg-gradient-to-r from-amber-500 to-orange-500',
      icon: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60 shadow-sm shadow-amber-500/10'
    },
    rose: {
      border: 'hover:border-rose-300 dark:hover:border-rose-700/60',
      glow: 'from-rose-500/10 via-pink-500/5 to-transparent',
      topLine: 'bg-gradient-to-r from-rose-500 to-pink-500',
      icon: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60 shadow-sm shadow-rose-500/10'
    },
    blue: {
      border: 'hover:border-blue-300 dark:hover:border-blue-700/60',
      glow: 'from-blue-500/10 via-cyan-500/5 to-transparent',
      topLine: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      icon: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60 shadow-sm shadow-blue-500/10'
    },
    purple: {
      border: 'hover:border-purple-300 dark:hover:border-purple-700/60',
      glow: 'from-purple-500/10 via-fuchsia-500/5 to-transparent',
      topLine: 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
      icon: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60 shadow-sm shadow-purple-500/10'
    }
  };

  const style = variantStyles[variant] || variantStyles.brand;

  return (
    <Card
      onClick={onClick}
      hoverEffect={false}
      className={`p-4 relative overflow-hidden transition-all duration-250 group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        onClick ? `cursor-pointer ${style.border}` : ''
      }`}
    >
      {/* Top micro gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-80 group-hover:opacity-100 transition-opacity ${style.topLine}`} />

      {/* Subtle ambient light gradient background on hover */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${style.glow} blur-xl pointer-events-none transition-all duration-300 group-hover:scale-150`} />

      <div className="flex items-start justify-between relative z-10">
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 duration-200 ${
            style.icon
          }`}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {badge && (
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              {badge}
            </span>
          )}
          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
          )}
        </div>
      </div>

      <div className="mt-3.5 relative z-10">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
          {value}
        </span>
        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider line-clamp-1">
          {label}
        </h4>
        {subtext && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium line-clamp-1">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
};
