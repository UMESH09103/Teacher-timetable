import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineArrowPath } from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Teachers = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState({
    fullName: '', email: '', mobile: '', password: '', status: 'active', assignedClasses: []
  });

  useEffect(() => {
    fetchTeachers();
    fetchStandardsAndDivisions();
  }, []);

  const sortTeachersClassWise = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const acA = a.assignedClasses && a.assignedClasses[0];
      const acB = b.assignedClasses && b.assignedClasses[0];

      const stdA = String(acA?.standard?.name || '').trim();
      const divA = String(acA?.division?.name || '').trim();

      const stdB = String(acB?.standard?.name || '').trim();
      const divB = String(acB?.division?.name || '').trim();

      const stdNumA = parseInt(stdA.match(/\d+/)?.[0] || '999', 10);
      const stdNumB = parseInt(stdB.match(/\d+/)?.[0] || '999', 10);

      if (stdNumA !== stdNumB) {
        return stdNumA - stdNumB;
      }
      return divA.localeCompare(divB, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  const fetchTeachers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const res = await api.get('/teachers', { params: { search: searchTerm } });
      const sorted = sortTeachersClassWise(res.data.data || []);
      setTeachers(sorted);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load teachers'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardsAndDivisions = async () => {
    try {
      const [stdRes, divRes] = await Promise.all([
        api.get('/standards'),
        api.get('/divisions')
      ]);
      setStandards(stdRes.data.data);
      setDivisions(divRes.data.data);
    } catch (error) {
      console.error('Failed to load standards/divisions');
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchTeachers(value);
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setForm({
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      status: 'active',
      assignedClasses: [
        { standard: '', division: '', boysCount: 0, girlsCount: 0 }
      ]
    });
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      fullName: teacher.fullName,
      email: teacher.email,
      mobile: teacher.mobile,
      password: '',
      status: teacher.status,
      assignedClasses: teacher.assignedClasses.map(ac => ({
        standard: ac.standard?._id || ac.standard,
        division: ac.division?._id || ac.division,
        boysCount: ac.boysCount !== undefined ? ac.boysCount : 0,
        girlsCount: ac.girlsCount !== undefined ? ac.girlsCount : 0
      }))
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanAssigned = (form.assignedClasses || []).filter(
        ac => ac.standard && ac.division
      );
      const cleanEmail = form.email && form.email.trim() ? form.email.trim() : `${form.mobile.trim()}@school.com`;
      const payload = {
        ...form,
        email: cleanEmail,
        assignedClasses: cleanAssigned
      };

      if (!payload.password && editingTeacher) {
        delete payload.password;
      }

      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher._id}`, payload);
        toast.success(t('common.success', 'Teacher updated successfully'));
      } else {
        await api.post('/teachers', payload);
        toast.success(t('common.success', 'Teacher created successfully'));
      }
      setShowModal(false);
      fetchTeachers(search);
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Operation failed'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/teachers/${id}`);
      toast.success(t('teachers.deleteSuccess', 'Teacher deleted'));
      fetchTeachers(search);
    } catch (error) {
      toast.error(t('common.error', 'Failed to delete teacher'));
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/teachers/${id}/toggle-status`);
      toast.success(t('teachers.toggleStatusSuccess', 'Status updated'));
      fetchTeachers(search);
    } catch (error) {
      toast.error(t('common.error', 'Failed to update status'));
    }
  };

  const addAssignedClass = () => {
    setForm({
      ...form,
      assignedClasses: [
        ...form.assignedClasses,
        { standard: '', division: '', boysCount: 0, girlsCount: 0 }
      ]
    });
  };

  const removeAssignedClass = (index) => {
    setForm({
      ...form,
      assignedClasses: form.assignedClasses.filter((_, i) => i !== index)
    });
  };

  const updateAssignedClass = (index, field, value) => {
    const updated = [...form.assignedClasses];
    updated[index][field] = value;
    setForm({ ...form, assignedClasses: updated });
  };

  const columns = [
    { header: t('teachers.fullName', 'Name'), accessor: 'fullName', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          {row.fullName?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.fullName}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      </div>
    )},
    { header: t('teachers.mobile', 'Mobile'), accessor: 'mobile' },
    { header: t('teachers.assignedClassesTitle', 'Assigned Classes'), render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.assignedClasses?.map((ac, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            Std {ac.standard?.name || '?'}-{ac.division?.name || '?'}
          </span>
        ))}
        {(!row.assignedClasses || row.assignedClasses.length === 0) && (
          <span className="text-xs text-slate-400">None assigned</span>
        )}
      </div>
    )},
    { header: t('teachers.status', 'Status'), render: (row) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        row.status === 'active'
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
      }`}>
        {row.status === 'active' ? t('teachers.active', 'Active') : t('teachers.inactive', 'Inactive')}
      </span>
    )},
    { header: t('students.actions', 'Actions'), width: '150px', render: (row) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleToggleStatus(row._id)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Status"
        >
          <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
        </button>
        <button
          onClick={() => openEditModal(row)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Edit"
        >
          <HiOutlinePencil className="w-4 h-4 text-indigo-500" />
        </button>
        <button
          onClick={() => setDeleteConfirm({ open: true, id: row._id })}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <HiOutlineTrash className="w-4 h-4 text-red-500" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('teachers.title', 'Teachers & Class Assignment')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('teachers.subtitle', 'Manage teaching staff and assign student strength')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
            shadow-lg shadow-indigo-500/25 transition-all duration-200"
        >
          <HiOutlinePlus className="w-4 h-4" />
          {t('teachers.addTeacher', 'Add Teacher')}
        </button>
      </motion.div>

      <DataTable
        columns={columns}
        data={teachers}
        loading={loading}
        onSearch={handleSearch}
        searchPlaceholder={t('teachers.searchPlaceholder', 'Search teachers...')}
        emptyMessage={t('teachers.noTeachers', 'No teachers found')}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeacher ? t('teachers.modalEditTitle', 'Edit Teacher') : t('teachers.modalAddTitle', 'Add Teacher')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('teachers.fullName', 'Full Name')}</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                placeholder={t('teachers.fullNamePlaceholder', 'e.g. Rahul Sharma')}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('teachers.mobile', 'Mobile Number (Login ID / लॉगिन आयडी)')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('teachers.email', 'Email')} <span className="text-slate-400 font-normal">(Optional / ऐच्छिक)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. rahul@school.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('teachers.password', 'Password')} {editingTeacher && <span className="text-slate-400">{t('teachers.passwordLeaveBlank', '(leave blank to keep)')}</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                {...(!editingTeacher && { required: true })}
                minLength={6}
                placeholder="******"
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('teachers.status', 'Status')}</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="active">{t('teachers.active', 'Active')}</option>
              <option value="inactive">{t('teachers.inactive', 'Inactive')}</option>
            </select>
          </div>

          {/* Assigned Classes */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-white">
                  {t('teachers.assignedClassesTitle', 'Assigned Classes & Student Strength')}
                </label>
                <p className="text-xs text-slate-500">{t('teachers.assignedClassesSubtitle', 'Assign standard, division, and total boys & girls count')}</p>
              </div>
              <button
                type="button"
                onClick={addAssignedClass}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                {t('teachers.addClass', '+ Add Class Assignment')}
              </button>
            </div>

            <div className="space-y-3">
              {form.assignedClasses.map((ac, i) => {
                const bCount = parseInt(ac.boysCount) || 0;
                const gCount = parseInt(ac.girlsCount) || 0;
                const totalClsStudents = bCount + gCount;

                return (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">{t('teachers.standard', 'Standard')}</label>
                        <select
                          value={ac.standard}
                          onChange={(e) => updateAssignedClass(i, 'standard', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="">Select Standard</option>
                          {standards.map(s => (
                            <option key={s._id} value={s._id}>Std {s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">{t('teachers.division', 'Division')}</label>
                        <select
                          value={ac.division}
                          onChange={(e) => updateAssignedClass(i, 'division', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        >
                          <option value="">Select Division</option>
                          {divisions.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">👦 {t('teachers.boysCount', 'Boys')}</label>
                        <input
                          type="number"
                          min={0}
                          value={ac.boysCount !== undefined ? ac.boysCount : 10}
                          onChange={(e) => updateAssignedClass(i, 'boysCount', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="block text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1">👧 {t('teachers.girlsCount', 'Girls')}</label>
                        <input
                          type="number"
                          min={0}
                          value={ac.girlsCount !== undefined ? ac.girlsCount : 10}
                          onChange={(e) => updateAssignedClass(i, 'girlsCount', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeAssignedClass(i)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={t('teachers.removeClass', 'Remove Class Assignment')}
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>{t('teachers.totalStudentsClass', 'Total Students for this class:')} <strong className="text-slate-900 dark:text-white">{totalClsStudents}</strong></span>
                      <span className="text-[11px] italic text-indigo-600 dark:text-indigo-400">{t('teachers.autoGenNote', 'Students will be auto-generated in DB upon saving')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/40">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {t('teachers.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all"
            >
              {editingTeacher ? t('teachers.saveUpdate', 'Update Teacher & Strength') : t('teachers.saveAdd', 'Add Teacher & Create Students')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title={t('teachers.deleteTitle', 'Delete Teacher')}
        message={t('teachers.deleteMsg', 'Are you sure you want to delete this teacher? This action cannot be undone.')}
      />
    </div>
  );
};

export default Teachers;
