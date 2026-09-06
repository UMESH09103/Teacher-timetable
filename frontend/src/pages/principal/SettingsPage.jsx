import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_PERIOD_TIMINGS, getSavedPeriodTimings } from '../../constants';
import {
  Settings,
  Clock,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Edit3,
  Coffee,
  Save,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

/**
 * Calculates duration in minutes between two "HH:MM" strings
 */
const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    // Convert 12-hour noon times if end < start
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    if (endTotal < startTotal) {
      // e.g. 12:25 to 01:00 (13:00)
      endTotal += 12 * 60;
    }
    return Math.max(0, endTotal - startTotal);
  } catch {
    return 0;
  }
};

export const SettingsPage = () => {
  const { success, error, info } = useToast();
  const { isMarathi } = useLanguage();

  const [schoolName, setSchoolName] = useState('विद्यामंदिर राजापूर');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [contactEmail, setContactEmail] = useState('admin@school.com');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Period Timing Changing Mode State
  const [isPeriodEditMode, setIsPeriodEditMode] = useState(false);
  const [periodTimings, setPeriodTimings] = useState(() => getSavedPeriodTimings());

  // Fetch initial settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/settings');
        if (res.data?.success && res.data.data) {
          const s = res.data.data;
          if (s.schoolName) setSchoolName(s.schoolName);
          if (s.academicYear) setAcademicYear(s.academicYear);
          if (s.contactEmail) setContactEmail(s.contactEmail);
          if (Array.isArray(s.periodTimings) && s.periodTimings.length > 0) {
            setPeriodTimings(s.periodTimings);
            localStorage.setItem('custom_period_timings', JSON.stringify(s.periodTimings));
          }
        }
      } catch (err) {
        console.error('Could not fetch settings from API, using cached:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Update a single period's time
  const handlePeriodChange = (index, field, value) => {
    setPeriodTimings((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        label: `Period ${next[index].period} (${field === 'startTime' ? value : next[index].startTime} - ${field === 'endTime' ? value : next[index].endTime})`
      };
      return next;
    });
  };

  // Add an extra period
  const handleAddPeriod = () => {
    const nextPeriodNum = periodTimings.length + 1;
    const lastPeriod = periodTimings[periodTimings.length - 1];
    const newStart = lastPeriod ? lastPeriod.endTime : '04:20';
    const newEnd = '04:55';

    setPeriodTimings((prev) => [
      ...prev,
      {
        period: nextPeriodNum,
        startTime: newStart,
        endTime: newEnd,
        label: `Period ${nextPeriodNum} (${newStart} - ${newEnd})`
      }
    ]);
  };

  // Remove last period (minimum 4 periods required)
  const handleRemovePeriod = (index) => {
    if (periodTimings.length <= 4) {
      error(isMarathi ? 'किमान ४ तास आवश्यक आहेत' : 'A minimum of 4 periods is required');
      return;
    }
    setPeriodTimings((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Reset to Maharashtra Board standard timings
  const handleResetTimings = () => {
    setPeriodTimings(DEFAULT_PERIOD_TIMINGS);
    info(
      isMarathi
        ? 'तासांच्या वेळा बोर्डाच्या मूळ स्वरूपात पूर्ववत केल्या'
        : 'Period timings reset to standard state board defaults'
    );
  };

  // Save All Settings
  const handleSaveAll = async (e) => {
    e?.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        schoolName,
        academicYear,
        contactEmail,
        periodTimings
      };

      // 1. Save to Backend Database
      const res = await api.put('/settings', payload);

      // 2. Persist to LocalStorage for immediate frontend reactivity
      localStorage.setItem('custom_period_timings', JSON.stringify(periodTimings));

      // 3. Dispatch global event for open timetables
      window.dispatchEvent(
        new CustomEvent('periodTimingsUpdated', { detail: periodTimings })
      );

      success(
        isMarathi
          ? 'शाळा सेटिंग्ज व तासांच्या वेळा यशस्वीरित्या जतन केल्या!'
          : 'School settings and period timings saved successfully!'
      );
      setIsPeriodEditMode(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
      // Fallback: save to localStorage even if backend network hiccup
      localStorage.setItem('custom_period_timings', JSON.stringify(periodTimings));
      success(
        isMarathi
          ? 'तासांच्या वेळा स्थानिक स्तरावर लागू झाल्या!'
          : 'Period timings updated locally and applied!'
      );
      setIsPeriodEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700/60 p-2.5 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isMarathi ? 'शाळा सेटिंग्ज व तास वेळ रचना' : 'School Settings & Bell Schedule'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isMarathi
                ? 'शाळेची माहिती, शैक्षणिक वर्ष व दैनिक तास वेळ बदलण्याची पद्धत'
                : 'Configure school profile, academic year, and interactive period bell schedules'}
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <Button
          type="button"
          onClick={handleSaveAll}
          variant="primary"
          size="md"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
          className="shadow-md shadow-brand-500/20"
        >
          {isMarathi ? 'सर्व बदल जतन करा' : 'Save All Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Institutional Profile Information */}
        <Card className="p-6">
          <CardHeader
            title={isMarathi ? 'शाळेची मूलभूत माहिती' : 'Institutional Information'}
            subtitle={
              isMarathi
                ? 'शाळेचे नाव, शैक्षणिक वर्ष आणि अधिकृत संपर्क ईमेल'
                : 'School identity, academic session, and administrative contacts'
            }
          />
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isMarathi ? 'शाळेचे नाव (School Name)' : 'School Name'}
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isMarathi ? 'शैक्षणिक वर्ष (Academic Year)' : 'Academic Session / Year'}
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isMarathi ? 'प्रशासकीय ईमेल (Administrative Email)' : 'Administrative Email'}
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                required
              />
            </div>
          </div>
        </Card>

        {/* Schedule & Period Settings with Period Time Changing Mode */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {isMarathi ? 'दैनिक तास वेळ रचना (Bell Schedule)' : 'Daily Bell Schedule & Period Timings'}
                </h3>
                {isPeriodEditMode && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                    <Edit3 className="w-3 h-3" />
                    {isMarathi ? 'वेळ संपादन सुरू' : 'Editing Mode Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isMarathi
                  ? 'येथून प्रत्येक तासाची सुरू वेळ व समाप्ती वेळ बदलता येते'
                  : 'Customize start times and end times for all daily teaching periods'}
              </p>
            </div>

            {/* Changing Mode Toggle Button */}
            <div className="flex items-center gap-2">
              {isPeriodEditMode && (
                <button
                  type="button"
                  onClick={handleResetTimings}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                  title={isMarathi ? 'मूळ वेळ पूर्ववत करा' : 'Reset to Board Defaults'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isMarathi ? 'मूळ वेळ' : 'Reset'}
                  </span>
                </button>
              )}

              <button
                type="button"
                id="toggle-period-edit-mode-btn"
                onClick={() => setIsPeriodEditMode(!isPeriodEditMode)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-xs ${
                  isPeriodEditMode
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                    : 'bg-brand-600 hover:bg-brand-700 text-white ring-2 ring-brand-500/30'
                }`}
              >
                {isPeriodEditMode ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isMarathi ? 'संपादन पूर्ण करा' : 'Done Editing'}</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>
                      {isMarathi ? 'तास वेळ बदला (Enable Changing Mode)' : 'Enable Changing Mode'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recess info badge */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {isMarathi
                  ? 'तास ४ नंतर २५ मिनिटांची मधली मोठी सुट्टी (01:35 PM – 02:00 PM) समाविष्ट आहे.'
                  : 'Includes 25-minute Midday Recess between Period 4 and Period 5 (01:35 PM – 02:00 PM).'}
              </span>
            </div>
            {isPeriodEditMode && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                {isMarathi ? 'तास संपल्यानंतर वेळ आपोआप अपडेट होते' : 'Times apply immediately'}
              </span>
            )}
          </div>

          {/* Period Slots Grid */}
          <div className="mt-5 space-y-3">
            {periodTimings.map((p, idx) => {
              const duration = calculateDuration(p.startTime, p.endTime);
              const isBreakAfter = p.period === 4;

              return (
                <React.Fragment key={p.period}>
                  <div
                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isPeriodEditMode
                        ? 'bg-white dark:bg-slate-800/90 border-brand-300 dark:border-brand-700/60 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Period Identifier & Badge */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                        P{p.period}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                          {isMarathi ? `तास क्रमांक ${p.period}` : `Period ${p.period}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {isMarathi ? 'कालावधी:' : 'Duration:'}{' '}
                          <strong className="text-brand-600 dark:text-brand-400">
                            {duration > 0 ? `${duration} mins` : '--'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Time Display / Inputs */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {isPeriodEditMode ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              {isMarathi ? 'सुरू वेळ' : 'Start'}
                            </label>
                            <input
                              type="time"
                              value={p.startTime}
                              onChange={(e) =>
                                handlePeriodChange(idx, 'startTime', e.target.value)
                              }
                              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            />
                          </div>

                          <span className="text-slate-400 font-bold self-end mb-2">–</span>

                          <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                              {isMarathi ? 'समाप्ती वेळ' : 'End'}
                            </label>
                            <input
                              type="time"
                              value={p.endTime}
                              onChange={(e) =>
                                handlePeriodChange(idx, 'endTime', e.target.value)
                              }
                              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                            />
                          </div>

                          {periodTimings.length > 4 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePeriod(idx)}
                              className="self-end mb-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title={isMarathi ? 'हा तास हटवा' : 'Remove this period slot'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-brand-500" />
                          <span>
                            {p.startTime} – {p.endTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Midday Recess Banner */}
                  {isBreakAfter && (
                    <div className="my-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 px-4">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                        <span>
                          {isMarathi
                            ? '🍽️ मधली सुट्टी (Recess / Lunch Interval)'
                            : '🍽️ Midday Recess / Lunch Break'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                        25 mins
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Add Period Slot in Editing Mode */}
          {isPeriodEditMode && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddPeriod}
                className="px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isMarathi ? '+ नवीन तास जोडा' : '+ Add Period Slot'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isMarathi ? 'बदल जतन करा व लागू करा' : 'Apply & Save Timings'}
                </span>
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
