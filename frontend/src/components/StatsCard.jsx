import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', trend, subtitle }) => {
  const colorMap = {
    indigo: {
      bg: 'from-indigo-500 to-indigo-600',
      light: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    emerald: {
      bg: 'from-emerald-500 to-emerald-600',
      light: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    rose: {
      bg: 'from-rose-500 to-rose-600',
      light: 'bg-rose-50 dark:bg-rose-900/20',
      text: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30'
    },
    amber: {
      bg: 'from-amber-500 to-amber-600',
      light: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30'
    },
    sky: {
      bg: 'from-sky-500 to-sky-600',
      light: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100 dark:bg-sky-900/30'
    },
    cyan: {
      bg: 'from-cyan-500 to-cyan-600',
      light: 'bg-cyan-50 dark:bg-cyan-900/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/30'
    }
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl
        bg-white dark:bg-slate-800/50
        border border-slate-200/60 dark:border-slate-700/40
        backdrop-blur-xl shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20
        p-5 group"
    >
      {/* Decorative gradient orb */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${c.bg} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${c.iconBg}`}>
          {Icon && <Icon className={`w-6 h-6 ${c.text}`} />}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
