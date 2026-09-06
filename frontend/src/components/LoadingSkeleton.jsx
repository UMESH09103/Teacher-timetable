const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const cards = [...Array(count)];

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-5 animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden animate-pulse">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/40">
          <div className="h-9 w-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 flex-1 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6" />
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
