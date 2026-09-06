import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  School,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

const CATEGORY_COLS = [
  { key: 'sc', label: 'अ.जा. (SC)' },
  { key: 'st', label: 'अ.ज. (ST)' },
  { key: 'ntvj', label: 'वि.जा./भ.ज. (VJNT)' },
  { key: 'sbc', label: 'वि.मा.प्र. (SBC)' },
  { key: 'obc', label: 'इ.मा.व. (OBC)' },
  { key: 'open', label: 'खुला (OPEN)' },
  { key: 'minority', label: 'अल्पसंख्याक (Minority)' }
];

export const CategoryReport = () => {
  const { error, success } = useToast();
  const [month, setMonth] = useState('September 2026');
  const [data, setData] = useState([]);
  const [schoolTotals, setSchoolTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/category-strength/all?month=${encodeURIComponent(month)}`);
      if (res.data.success) {
        setData(sortClassesAsc(res.data.data));
        setSchoolTotals(res.data.schoolTotals);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load category strength report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month]);

  // Export to Excel using XLSX
  const handleExportExcel = () => {
    try {
      const rows = [];

      // Header info
      rows.push(['क्रांतिवीर वसंतराव नारायणराव नाईक शिक्षण प्रसारक संस्था, नाशिक संचलित']);
      rows.push(['माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर ता.येवला जि.नाशिक']);
      rows.push([`प्रवर्गनिहाय विद्यार्थी पटसंख्या अहवाल • महिना: ${month}`]);
      rows.push([]); // blank row

      // Table columns headers
      rows.push([
        'वर्ग व तुकडी',
        'वर्गशिक्षक',
        'SC मुले', 'SC मुली', 'SC एकूण',
        'ST मुले', 'ST मुली', 'ST एकूण',
        'VJNT मुले', 'VJNT मुली', 'VJNT एकूण',
        'SBC मुले', 'SBC मुली', 'SBC एकूण',
        'OBC मुले', 'OBC मुली', 'OBC एकूण',
        'OPEN मुले', 'OPEN मुली', 'OPEN एकूण',
        'एकूण मुले', 'एकूण मुली', 'एकूण पटसंख्या',
        'अल्पसंख्याक (Minority)'
      ]);

      // Rows for each class
      data.forEach((row) => {
        const c = row.categories || {};
        rows.push([
          row.displayName,
          row.classTeacher?.name || 'Class Teacher',
          c.sc?.boys || 0, c.sc?.girls || 0, c.sc?.total || 0,
          c.st?.boys || 0, c.st?.girls || 0, c.st?.total || 0,
          c.ntvj?.boys || 0, c.ntvj?.girls || 0, c.ntvj?.total || 0,
          c.sbc?.boys || 0, c.sbc?.girls || 0, c.sbc?.total || 0,
          c.obc?.boys || 0, c.obc?.girls || 0, c.obc?.total || 0,
          c.open?.boys || 0, c.open?.girls || 0, c.open?.total || 0,
          row.totalBoys,
          row.totalGirls,
          row.grandTotal,
          c.minority?.total || 0
        ]);
      });

      // Grand totals row
      if (schoolTotals) {
        const st = schoolTotals;
        rows.push([
          'शाळा एकूण (School Total)',
          '-',
          st.sc?.boys || 0, st.sc?.girls || 0, st.sc?.total || 0,
          st.st?.boys || 0, st.st?.girls || 0, st.st?.total || 0,
          st.ntvj?.boys || 0, st.ntvj?.girls || 0, st.ntvj?.total || 0,
          st.sbc?.boys || 0, st.sbc?.girls || 0, st.sbc?.total || 0,
          st.obc?.boys || 0, st.obc?.girls || 0, st.obc?.total || 0,
          st.open?.boys || 0, st.open?.girls || 0, st.open?.total || 0,
          st.totalBoys,
          st.totalGirls,
          st.grandTotal,
          st.minority?.total || 0
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Category Strength');
      XLSX.writeFile(wb, `Vidyamandir_Rajapur_Category_Strength_${month.replace(' ', '_')}.xlsx`);
      success('एक्सेल फाईल डाऊनलोड झाली (Excel report downloaded successfully)');
    } catch (err) {
      console.error(err);
      error('Failed to export Excel report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> शासकीय सामाजिक प्रवर्ग अहवाल • Social Category Report
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            प्रवर्गनिहाय पटसंख्या नोंदवही • Category Strength Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            शासकीय शिक्षण विभाग, सरल पोर्टल व पोषण आहारासाठी संपूर्ण शाळेचा प्रवर्गनिहाय एकत्रित पटसंख्या तक्ता.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">महिना:</label>
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

          <div className="pt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              प्रिंट (Print)
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportExcel}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Excel Export (.xlsx)
            </Button>
          </div>
        </div>
      </div>

      {/* Grand Total Cards */}
      {schoolTotals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              एकूण पटसंख्या (Grand Total)
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {schoolTotals.grandTotal}
            </div>
            <span className="text-[11px] text-slate-500">
              मुले: {schoolTotals.totalBoys} • मुली: {schoolTotals.totalGirls}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 shadow-subtle">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
              SC + ST पटसंख्या
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {(schoolTotals.sc?.total || 0) + (schoolTotals.st?.total || 0)}
            </div>
            <span className="text-[11px] text-blue-700/70 dark:text-blue-300">
              SC: {schoolTotals.sc?.total || 0} • ST: {schoolTotals.st?.total || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 shadow-subtle">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
              VJNT + SBC + OBC पटसंख्या
            </span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {(schoolTotals.ntvj?.total || 0) + (schoolTotals.sbc?.total || 0) + (schoolTotals.obc?.total || 0)}
            </div>
            <span className="text-[11px] text-purple-700/70 dark:text-purple-300">
              OBC: {schoolTotals.obc?.total || 0} • VJNT: {schoolTotals.ntvj?.total || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 shadow-subtle">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
              OPEN + Minority पटसंख्या
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {schoolTotals.open?.total || 0}
            </div>
            <span className="text-[11px] text-amber-700/70 dark:text-amber-300">
              Minority (विशेष): {schoolTotals.minority?.total || 0}
            </span>
          </div>
        </div>
      )}

      {/* Main Register Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th rowSpan={2} className="p-3 text-left w-32 border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                    वर्ग (Class)
                  </th>
                  <th rowSpan={2} className="p-3 text-left w-36 border-r border-slate-200 dark:border-slate-700">
                    वर्गशिक्षक (Teacher)
                  </th>
                  {CATEGORY_COLS.map((c) => (
                    <th key={c.key} colSpan={3} className="p-2 border-r border-slate-200 dark:border-slate-700">
                      {c.label}
                    </th>
                  ))}
                  <th colSpan={3} className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                    एकूण पटसंख्या (Total)
                  </th>
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {CATEGORY_COLS.map((c) => (
                    <React.Fragment key={`${c.key}-sub`}>
                      <th className="p-1.5 w-11">मुले</th>
                      <th className="p-1.5 w-11">मुली</th>
                      <th className="p-1.5 w-12 border-r border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">एकूण</th>
                    </React.Fragment>
                  ))}
                  <th className="p-1.5 w-14 bg-emerald-50/70 dark:bg-emerald-950/30 text-blue-600 dark:text-blue-400 font-bold">मुले</th>
                  <th className="p-1.5 w-14 bg-emerald-50/70 dark:bg-emerald-950/30 text-pink-600 dark:text-pink-400 font-bold">मुली</th>
                  <th className="p-1.5 w-16 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold">एकूण</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {data.map((row) => {
                  const c = row.categories || {};
                  return (
                    <tr key={row.classId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 text-left font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                        {row.displayName}
                      </td>
                      <td className="p-3 text-left text-slate-600 dark:text-slate-300 truncate max-w-[140px] border-r border-slate-100 dark:border-slate-800">
                        {row.classTeacher?.name || 'Class Teacher'}
                      </td>

                      {CATEGORY_COLS.map((col) => {
                        const b = c[col.key]?.boys || 0;
                        const g = c[col.key]?.girls || 0;
                        const tot = c[col.key]?.total || (b + g);
                        return (
                          <React.Fragment key={`${row.classId}-${col.key}`}>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{b}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{g}</td>
                            <td className="p-2 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                              {tot}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="p-2 font-bold text-blue-600 dark:text-blue-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                        {row.totalBoys}
                      </td>
                      <td className="p-2 font-bold text-pink-600 dark:text-pink-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                        {row.totalGirls}
                      </td>
                      <td className="p-2 font-black text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30">
                        {row.grandTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {schoolTotals && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs">
                    <td colSpan={2} className="p-3.5 text-left text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">
                      शाळा एकूण पटसंख्या (School Total):
                    </td>
                    {CATEGORY_COLS.map((col) => {
                      const st = schoolTotals[col.key] || { boys: 0, girls: 0, total: 0 };
                      return (
                        <React.Fragment key={`tot-${col.key}`}>
                          <td className="p-2 text-blue-600 dark:text-blue-400">{st.boys}</td>
                          <td className="p-2 text-pink-600 dark:text-pink-400">{st.girls}</td>
                          <td className="p-2 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 bg-slate-200/40 dark:bg-slate-700/40">
                            {st.total}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-2 font-black text-blue-700 dark:text-blue-300 bg-emerald-100 dark:bg-emerald-950">
                      {schoolTotals.totalBoys}
                    </td>
                    <td className="p-2 font-black text-pink-700 dark:text-pink-300 bg-emerald-100 dark:bg-emerald-950">
                      {schoolTotals.totalGirls}
                    </td>
                    <td className="p-2 font-black text-base text-emerald-700 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-900/50">
                      {schoolTotals.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
