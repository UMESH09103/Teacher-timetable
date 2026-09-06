import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser, HiOutlinePhone, HiOutlineEnvelope,
  HiOutlineLockClosed, HiOutlineCheckCircle, HiOutlineShieldCheck
} from 'react-icons/hi2';

const AdminProfile = () => {
  const { user, fetchUser } = useAuth();
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        mobile: user.mobile || '7588097136',
        email: user.email || '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error(t('profile.passwordMismatch', 'New passwords do not match'));
      return;
    }

    if (form.newPassword && form.newPassword.length < 6) {
      toast.error(t('profile.passwordMinLength', 'Password must be at least 6 characters long'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        ...(form.newPassword && { password: form.newPassword })
      };

      const res = await api.put('/auth/profile', payload);
      toast.success(res.data.message || t('profile.updateSuccess', 'Profile updated successfully!'));

      setForm((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      fetchUser();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const isMarathi = i18n.language === 'mr';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <HiOutlineShieldCheck className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 mb-1">
                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                {isMarathi ? 'प्रशासक खाते' : 'Administrator Account'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isMarathi ? 'ॲडमिन प्रोफाईल व खाते सेटिंग्स' : 'Admin Profile & Account Settings'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-0.5">
                {isMarathi
                  ? 'येथे तुमचा मोबाईल नंबर, ईमेल आयडी आणि नवीन पासवर्ड अपडेट करा'
                  : 'Update your mobile number, email address, and login credentials'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Profile Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-6 sm:p-8 shadow-sm backdrop-blur-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <HiOutlineUser className="w-5 h-5 text-indigo-500" />
              <span>{isMarathi ? 'वैयक्तिक व संपर्क माहिती (Contact Details)' : 'Personal & Contact Information'}</span>
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
              {isMarathi ? 'लॉगिन आणि सिस्टम सूचनांसाठी ही माहिती वापरली जाते' : 'Used for authentication & system notifications'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {isMarathi ? 'ॲडमिनचे नाव (Full Name)' : 'Admin Full Name'}
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Admin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {isMarathi ? 'मोबाईल नंबर (Login Mobile ID)' : 'Mobile Number (Login ID)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-indigo-500" />
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  required
                  placeholder="7588097136"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                {isMarathi ? 'या मोबाईल नंबरचा वापर ॲडमिन लॉगिन करण्यासाठी होईल (उदा. 7588097136)' : 'Use this mobile number to log in as Admin'}
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {isMarathi ? 'ईमेल पत्ता (Email Address)' : 'Email Address'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-indigo-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="admin@school.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 dark:border-slate-700/60 pt-4 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <HiOutlineLockClosed className="w-5 h-5 text-purple-500" />
              <span>{isMarathi ? 'लॉगिन पासवर्ड बदला (Change Password)' : 'Change Login Password'}</span>
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
              {isMarathi ? 'पासवर्ड बदलावायाचा नसेल तर हे रकाने रिकामे सोडा' : 'Leave empty if you do not want to change your password'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {isMarathi ? 'नवीन पासवर्ड (New Password)' : 'New Password'}
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {isMarathi ? 'पासवर्डची खात्री करा (Confirm New Password)' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isMarathi ? 'सेव्ह होत आहे...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-4.5 h-4.5" />
                  <span>{isMarathi ? 'प्रोफाईल सेव्ह करा (Save Profile)' : 'Save Profile Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminProfile;
