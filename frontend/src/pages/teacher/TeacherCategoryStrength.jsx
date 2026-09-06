import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  Users,
  CheckCircle2,
  School,
  Save,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  { key: 'sc', labelMar: 'अ.जा. (SC)', labelEng: 'Scheduled Caste', color: 'blue' },
  { key: 'st', labelMar: 'अ.ज. (ST)', labelEng: 'Scheduled Tribe', color: 'emerald' },
  { key: 'ntvj', labelMar: 'वि.जा. / भ.ज. (VJNT)', labelEng: 'VJNT / Nomadic Tribes', color: 'purple' },
  { key: 'sbc', labelMar: 'वि.मा.प्र. (SBC)', labelEng: 'Special Backward Class', color: 'amber' },
  { key: 'obc', labelMar: 'इ.मा.व. (OBC)', labelEng: 'Other Backward Class', color: 'indigo' },
  { key: 'open', labelMar: 'खुला प्रवर्ग (OPEN)', labelEng: 'General / Open', color: 'slate' },
  { key: 'minority', labelMar: 'अल्पसंख्याक (Minority)', labelEng: 'Religious Minority', color: 'rose' }
];

export const TeacherCategoryStrength = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [month, setMonth] = useState('September 2026');
  const [classInfo, setClassInfo] = useState(null);
  const [categoriesData, setCategoriesData] = useState({
    sc: { boys: 0, girls: 0 },
    st: { boys: 0, girls: 0 },
    ntvj: { boys: 0, girls: 0 },
    sbc: { boys: 0, girls: 0 },
    obc: { boys: 0, girls: 0 },
    open: { boys: 0, girls: 0 },
    minority: { boys: 0, girls: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategoryStrength = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/category-strength/my-class?month=${encodeURIComponent(month)}`);
      if (res.data.success) {
        setClassInfo(res.data.classInfo);
        const cats = res.data.data?.categories || {};
        const formatted = {};
        CATEGORIES.forEach((c) => {
          formatted[c.key] = {
            boys: cats[c.key]?.boys || 0,
            girls: cats[c.key]?.girls || 0
          };
        });
        setCategoriesData(formatted);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load category strength data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryStrength();
  }, [month]);

  const handleInputChange = (categoryKey, field, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setCategoriesData((prev) => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [field]: num
      }
    }));
  };

  // Compute live sums
  // Note: main standard categories sum to total, minority is tracked
  const mainKeys = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open'];
  let totalBoys = 0;
  let totalGirls = 0;
  mainKeys.forEach((k) => {
    totalBoys += categoriesData[k]?.boys || 0;
    totalGirls += categoriesData[k]?.girls || 0;
  });
  const grandTotal = totalBoys + totalGirls;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classInfo?.classId) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/category-strength/my-class', {
        classId: classInfo.classId,
        month,
        categories: categoriesData
      });

      if (res.data.success) {
        success('प्रवर्गनिहाय पटसंख्या यशस्वीरित्या जतन केली (Category strength updated successfully)');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save category strength');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> शासकीय पटसंख्या नोंदवही • Social Category Register
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            प्रवर्गनिहाय विद्यार्थी पटसंख्या • Category-wise Strength
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            शालेय पोषण आहार, सरल प्रणाली व शिक्षण विभागाच्या अहवालासाठी वर्गनिहाय सामाजिक प्रवर्ग पटसंख्या नोंदवा.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">महिना:</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="June 2026">जून २०२६ (June 2026)</option>
            <option value="July 2026">जुलै २०२६ (July 2026)</option>
            <option value="August 2026">ऑगस्ट २०२६ (August 2026)</option>
            <option value="September 2026">सप्टेंबर २०२६ (September 2026)</option>
            <option value="October 2026">ऑक्टोबर २०२६ (October 2026)</option>
          </select>
        </div>
      </div>

      {/* Class Info & Quick Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
            वर्ग व तुकडी (Class)
          </span>
          <div className="text-lg font-black text-brand-600 dark:text-brand-400">
            {classInfo?.displayName || 'Class'}
          </div>
          <span className="text-[11px] text-slate-500">
            वर्गशिक्षक: {classInfo?.classTeacherName}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
            एकूण मुले (Total Boys)
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalBoys}
          </div>
          <span className="text-[11px] text-blue-700/70 dark:text-blue-300">
            सर्व मुख्य प्रवर्ग मिळून
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400 block mb-0.5">
            एकूण मुली (Total Girls)
          </span>
          <div className="text-2xl font-black text-pink-600 dark:text-pink-400">
            {totalGirls}
          </div>
          <span className="text-[11px] text-pink-700/70 dark:text-pink-300">
            सर्व मुख्य प्रवर्ग मिळून
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 shadow-subtle">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
            एकूण पटसंख्या (Grand Total)
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {grandTotal}
          </div>
          <span className="text-[11px] text-emerald-700/70 dark:text-emerald-300">
            मुले + मुली एकूण
          </span>
        </div>
      </div>

      {/* Category Input Form Matrix */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <th className="p-4 w-12">क्र.</th>
                    <th className="p-4">सामाजिक प्रवर्ग (Social Category)</th>
                    <th className="p-4 text-center w-36">मुले (Boys)</th>
                    <th className="p-4 text-center w-36">मुली (Girls)</th>
                    <th className="p-4 text-center w-32">एकूण (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {CATEGORIES.map((cat, idx) => {
                    const b = categoriesData[cat.key]?.boys || 0;
                    const g = categoriesData[cat.key]?.girls || 0;
                    const rowTotal = b + g;

                    return (
                      <tr
                        key={cat.key}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                          cat.key === 'minority' ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {cat.labelMar}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {cat.labelEng}
                            {cat.key === 'minority' && (
                              <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                                *(विशेष नोंद)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={b}
                            onChange={(e) => handleInputChange(cat.key, 'boys', e.target.value)}
                            className="w-24 px-3 py-1.5 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={g}
                            onChange={(e) => handleInputChange(cat.key, 'girls', e.target.value)}
                            className="w-24 px-3 py-1.5 text-center font-black text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-pink-600 dark:text-pink-400 focus:ring-2 focus:ring-pink-500/20"
                          />
                        </td>
                        <td className="p-4 text-center font-extrabold text-sm text-slate-900 dark:text-white">
                          <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black">
                            {rowTotal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-black text-sm">
                    <td colSpan={2} className="p-4 text-slate-900 dark:text-white">
                      एकूण मुख्य प्रवर्ग पटसंख्या (Total Enrolled):
                    </td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400">
                      {totalBoys}
                    </td>
                    <td className="p-4 text-center text-pink-600 dark:text-pink-400">
                      {totalGirls}
                    </td>
                    <td className="p-4 text-center text-emerald-600 dark:text-emerald-400">
                      {grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                ही माहिती जतन केल्यानंतर मुख्याध्यापक यांच्या एकत्रित शासकीय अहवालामध्ये थेट समाविष्ट होईल.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              पटसंख्या जतन करा (Save Category Strength)
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
