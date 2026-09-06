import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineTableCells,
  HiOutlineAcademicCap, HiOutlineArrowPath
} from 'react-icons/hi2';

const CATEGORIES = [
  { key: 'sc', mr: 'अनु.जाती', en: 'SC (Scheduled Caste)', color: 'from-amber-500 to-orange-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  { key: 'st', mr: 'अनु.जमाती', en: 'ST (Scheduled Tribe)', color: 'from-indigo-500 to-blue-600', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { key: 'ntvj', mr: 'भटक्या व विमुक्त जाती', en: 'NT / VJ (Nomadic Tribe)', color: 'from-purple-500 to-pink-600', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { key: 'sbc', mr: 'विशेष मागास प्रवर्ग', en: 'SBC (Special Backward Category)', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { key: 'obc', mr: 'इतर मागास वर्ग', en: 'OBC (Other Backward Class)', color: 'from-sky-500 to-cyan-600', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
  { key: 'open', mr: 'बिगर मागास', en: 'OPEN (General)', color: 'from-slate-600 to-slate-800', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { key: 'minority', mr: 'अल्पसंख्यांक', en: 'MINORITY (Minority Community)', color: 'from-rose-500 to-red-600', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
];

const TeacherCategoryStrength = () => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState(null);
  const [categories, setCategories] = useState({
    sc: { boys: 0, girls: 0 },
    st: { boys: 0, girls: 0 },
    ntvj: { boys: 0, girls: 0 },
    sbc: { boys: 0, girls: 0 },
    obc: { boys: 0, girls: 0 },
    open: { boys: 0, girls: 0 },
    minority: { boys: 0, girls: 0 },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/category-strength/my-class');
      if (res.data.data) {
        const rawCats = res.data.data.categories || {};
        const formatted = {};
        CATEGORIES.forEach(c => {
          formatted[c.key] = {
            boys: rawCats[c.key]?.boys || 0,
            girls: rawCats[c.key]?.girls || 0,
          };
        });
        setCategories(formatted);
      }
      if (res.data.classInfo) {
        setClassInfo(res.data.classInfo);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, field, val) => {
    const num = Math.max(0, parseInt(val || '0', 10));
    setCategories(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: isNaN(num) ? 0 : num
      }
    }));
  };

  const calculateTotals = () => {
    let totalBoys = 0;
    let totalGirls = 0;
    const mainCats = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open'];
    mainCats.forEach(k => {
      totalBoys += (categories[k]?.boys || 0);
      totalGirls += (categories[k]?.girls || 0);
    });
    return { totalBoys, totalGirls, grandTotal: totalBoys + totalGirls };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/category-strength/my-class', { categories });
      toast.success(res.data.message || (isMarathi ? 'माहिती यशस्वीरीत्या सेव्ह झाली!' : 'Saved successfully!'));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const { totalBoys, totalGirls, grandTotal } = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <HiOutlineTableCells className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-indigo-100 mb-1">
                <HiOutlineAcademicCap className="w-4 h-4" />
                <span>{classInfo ? `Std ${classInfo.standardName}-${classInfo.divisionName}` : 'Class Teacher'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isMarathi ? 'जातनिहाय विद्यार्थी संख्या नोंदणी' : 'Category-wise Student Strength Register'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-0.5">
                {isMarathi
                  ? 'आपल्या वर्गातील प्रवर्गनिहाय मुलांची व मुलींची संख्या नोंदवा'
                  : 'Enter the category-wise strength of boys and girls for your class'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="self-start sm:self-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all"
            title="Refresh"
          >
            <HiOutlineArrowPath className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Grand Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isMarathi ? 'एकूण मुले (Boys)' : 'Total Boys'}</p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalBoys}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isMarathi ? 'एकूण मुली (Girls)' : 'Total Girls'}</p>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalGirls}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isMarathi ? 'एकूण विद्यार्थी (Total)' : 'Grand Total'}</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{grandTotal}</p>
        </div>
      </div>

      {/* Main Category Entry Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-5 sm:p-7 shadow-sm backdrop-blur-xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <HiOutlineUserGroup className="w-5 h-5 text-indigo-500" />
            <span>{isMarathi ? 'जातनिहाय संख्या तपशील (Category-wise Strength Details)' : 'Category-wise Student Breakdown'}</span>
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-black uppercase text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/50">
                  <th className="py-3 px-4 rounded-l-xl">{isMarathi ? 'प्रवर्ग (Category)' : 'Category Name'}</th>
                  <th className="py-3 px-4 text-center">{isMarathi ? 'मुले (Boys)' : 'Boys'}</th>
                  <th className="py-3 px-4 text-center">{isMarathi ? 'मुली (Girls)' : 'Girls'}</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">{isMarathi ? 'एकूण (Total)' : 'Category Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {CATEGORIES.map(c => {
                  const b = categories[c.key]?.boys || 0;
                  const g = categories[c.key]?.girls || 0;
                  const catTotal = b + g;

                  return (
                    <tr key={c.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${c.badge}`}>
                            {c.key.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{isMarathi ? c.mr : c.en}</p>
                            <p className="text-[11px] font-semibold text-slate-400">{c.en}</p>
                          </div>
                        </div>
                      </td>

                      {/* Boys Input */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={categories[c.key]?.boys === 0 ? '' : categories[c.key]?.boys}
                          onChange={(e) => handleInputChange(c.key, 'boys', e.target.value)}
                          placeholder="0"
                          className="w-24 text-center py-2 px-3 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </td>

                      {/* Girls Input */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={categories[c.key]?.girls === 0 ? '' : categories[c.key]?.girls}
                          onChange={(e) => handleInputChange(c.key, 'girls', e.target.value)}
                          placeholder="0"
                          className="w-24 text-center py-2 px-3 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                      </td>

                      {/* Category Total Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block w-20 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                          {catTotal}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Summary Row */}
                <tr className="bg-indigo-50/60 dark:bg-indigo-950/40 font-black">
                  <td className="py-4 px-4 text-sm text-indigo-900 dark:text-indigo-200">
                    {isMarathi ? 'एकूण संख्या (GRAND TOTAL)' : 'GRAND TOTAL'}
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-indigo-700 dark:text-indigo-300">
                    {totalBoys}
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-purple-700 dark:text-purple-300">
                    {totalGirls}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block w-20 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black shadow-md shadow-indigo-500/30">
                      {grandTotal}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isMarathi ? 'सेव्ह होत आहे...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-4.5 h-4.5" />
                  <span>{isMarathi ? 'माहिती सेव्ह करा (Save Category Data)' : 'Save Category Breakdown'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TeacherCategoryStrength;
