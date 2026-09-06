import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HiOutlineBuildingLibrary, HiOutlineCheck } from 'react-icons/hi2';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    schoolName: '',
    schoolLogo: '',
    academicYear: '2025-2026'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.data) {
        setForm(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success(t('settings.updatedSuccess', 'Settings updated successfully'));
    } catch (error) {
      toast.error(t('common.error', 'Failed to update settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings.title', 'School Settings')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle', 'Configure your school information')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200/60 dark:border-slate-700/40 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <HiOutlineBuildingLibrary className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.infoTitle', 'School Information')}</h3>
            <p className="text-xs text-slate-500">{t('settings.infoSubtitle', 'Update your school details')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('settings.schoolName', 'School Name')}
            </label>
            <input
              type="text"
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('settings.schoolLogo', 'School Logo URL')}
            </label>
            <input
              type="text"
              value={form.schoolLogo}
              onChange={(e) => setForm({ ...form, schoolLogo: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('settings.academicYear', 'Academic Year')}
            </label>
            <input
              type="text"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              required
              placeholder="2025-2026"
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white
                bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
                shadow-lg shadow-indigo-500/25 disabled:opacity-60 transition-all"
            >
              {saving ? t('settings.saving', 'Saving...') : (
                <>
                  <HiOutlineCheck className="w-4 h-4" />
                  {t('settings.save', 'Save Settings')}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Settings;
