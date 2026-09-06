import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  LayoutDashboard,
  Calendar,
  Users,
  School,
  BookOpen,
  UserX,
  Repeat,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  LogOut,
  UserCheck,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
  GraduationCap
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, isPrincipal, logout } = useAuth();
  const { isMarathi } = useLanguage();
  const location = useLocation();

  const [timetableMenuOpen, setTimetableMenuOpen] = useState(
    location.pathname.startsWith('/principal/timetable')
  );
  const [attendanceMenuOpen, setAttendanceMenuOpen] = useState(
    location.pathname.startsWith('/principal/attendance')
  );
  const [teacherAttendanceMenuOpen, setTeacherAttendanceMenuOpen] = useState(
    location.pathname.startsWith('/teacher/attendance') || location.pathname.startsWith('/teacher/category')
  );

  // Grouped Navigation for Admin / Principal
  const principalSections = [
    {
      group: isMarathi ? 'मुख्य' : 'OVERVIEW',
      items: [
        { name: isMarathi ? 'डॅशबोर्ड' : 'Dashboard', path: '/principal/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: isMarathi ? 'वेळापत्रक व नियोजन' : 'ACADEMICS & SCHEDULE',
      items: [
        {
          name: isMarathi ? 'वेळापत्रक' : 'Timetable',
          icon: Calendar,
          isSubmenu: true,
          isOpen: timetableMenuOpen,
          toggle: () => setTimetableMenuOpen(!timetableMenuOpen),
          subItems: [
            { name: isMarathi ? 'आजचे वेळापत्रक' : "Today's Timetable", path: '/principal/timetable/today' },
            { name: isMarathi ? 'वर्गानुसार वेळापत्रक' : 'Class View', path: '/principal/timetable/class' },
            { name: isMarathi ? 'तासानुसार वेळापत्रक' : 'Period View', path: '/principal/timetable/period' },
            { name: isMarathi ? 'शिक्षकानुसार वेळापत्रक' : 'Teacher View', path: '/principal/timetable/teacher' },
            { name: isMarathi ? 'साप्ताहिक वेळापत्रक' : 'Weekly Timetable', path: '/principal/timetable/weekly' },
            { name: isMarathi ? 'लाइव्ह शाळा' : 'Live School', path: '/principal/timetable/live', badge: 'LIVE' }
          ]
        },
        {
          name: isMarathi ? 'विद्यार्थी उपस्थिती' : 'Attendance',
          icon: UserCheck,
          isSubmenu: true,
          isOpen: attendanceMenuOpen,
          toggle: () => setAttendanceMenuOpen(!attendanceMenuOpen),
          subItems: [
            { name: isMarathi ? 'वर्ग उपस्थिती' : 'Class Attendance', path: '/principal/attendance' },
            { name: isMarathi ? 'प्रवर्ग अहवाल' : 'Category Report', path: '/principal/attendance/category-report' },
            { name: isMarathi ? 'उपस्थिती अहवाल' : 'Attendance Reports', path: '/principal/attendance/reports' }
          ]
        }
      ]
    },
    {
      group: isMarathi ? 'व्यवस्थापन व कर्मचारी' : 'STAFF & OPERATIONS',
      items: [
        { name: isMarathi ? 'शिक्षक यादी' : 'Teachers', path: '/principal/teachers', icon: Users },
        { name: isMarathi ? 'वर्ग व्यवस्थापन' : 'Classes', path: '/principal/classes', icon: School },
        { name: isMarathi ? 'विषय' : 'Subjects', path: '/principal/subjects', icon: BookOpen },
        { name: isMarathi ? 'गैरहजेरी नोंदी' : 'Absences', path: '/principal/absences', icon: UserX },
        { name: isMarathi ? 'पर्यायी तास (बदली)' : 'Substitutions', path: '/principal/substitutions', icon: Repeat }
      ]
    },
    {
      group: isMarathi ? 'प्रणाली व अहवाल' : 'SYSTEM & REPORTS',
      items: [
        { name: isMarathi ? 'अहवाल' : 'Reports', path: '/principal/reports', icon: BarChart3 },
        { name: isMarathi ? 'शाळा सेटिंग्ज' : 'Settings', path: '/principal/settings', icon: Settings }
      ]
    }
  ];

  // Grouped Navigation for Teacher
  const teacherSections = [
    {
      group: isMarathi ? 'मुख्य' : 'OVERVIEW',
      items: [
        { name: isMarathi ? 'डॅशबोर्ड' : 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: isMarathi ? 'माझे कामकाज' : 'SCHEDULE & RELIEF',
      items: [
        { name: isMarathi ? 'माझे वेळापत्रक' : 'My Timetable', path: '/teacher/timetable', icon: Calendar },
        { name: isMarathi ? 'पर्यायी तास' : 'Substitutions', path: '/teacher/substitutions', icon: Repeat }
      ]
    },
    {
      group: isMarathi ? 'विद्यार्थी उपस्थिती' : 'STUDENT ATTENDANCE',
      items: [
        {
          name: isMarathi ? 'उपस्थिती व्यवस्थापन' : 'Class Attendance',
          icon: UserCheck,
          isSubmenu: true,
          isOpen: teacherAttendanceMenuOpen,
          toggle: () => setTeacherAttendanceMenuOpen(!teacherAttendanceMenuOpen),
          subItems: [
            { name: isMarathi ? 'उपस्थिती नोंदवा' : 'Mark Attendance', path: '/teacher/attendance/mark', badge: isMarathi ? 'दैनंदिन' : 'Daily' },
            { name: isMarathi ? 'उपस्थिती इतिहास' : 'Attendance History', path: '/teacher/attendance/history' },
            { name: isMarathi ? 'प्रवर्गनिहाय संख्या' : 'Category Strength', path: '/teacher/category-strength' }
          ]
        }
      ]
    },
    {
      group: isMarathi ? 'संदेश व सूचना' : 'ALERTS & UPDATES',
      items: [
        { name: isMarathi ? 'सूचना' : 'Notifications', path: '/teacher/notifications', icon: Bell }
      ]
    }
  ];

  const sections = isPrincipal ? principalSections : teacherSections;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/60 dark:from-slate-800 dark:to-slate-800/80 border border-brand-200/60 dark:border-slate-700/60 p-1 flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 hover:scale-105">
              <img
                src="/school-logo.png"
                alt="K.V.N. Naik Sanstha Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight truncate">
                  {isMarathi ? 'विद्यामंदिर राजापूर' : 'Vidyamandir Rajapur'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                  isPrincipal
                    ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-brand-100/80 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                }`}>
                  {isPrincipal
                    ? (isMarathi ? 'प्रशासकीय कक्ष' : 'ADMIN CONSOLE')
                    : (isMarathi ? 'शिक्षक पोर्टल' : 'FACULTY PORTAL')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 transition-all shadow-sm"
          title={isCollapsed ? (isMarathi ? 'विस्तार करा' : 'Expand sidebar') : (isMarathi ? 'संक्षिप्त करा' : 'Collapse sidebar')}
          aria-label="Toggle sidebar width"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800">
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-1">
            {/* Section Header */}
            {!isCollapsed ? (
              <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.group}
              </div>
            ) : (
              <div className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800 mx-auto my-2" />
            )}

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                if (item.isSubmenu) {
                  const isAnySubActive = item.subItems.some((sub) => location.pathname === sub.path);
                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        onClick={item.toggle}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                          isAnySubActive
                            ? 'bg-brand-50/90 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 shadow-sm border border-brand-200/50 dark:border-brand-900/40'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            isAnySubActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                          }`} />
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                              item.isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
                            }`}
                          />
                        )}
                      </button>

                      {(!isCollapsed && item.isOpen) && (
                        <div className="relative pl-7 pr-1 py-1 space-y-1 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                          {item.subItems.map((sub) => (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                              className={({ isActive }) =>
                                `relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                  isActive
                                    ? 'bg-brand-600 text-white shadow-sm font-bold shadow-brand-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                }`
                              }
                            >
                              <span className="truncate">{sub.name}</span>
                              {sub.badge && (
                                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm ${
                                  sub.badge === 'LIVE'
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                  {sub.badge}
                                </span>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-600 dark:to-indigo-500 text-white shadow-md shadow-brand-500/25 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 hover:translate-x-0.5'
                      }`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        }`} />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile Strip */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <UserAvatar user={user} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name || 'User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {isMarathi ? 'सक्रिय' : 'Online'}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize truncate">
                    • {user?.role || 'Staff'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
              title={isMarathi ? 'लॉगआउट करा' : 'Sign out'}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

