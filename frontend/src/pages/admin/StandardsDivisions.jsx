import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineAcademicCap, HiOutlineSquares2X2 } from 'react-icons/hi2';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StandardsDivisions = () => {
  const { t } = useTranslation();
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stdModal, setStdModal] = useState({ open: false, data: null, name: '' });
  const [divModal, setDivModal] = useState({ open: false, data: null, name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stdRes, divRes] = await Promise.all([api.get('/standards'), api.get('/divisions')]);
      const rawStds = stdRes.data.data || [];
      const rawDivs = divRes.data.data || [];

      const sortedStds = [...rawStds].sort((a, b) => {
        const numA = parseInt(String(a.name).match(/\d+/)?.[0] || '999', 10);
        const numB = parseInt(String(b.name).match(/\d+/)?.[0] || '999', 10);
        if (numA !== numB) return numA - numB;
        return String(a.name).localeCompare(String(b.name), undefined, { numeric: true });
      });

      const sortedDivs = [...rawDivs].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' })
      );

      setStandards(sortedStds);
      setDivisions(sortedDivs);
    } catch (error) {
      toast.error(t('common.error', 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    try {
      if (stdModal.data) {
        await api.put(`/standards/${stdModal.data._id}`, { name: stdModal.name });
        toast.success(t('common.success', 'Standard updated'));
      } else {
        await api.post('/standards', { name: stdModal.name });
        toast.success(t('common.success', 'Standard added'));
      }
      setStdModal({ open: false, data: null, name: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Operation failed'));
    }
  };

  const handleDivisionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (divModal.data) {
        await api.put(`/divisions/${divModal.data._id}`, { name: divModal.name });
        toast.success(t('common.success', 'Division updated'));
      } else {
        await api.post('/divisions', { name: divModal.name });
        toast.success(t('common.success', 'Division added'));
      }
      setDivModal({ open: false, data: null, name: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error', 'Operation failed'));
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteConfirm.type === 'standard') {
        await api.delete(`/standards/${deleteConfirm.id}`);
        toast.success(t('common.success', 'Standard deleted'));
      } else {
        await api.delete(`/divisions/${deleteConfirm.id}`);
        toast.success(t('common.success', 'Division deleted'));
      }
      fetchData();
    } catch (error) {
      toast.error(t('common.error', 'Failed to delete'));
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('standardsDivisions.title', 'Standards & Divisions')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('standardsDivisions.subtitle', 'Manage class standards and divisions')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standards Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <HiOutlineAcademicCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('standardsDivisions.standards', 'Standards')}</h3>
            </div>
            <button onClick={() => setStdModal({ open: true, data: null, name: '' })} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
              <HiOutlinePlus className="w-4 h-4" />
              {t('standardsDivisions.addStandard', 'Add Standard')}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {standards.map(s => (
              <div key={s._id} className="flex items-center justify-between py-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Standard {s.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setStdModal({ open: true, data: s, name: s.name })} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><HiOutlinePencil className="w-4 h-4 text-indigo-500" /></button>
                  <button onClick={() => setDeleteConfirm({ open: true, type: 'standard', id: s._id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><HiOutlineTrash className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divisions Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <HiOutlineSquares2X2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('standardsDivisions.divisions', 'Divisions')}</h3>
            </div>
            <button onClick={() => setDivModal({ open: true, data: null, name: '' })} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md">
              <HiOutlinePlus className="w-4 h-4" />
              {t('standardsDivisions.addDivision', 'Add Division')}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {divisions.map(d => (
              <div key={d._id} className="flex items-center justify-between py-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Division {d.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDivModal({ open: true, data: d, name: d.name })} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><HiOutlinePencil className="w-4 h-4 text-purple-500" /></button>
                  <button onClick={() => setDeleteConfirm({ open: true, type: 'division', id: d._id })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><HiOutlineTrash className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={stdModal.open} onClose={() => setStdModal({ open: false, data: null, name: '' })} title={stdModal.data ? t('standardsDivisions.editStandard', 'Edit Standard') : t('standardsDivisions.addStandard', 'Add Standard')}>
        <form onSubmit={handleStandardSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('standardsDivisions.standardName', 'Standard Name')}</label>
            <input type="text" value={stdModal.name} onChange={(e) => setStdModal({ ...stdModal, name: e.target.value })} required placeholder="e.g. 5 or 10" className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/40">
            <button type="button" onClick={() => setStdModal({ open: false, data: null, name: '' })} className="px-4 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">{stdModal.data ? t('common.update', 'Update') : t('common.add', 'Add')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={divModal.open} onClose={() => setDivModal({ open: false, data: null, name: '' })} title={divModal.data ? t('standardsDivisions.editDivision', 'Edit Division') : t('standardsDivisions.addDivision', 'Add Division')}>
        <form onSubmit={handleDivisionSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('standardsDivisions.divisionName', 'Division Name')}</label>
            <input type="text" value={divModal.name} onChange={(e) => setDivModal({ ...divModal, name: e.target.value })} required placeholder="e.g. A or B" className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-700/40">
            <button type="button" onClick={() => setDivModal({ open: false, data: null, name: '' })} className="px-4 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700">{divModal.data ? t('common.update', 'Update') : t('common.add', 'Add')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: '', id: null })}
        onConfirm={handleDelete}
        title={t('standardsDivisions.deleteTitle', 'Delete Item')}
        message={t('standardsDivisions.deleteMsg', 'Are you sure? Students assigned to this may be affected.')}
      />
    </div>
  );
};

export default StandardsDivisions;
