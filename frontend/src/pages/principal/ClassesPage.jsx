import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { School, Plus, Edit2, Trash2, User } from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';

export const ClassesPage = () => {
  const { success, error } = useToast();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [className, setClassName] = useState('');
  const [division, setDivision] = useState('A');
  const [roomNumber, setRoomNumber] = useState('');
  const [classTeacher, setClassTeacher] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cRes, tRes] = await Promise.all([
        api.get(`/classes?search=${encodeURIComponent(search)}`),
        api.get('/teachers')
      ]);

      if (cRes.data.success) setClasses(sortClassesAsc(cRes.data.data));
      if (tRes.data.success) setTeachers(tRes.data.data);
    } catch (err) {
      console.error(err);
      error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('9');
    setDivision('A');
    setRoomNumber('Room 501');
    setClassTeacher(teachers[0]?._id || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setClassName(cls.className);
    setDivision(cls.division);
    setRoomNumber(cls.roomNumber);
    setClassTeacher(cls.classTeacher?._id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingClass) {
        const res = await api.put(`/classes/${editingClass._id}`, {
          className,
          division,
          roomNumber,
          classTeacher: classTeacher || null
        });
        if (res.data.success) {
          success('Class updated successfully');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/classes', {
          className,
          division,
          roomNumber,
          classTeacher: classTeacher || null
        });
        if (res.data.success) {
          success('Class created successfully');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/classes/${deleteTarget._id}`);
      if (res.data.success) {
        success('Class removed successfully');
        setDeleteTarget(null);
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Classroom & Division Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage grade levels, section divisions, assigned class teachers, and physical room allocations
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Class
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search class or room..."
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          Total Divisions: <strong>{classes.length}</strong>
        </span>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Class & Section</th>
                  <th className="p-3.5">Room Number</th>
                  <th className="p-3.5">Class Teacher</th>
                  <th className="p-3.5">Academic Year</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {classes.map((cls) => (
                  <tr key={cls._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-black flex items-center justify-center text-sm">
                          {cls.className}
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                            Class {cls.className}-{cls.division}
                          </span>
                          <span className="text-[10px] text-slate-400">Division {cls.division}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold font-mono text-slate-700 dark:text-slate-300">
                      {cls.roomNumber}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {cls.classTeacher ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cls.classTeacher.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-500 font-medium">
                      {cls.academicYear || '2026-2027'}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cls)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit class"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cls)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class Details' : 'Add New Class Section'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class / Grade (e.g. 5, 6, 7, 8)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. 9"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Division (e.g. A, B, C)
              </label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value.toUpperCase())}
                placeholder="A"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room Number
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 501"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class Teacher
              </label>
              <select
                value={classTeacher}
                onChange={(e) => setClassTeacher(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">None Assigned</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Are you sure you want to delete Class ${deleteTarget?.className}-${deleteTarget?.division}?`}
        isLoading={isDeleting}
      />
    </div>
  );
};
