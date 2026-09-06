import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { HiOutlineSun, HiOutlineMoon, HiOutlineBell, HiOutlineBars3 } from 'react-icons/hi2';
import LanguageSwitcher from './LanguageSwitcher';

const TopBar = ({ title, onMenuClick }) => {
  const { darkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
      border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800
            md:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <HiOutlineBars3 className="w-6 h-6" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800
            hover:bg-slate-200 dark:hover:bg-slate-700
            text-slate-600 dark:text-slate-400
            transition-all duration-200"
          aria-label={t('topbar.toggleTheme', 'Toggle theme')}
        >
          {darkMode ? (
            <HiOutlineSun className="w-5 h-5 text-amber-400" />
          ) : (
            <HiOutlineMoon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800
            hover:bg-slate-200 dark:hover:bg-slate-700
            text-slate-600 dark:text-slate-400
            transition-all duration-200 relative"
          aria-label={t('topbar.notifications', 'Notifications')}
        >
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar & Profile Link */}
        <Link
          to={user?.role === 'admin' ? '/admin/profile' : '#'}
          className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-all cursor-pointer group"
          title={t('sidebar.profile', 'Admin Profile')}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:scale-105 transition-transform">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
