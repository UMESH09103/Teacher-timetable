import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  School,
  UserCheck,
  TrendingUp,
  Filter,
  Eye,
  RefreshCw,
  Phone,
  AlertCircle,
  Sparkles,
  Search,
  Check,
  UserX,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const ClassAttendance = () => {
  const { error } = useToast();
  const { isMarathi } = useLanguage();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [standardFilter, setStandardFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Room display helper to prevent "Room Room 101"
  const formatRoom = (room) => {
    if (!room) return isMarathi ? 'नियमित वर्गखोली' : 'Standard Class';
    const clean = String(room).trim();
    if (/^room\s*/i.test(clean)) {
      return clean;
    }
    return `Room ${clean}`;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [classSummary, setClassSummary] = useState([]);
  const [inspectClass, setInspectClass] = useState(null);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const params = { date: selectedDate };
      if (standardFilter !== 'all') params.standard = standardFilter;
      if (divisionFilter !== 'all') params.division = divisionFilter;

      const res = await api.get('/attendance/class-summary', { params });
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setClassSummary(sortClassesAsc(res.data.data));
      }
    } catch (err) {
      console.error(err);
      error(isMarathi ? 'उपस्थिती माहिती लोड करण्यात अयशस्वी' : 'Failed to load class attendance breakdown');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedDate, standardFilter, divisionFilter]);

  // Quick date presets
  const handleSetDate = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      setSelectedDate(today.toISOString().slice(0, 10));
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      setSelectedDate(yesterday.toISOString().slice(0, 10));
    }
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  // Filtered classes by search
  const filteredSummary = classSummary.filter((cls) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      cls.displayName?.toLowerCase().includes(query) ||
      cls.classTeacher?.name?.toLowerCase().includes(query) ||
      cls.roomNumber?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Command Center & Filter Strip */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-brand-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/20 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-100/80 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-900/60">
              <UserCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              {isMarathi ? 'विद्यार्थी उपस्थिती कक्ष' : 'STUDENT ATTENDANCE CENTER'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isMarathi ? 'थेट अहवाल' : 'Live Sync'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isMarathi ? 'वर्गनिहाय दैनिक विद्यार्थी उपस्थिती' : 'Class-wise Student Daily Attendance'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isMarathi
              ? 'शाळेतील सर्व इयत्ता (५ वी ते १० वी) व तुकड्यांची दैनिक हजेरी, मुले-मुलींची पटसंख्या व उपस्थिती टक्केवारी.'
              : 'School-wide daily attendance monitoring for Standards 5th to 10th with boys, girls, and submission status.'}
          </p>
        </div>

        {/* Date & Filter Controls Card */}
        <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 shadow-xs w-full xl:w-auto">
          {/* Quick Date Buttons */}
          <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleSetDate('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                isToday
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isMarathi ? 'आज (Today)' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => handleSetDate('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                !isToday
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isMarathi ? 'काल (Yesterday)' : 'Yesterday'}
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            />
          </div>

          {/* Standard Dropdown */}
          <select
            value={standardFilter}
            onChange={(e) => setStandardFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">{isMarathi ? 'सर्व इयत्ता (All Std)' : 'All Standards'}</option>
            <option value="5">५ वी (5th Std)</option>
            <option value="6">६ वी (6th Std)</option>
            <option value="7">७ वी (7th Std)</option>
            <option value="8">८ वी (8th Std)</option>
            <option value="9">९ वी (9th Std)</option>
            <option value="10">१० वी (10th Std)</option>
          </select>

          {/* Division Dropdown */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">{isMarathi ? 'सर्व तुकड्या (All Div)' : 'All Divisions'}</option>
            <option value="A">अ (Div A)</option>
            <option value="B">ब (Div B)</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchSummary}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all"
            title={isMarathi ? 'माहिती रिफ्रेश करा' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Row (5 Rich Glow Cards) */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Enrolled */}
          <div className="relative p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden group hover:border-brand-400 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
                {isMarathi ? 'एकूण पटसंख्या' : 'Total Enrolled'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalEnrolled}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                👦 {metrics.totalBoysEnrolled}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-900/60">
                👧 {metrics.totalGirlsEnrolled}
              </span>
            </div>
          </div>

          {/* 2. Present Today */}
          <div className="relative p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 dark:text-emerald-400">
                {isMarathi ? 'आज उपस्थित' : 'Present Today'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {metrics.totalPresent}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold">
              <span className="text-emerald-700/90 dark:text-emerald-300 font-semibold">
                {isMarathi ? 'मुले:' : 'Boys:'} {metrics.totalBoysPresent} • {isMarathi ? 'मुली:' : 'Girls:'} {metrics.totalGirlsPresent}
              </span>
            </div>
          </div>

          {/* 3. Absent Today */}
          <div className="relative p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 shadow-xs overflow-hidden group hover:border-rose-400 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-700 dark:text-rose-400">
                {isMarathi ? 'आज गैरहजर' : 'Absent Today'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {metrics.totalAbsent}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold">
              <span className="text-rose-700/90 dark:text-rose-300 font-semibold">
                {isMarathi ? 'मुले:' : 'Boys:'} {metrics.totalBoysAbsent} • {isMarathi ? 'मुली:' : 'Girls:'} {metrics.totalGirlsAbsent}
              </span>
            </div>
          </div>

          {/* 4. Overall Attendance % */}
          <div className="relative p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden group hover:border-brand-400 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
                {isMarathi ? 'हजेरी टक्केवारी' : 'Attendance Rate'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-brand-600 dark:text-brand-400 tracking-tight">
                {metrics.overallPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, metrics.overallPercentage))}%` }}
              />
            </div>
          </div>

          {/* 5. Class Submissions Status */}
          <div className="relative p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/60 shadow-xs overflow-hidden group hover:border-slate-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 dark:text-slate-500">
                {isMarathi ? 'वर्ग स्थिती (Submissions)' : 'Class Submissions'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.submittedClasses} <span className="text-base text-slate-400 font-bold">/ {metrics.totalClasses}</span>
            </div>
            <div className="mt-2 text-[11px] font-bold">
              {metrics.pendingClasses > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {metrics.pendingClasses} {isMarathi ? 'वर्ग प्रलंबित' : 'Classes Pending'}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600 font-black" />
                  {isMarathi ? 'सर्व वर्ग पूर्ण' : 'All Classes Submitted'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class Attendance Visual Ribbon (Quick Class Glance in Natural Ascending Order) */}
      {!isLoading && classSummary.length > 0 && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              {isMarathi ? 'वर्गनिहाय जलद आढावा (५ वी ते १० वी)' : 'Class Quick Status (5th to 10th Standard)'}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              {isMarathi ? 'तपशील पाहण्यासाठी वर्गावर क्लिक करा' : 'Click a class chip to view full details'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800">
            {classSummary.map((cls) => {
              const isHigh = cls.percentage >= 90;
              const isMid = cls.percentage >= 75;

              return (
                <button
                  key={cls.classId}
                  type="button"
                  onClick={() => cls.isSubmitted && setInspectClass(cls)}
                  className={`px-3 py-2 rounded-2xl border text-left shrink-0 transition-all duration-150 flex items-center gap-3 ${
                    cls.isSubmitted
                      ? isHigh
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60 hover:bg-emerald-50 hover:shadow-xs'
                        : isMid
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 hover:bg-blue-50 hover:shadow-xs'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-50 hover:shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {cls.displayName || `${cls.className}-${cls.division}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {cls.classTeacher?.shortName || cls.classTeacher?.name?.split(' ')[1] || 'Teacher'}
                    </span>
                  </div>

                  <div className="text-right">
                    {cls.isSubmitted ? (
                      <span
                        className={`text-xs font-black block leading-tight ${
                          isHigh
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isMid
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {cls.percentage}%
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        {isMarathi ? 'प्रलंबित' : 'Pending'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Attendance Breakdown Table Card */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-subtle rounded-3xl">
          {/* Table Header Bar with Search */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-500" />
                {isMarathi ? 'वर्गनिहाय हजेरी तपशील तक्ता' : 'Class Attendance Breakdown Matrix'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMarathi
                  ? `${selectedDate} रोजीची वर्गवार मुले-मुलींची उपस्थिती माहिती (${filteredSummary.length} वर्ग)`
                  : `Showing breakdown for ${selectedDate} (${filteredSummary.length} classes)`}
              </p>
            </div>

            {/* Local Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isMarathi ? 'वर्ग किंवा शिक्षक शोधा...' : 'Search class or teacher...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="p-4">{isMarathi ? 'वर्ग (Class)' : 'Class & Room'}</th>
                  <th className="p-4">{isMarathi ? 'वर्गशिक्षक (Class Teacher)' : 'Class Teacher'}</th>
                  <th className="p-4">{isMarathi ? 'स्थिती (Status)' : 'Status'}</th>
                  <th className="p-4 text-center">{isMarathi ? 'मुले हजर/एकूण' : 'Boys (Pres/Tot)'}</th>
                  <th className="p-4 text-center">{isMarathi ? 'मुली हजर/एकूण' : 'Girls (Pres/Tot)'}</th>
                  <th className="p-4 text-center">{isMarathi ? 'एकूण हजर' : 'Total Present'}</th>
                  <th className="p-4 text-center">{isMarathi ? 'एकूण गैरहजर' : 'Absent'}</th>
                  <th className="p-4 text-center">{isMarathi ? 'हजेरी %' : 'Attendance %'}</th>
                  <th className="p-4 text-right">{isMarathi ? 'तपशील' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                      {isMarathi ? 'कोणतीही माहिती सापडली नाही' : 'No matching class attendance records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((cls) => {
                    const isHigh = cls.percentage >= 90;
                    const isMid = cls.percentage >= 75;

                    return (
                      <tr
                        key={cls.classId}
                        className="hover:bg-brand-50/20 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* 1. Class & Room */}
                        <td className="p-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-900/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-xs shrink-0">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white block truncate">
                                {cls.displayName || `${cls.className}-${cls.division}`}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono font-medium block truncate">
                                {formatRoom(cls.roomNumber)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Class Teacher with UserAvatar (Male/Female logo) */}
                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              user={cls.classTeacher}
                              name={cls.classTeacher?.name}
                              size="sm"
                              className="ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 dark:text-white block truncate max-w-[160px]">
                                {cls.classTeacher?.name || 'Unassigned'}
                              </span>
                              {cls.classTeacher?.phone && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  📞 {cls.classTeacher.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Status */}
                        <td className="p-4">
                          {cls.isSubmitted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 font-black" />
                              {isMarathi ? 'नोंद झाली' : 'Submitted'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              {isMarathi ? 'प्रलंबित' : 'Pending'}
                            </span>
                          )}
                        </td>

                        {/* 4. Boys */}
                        <td className="p-4 text-center">
                          {cls.isSubmitted ? (
                            <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-900/60 text-xs">
                              {cls.boysPresent} / {cls.totalBoys}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">- / {cls.totalBoys}</span>
                          )}
                        </td>

                        {/* 5. Girls */}
                        <td className="p-4 text-center">
                          {cls.isSubmitted ? (
                            <span className="px-2.5 py-1 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold border border-pink-200/60 dark:border-pink-900/60 text-xs">
                              {cls.girlsPresent} / {cls.totalGirls}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">- / {cls.totalGirls}</span>
                          )}
                        </td>

                        {/* 6. Total Present */}
                        <td className="p-4 text-center font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {cls.isSubmitted ? cls.totalPresent : '-'}
                        </td>

                        {/* 7. Total Absent */}
                        <td className="p-4 text-center font-extrabold text-sm text-rose-600 dark:text-rose-400">
                          {cls.isSubmitted ? cls.totalAbsent : '-'}
                        </td>

                        {/* 8. Attendance Percentage & Progress Bar */}
                        <td className="p-4 text-center">
                          {cls.isSubmitted ? (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`text-xs font-black ${
                                  isHigh
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isMid
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {cls.percentage}%
                              </span>
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isHigh ? 'bg-emerald-500' : isMid ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, cls.percentage))}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* 9. Details Action */}
                        <td className="p-4 text-right">
                          {cls.isSubmitted ? (
                            <button
                              type="button"
                              onClick={() => setInspectClass(cls)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                              title={isMarathi ? 'हजेरी तपशील पहा' : 'Inspect Attendance'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {isMarathi ? 'पहा' : 'View'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {isMarathi ? 'अपूर्ण' : 'Pending'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modern Attendance Details Modal */}
      {inspectClass && (
        <Modal
          isOpen={!!inspectClass}
          onClose={() => setInspectClass(null)}
          title={`${inspectClass.displayName} • ${isMarathi ? 'उपस्थिती संपूर्ण तपशील' : 'Attendance Breakdown'}`}
          subtitle={`${selectedDate} • ${formatRoom(inspectClass.roomNumber)}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            {/* Teacher Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <UserAvatar
                user={inspectClass.classTeacher}
                name={inspectClass.classTeacher?.name}
                size="md"
              />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  {isMarathi ? 'वर्गशिक्षक' : 'Class Teacher'}
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white block truncate">
                  {inspectClass.classTeacher?.name || 'Class Teacher'}
                </span>
                {inspectClass.classTeacher?.phone && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    📞 {inspectClass.classTeacher.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Boys & Girls Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Boys Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 block mb-1">
                  👦 {isMarathi ? 'मुले उपस्थिती' : 'Boys Attendance'}
                </span>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300">
                  {inspectClass.boysPresent} <span className="text-xs font-bold text-slate-400">/ {inspectClass.totalBoys}</span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-1">
                  {isMarathi ? 'गैरहजर मुले:' : 'Absent Boys:'} {inspectClass.boysAbsent}
                </span>
              </div>

              {/* Girls Card */}
              <div className="p-3.5 rounded-2xl bg-pink-50/60 dark:bg-pink-950/30 border border-pink-200/80 dark:border-pink-900/60">
                <span className="text-[10px] font-black uppercase text-pink-600 dark:text-pink-400 block mb-1">
                  👧 {isMarathi ? 'मुली उपस्थिती' : 'Girls Attendance'}
                </span>
                <div className="text-xl font-black text-pink-700 dark:text-pink-300">
                  {inspectClass.girlsPresent} <span className="text-xs font-bold text-slate-400">/ {inspectClass.totalGirls}</span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-1">
                  {isMarathi ? 'गैरहजर मुली:' : 'Absent Girls:'} {inspectClass.girlsAbsent}
                </span>
              </div>
            </div>

            {/* Total Ratio Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {isMarathi ? 'एकूण उपस्थिती प्रमाण' : 'Total Attendance Ratio'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {inspectClass.totalPresent} {isMarathi ? 'हजर पैकी' : 'present out of'} {inspectClass.totalStudents} {isMarathi ? 'विद्यार्थी' : 'students'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
                  {inspectClass.percentage}%
                </span>
              </div>
            </div>

            {/* Remarks if any */}
            {inspectClass.remarks && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200">
                <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5">
                  {isMarathi ? 'नोंद / विशेष शेरा:' : 'Remarks / Notes:'}
                </span>
                <p className="text-xs leading-relaxed">{inspectClass.remarks}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setInspectClass(null)}>
                {isMarathi ? 'बंद करा' : 'Close'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClassAttendance;
