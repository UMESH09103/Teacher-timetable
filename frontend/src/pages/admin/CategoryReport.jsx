import { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import * as XLSX from 'xlsx';
import {
  HiOutlineTableCells, HiOutlineArrowPath,
  HiOutlinePencil, HiOutlineArrowDownTray,
  HiOutlineAcademicCap, HiOutlineBuildingLibrary, HiOutlineSparkles,
  HiOutlineDocumentText, HiOutlineCalendar
} from 'react-icons/hi2';

const CATEGORIES = [
  { key: 'sc', mr: 'अनु.जाती', en: 'SC' },
  { key: 'st', mr: 'अनु.जमाती', en: 'ST' },
  { key: 'ntvj', mr: 'भटक्या व विमुक्त जाती', en: 'NT/VJ' },
  { key: 'sbc', mr: 'विशेष मागास प्रवर्ग', en: 'SBC' },
  { key: 'obc', mr: 'इतर मागास वर्ग', en: 'OBC' },
  { key: 'open', mr: 'बिगर मागास', en: 'OPEN' },
];

const ALL_TABLE_COLS = [
  ...CATEGORIES,
  { key: 'minority', mr: 'अल्पसंख्यांक', en: 'MINORITY' }
];

const getMarathiClassName = (stdName, divName) => {
  const digits = { '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९', '10': '१०', '11': '११', '12': '१२' };
  const marathiStd = digits[String(stdName)] || stdName;
  let divClean = String(divName || '').toLowerCase().trim();
  if (divClean === 'a') divClean = 'अ';
  else if (divClean === 'b') divClean = 'ब';
  else if (divClean === 'c') divClean = 'क';
  else if (divClean === 'd') divClean = 'ड';
  else if (divClean === 'art-a') divClean = 'कला-अ';
  else if (divClean === 'art-b') divClean = 'कला-ब';
  else if (divClean === 'science') divClean = 'विज्ञान';

  return `${marathiStd} वी ${divClean}`;
};

const formatDateMarathi = (dateStr) => {
  if (!dateStr) return 'दिनांक: ०७/०८/२०२६';
  const [y, m, d] = dateStr.split('-');
  const digits = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
  const toMar = (str) => String(str).split('').map(ch => digits[ch] || ch).join('');
  return `दिनांक: ${toMar(d)}/${toMar(m)}/${toMar(y)}`;
};

const calculateSummaryForItems = (items) => {
  const summary = {
    sc: { boys: 0, girls: 0, total: 0 },
    st: { boys: 0, girls: 0, total: 0 },
    ntvj: { boys: 0, girls: 0, total: 0 },
    sbc: { boys: 0, girls: 0, total: 0 },
    obc: { boys: 0, girls: 0, total: 0 },
    open: { boys: 0, girls: 0, total: 0 },
    minority: { boys: 0, girls: 0, total: 0 },
    totalBoys: 0,
    totalGirls: 0,
    grandTotal: 0
  };

  const cats = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open', 'minority'];
  items.forEach(item => {
    cats.forEach(c => {
      const b = item.categories[c]?.boys || 0;
      const g = item.categories[c]?.girls || 0;
      summary[c].boys += b;
      summary[c].girls += g;
      summary[c].total += (b + g);
    });
    summary.totalBoys += item.totalBoys || 0;
    summary.totalGirls += item.totalGirls || 0;
    summary.grandTotal += item.grandTotal || 0;
  });

  return summary;
};

const AdminCategoryReport = () => {
  const { t, i18n } = useTranslation();
  const isMarathi = i18n.language === 'mr';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('combined'); // 'school' | 'college' | 'combined'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Edit Modal State
  const [editModal, setEditModal] = useState({ open: false, item: null, categories: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const fetchData = async (dStr = selectedDate) => {
    try {
      setLoading(true);
      const res = await api.get('/category-strength/all', { params: { date: dStr } });
      setData(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Failed to load report data'));
    } finally {
      setLoading(false);
    }
  };

  const filterItems = (type) => {
    if (type === 'school') {
      return data.filter(d => d.stdNum >= 5 && d.stdNum <= 10);
    } else if (type === 'college') {
      return data.filter(d => d.stdNum >= 11 && d.stdNum <= 12);
    }
    return data;
  };

  const displayData = filterItems(activeTab);
  const displaySummary = calculateSummaryForItems(displayData);
  const marathiDateText = formatDateMarathi(selectedDate);

  const handleOpenEdit = (item) => {
    const cats = {};
    [...CATEGORIES, { key: 'minority' }].forEach(c => {
      cats[c.key] = {
        boys: item.categories[c.key]?.boys || 0,
        girls: item.categories[c.key]?.girls || 0,
      };
    });
    setEditModal({ open: true, item, categories: cats });
  };

  const handleEditInputChange = (key, field, val) => {
    const num = Math.max(0, parseInt(val || '0', 10));
    setEditModal(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [key]: {
          ...prev.categories[key],
          [field]: isNaN(num) ? 0 : num
        }
      }
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        teacherId: editModal.item.teacherId,
        standardId: editModal.item.standardId,
        divisionId: editModal.item.divisionId,
        categories: editModal.categories,
        dateStr: selectedDate
      };
      const res = await api.post('/category-strength/admin-update', payload);
      toast.success(res.data.message || (isMarathi ? 'माहिती अपडेट झाली!' : 'Updated successfully!'));
      setEditModal({ open: false, item: null, categories: null });
      fetchData(selectedDate);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  // Download PDF Report Function with Sr No & Selected Date
  const handleDownloadPDF = (type) => {
    const reportItems = filterItems(type);
    if (!reportItems || reportItems.length === 0) {
      toast.error(isMarathi ? 'निवडलेल्या अहवालासाठी डेटा उपलब्ध नाही' : 'No data available for selected report');
      return;
    }

    let reportTitle = `एकत्रित जातनिहाय विद्यार्थी संख्या अहवाल (५वी ते १२वी)`;
    let fileDocName = `Combined_Category_Report_${selectedDate}`;
    if (type === 'school') {
      reportTitle = `माध्यमिक शाळा जातनिहाय विद्यार्थी संख्या अहवाल (५वी ते १०वी)`;
      fileDocName = `School_Category_Report_${selectedDate}`;
    } else if (type === 'college') {
      reportTitle = `उच्च माध्यमिक कॉलेज जातनिहाय विद्यार्थी संख्या अहवाल (११वी व १२वी)`;
      fileDocName = `College_Category_Report_${selectedDate}`;
    }

    const reportSummary = calculateSummaryForItems(reportItems);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(isMarathi ? 'कृपया PDF डाऊनलोड करण्यासाठी पॉपअपला अनुमती द्या' : 'Please allow popups to download PDF');
      return;
    }

    let rowsHtml = '';
    reportItems.forEach((item, idx) => {
      const className = getMarathiClassName(item.standardName, item.divisionName);
      rowsHtml += `
        <tr>
          <td style="font-weight:bold;">${idx + 1}</td>
          <td style="text-align:left; font-weight:bold; padding:4px 6px;">${className}</td>
      `;
      CATEGORIES.forEach(c => {
        const b = item.categories[c.key]?.boys || 0;
        const g = item.categories[c.key]?.girls || 0;
        const tot = b + g;
        rowsHtml += `
          <td>${b}</td>
          <td>${g}</td>
          <td style="font-weight:bold; background-color:#f1f5f9;">${tot}</td>
        `;
      });
      rowsHtml += `
        <td style="font-weight:bold; background-color:#e2e8f0;">${item.totalBoys || 0}</td>
        <td style="font-weight:bold; background-color:#e2e8f0;">${item.totalGirls || 0}</td>
        <td style="font-weight:bold; background-color:#cbd5e1;">${item.grandTotal || 0}</td>
        <td>${item.categories.minority?.boys || 0}</td>
        <td>${item.categories.minority?.girls || 0}</td>
        <td style="font-weight:bold; background-color:#f1f5f9;">${item.categories.minority?.total || 0}</td>
      </tr>
      `;
    });

    let grandRowHtml = `
      <tr style="background-color:#cbd5e1; font-weight:bold;">
        <td colspan="2" style="text-align:center; padding:5px 6px;">एकूण (TOTAL)</td>
    `;
    CATEGORIES.forEach(c => {
      const sum = reportSummary[c.key] || { boys: 0, girls: 0, total: 0 };
      grandRowHtml += `
        <td>${sum.boys}</td>
        <td>${sum.girls}</td>
        <td style="background-color:#94a3b8; font-weight:bold;">${sum.total}</td>
      `;
    });
    grandRowHtml += `
      <td>${reportSummary.totalBoys}</td>
      <td>${reportSummary.totalGirls}</td>
      <td style="background-color:#94a3b8; font-weight:bold;">${reportSummary.grandTotal}</td>
      <td>${reportSummary.minority?.boys || 0}</td>
      <td>${reportSummary.minority?.girls || 0}</td>
      <td style="background-color:#94a3b8; font-weight:bold;">${reportSummary.minority?.total || 0}</td>
    </tr>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileDocName}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 10px; color: #000; background: #fff; font-size: 11px; }
          .header-box { border: 2px solid #000; background-color: #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
          .top-row { display: flex; align-items: center; justify-content: space-between; position: relative; min-height: 55px; }
          .logo { width: 50px; height: 50px; border: 1.5px solid #000; border-radius: 8px; background: #fff; padding: 2px; }
          .title-container { text-align: center; width: 100%; padding: 0 50px; }
          .inst-title { font-size: 13px; font-weight: bold; margin: 0 0 4px 0; }
          .school-title { font-size: 15px; font-weight: 900; margin: 0; }
          .sub-row { display: flex; justify-content: space-between; border-top: 2px solid #000; margin-top: 10px; padding-top: 6px; font-weight: bold; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 10px; text-align: center; border: 2px solid #000; }
          th, td { border: 1px solid #000; padding: 4px 2px; }
          th { background-color: #cbd5e1; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="top-row">
            <div style="position:absolute; left:0;"><img src="/school-logo.png" class="logo" alt="Logo" /></div>
            <div class="title-container">
              <p class="inst-title">क्रांतीवीर वसंतराव नारायणराव नाईक शिक्षण प्रसारक संस्था,नाशिक संचलित,</p>
              <h1 class="school-title">माध्यमिक व उच्च माध्यमिक विद्यामंदिर,राजापूर ता.येवला जि.नाशिक</h1>
            </div>
          </div>
          <div class="sub-row">
            <span style="text-decoration: underline;">${reportTitle}</span>
            <span>${marathiDateText}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="3" style="width:40px;">अ.क्र.</th>
              <th rowspan="3" style="width:75px;">इयत्ता</th>
              <th colspan="3">अनु.जाती</th>
              <th colspan="3">अनु.जमाती</th>
              <th colspan="3">भटक्या व विमुक्त जाती</th>
              <th colspan="3">विशेष मागास प्रवर्ग</th>
              <th colspan="3">इतर मागास वर्ग</th>
              <th colspan="3">बिगर मागास</th>
              <th colspan="3" style="background-color:#94a3b8;">एकूण</th>
              <th colspan="3">अल्पसंख्यांक</th>
            </tr>
            <tr>
              <th colspan="3">SC</th>
              <th colspan="3">ST</th>
              <th colspan="3">NT/VJ</th>
              <th colspan="3">SBC</th>
              <th colspan="3">OBC</th>
              <th colspan="3">OPEN</th>
              <th colspan="3" style="background-color:#94a3b8;">TOTAL</th>
              <th colspan="3">MINORITY</th>
            </tr>
            <tr>
              ${Array(8).fill('<th>मुले</th><th>मुली</th><th style="background-color:#cbd5e1;">एकूण</th>').join('')}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${grandRowHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            document.title = "${fileDocName}";
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success(isMarathi ? `${reportTitle} (${marathiDateText}) PDF तयार झाला!` : `${reportTitle} PDF ready!`);
  };

  // Excel (.xlsx) Download with Merged Headers & Sr. No. Column
  const handleDownloadXLSX = (type) => {
    const reportItems = filterItems(type);
    if (!reportItems || reportItems.length === 0) {
      toast.error(isMarathi ? 'निवडलेल्या अहवालासाठी डेटा उपलब्ध नाही' : 'No data available for selected report');
      return;
    }

    let titleName = 'एकत्रित अहवाल (५वी ते १२वी)';
    let fileName = `Combined_Category_Report_${selectedDate}`;

    if (type === 'school') {
      titleName = 'माध्यमिक शाळा अहवाल (५वी ते १०वी)';
      fileName = `School_Category_Report_${selectedDate}`;
    } else if (type === 'college') {
      titleName = 'उच्च माध्यमिक कॉलेज अहवाल (११वी व १२वी)';
      fileName = `College_Category_Report_${selectedDate}`;
    }

    const reportSummary = calculateSummaryForItems(reportItems);

    const sheetData = [
      ['क्रांतीवीर वसंतराव नारायणराव नाईक शिक्षण प्रसारक संस्था, नाशिक संचलित'],
      ['माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर ता. येवला जि. नाशिक'],
      [`जातनिहाय विद्यार्थी संख्या (${titleName}) - ${marathiDateText}`],
      [],
      ['अ.क्र.', 'इयत्ता', 
       'अनु.जाती', '', '', 
       'अनु.जमाती', '', '', 
       'भटक्या व विमुक्त जाती', '', '', 
       'विशेष मागास प्रवर्ग', '', '', 
       'इतर मागास वर्ग', '', '', 
       'बिगर मागास', '', '', 
       'एकूण', '', '', 
       'अल्पसंख्यांक', '', ''],
      ['', '', 
       'SC', '', '', 
       'ST', '', '', 
       'NT/VJ', '', '', 
       'SBC', '', '', 
       'OBC', '', '', 
       'OPEN', '', '', 
       'TOTAL', '', '', 
       'MINORITY', '', ''],
      ['', '', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण', 
       'मुले', 'मुली', 'एकूण']
    ];

    reportItems.forEach((item, index) => {
      const srNo = index + 1;
      const className = getMarathiClassName(item.standardName, item.divisionName);

      const row = [srNo, className];

      CATEGORIES.forEach(c => {
        const b = item.categories[c.key]?.boys || 0;
        const g = item.categories[c.key]?.girls || 0;
        row.push(b, g, b + g);
      });

      row.push(item.totalBoys || 0, item.totalGirls || 0, item.grandTotal || 0);

      const mb = item.categories.minority?.boys || 0;
      const mg = item.categories.minority?.girls || 0;
      row.push(mb, mg, mb + mg);

      sheetData.push(row);
    });

    const grandRow = ['', 'एकूण (TOTAL)'];
    CATEGORIES.forEach(c => {
      const sum = reportSummary[c.key] || { boys: 0, girls: 0, total: 0 };
      grandRow.push(sum.boys, sum.girls, sum.total);
    });
    grandRow.push(reportSummary.totalBoys, reportSummary.totalGirls, reportSummary.grandTotal);
    const mb = reportSummary.minority?.boys || 0;
    const mg = reportSummary.minority?.girls || 0;
    grandRow.push(mb, mg, mb + mg);
    sheetData.push(grandRow);

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 25 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 25 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 25 } },

      { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } },
      { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } },

      { s: { r: 4, c: 2 }, e: { r: 4, c: 4 } },
      { s: { r: 5, c: 2 }, e: { r: 5, c: 4 } },

      { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },
      { s: { r: 5, c: 5 }, e: { r: 5, c: 7 } },

      { s: { r: 4, c: 8 }, e: { r: 4, c: 10 } },
      { s: { r: 5, c: 8 }, e: { r: 5, c: 10 } },

      { s: { r: 4, c: 11 }, e: { r: 4, c: 13 } },
      { s: { r: 5, c: 11 }, e: { r: 5, c: 13 } },

      { s: { r: 4, c: 14 }, e: { r: 4, c: 16 } },
      { s: { r: 5, c: 14 }, e: { r: 5, c: 16 } },

      { s: { r: 4, c: 17 }, e: { r: 4, c: 19 } },
      { s: { r: 5, c: 17 }, e: { r: 5, c: 19 } },

      { s: { r: 4, c: 20 }, e: { r: 4, c: 22 } },
      { s: { r: 5, c: 20 }, e: { r: 5, c: 22 } },

      { s: { r: 4, c: 23 }, e: { r: 4, c: 25 } },
      { s: { r: 5, c: 23 }, e: { r: 5, c: 25 } },
    ];

    ws['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      ...Array(24).fill({ wch: 7 })
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Category Report');

    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast.success(isMarathi ? `${titleName} (${marathiDateText}) Excel (.xlsx) फाईल डाऊनलोड झाली!` : `${titleName} Excel downloaded!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Top Header Card with Date Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <HiOutlineTableCells className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isMarathi ? 'जातनिहाय विद्यार्थी संख्या अहवाल (दिनांकानुसार शोधा)' : 'Date-wise Category Student Report Search'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-0.5">
                {isMarathi
                  ? 'कोणत्याही तारखेचा (Specific Date) अहवाल शोधा व PDF/Excel मध्ये डाऊनलोड करा'
                  : 'Select specific date e.g. 07-08-2026 to view and download reports'}
              </p>
            </div>
          </div>

          {/* Specific Date Picker Search Control */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl">
              <HiOutlineCalendar className="w-5 h-5 text-indigo-200" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                  {isMarathi ? 'दिनांक निवडा (Select Date)' : 'Select Date'}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-1"
                />
              </div>
            </div>

            <button
              onClick={() => fetchData(selectedDate)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all shadow-inner"
              title="Refresh"
            >
              <HiOutlineArrowPath className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3 Explicit Download Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1) School Report Download Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HiOutlineAcademicCap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isMarathi ? '१) शाळा अहवाल (School Report)' : '1) School Report'}
              </h3>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">इयत्ता ५ वी ते १० वी | {marathiDateText}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => handleDownloadPDF('school')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <HiOutlineDocumentText className="w-4.5 h-4.5" />
              <span>{isMarathi ? `१) शाळा अहवाल PDF` : 'Download School PDF'}</span>
            </button>
            <button
              onClick={() => handleDownloadXLSX('school')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 transition-all border border-emerald-200 dark:border-emerald-800"
            >
              <HiOutlineArrowDownTray className="w-4 h-4 text-emerald-600" />
              <span>{isMarathi ? 'Excel (.xlsx) फाईल डाऊनलोड करा' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* 2) College Report Download Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <HiOutlineBuildingLibrary className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isMarathi ? '२) कॉलेज अहवाल (College Report)' : '2) College Report'}
              </h3>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">इयत्ता ११ वी व १२ वी | {marathiDateText}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => handleDownloadPDF('college')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
            >
              <HiOutlineDocumentText className="w-4.5 h-4.5" />
              <span>{isMarathi ? `२) कॉलेज अहवाल PDF` : 'Download College PDF'}</span>
            </button>
            <button
              onClick={() => handleDownloadXLSX('college')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition-all border border-blue-200 dark:border-blue-800"
            >
              <HiOutlineArrowDownTray className="w-4 h-4 text-blue-600" />
              <span>{isMarathi ? 'Excel (.xlsx) फाईल डाऊनलोड करा' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>

        {/* 3) Combine Report Download Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 border border-purple-200 dark:border-purple-900/50 shadow-sm flex flex-col justify-between bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <HiOutlineSparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isMarathi ? '३) एकत्रित अहवाल (Combine Report)' : '3) Combine Report'}
              </h3>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400">इयत्ता ५ वी ते १२ वी सर्व एकत्र | {marathiDateText}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => handleDownloadPDF('combined')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition-all"
            >
              <HiOutlineDocumentText className="w-4.5 h-4.5" />
              <span>{isMarathi ? `३) एकत्रित अहवाल PDF` : 'Download Combine PDF'}</span>
            </button>
            <button
              onClick={() => handleDownloadXLSX('combined')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-purple-700 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 transition-all border border-purple-200 dark:border-purple-800"
            >
              <HiOutlineArrowDownTray className="w-4 h-4 text-purple-600" />
              <span>{isMarathi ? 'Excel (.xlsx) फाईल डाऊनलोड करा' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Screen View Filter Tabs - Number-wise Order (1, 2, 3) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'school'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <HiOutlineAcademicCap className="w-4 h-4" />
          <span>{isMarathi ? '१) शाळा अहवाल पहा (Std 5th-10th)' : '1) School View'}</span>
        </button>

        <button
          onClick={() => setActiveTab('college')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'college'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <HiOutlineBuildingLibrary className="w-4 h-4" />
          <span>{isMarathi ? '२) कॉलेज अहवाल पहा (Std 11th-12th)' : '2) College View'}</span>
        </button>

        <button
          onClick={() => setActiveTab('combined')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'combined'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <HiOutlineSparkles className="w-4 h-4" />
          <span>{isMarathi ? '३) एकत्रित अहवाल पहा (All 5th to 12th)' : '3) Combined View'}</span>
        </button>
      </div>

      {/* Dynamic Summary Cards Grid */}
      {displaySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map(c => {
            const sum = displaySummary[c.key] || { boys: 0, girls: 0, total: 0 };
            return (
              <div key={c.key} className="bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/60 shadow-sm text-center">
                <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{isMarathi ? c.mr : c.en}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{sum.total}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  M: {sum.boys} | F: {sum.girls}
                </p>
              </div>
            );
          })}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-rose-200 dark:border-rose-900/40 shadow-sm text-center">
            <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">अल्पसंख्यांक</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{displaySummary.minority?.total || 0}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              M: {displaySummary.minority?.boys || 0} | F: {displaySummary.minority?.girls || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-3 text-white shadow-md text-center col-span-2 sm:col-span-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-indigo-100">{isMarathi ? 'एकूण पट' : 'TOTAL'}</p>
            <p className="text-xl font-black text-white mt-1">{displaySummary.grandTotal}</p>
            <p className="text-[10px] font-extrabold text-indigo-100 mt-0.5">
              M: {displaySummary.totalBoys} | F: {displaySummary.totalGirls}
            </p>
          </div>
        </div>
      )}

      {/* Main Register Table Card (Exact match of official Marathi document) */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-4 sm:p-6 shadow-sm backdrop-blur-xl">
        
        {/* Official Header Box matching school register screenshot */}
        <div className="mb-4 p-4 bg-slate-200 dark:bg-slate-800 border-2 border-slate-900 rounded-xl space-y-2">
          <div className="relative flex items-center justify-center min-h-[64px]">
            {/* Logo on Left */}
            <div className="absolute left-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 border-2 border-slate-900 bg-white p-1 rounded-xl shadow-sm">
              <img src="/school-logo.png" alt="Emblem" className="w-full h-full object-contain" />
            </div>

            {/* Centered Clear School Title */}
            <div className="text-center space-y-1 text-slate-900 dark:text-white px-16">
              <p className="text-xs sm:text-sm font-extrabold tracking-normal">
                क्रांतीवीर वसंतराव नारायणराव नाईक शिक्षण प्रसारक संस्था,नाशिक संचलित,
              </p>
              <h1 className="text-sm sm:text-lg font-black tracking-tight leading-tight">
                माध्यमिक व उच्च माध्यमिक विद्यामंदिर,राजापूर ता.येवला जि.नाशिक
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900 dark:text-white pt-2.5 border-t-2 border-slate-900 mt-2">
            <span className="underline underline-offset-4 decoration-2">
              जातनिहाय विद्यार्थी संख्या {activeTab === 'school' ? '(शाळा: ५वी ते १०वी)' : activeTab === 'college' ? '(कॉलेज: ११वी व १२वी)' : '(एकत्रित: ५वी ते १२वी)'}
            </span>
            <span className="font-extrabold">{marathiDateText}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-slate-900 text-slate-900 dark:text-white text-xs font-bold text-center">
            <thead>
              <tr className="bg-slate-300 dark:bg-slate-800">
                <th rowSpan={3} className="border border-slate-900 p-2 min-w-[45px] text-xs font-black">अ.क्र.</th>
                <th rowSpan={3} className="border border-slate-900 p-2 min-w-[75px] text-sm font-black">इयत्ता</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">अनु.जाती</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">अनु.जमाती</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">भटक्या व विमुक्त जाती</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">विशेष मागास प्रवर्ग</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">इतर मागास वर्ग</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">बिगर मागास</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs bg-slate-400 dark:bg-slate-700 font-black">एकूण</th>
                <th colSpan={3} className="border border-slate-900 p-1 text-xs font-black">अल्पसंख्यांक</th>
                <th rowSpan={3} className="border border-slate-900 p-1 min-w-[45px]">Action</th>
              </tr>
              <tr className="bg-slate-300 dark:bg-slate-800">
                <th colSpan={3} className="border border-slate-900 p-1 font-black">SC</th>
                <th colSpan={3} className="border border-slate-900 p-1 font-black">ST</th>
                <th colSpan={3} className="border border-slate-900 p-1 font-black">NT/VJ</th>
                <th colSpan={3} className="border border-slate-900 p-1 font-black">SBC</th>
                <th colSpan={3} className="border border-slate-900 p-1 font-black">OBC</th>
                <th colSpan={3} className="border border-slate-900 p-1 font-black">OPEN</th>
                <th colSpan={3} className="border border-slate-900 p-1 bg-slate-400 dark:bg-slate-700 font-black">TOTAL</th>
                <th colSpan={3} className="border border-slate-900 p-1 font-black">MINORITY</th>
              </tr>
              <tr className="bg-slate-200 dark:bg-slate-800 text-[11px]">
                {/* 8 categories x 3 sub-columns */}
                {[...Array(8)].map((_, i) => (
                  <Fragment key={i}>
                    <th className="border border-slate-900 p-1 font-bold">मुले</th>
                    <th className="border border-slate-900 p-1 font-bold">मुली</th>
                    <th className={`border border-slate-900 p-1 font-black ${i === 6 ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'}`}>एकूण</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="border border-slate-900 p-1.5 font-bold text-center bg-slate-50 dark:bg-slate-900/40">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-900 p-1.5 font-black whitespace-nowrap bg-slate-100 dark:bg-slate-900/50 text-left pl-3 text-sm">
                    {getMarathiClassName(item.standardName, item.divisionName)}
                  </td>

                  {/* Categories SC, ST, NT/VJ, SBC, OBC, OPEN */}
                  {CATEGORIES.map(c => {
                    const b = item.categories[c.key]?.boys || 0;
                    const g = item.categories[c.key]?.girls || 0;
                    const tot = b + g;
                    return (
                      <Fragment key={c.key}>
                        <td className="border border-slate-900 p-1 font-bold">{b}</td>
                        <td className="border border-slate-900 p-1 font-bold">{g}</td>
                        <td className="border border-slate-900 p-1 font-black bg-slate-100 dark:bg-slate-900/40">{tot}</td>
                      </Fragment>
                    );
                  })}

                  {/* Total for class */}
                  <td className="border border-slate-900 p-1 font-black bg-slate-200 dark:bg-slate-800">{item.totalBoys || 0}</td>
                  <td className="border border-slate-900 p-1 font-black bg-slate-200 dark:bg-slate-800">{item.totalGirls || 0}</td>
                  <td className="border border-slate-900 p-1 font-black bg-slate-300 dark:bg-slate-700 text-indigo-900 dark:text-indigo-300">{item.grandTotal || 0}</td>

                  {/* Minority column */}
                  <td className="border border-slate-900 p-1 font-bold">{item.categories.minority?.boys || 0}</td>
                  <td className="border border-slate-900 p-1 font-bold">{item.categories.minority?.girls || 0}</td>
                  <td className="border border-slate-900 p-1 font-black bg-slate-100 dark:bg-slate-900/40">{item.categories.minority?.total || 0}</td>

                  {/* Admin Edit Button */}
                  <td className="border border-slate-900 p-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400"
                      title="Edit class strength"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Grand Total Row */}
              {displaySummary && (
                <tr className="bg-slate-300 dark:bg-slate-900 font-black text-slate-900 dark:text-white text-sm">
                  <td colSpan={2} className="border border-slate-900 p-2 text-sm font-black text-center">एकूण (TOTAL)</td>
                  {CATEGORIES.map(c => {
                    const sum = displaySummary[c.key] || { boys: 0, girls: 0, total: 0 };
                    return (
                      <Fragment key={c.key}>
                        <td className="border border-slate-900 p-1.5 font-black">{sum.boys}</td>
                        <td className="border border-slate-900 p-1.5 font-black">{sum.girls}</td>
                        <td className="border border-slate-900 p-1.5 bg-slate-400 dark:bg-slate-800 font-black">{sum.total}</td>
                      </Fragment>
                    );
                  })}
                  <td className="border border-slate-900 p-1.5 text-sm font-black">{displaySummary.totalBoys}</td>
                  <td className="border border-slate-900 p-1.5 text-sm font-black">{displaySummary.totalGirls}</td>
                  <td className="border border-slate-900 p-1.5 text-sm bg-slate-400 dark:bg-slate-700 text-indigo-950 dark:text-indigo-100 font-black">{displaySummary.grandTotal}</td>

                  {/* Minority Grand Total */}
                  <td className="border border-slate-900 p-1.5 font-black">{displaySummary.minority?.boys || 0}</td>
                  <td className="border border-slate-900 p-1.5 font-black">{displaySummary.minority?.girls || 0}</td>
                  <td className="border border-slate-900 p-1.5 bg-slate-400 dark:bg-slate-800 font-black">{displaySummary.minority?.total || 0}</td>

                  <td className="border border-slate-900 p-1"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, item: null, categories: null })}
        title={editModal.item ? `Edit ${getMarathiClassName(editModal.item.standardName, editModal.item.divisionName)} Category Strength` : 'Edit Category Strength'}
        size="lg"
      >
        {editModal.categories && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_TABLE_COLS.map(c => (
                <div key={c.key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{c.mr} ({c.en})</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Boys</label>
                      <input
                        type="number"
                        min="0"
                        value={editModal.categories[c.key]?.boys === 0 ? '' : editModal.categories[c.key]?.boys}
                        onChange={(e) => handleEditInputChange(c.key, 'boys', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Girls</label>
                      <input
                        type="number"
                        min="0"
                        value={editModal.categories[c.key]?.girls === 0 ? '' : editModal.categories[c.key]?.girls}
                        onChange={(e) => handleEditInputChange(c.key, 'girls', e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal({ open: false, item: null, categories: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminCategoryReport;
