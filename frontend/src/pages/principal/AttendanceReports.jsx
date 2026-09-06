import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  School,
  UserCheck,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const AttendanceReports = () => {
  const { error } = useToast();
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/attendance/class-summary?date=${selectedMonth}-07`);
        if (res.data.success) {
          setSummaryData(sortClassesAsc(res.data.data));
        }
      } catch (err) {
        console.error(err);
        error('Failed to load attendance analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedMonth]);

  // Chart data: Class wise attendance percentage
  const chartData = summaryData.map((c) => ({
    name: `${c.className}-${c.division}`,
    present: c.totalPresent,
    enrolled: c.totalStudents,
    percentage: c.percentage || 0
  }));

  // Top and bottom performing classes
  const sortedClasses = [...summaryData].sort((a, b) => b.percentage - a.percentage);
  const topClasses = sortedClasses.slice(0, 3);
  const lowClasses = [...sortedClasses].reverse().slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> उपस्थिती विश्लेषण • Attendance Analytics
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            विद्यार्थी उपस्थिती अहवाल • Attendance Reports & Trends
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            शाळेतील उपस्थितीचे आलेख, वर्गनिहाय तुलनात्मक विश्लेषण व नियमित उपस्थिती अहवाल.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">महिना:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Top and Low Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 border-emerald-200/70 dark:border-emerald-900/50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  सर्वोत्तम उपस्थिती वर्ग (Top Performing Classes)
                </h3>
                <p className="text-xs text-slate-400">सर्वाधिक विद्यार्थी उपस्थिती प्रमाण</p>
              </div>
            </div>
            <Badge variant="emerald">उत्कृष्ट</Badge>
          </div>

          <div className="space-y-2.5">
            {topClasses.map((c, i) => (
              <div
                key={c.classId}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">
                    #{i + 1}
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {c.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      शिक्षक: {c.classTeacher?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 block">
                    {c.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {c.totalPresent}/{c.totalStudents} हजर
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-amber-200/70 dark:border-amber-900/50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  लक्ष आवश्यक वर्ग (Classes Needing Attention)
                </h3>
                <p className="text-xs text-slate-400">कमी उपस्थिती प्रमाण असलेले वर्ग</p>
              </div>
            </div>
            <Badge variant="amber">सुधारणा आवश्यक</Badge>
          </div>

          <div className="space-y-2.5">
            {lowClasses.map((c, i) => (
              <div
                key={c.classId}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
                    #{i + 1}
                  </span>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {c.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      शिक्षक: {c.classTeacher?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-amber-600 dark:text-amber-400 block">
                    {c.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {c.totalPresent}/{c.totalStudents} हजर
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Class Comparison Chart */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            वर्गनिहाय उपस्थिती प्रमाण आलेख • Class-wise Attendance Percentage
          </h3>
          <p className="text-xs text-slate-400">इयत्ता ५ वी ते १० वी मधील उपस्थिती तुलनात्मक आलेख</p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="percentage" fill="#6366f1" radius={[6, 6, 0, 0]} name="उपस्थिती %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
