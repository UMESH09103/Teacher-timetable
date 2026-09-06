import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineAcademicCap,
  HiOutlineClipboardDocumentList, HiOutlineChartBarSquare,
  HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle,
  HiOutlineClock, HiOutlineBookOpen, HiOutlineUserGroup,
  HiOutlineSquares2X2, HiOutlineChevronLeft, HiOutlineXMark,
  HiOutlineUser, HiOutlineTableCells
} from 'react-icons/hi2';
import { useEffect } from 'react';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin/dashboard', icon: HiOutlineHome, labelKey: 'sidebar.dashboard' },
    { to: '/admin/class-attendance', icon: HiOutlineUserGroup, labelKey: 'sidebar.classAttendance' },
    { to: '/admin/teachers', icon: HiOutlineUsers, labelKey: 'sidebar.teachers' },
    { to: '/admin/standards-divisions', icon: HiOutlineSquares2X2, labelKey: 'sidebar.standardsDivisions' },
    { to: '/admin/reports', icon: HiOutlineChartBarSquare, labelKey: 'sidebar.reports' },
    { to: '/admin/category-report', icon: HiOutlineTableCells, labelKey: 'sidebar.categoryReport' },
    { to: '/admin/profile', icon: HiOutlineUser, labelKey: 'sidebar.profile' },
    { to: '/admin/settings', icon: HiOutlineCog6Tooth, labelKey: 'sidebar.settings' },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', icon: HiOutlineHome, labelKey: 'sidebar.dashboard' },
    { to: '/teacher/mark-attendance', icon: HiOutlineClipboardDocumentList, labelKey: 'sidebar.markAttendance' },
    { to: '/teacher/category-strength', icon: HiOutlineTableCells, labelKey: 'sidebar.categoryStrength' },
    { to: '/teacher/attendance-history', icon: HiOutlineClock, labelKey: 'sidebar.attendanceHistory' },
  ];

  const links = user?.role === 'admin' ? adminLinks : teacherLinks;

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-200/60 dark:border-slate-700/60 min-h-[64px]">
        <div className="flex items-center gap-3">
          <img
            src="/school-logo.png"
            alt="School Emblem"
            className="w-10 h-10 object-contain drop-shadow-sm flex-shrink-0"
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <h2 className="font-bold text-xs leading-tight text-slate-900 dark:text-white line-clamp-2">
                {t('app.title')}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                {t('app.subtitle')}
              </p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <HiOutlineXMark className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto scrollbar-thin">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 group relative text-sm
              ${isActive
                ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                {(!collapsed || isMobile) && (
                  <span className="truncate">{t(link.labelKey)}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl
            text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
            transition-all duration-200 text-sm font-medium"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>{t('sidebar.logout', 'Logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer (Visible < md) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw]
                bg-white dark:bg-slate-900
                border-r border-slate-200/60 dark:border-slate-700/60
                shadow-2xl flex flex-col"
            >
              {renderNavContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Visible >= md) */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen z-40 flex-col
          bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl
          border-r border-slate-200/60 dark:border-slate-700/60
          shadow-xl shadow-slate-200/20 dark:shadow-slate-900/40
          transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        {renderNavContent(false)}

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full
            bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            shadow-md flex items-center justify-center
            hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <HiOutlineChevronLeft
            className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
