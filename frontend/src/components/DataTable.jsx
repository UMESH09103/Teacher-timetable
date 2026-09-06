import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

const DataTable = ({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  pagination = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  emptyMessage = 'No data found',
  actions
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    if (onSearch) onSearch(value);
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 backdrop-blur-xl shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20 overflow-hidden">
      {/* Header with Search and Actions */}
      {(searchable || actions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-200/60 dark:border-slate-700/40">
          {searchable && (
            <div className="relative w-full sm:w-72">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm
                  bg-slate-50 dark:bg-slate-900/50
                  border border-slate-200 dark:border-slate-700
                  text-slate-900 dark:text-white
                  placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                  transition-all duration-200"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/30">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={row._id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/40">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${currentPage === page
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
