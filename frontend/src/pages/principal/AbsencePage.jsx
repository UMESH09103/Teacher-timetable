import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { AbsenceDrawer } from '../../components/substitutions/AbsenceDrawer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserX, Plus, Trash2, Calendar, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';
import { UserAvatar } from '../../components/common/UserAvatar';

export const AbsencePage = () => {
  const { success, error } = useToast();
  const { isMarathi } = useLanguage();
  const [absences, setAbsences] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [absRes, tRes] = await Promise.all([
        api.get(`/absences${selectedDate ? `?date=${selectedDate}` : ''}`),
        api.get('/teachers')
      ]);

      if (absRes.data.success) setAbsences(absRes.data.data);
      if (tRes.data.success) setTeachers(tRes.data.data);
    } catch (err) {
      console.error(err);
      error('Failed to load absence records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleDeleteAbsence = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/absences/${deleteTarget._id}`);
      if (res.data.success) {
        success(
          isMarathi
            ? `${deleteTarget.teacherId?.name} यांची गैरहजेरी रद्द झाली. सर्व बदली तासिका रद्द करून तासिका पुन्हा त्यांच्याकडे सोपविल्या आहेत.`
            : `Absence cancelled. All substitution duties removed and lectures restored to ${deleteTarget.teacherId?.name}.`
        );
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || (isMarathi ? 'गैरहजेरी रद्द करणे अयशस्वी' : 'Failed to cancel absence'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Teacher Absence Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log faculty leave and track affected periods and automatic substitution coverage
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsDrawerOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Mark Teacher Absent
        </Button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Filter by Date:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium ml-2"
            >
              Clear Filter
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total Records: <strong>{absences.length}</strong>
        </span>
      </div>

      {/* Absence Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : absences.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Teachers Absent
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            All teachers are present and attending scheduled lectures.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Teacher</th>
                  <th className="p-3.5">Affected Periods</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Coverage Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {absences.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {item.date}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={item.teacherId} size="sm" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.teacherId?.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.teacherId?.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {item.affectedPeriods?.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                          >
                            P{p}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {item.reason}
                    </td>

                    <td className="p-3.5">
                      {item.status === 'covered' && (
                        <Badge variant="emerald" dot>
                          Fully Covered
                        </Badge>
                      )}
                      {item.status === 'partial' && (
                        <Badge variant="blue" dot>
                          Partially Covered
                        </Badge>
                      )}
                      {item.status === 'pending' && (
                        <Badge variant="amber" dot>
                          Pending Subs
                        </Badge>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Cancel absence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Mark Absence Drawer */}
      <AbsenceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        teachers={teachers}
        onAbsenceLogged={() => fetchData()}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAbsence}
        title={isMarathi ? 'गैरहजेरी रद्द करा (Cancel Absence)' : 'Cancel Absence Record'}
        message={
          isMarathi
            ? `तुम्हाला खात्री आहे का की तुम्ही ${deleteTarget?.teacherId?.name} यांची ${deleteTarget?.date} ची गैरहजेरी रद्द करू इच्छिता? या शिक्षकांच्या सर्व बदली तासिका (नेमलेल्या व प्रलंबित) रद्द केल्या जातील आणि सर्व तासिका पुन्हा मूळ शिक्षक ${deleteTarget?.teacherId?.name} यांच्याकडे सोपविल्या जातील.`
            : `Are you sure you want to cancel the absence for ${deleteTarget?.teacherId?.name} on ${deleteTarget?.date}? All associated substitution duties (both assigned and pending) will be deleted, and all lectures will be restored back to ${deleteTarget?.teacherId?.name}.`
        }
        confirmText={isMarathi ? 'होय, गैरहजेरी रद्द करा' : 'Yes, Cancel Absence'}
        cancelText={isMarathi ? 'बंद करा' : 'Close'}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
