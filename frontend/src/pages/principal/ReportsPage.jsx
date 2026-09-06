import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Calendar, Users, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const STATUS_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

export const ReportsPage = () => {
  const [range, setRange] = useState('month'); // 'today' | 'week' | 'month'
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/reports/analytics?range=${range}`);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Workload & Substitution Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical breakdown of faculty teaching balance, substitute allocation trends, and attendance patterns
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          {['today', 'week', 'month'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                range === r
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !reportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Teacher Workload Distribution */}
          <Card className="p-5">
            <CardHeader
              title="Faculty Workload Balance"
              subtitle="Comparison of weekly scheduled classes vs covered substitutions"
            />
            <CardBody className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.teacherWorkloadData?.slice(0, 8)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="regularPeriods" name="Regular Periods" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="substitutionsTaken" name="Substitutions Covered" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 2. Substitution Status Breakdown */}
          <Card className="p-5">
            <CardHeader
              title="Substitution Status Distribution"
              subtitle="Proportion of assigned, pending, and completed substitution tickets"
            />
            <CardBody className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.subStatusData}
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {reportData.subStatusData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 3. Coverage Demand by Period */}
          <Card className="p-5">
            <CardHeader
              title="Coverage Demand by Period"
              subtitle="Which periods of the day experience the highest substitution frequency"
            />
            <CardBody className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reportData.periodData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="period" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" name="Substitutions Needed" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 4. Most Substituted Faculty Members */}
          <Card className="p-5">
            <CardHeader
              title="Most Substituted Faculty"
              subtitle="Teachers requiring the highest lecture coverage assistance"
            />
            <CardBody className="p-0 mt-3">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportData.mostSubstitutedTeachers?.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">No absence records yet</p>
                ) : (
                  reportData.mostSubstitutedTeachers?.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 font-black flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/50">
                        {item.substitutionsRequired} slots covered
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};
