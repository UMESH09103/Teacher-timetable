import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineCalendar, HiOutlineDocumentArrowDown,
  HiOutlineExclamationTriangle, HiOutlineEye, HiOutlineFunnel,
  HiOutlineAcademicCap, HiOutlineBuildingLibrary, HiOutlineSparkles
} from 'react-icons/hi2';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'range'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Hidden print element ref
  const printContainerRef = useRef(null);

  // Daily report states
  const [classData, setClassData] = useState([]);
  const [pendingClasses, setPendingClasses] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [summary, setSummary] = useState({
    secondary: { enrolledBoys: 0, enrolledGirls: 0, enrolledTotal: 0, presentBoys: 0, presentGirls: 0, presentTotal: 0, absentBoys: 0, absentGirls: 0, absentTotal: 0 },
    higherSecondary: { enrolledBoys: 0, enrolledGirls: 0, enrolledTotal: 0, presentBoys: 0, presentGirls: 0, presentTotal: 0, absentBoys: 0, absentGirls: 0, absentTotal: 0 },
    totalSchool: { enrolledBoys: 0, enrolledGirls: 0, enrolledTotal: 0, presentBoys: 0, presentGirls: 0, presentTotal: 0, absentBoys: 0, absentGirls: 0, absentTotal: 0 }
  });

  // Range report states
  const [rangeReports, setRangeReports] = useState([]);
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rangeFilters, setRangeFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    standard: '',
    division: '',
    teacher: ''
  });

  const isMarathi = i18n.language === 'mr';

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailySummary();
    } else {
      fetchRangeReports();
    }
  }, [activeTab, selectedDate, rangeFilters]);

  const fetchMetadata = async () => {
    try {
      const [stdRes, divRes, teachRes] = await Promise.all([
        api.get('/standards'),
        api.get('/divisions'),
        api.get('/teachers')
      ]);
      setStandards(stdRes.data.data);
      setDivisions(divRes.data.data);
      setTeachers(teachRes.data.data);
    } catch (error) {
      console.error('Failed to load metadata');
    }
  };

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/class-summary', {
        params: { date: selectedDate }
      });
      const list = res.data.data || [];
      setClassData(list);

      if (res.data.summary) {
        setSummary(res.data.summary);
        setPendingClasses(res.data.pendingClasses || []);
        setPendingCount(res.data.pendingCount || 0);
      } else {
        // Fallback client-side calculation
        const pending = [];
        const sum = {
          secondary: { enrolledBoys: 0, enrolledGirls: 0, enrolledTotal: 0, presentBoys: 0, presentGirls: 0, presentTotal: 0, absentBoys: 0, absentGirls: 0, absentTotal: 0 },
          higherSecondary: { enrolledBoys: 0, enrolledGirls: 0, enrolledTotal: 0, presentBoys: 0, presentGirls: 0, presentTotal: 0, absentBoys: 0, absentGirls: 0, absentTotal: 0 },
          totalSchool: { enrolledBoys: 0, enrolledGirls: 0, enrolledTotal: 0, presentBoys: 0, presentGirls: 0, presentTotal: 0, absentBoys: 0, absentGirls: 0, absentTotal: 0 }
        };

        list.forEach(item => {
          const stdName = String(item.standard?.name || '').trim();
          const divName = String(item.division?.name || '').trim();
          const isCollege = /^(11|12)/.test(stdName);
          const targetGroup = isCollege ? sum.higherSecondary : sum.secondary;

          if (!item.isSubmitted) {
            pending.push(`${stdName}-${divName}`);
          }

          targetGroup.enrolledBoys += item.totalBoys || 0;
          targetGroup.enrolledGirls += item.totalGirls || 0;
          targetGroup.enrolledTotal += item.totalStudents || 0;

          sum.totalSchool.enrolledBoys += item.totalBoys || 0;
          sum.totalSchool.enrolledGirls += item.totalGirls || 0;
          sum.totalSchool.enrolledTotal += item.totalStudents || 0;

          if (item.isSubmitted) {
            targetGroup.presentBoys += item.boysPresent || 0;
            targetGroup.presentGirls += item.girlsPresent || 0;
            targetGroup.presentTotal += item.totalPresent || 0;

            targetGroup.absentBoys += item.boysAbsent || 0;
            targetGroup.absentGirls += item.girlsAbsent || 0;
            targetGroup.absentTotal += item.totalAbsent || 0;

            sum.totalSchool.presentBoys += item.boysPresent || 0;
            sum.totalSchool.presentGirls += item.girlsPresent || 0;
            sum.totalSchool.presentTotal += item.totalPresent || 0;

            sum.totalSchool.absentBoys += item.boysAbsent || 0;
            sum.totalSchool.absentGirls += item.girlsAbsent || 0;
            sum.totalSchool.absentTotal += item.totalAbsent || 0;
          }
        });

        setPendingClasses(pending);
        setPendingCount(pending.length);
        setSummary(sum);
      }
    } catch (error) {
      toast.error(t('common.error', 'Failed to load daily attendance report'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRangeReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports', { params: rangeFilters });
      setRangeReports(res.data.data || []);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load range reports'));
    } finally {
      setLoading(false);
    }
  };

  // Convert English numbers to Marathi Devanagari digits
  const toMarathiDigits = (num) => {
    if (num === null || num === undefined || num === '-') return '-';
    const digits = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
    return String(num).replace(/[0-9]/g, (w) => digits[w] || w);
  };

  // Format date to DD/MM/YYYY
  const formatDateDDMMYYYY = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dStr;
  };

  // Helper to format Class Name cleanly in Marathi
  const formatClassNameMarathi = (stdName, divName) => {
    let std = String(stdName || '').trim();
    let div = String(divName || '').trim();

    let marathiStd = std;
    if (std === '11') marathiStd = '११ वी';
    else if (std === '12') marathiStd = '१२ वी';
    else if (std === '5') marathiStd = '५ वी';
    else if (std === '6') marathiStd = '६ वी';
    else if (std === '7') marathiStd = '७ वी';
    else if (std === '8') marathiStd = '८ वी';
    else if (std === '9') marathiStd = '९ वी';
    else if (std === '10') marathiStd = '१० वी';
    else marathiStd = toMarathiDigits(std);

    let marathiDiv = div;
    if (div === 'Art-A') marathiDiv = 'कला (अ)';
    else if (div === 'Art-B') marathiDiv = 'कला (ब)';
    else if (div === 'Science') marathiDiv = 'विज्ञान';
    else if (div === 'Commerce') marathiDiv = 'वाणिज्य';
    else if (div === 'A') marathiDiv = 'अ';
    else if (div === 'B') marathiDiv = 'ब';
    else if (div === 'C') marathiDiv = 'क';
    else if (div === 'D') marathiDiv = 'ड';

    return `इ. ${marathiStd} ${marathiDiv}`;
  };

  // Generate readable Marathi file name for download
  const getMarathiFileName = (reportOption) => {
    const dateFormatted = formatDateDDMMYYYY(selectedDate).replace(/\//g, '-');
    if (reportOption === 'school') {
      return `माध्यमिक_उपस्थिती_अहवाल_${dateFormatted}.pdf`;
    } else if (reportOption === 'college') {
      return `उच्च_माध्यमिक_उपस्थिती_अहवाल_${dateFormatted}.pdf`;
    }
    return `संपूर्ण_शाळा_उपस्थिती_अहवाल_${dateFormatted}.pdf`;
  };

  // Clean, Large-Font, B&W Marathi PDF Generator — Designed for Easy Reading & Print
  const generatePdfReport = async (reportOption) => {
    try {
      setIsDownloadModalOpen(false);
      setDownloadingPdf(true);
      toast.loading(isMarathi ? 'अहवाल तयार होत आहे...' : 'Generating PDF Report...', { id: 'pdf-toast' });

      const element = printContainerRef.current;
      if (!element) {
        toast.error('Print container not found', { id: 'pdf-toast' });
        setDownloadingPdf(false);
        return;
      }

      // Filter classes based on option
      let targetClasses = classData;
      if (reportOption === 'school') {
        targetClasses = classData.filter(c => !/^(11|12)/.test(String(c.standard?.name || '').trim()));
      } else if (reportOption === 'college') {
        targetClasses = classData.filter(c => /^(11|12)/.test(String(c.standard?.name || '').trim()));
      }

      // Compute totals for the filtered set
      let totEnrolledB = 0, totEnrolledG = 0, totEnrolled = 0;
      let totPresentB = 0, totPresentG = 0, totPresent = 0;
      let totAbsentB = 0, totAbsentG = 0, totAbsent = 0;
      targetClasses.forEach(item => {
        totEnrolledB += item.totalBoys || 0;
        totEnrolledG += item.totalGirls || 0;
        totEnrolled += item.totalStudents || 0;
        if (item.isSubmitted) {
          totPresentB += item.boysPresent || 0;
          totPresentG += item.girlsPresent || 0;
          totPresent += item.totalPresent || 0;
          totAbsentB += item.boysAbsent || 0;
          totAbsentG += item.girlsAbsent || 0;
          totAbsent += item.totalAbsent || 0;
        }
      });

      let subTitleText = 'दैनिक विद्यार्थी उपस्थिती अहवाल';
      if (reportOption === 'school') {
        subTitleText = 'माध्यमिक विभाग — दैनिक उपस्थिती अहवाल (इयत्ता ५ वी ते १० वी)';
      } else if (reportOption === 'college') {
        subTitleText = 'उच्च माध्यमिक विभाग — दैनिक उपस्थिती अहवाल (इयत्ता ११ वी व १२ वी)';
      } else {
        subTitleText = 'संपूर्ण शाळा व कनिष्ठ महाविद्यालय — दैनिक एकत्रित उपस्थिती अहवाल';
      }

      // Cell style helpers for cleaner template
      const hdrCell = 'border: 2px solid #000; padding: 10px 6px; font-size: 13px; font-weight: 900; color: #000; text-align: center; background: #f0f0f0;';
      const subHdrCell = 'border: 2px solid #000; padding: 8px 4px; font-size: 12px; font-weight: 800; color: #000; text-align: center; background: #e8e8e8;';
      const bodyCell = 'border: 1.5px solid #000; padding: 9px 5px; font-size: 13px; font-weight: 600; color: #000; text-align: center;';
      const bodyCellBold = 'border: 1.5px solid #000; padding: 9px 5px; font-size: 13px; font-weight: 900; color: #000; text-align: center;';
      const nameCell = 'border: 1.5px solid #000; padding: 9px 10px; font-size: 13px; font-weight: 900; color: #000; text-align: left;';
      const srCell = 'border: 1.5px solid #000; padding: 9px 5px; font-size: 13px; font-weight: 700; color: #000; text-align: center;';
      const totalCell = 'border: 2.5px solid #000; padding: 11px 5px; font-size: 14px; font-weight: 900; color: #000; text-align: center; background: #e0e0e0;';
      const totalNameCell = 'border: 2.5px solid #000; padding: 11px 10px; font-size: 14px; font-weight: 900; color: #000; text-align: left; background: #e0e0e0;';

      element.innerHTML = `
        <div style="width: 900px; background: #fff; color: #000; font-family: 'Noto Sans Devanagari', 'Noto Sans', 'Mangal', sans-serif; padding: 40px 35px; box-sizing: border-box;">
          
          <!-- Header -->
          <div style="border: 2.5px solid #000; padding: 18px 24px; margin-bottom: 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #000; letter-spacing: 0.5px;">
              माध्यमिक व उच्च माध्यमिक विद्यामंदिर, राजापूर
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 700; color: #333;">
              ता. येवला, जि. नाशिक
            </p>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1.5px solid #000;">
              <p style="margin: 0; font-size: 15px; font-weight: 900; color: #000;">
                ${subTitleText}
              </p>
            </div>
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #666; font-size: 12px; font-weight: 700; color: #000; display: flex; justify-content: space-between;">
              <span>दिनांक : ${toMarathiDigits(formatDateDDMMYYYY(selectedDate))}</span>
              <span>एकूण वर्ग : ${toMarathiDigits(targetClasses.length)}</span>
            </div>
          </div>

          <!-- Main Table -->
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
            <thead>
              <tr>
                <th rowspan="2" style="${hdrCell} width: 6%; vertical-align: middle;">अ.क्र.</th>
                <th rowspan="2" style="${hdrCell} width: 17%; text-align: left; padding-left: 10px; vertical-align: middle;">वर्ग</th>
                <th colspan="3" style="${hdrCell}">पट संख्या (Enrolled)</th>
                <th colspan="3" style="${hdrCell}">उपस्थित (Present)</th>
                <th colspan="3" style="${hdrCell}">गैरहजर (Absent)</th>
                <th rowspan="2" style="${hdrCell} width: 9%; vertical-align: middle;">स्थिती</th>
              </tr>
              <tr>
                <th style="${subHdrCell} width: 6.5%;">मुले</th>
                <th style="${subHdrCell} width: 6.5%;">मुली</th>
                <th style="${subHdrCell} width: 7.5%;">एकूण</th>
                <th style="${subHdrCell} width: 6.5%;">मुले</th>
                <th style="${subHdrCell} width: 6.5%;">मुली</th>
                <th style="${subHdrCell} width: 7.5%;">एकूण</th>
                <th style="${subHdrCell} width: 6.5%;">मुले</th>
                <th style="${subHdrCell} width: 6.5%;">मुली</th>
                <th style="${subHdrCell} width: 7.5%;">एकूण</th>
              </tr>
            </thead>
            <tbody>
              ${targetClasses.map((item, idx) => {
                const cn = formatClassNameMarathi(item.standard?.name, item.division?.name);
                const sub = item.isSubmitted;
                const bg = idx % 2 === 0 ? '#ffffff' : '#f7f7f7';
                return `
                  <tr style="background: ${bg};">
                    <td style="${srCell}">${toMarathiDigits(idx + 1)}</td>
                    <td style="${nameCell}">${cn}</td>
                    <td style="${bodyCell}">${toMarathiDigits(item.totalBoys)}</td>
                    <td style="${bodyCell}">${toMarathiDigits(item.totalGirls)}</td>
                    <td style="${bodyCellBold}">${toMarathiDigits(item.totalStudents)}</td>
                    <td style="${bodyCell}">${sub ? toMarathiDigits(item.boysPresent) : '-'}</td>
                    <td style="${bodyCell}">${sub ? toMarathiDigits(item.girlsPresent) : '-'}</td>
                    <td style="${bodyCellBold}">${sub ? toMarathiDigits(item.totalPresent) : '-'}</td>
                    <td style="${bodyCell}">${sub ? toMarathiDigits(item.boysAbsent) : '-'}</td>
                    <td style="${bodyCell}">${sub ? toMarathiDigits(item.girlsAbsent) : '-'}</td>
                    <td style="${bodyCellBold}">${sub ? toMarathiDigits(item.totalAbsent) : '-'}</td>
                    <td style="${bodyCellBold}">${sub ? '✔ भरले' : '⏳ प्रलंबित'}</td>
                  </tr>
                `;
              }).join('')}

              <!-- Totals Row -->
              <tr>
                <td colspan="2" style="${totalNameCell}">एकूण (Total)</td>
                <td style="${totalCell}">${toMarathiDigits(totEnrolledB)}</td>
                <td style="${totalCell}">${toMarathiDigits(totEnrolledG)}</td>
                <td style="${totalCell}">${toMarathiDigits(totEnrolled)}</td>
                <td style="${totalCell}">${toMarathiDigits(totPresentB)}</td>
                <td style="${totalCell}">${toMarathiDigits(totPresentG)}</td>
                <td style="${totalCell}">${toMarathiDigits(totPresent)}</td>
                <td style="${totalCell}">${toMarathiDigits(totAbsentB)}</td>
                <td style="${totalCell}">${toMarathiDigits(totAbsentG)}</td>
                <td style="${totalCell}">${toMarathiDigits(totAbsent)}</td>
                <td style="${totalCell}">—</td>
              </tr>
            </tbody>
          </table>


        </div>
      `;

      // Render at optimized resolution for smaller file size
      const canvas = await html2canvas(element, {
        scale: 1.8,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(getMarathiFileName(reportOption));

      toast.success(isMarathi ? 'मराठी PDF अहवाल डाऊनलोड झाला!' : 'Marathi PDF Report Downloaded!', { id: 'pdf-toast' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error(isMarathi ? 'PDF अहवाल तयार करताना त्रुटी आली.' : 'Failed to generate PDF report.', { id: 'pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const sec = summary.secondary;
  const hSec = summary.higherSecondary;
  const tot = summary.totalSchool;

  // Attendance percentage helper
  const getPercentage = (present, total) => {
    if (!total || total === 0) return '0';
    return ((present / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Hidden Offscreen Container for PDF Rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printContainerRef} />
      </div>

      {/* Top Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl shadow-indigo-500/15"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <HiOutlineDocumentArrowDown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-indigo-100 mb-1">
                <HiOutlineCalendar className="w-3.5 h-3.5" />
                {selectedDate}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isMarathi ? 'उपस्थिती अहवाल व्यवस्थापन' : 'Attendance Reports Hub'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium">
                {isMarathi ? 'दैनिक उपस्थिती अहवाल पहा व मराठी PDF डाउनलोड करा' : 'View attendance analytics and export official Marathi PDF reports'}
              </p>
            </div>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="flex p-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/15 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'daily'
                  ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <HiOutlineCalendar className="w-4 h-4" />
              {isMarathi ? 'दैनिक अहवाल' : 'Daily Report'}
            </button>
            <button
              onClick={() => setActiveTab('range')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'range'
                  ? 'bg-white text-indigo-900 shadow-md font-extrabold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <HiOutlineFunnel className="w-4 h-4" />
              {isMarathi ? 'कालावधी अहवाल' : 'Range Report'}
            </button>
          </div>
        </div>
      </motion.div>

      {activeTab === 'daily' ? (
        <>
          {/* Action Bar (Date Selection & PDF Export Button) */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 shadow-sm backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {isMarathi ? 'तारीख' : 'Date'}:
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-3 pr-9 py-2 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                  <HiOutlineCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button
                  onClick={fetchDailySummary}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <HiOutlineEye className="w-4 h-4" />
                  {isMarathi ? 'पहा' : 'View'}
                </button>
              </div>

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                disabled={downloadingPdf || classData.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HiOutlineDocumentArrowDown className="w-4.5 h-4.5" />
                <span>{isMarathi ? 'मराठी PDF डाऊनलोड' : 'Download Marathi PDF'}</span>
              </button>
            </div>
          </motion.div>

          {/* Pending Warning Banner */}
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xs font-semibold leading-relaxed">
                <span className="font-extrabold text-amber-700 dark:text-amber-400 mr-1.5">
                  ⚠️ {isMarathi ? `अजून न भरलेले वर्ग (${pendingCount}):` : `Unsubmitted Classes (${pendingCount}):`}
                </span>
                <span className="font-medium">{pendingClasses.join(', ')}</span>
              </div>
            </motion.div>
          )}

          {/* Top 3 KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Enrolled Card */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isMarathi ? 'एकूण पटावर' : 'Total Enrolled'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <HiOutlineAcademicCap className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {tot.enrolledTotal}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                👦 {tot.enrolledBoys} {isMarathi ? 'मुले' : 'Boys'} | 👧 {tot.enrolledGirls} {isMarathi ? 'मुली' : 'Girls'}
              </p>
            </div>

            {/* Total Present Card */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {isMarathi ? 'एकूण हजर' : 'Total Present'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <span className="text-xs font-bold">✔</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {tot.presentTotal}
                </p>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {getPercentage(tot.presentTotal, tot.enrolledTotal)}%
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                👦 {tot.presentBoys} {isMarathi ? 'मुले' : 'Boys'} | 👧 {tot.presentGirls} {isMarathi ? 'मुली' : 'Girls'}
              </p>
            </div>

            {/* Total Absent Card */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {isMarathi ? 'एकूण गैरहजर' : 'Total Absent'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <span className="text-xs font-bold">✖</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  {tot.absentTotal}
                </p>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {getPercentage(tot.absentTotal, tot.enrolledTotal)}%
                </span>
              </div>
              <p className="text-[11px] font-semibold text-rose-600/80 dark:text-rose-400/80 mt-1">
                👦 {tot.absentBoys} {isMarathi ? 'मुले' : 'Boys'} | 👧 {tot.absentGirls} {isMarathi ? 'मुली' : 'Girls'}
              </p>
            </div>
          </div>

          {/* Section Breakdown (School vs College) Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* School Section (5th to 10th) */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <HiOutlineAcademicCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {isMarathi ? 'माध्यमिक शाळा विभाग' : 'Secondary School Section'}
                    </h4>
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {isMarathi ? 'इयत्ता ५वी ते १०वी' : 'Classes 5th to 10th'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {getPercentage(sec.presentTotal, sec.enrolledTotal)}% {isMarathi ? 'हजरी' : 'Att.'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-lg font-black text-slate-900 dark:text-white">{sec.enrolledTotal}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{isMarathi ? 'पटावर' : 'Enrolled'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{sec.presentTotal}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{isMarathi ? 'हजर' : 'Present'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400">{sec.absentTotal}</p>
                  <p className="text-[10px] font-bold text-rose-600 uppercase">{isMarathi ? 'गैरहजर' : 'Absent'}</p>
                </div>
              </div>
            </div>

            {/* College Section (11th & 12th) */}
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                    <HiOutlineBuildingLibrary className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {isMarathi ? 'उच्च माध्यमिक / कनिष्ठ महाविद्यालय' : 'Higher Secondary / College'}
                    </h4>
                    <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      {isMarathi ? 'इयत्ता ११वी व १२वी (कला, विज्ञान, वाणिज्य)' : 'Classes 11th & 12th'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {getPercentage(hSec.presentTotal, hSec.enrolledTotal)}% {isMarathi ? 'हजरी' : 'Att.'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                  <p className="text-lg font-black text-slate-900 dark:text-white">{hSec.enrolledTotal}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{isMarathi ? 'पटावर' : 'Enrolled'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{hSec.presentTotal}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">{isMarathi ? 'हजर' : 'Present'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                  <p className="text-lg font-black text-rose-600 dark:text-rose-400">{hSec.absentTotal}</p>
                  <p className="text-[10px] font-bold text-rose-600 uppercase">{isMarathi ? 'गैरहजर' : 'Absent'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Class Attendance Table */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentArrowDown className="w-4.5 h-4.5 text-indigo-400" />
                <span>{isMarathi ? 'वर्गनिहाय सविस्तर उपस्थिती तक्ता' : 'Detailed Class Attendance Table'}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-slate-200">
                {selectedDate}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : classData.length === 0 ? (
              <div className="text-center py-14">
                <HiOutlineAcademicCap className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  {isMarathi ? 'या तारखेला कोणतीही वर्ग माहिती उपलब्ध नाही.' : 'No class data available for this date.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th rowSpan={2} className="py-3 px-4 text-left border-r border-slate-200/60 dark:border-slate-700/60">{isMarathi ? 'वर्ग' : 'Class'}</th>
                      <th colSpan={3} className="py-2 px-3 border-b border-slate-200/60 dark:border-slate-700/60 border-r border-slate-200/60 dark:border-slate-700/60">{isMarathi ? 'पटावर' : 'Enrolled'}</th>
                      <th colSpan={3} className="py-2 px-3 border-b border-slate-200/60 dark:border-slate-700/60 border-r border-slate-200/60 dark:border-slate-700/60 text-emerald-700 dark:text-emerald-400">{isMarathi ? 'हजर' : 'Present'}</th>
                      <th colSpan={3} className="py-2 px-3 border-b border-slate-200/60 dark:border-slate-700/60 border-r border-slate-200/60 dark:border-slate-700/60 text-rose-700 dark:text-rose-400">{isMarathi ? 'गैरहजर' : 'Absent'}</th>
                      <th rowSpan={2} className="py-3 px-3">{isMarathi ? 'स्थिती' : 'Status'}</th>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60">{isMarathi ? 'मुले' : 'Boys'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60">{isMarathi ? 'मुली' : 'Girls'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white font-extrabold">{isMarathi ? 'एकूण' : 'Total'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-emerald-600">{isMarathi ? 'मुले' : 'Boys'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-emerald-600">{isMarathi ? 'मुली' : 'Girls'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-emerald-700 dark:text-emerald-400 font-extrabold">{isMarathi ? 'एकूण' : 'Total'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-rose-600">{isMarathi ? 'मुले' : 'Boys'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-rose-600">{isMarathi ? 'मुली' : 'Girls'}</th>
                      <th className="py-1.5 px-2 border-r border-slate-200/60 dark:border-slate-700/60 text-rose-700 dark:text-rose-400 font-extrabold">{isMarathi ? 'एकूण' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-semibold">
                    {classData.map((item, index) => {
                      const className = `${item.standard?.name}${item.division?.name}`;
                      const isSub = item.isSubmitted;
                      return (
                        <tr
                          key={index}
                          className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-left font-black text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                            {className}
                          </td>
                          <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800">{item.totalBoys}</td>
                          <td className="py-3 px-2 border-r border-slate-100 dark:border-slate-800">{item.totalGirls}</td>
                          <td className="py-3 px-2 font-black border-r border-slate-100 dark:border-slate-800">{item.totalStudents}</td>

                          <td className="py-3 px-2 text-emerald-600 border-r border-slate-100 dark:border-slate-800">{isSub ? item.boysPresent : '-'}</td>
                          <td className="py-3 px-2 text-emerald-600 border-r border-slate-100 dark:border-slate-800">{isSub ? item.girlsPresent : '-'}</td>
                          <td className="py-3 px-2 font-black text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800">{isSub ? item.totalPresent : '-'}</td>

                          <td className="py-3 px-2 text-rose-600 border-r border-slate-100 dark:border-slate-800">{isSub ? item.boysAbsent : '-'}</td>
                          <td className="py-3 px-2 text-rose-600 border-r border-slate-100 dark:border-slate-800">{isSub ? item.girlsAbsent : '-'}</td>
                          <td className="py-3 px-2 font-black text-rose-600 dark:text-rose-400 border-r border-slate-100 dark:border-slate-800">{isSub ? item.totalAbsent : '-'}</td>

                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isSub
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isSub ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                              <span>{isSub ? (isMarathi ? 'भरले' : 'Submitted') : (isMarathi ? 'प्रलंबित' : 'Pending')}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Custom Range Reports View */
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
              <HiOutlineFunnel className="w-4 h-4 text-indigo-500" />
              <span>{isMarathi ? 'अहवाल फिल्टर पर्याय' : 'Filter Options'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{isMarathi ? 'सुरुवात तारीख' : 'Start Date'}</label>
                <input
                  type="date"
                  value={rangeFilters.startDate}
                  onChange={(e) => setRangeFilters({ ...rangeFilters, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{isMarathi ? 'अंतिम तारीख' : 'End Date'}</label>
                <input
                  type="date"
                  value={rangeFilters.endDate}
                  onChange={(e) => setRangeFilters({ ...rangeFilters, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{isMarathi ? 'इयत्ता' : 'Standard'}</label>
                <select
                  value={rangeFilters.standard}
                  onChange={(e) => setRangeFilters({ ...rangeFilters, standard: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">{isMarathi ? 'सर्व इयत्ता' : 'All Standards'}</option>
                  {standards.map(s => <option key={s._id} value={s._id}>Std {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{isMarathi ? 'तुकडी' : 'Division'}</label>
                <select
                  value={rangeFilters.division}
                  onChange={(e) => setRangeFilters({ ...rangeFilters, division: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">{isMarathi ? 'सर्व तुकड्या' : 'All Divisions'}</option>
                  {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">{isMarathi ? 'वर्गशिक्षक' : 'Teacher'}</label>
                <select
                  value={rangeFilters.teacher}
                  onChange={(e) => setRangeFilters({ ...rangeFilters, teacher: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">{isMarathi ? 'सर्व शिक्षक' : 'All Teachers'}</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <HiOutlineDocumentArrowDown className="w-4 h-4" />
                <span>{isMarathi ? 'मराठी PDF डाऊनलोड' : 'Marathi PDF Download'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs font-semibold border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{isMarathi ? 'तारीख' : 'Date'}</th>
                    <th className="py-3 px-4">{isMarathi ? 'वर्ग' : 'Class'}</th>
                    <th className="py-3 px-4">{isMarathi ? 'वर्गशिक्षक' : 'Teacher'}</th>
                    <th className="py-3 px-4 text-emerald-400">{isMarathi ? 'हजर मुले' : 'Present Boys'}</th>
                    <th className="py-3 px-4 text-emerald-400">{isMarathi ? 'हजर मुली' : 'Present Girls'}</th>
                    <th className="py-3 px-4 text-emerald-400">{isMarathi ? 'एकूण हजर' : 'Total Present'}</th>
                    <th className="py-3 px-4 text-rose-400">{isMarathi ? 'एकूण गैरहजर' : 'Total Absent'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100">
                  {rangeReports.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-3 px-4">{idx + 1}</td>
                      <td className="py-3 px-4">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-4 font-black">{`Std ${row.standard?.name}-${row.division?.name}`}</td>
                      <td className="py-3 px-4">{row.teacher?.fullName || 'N/A'}</td>
                      <td className="py-3 px-4 text-emerald-600">{row.boysPresent || 0}</td>
                      <td className="py-3 px-4 text-emerald-600">{row.girlsPresent || 0}</td>
                      <td className="py-3 px-4 font-black text-emerald-600">{row.totalPresent || 0}</td>
                      <td className="py-3 px-4 font-black text-rose-600">{row.totalAbsent || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3-Option PDF Download Selection Modal */}
      <Modal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        title={isMarathi ? 'मराठी PDF अहवाल डाऊनलोड पर्याय निवडा' : 'Select Marathi PDF Report Download Option'}
        size="md"
      >
        <div className="space-y-3.5 py-1">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {isMarathi
              ? 'कृपया मुद्रण योग्य (Print Ready) मराठी अहवाल प्रकार निवडा:'
              : 'Please choose which print-optimized Marathi report option to generate:'}
          </p>

          <div className="space-y-3">
            {/* Option 1: School Report (5th to 10th) */}
            <button
              onClick={() => generatePdfReport('school')}
              className="w-full p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-2 border-indigo-200/80 dark:border-indigo-800/60 transition-all text-left group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <HiOutlineAcademicCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                    १) {isMarathi ? 'माध्यमिक शाळा अहवाल (५वी ते १०वी)' : 'School Report (5th to 10th)'}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    ५वी ते १०वी
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                  {isMarathi
                    ? 'फक्त माध्यमिक विभागातील (५वी ते १०वी) वर्गांचा मराठी मुद्रण योग्य अहवाल डाऊनलोड करा.'
                    : 'Download Marathi attendance report containing only Secondary school classes (5th to 10th).'}
                </p>
              </div>
            </button>

            {/* Option 2: College Report (11th & 12th) */}
            <button
              onClick={() => generatePdfReport('college')}
              className="w-full p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-2 border-purple-200/80 dark:border-purple-800/60 transition-all text-left group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <HiOutlineBuildingLibrary className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-purple-900 dark:text-purple-200">
                    २) {isMarathi ? 'उच्च माध्यमिक / कॉलेज अहवाल (११वी व १२वी)' : 'College Report (11th & 12th)'}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    ११वी व १२वी
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                  {isMarathi
                    ? 'फक्त ११वी व १२वी कला, विज्ञान व वाणिज्य वर्गांचा मराठी मुद्रण योग्य अहवाल डाऊनलोड करा.'
                    : 'Download Marathi attendance report containing only Higher Secondary / Junior College classes (11th & 12th).'}
                </p>
              </div>
            </button>

            {/* Option 3: Both Combined Report */}
            <button
              onClick={() => generatePdfReport('combined')}
              className="w-full p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-2 border-amber-300 dark:border-amber-700/60 transition-all text-left group flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <HiOutlineSparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-950 dark:text-amber-200">
                    ३) {isMarathi ? 'शाळा व कॉलेज एकत्रित अहवाल (Combined Both)' : 'Both Combined Report (School & College)'}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                    एकत्रित अहवाल
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                  {isMarathi
                    ? 'शाळा व कॉलेज या सर्वांचा एकत्रित सविस्तर मराठी मुद्रण योग्य उपस्थिती अहवाल डाऊनलोड करा.'
                    : 'Download full combined Marathi attendance report containing both Secondary and College sections.'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
