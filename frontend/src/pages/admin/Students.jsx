import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArrowDownTray, HiOutlineArrowUpTray, HiOutlineFunnel } from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Students = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStandard, setFilterStandard] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterGender, setFilterGender] = useState(''); // '', 'male', 'female'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [classBoysCount, setClassBoysCount] = useState(0);
  const [classGirlsCount, setClassGirlsCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState({ rollNumber: '', name: '', gender: 'male', standard: '', division: '', status: 'active' });

  useEffect(() => {
    fetchStandardsAndDivisions();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, filterStandard, filterDivision, filterGender]);

  const fetchStudents = async (searchTerm = search) => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          search: searchTerm,
          standard: filterStandard,
          division: filterDivision,
          gender: filterGender,
          page: currentPage,
          limit: 20
        }
      });
      setStudents(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalStudentsCount(res.data.total || res.data.data.length);
      setClassBoysCount(res.data.totalBoys !== undefined ? res.data.totalBoys : 0);
      setClassGirlsCount(res.data.totalGirls !== undefined ? res.data.totalGirls : 0);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load students'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardsAndDivisions = async () => {
    try {
      const [stdRes, divRes] = await Promise.all([api.get('/standards'), api.get('/divisions')]);
      setStandards(stdRes.data.data);
      setDivisions(divRes.data.data);
    } catch (error) {
      console.error('Failed to load standards/divisions');
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
    fetchStudents(value);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setForm({ rollNumber: '', name: '', gender: 'male', standard: filterStandard || '', division: filterDivision || '', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setForm({
      rollNumber: student.rollNumber,
      name: student.name,
      gender: student.gender || 'male',
      standard: student.standard?._id || student.standard,
      division: student.division?._id || student.division,
      status: student.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent._id}`, form);
        toast.success(t('common.success', 'Student updated'));
      } else {
        await api.post('/students', form);
        toast.success(t('common.success', 'Student added'));
      }
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Operation failed'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      toast.success(t('common.success', 'Student deleted'));
      fetchStudents();
    } catch (error) {
      toast.error(t('common.error', 'Failed to delete student'));
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/students/export', {
        params: { standard: filterStandard, division: filterDivision, gender: filterGender },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('common.success', 'Exported successfully'));
    } catch (error) {
      toast.error(t('common.error', 'Export failed'));
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Import failed'));
    }
    e.target.value = '';
  };

  const selectedStdObj = standards.find(s => s._id === filterStandard);
  const selectedDivObj = divisions.find(d => d._id === filterDivision);
  const classLabel = selectedStdObj
    ? `Std ${selectedStdObj.name}${selectedDivObj ? `-${selectedDivObj.name}` : ''}`
    : 'All Classes';

  const columns = [
    { header: t('students.rollNo', 'Roll No'), accessor: 'rollNumber', width: '80px', render: (row) => (
      <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{row.rollNumber}</span>
    )},
    { header: t('students.studentName', 'Student Name'), accessor: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          row.gender === 'female'
            ? 'bg-gradient-to-br from-purple-400 to-pink-500'
            : 'bg-gradient-to-br from-indigo-400 to-cyan-500'
        }`}>
          {row.name?.charAt(0)?.toUpperCase()}
        </div>
        <span className="font-medium text-slate-900 dark:text-white">{row.name}</span>
      </div>
    )},
    { header: t('students.gender', 'Gender'), render: (row) => (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        row.gender === 'female'
          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
          : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
      }`}>
        {row.gender === 'female' ? `👧 ${t('students.girl', 'Girl')}` : `👦 ${t('students.boy', 'Boy')}`}
      </span>
    )},
    { header: t('students.standard', 'Standard'), render: (row) => (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        Std {row.standard?.name}
      </span>
    )},
    { header: t('students.division', 'Division'), render: (row) => (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
        {row.division?.name}
      </span>
    )},
    { header: t('students.status', 'Status'), render: (row) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        row.status === 'active'
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
      }`}>
        {row.status === 'active' ? t('teachers.active', 'Active') : t('teachers.inactive', 'Inactive')}
      </span>
    )},
    { header: t('students.actions', 'Actions'), width: '100px', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEditModal(row)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Edit Student">
          <HiOutlinePencil className="w-4 h-4 text-indigo-500" />
        </button>
        <button onClick={() => setDeleteConfirm({ open: true, id: row._id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Student">
          <HiOutlineTrash className="w-4 h-4 text-red-500" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('students.title', 'Students')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('students.subtitle', 'Manage student records & gender distribution')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
            <HiOutlineArrowUpTray className="w-4 h-4" />
            {t('students.import', 'Import')}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <HiOutlineArrowDownTray className="w-4 h-4" />
            {t('students.export', 'Export')}
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all">
            <HiOutlinePlus className="w-4 h-4" />
            {t('students.addStudent', 'Add Student')}
          </button>
        </div>
      </motion.div>

      {/* Class Boys & Girls Breakdown Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/40 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total ({classLabel})
            </p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {filterGender === 'male' ? '👦 Boys Only' : filterGender === 'female' ? '👧 Girls Only' : 'All'}
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalStudentsCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-indigo-100 dark:border-indigo-900/30 backdrop-blur-xl">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            👦 {t('students.totalBoys', 'Boys Count')} ({classLabel})
          </p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{classBoysCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border-2 border-purple-100 dark:border-purple-900/30 backdrop-blur-xl">
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            👧 {t('students.totalGirls', 'Girls Count')} ({classLabel})
          </p>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">{classGirlsCount}</p>
        </div>
      </div>

      {/* Class Selection & Gender Filter Controls */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-4 backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-700/40 pb-2">
          <HiOutlineFunnel className="w-4 h-4 text-indigo-500" />
          <span>Select Class & Gender Filter (वर्ग व लिंग फिल्टर करा)</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Standard (इयत्ता)</label>
              <select
                value={filterStandard}
                onChange={(e) => { setFilterStandard(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">{t('students.allStandards', 'All Standards (सर्व इयत्ता)')}</option>
                {standards.map(s => <option key={s._id} value={s._id}>Std {s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Division (तुकडी)</label>
              <select
                value={filterDivision}
                onChange={(e) => { setFilterDivision(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="">{t('students.allDivisions', 'All Divisions (सर्व तुकड्या)')}</option>
                {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Quick Gender Tabs */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Show Specific Gender</label>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setFilterGender(''); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterGender === ''
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All (सर्व)
              </button>
              <button
                type="button"
                onClick={() => { setFilterGender('male'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterGender === 'male'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                }`}
              >
                👦 Boys ({classBoysCount})
              </button>
              <button
                type="button"
                onClick={() => { setFilterGender('female'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterGender === 'female'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                👧 Girls ({classGirlsCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        onSearch={handleSearch}
        searchPlaceholder={t('students.searchPlaceholder', 'Search by name or roll number...')}
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage={t('students.noStudents', 'No students found for the selected filters')}
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingStudent ? t('students.modalEditTitle', 'Edit Student') : t('students.modalAddTitle', 'Add Student')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('students.rollNo', 'Roll Number')}</label>
              <input type="text" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('students.studentName', 'Student Name')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('students.gender', 'Gender')}</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="male">👦 {t('students.boy', 'Boy (Male)')}</option>
                <option value="female">👧 {t('students.girl', 'Girl (Female)')}</option>
                <option value="other">{t('students.other', 'Other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('students.standard', 'Standard')}</label>
              <select value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="">Select Standard</option>
                {standards.map(s => <option key={s._id} value={s._id}>Std {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('students.division', 'Division')}</label>
              <select value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="">Select Division</option>
                {divisions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('students.status', 'Status')}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="active">{t('teachers.active', 'Active')}</option>
                <option value="inactive">{t('teachers.inactive', 'Inactive')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/40">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('students.cancel', 'Cancel')}
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all">
              {editingStudent ? t('students.saveUpdate', 'Update Student') : t('students.saveAdd', 'Add Student')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title={t('students.deleteTitle', 'Delete Student')}
        message={t('students.deleteMsg', 'Are you sure you want to delete this student? This action cannot be undone.')}
      />
    </div>
  );
};

export default Students;
