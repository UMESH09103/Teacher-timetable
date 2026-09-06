import React, { useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { PERIOD_TIMINGS } from '../../constants';
import { UserX, Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const AbsenceDrawer = ({
  isOpen,
  onClose,
  teachers = [],
  onAbsenceLogged,
  onOpenSubstitutions
}) => {
  const [teacherId, setTeacherId] = useState(teachers[0]?._id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriods, setSelectedPeriods] = useState([1, 2, 3, 4]);
  const [reason, setReason] = useState('Medical Leave - Doctor Appointment');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultData, setResultData] = useState(null);

  const togglePeriod = (p) => {
    if (selectedPeriods.includes(p)) {
      if (selectedPeriods.length === 1) return; // Must keep at least one
      setSelectedPeriods(selectedPeriods.filter((item) => item !== p));
    } else {
      setSelectedPeriods([...selectedPeriods, p].sort((a, b) => a - b));
    }
  };

  const selectAllPeriods = () => {
    setSelectedPeriods([1, 2, 3, 4, 5, 6, 7, 8]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/absences', {
        teacherId,
        date,
        affectedPeriods: selectedPeriods,
        reason
      });

      if (res.data.success) {
        setResultData(res.data.data);
        if (onAbsenceLogged) onAbsenceLogged(res.data.data);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to record absence'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setResultData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={resultData ? 'Absence Recorded' : 'Mark Teacher Absent'}
      subtitle={
        resultData
          ? 'Affected classes have been automatically flagged for substitution'
          : 'Log teacher leave and automatically queue required class substitutions'
      }
    >
      {resultData ? (
        /* Result Screen (Section 20) */
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {resultData.absence?.teacherId?.name} Marked Absent
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Date: {resultData.absence?.date} • Reason: {resultData.absence?.reason}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {resultData.affectedPeriodsCount}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Periods Affected</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {resultData.affectedClassesCount}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300 block mt-0.5">
                Classes Need Coverage
              </span>
            </div>
          </div>

          {resultData.affectedClasses && resultData.affectedClasses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Affected Lectures Queue
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {resultData.affectedClasses.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Class {item.classId?.className}-{item.classId?.division}
                      </span>
                      <span className="text-slate-400 ml-2">
                        {item.subjectId?.name}
                      </span>
                    </div>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      Period {item.periodNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-2.5">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                handleResetAndClose();
                if (onOpenSubstitutions) onOpenSubstitutions();
              }}
            >
              Find Substitutes Now
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResetAndClose}
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        /* Absence Entry Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Select Teacher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Step 1: Select Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            >
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.employeeId}) • {t.subjects?.map((s) => s.name).join(', ') || 'Faculty'}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Step 2: Absence Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              required
            />
            {new Date(date).getDay() === 0 && (
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <span>⚠️</span>
                <span>रविवार साप्ताहिक सुट्टी आहे (Sunday is a holiday). Please choose a school working day (Mon–Sat).</span>
              </p>
            )}
          </div>

          {/* Step 3: Select Affected Periods (Period Chips) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Step 3: Affected Periods
              </label>
              <button
                type="button"
                onClick={selectAllPeriods}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Select Full Day (P1-P8)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PERIOD_TIMINGS.map((p) => {
                const isSelected = selectedPeriods.includes(p.period);
                return (
                  <button
                    key={p.period}
                    type="button"
                    onClick={() => togglePeriod(p.period)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/20 scale-[1.02]'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    P{p.period}
                    <span className="block text-[9px] font-normal opacity-80 mt-0.5">
                      {p.startTime}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Selected periods: {selectedPeriods.join(', ')}
            </p>
          </div>

          {/* Step 4: Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Step 4: Reason for Absence
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical Leave, Emergency, Training Workshop"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500/20"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading || new Date(date).getDay() === 0}
            >
              Confirm Absence
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
};
