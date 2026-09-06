import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, Phone, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('कृपया आपला मोबाईल नंबर किंवा ईमेल आणि पासवर्ड प्रविष्ट करा.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const user = await login(email.trim(), password);
      success(`Welcome, ${user.name}!`, 'Authentication Successful');
      if (user.role === 'principal') {
        navigate('/principal/dashboard');
      } else {
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      error(msg, 'Authentication Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* 1. PHOTOREALISTIC CAMPUS BACKGROUND WITH SLIGHT PARALLAX ZOOM */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
        style={{ backgroundImage: "url('/school-bg.jpg')" }}
      />

      {/* 2. CINEMATIC GRADIENT & GLASSMORPHISM OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/92 via-indigo-950/80 to-slate-900/85 backdrop-blur-[6px]" />

      {/* 3. ATMOSPHERIC AMBIENT GLOW ORBS */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />

      {/* 4. SUBTLE GRID PATTERN OVERLAY */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* 5. MAIN LOGIN CARD */}
      <div className="w-full max-w-[460px] relative z-10 my-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-[32px] p-7 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition-all">
          
          {/* Institution Header & Emblem */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3.5 group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-500 to-indigo-600 rounded-3xl blur-sm opacity-40 group-hover:opacity-75 transition duration-300" />
              <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-2 flex items-center justify-center shadow-md">
                <img
                  src="/school-logo.png"
                  alt="Krantiveer V.N. Naik Shikshan Prasarak Sanstha, Nashik"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
            </div>

            {/* Sanstha Name */}
            <span className="text-[10.5px] font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-widest block mb-1">
              क्रांतिवीर वसंतराव नारायणराव नाईक शिक्षण प्रसारक संस्था, नाशिक
            </span>

            {/* School Name */}
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug tracking-tight max-w-sm">
              माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              ता. येवला, जि. नाशिक • स्मार्ट वेळापत्रक व दैनिक उपस्थिती पोर्टल
            </p>

            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 mt-3" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}

            {/* Mobile / Email Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>मोबाईल नंबर किंवा ईमेल (Login ID)</span>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold lowercase">Mobile / Email</span>
              </label>
              <div className="relative flex items-center group">
                <div className="w-10 h-10 absolute left-1.5 flex items-center justify-center text-slate-400 group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors pointer-events-none">
                  <Phone className="w-4 h-4 stroke-[2]" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="उदा. 9822001122 किंवा admin@school.com"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1 pl-1">
                आपला १० अंकी नोंदणीकृत मोबाईल क्रमांक प्रविष्ट करा.
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>पासवर्ड (Password)</span>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold lowercase">Secure PIN / Pass</span>
              </label>
              <div className="relative flex items-center group">
                <div className="w-10 h-10 absolute left-1.5 flex items-center justify-center text-slate-400 group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400 transition-colors pointer-events-none">
                  <Lock className="w-4 h-4 stroke-[2]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="आपला पासवर्ड प्रविष्ट करा"
                  className="w-full pl-11 pr-11 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Options */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-lg text-brand-600 border-slate-300 dark:border-slate-700 focus:ring-brand-500 cursor-pointer"
                />
                <span>लॉगिन लक्षात ठेवा (Remember me)</span>
              </label>

              <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold cursor-default">
                मदत आवश्यक?
              </span>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-700 hover:to-indigo-700 active:scale-[0.99] shadow-lg shadow-brand-500/30 dark:shadow-brand-900/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>लॉगिन होत आहे... (Authenticating...)</span>
                </>
              ) : (
                <>
                  <span>पोर्टलमध्ये प्रवेश करा (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Access Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>२५६-बिट एनक्रिप्टेड • केवळ अधिकृत शिक्षक व प्रशासनासाठी</span>
          </div>
        </div>

        {/* Institution Footer */}
        <div className="text-center mt-5 space-y-1">
          <p className="text-[11px] font-bold text-slate-300">
            के. व्ही. एन. नाईक शिक्षण प्रसारक संस्था, नाशिक
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            © 2026 सर्व हक्क राखीव • माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर
          </p>
        </div>
      </div>
    </div>
  );
};
