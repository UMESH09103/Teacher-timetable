import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  HiOutlineEnvelope, HiOutlinePhone, HiOutlineLockClosed, HiOutlineEye,
  HiOutlineEyeSlash, HiOutlineSun, HiOutlineMoon
} from 'react-icons/hi2';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const Login = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      toast.error(t('login.fillAllFields', 'Please fill in all fields'));
      return;
    }

    setLoading(true);
    try {
      const user = await login(loginId, password);
      toast.success(t('login.welcomeBack', { name: user.name, defaultValue: `Welcome back, ${user.name}!` }));
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || t('login.loginFailed', 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const isMarathi = i18n.language === 'mr';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 py-10 px-4">
      {/* Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-300/10 dark:bg-indigo-700/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Controls: Language Switcher & Theme Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 shadow-md hover:scale-105 transition-all"
          aria-label={t('topbar.toggleTheme', 'Toggle theme')}
        >
          {darkMode ? <HiOutlineSun className="w-5 h-5 text-amber-400" /> : <HiOutlineMoon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md z-10 space-y-4"
      >
        {/* Main Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-700/60 shadow-2xl shadow-slate-300/30 dark:shadow-slate-950/70 p-7 sm:p-9 space-y-6">
          
          {/* Header & Emblem */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="inline-block relative"
            >
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-2.5 border border-indigo-100 dark:border-indigo-900/40 shadow-inner flex items-center justify-center">
                <img
                  src="/school-logo.png"
                  alt="School Emblem"
                  className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
                />
              </div>
            </motion.div>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                {isMarathi ? 'माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर' : 'Secondary & Higher Sec. Vidyamandir, Rajapur'}
              </h1>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                {isMarathi ? 'ता. येवला, जि. नाशिक — उपस्थिती प्रणाली' : 'Tal. Yeola, Dist. Nashik — Attendance Portal'}
              </p>
            </div>
          </div>

          {/* Secure Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {t('login.emailLabel', 'Mobile Number / Email Address')}
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/70" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder={t('login.emailPlaceholder', 'Enter mobile number or email address')}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium
                    bg-slate-50 dark:bg-slate-800/60
                    border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white
                    placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                    transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {t('login.passwordLabel', 'Password')}
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/70" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm font-medium
                    bg-slate-50 dark:bg-slate-800/60
                    border border-slate-200 dark:border-slate-700
                    text-slate-900 dark:text-white
                    placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white
                bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700
                hover:from-indigo-700 hover:to-purple-800
                shadow-xl shadow-indigo-500/30
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isMarathi ? 'साइन इन होत आहे...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{isMarathi ? 'लॉगिन करा (Sign In)' : 'Sign In'}</span>
              )}
            </motion.button>
          </form>

          {/* Secure Footer Notice */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {isMarathi ? 'प्रणाली सुरक्षितता: अधिकृत वापरकर्त्यांसाठी लॉगिन' : 'Secure System Login for Authorized Staff'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
