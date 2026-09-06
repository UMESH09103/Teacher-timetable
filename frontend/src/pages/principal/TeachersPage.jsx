import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SearchInput } from '../../components/ui/SearchInput';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { Users, Plus, Edit2, UserX, Trash2, Phone, Mail, BookOpen, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { sortClassesAsc } from '../../utils/sortUtils';
import { UserAvatar } from '../../components/common/UserAvatar';

export const TeachersPage = () => {
  const { success, error } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add/Edit Teacher Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permanent Delete confirmation (Database)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const [tRes, sRes, cRes] = await Promise.all([
        api.get(`/teachers?search=${encodeURIComponent(search)}`),
        api.get('/subjects'),
        api.get('/classes')
      ]);

      if (tRes.data.success) setTeachers(tRes.data.data);
      if (sRes.data.success) setSubjects(sRes.data.data);
      if (cRes.data.success) setClasses(sortClassesAsc(cRes.data.data));
    } catch (err) {
      console.error(err);
      error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setEmployeeId(`EMP-${1000 + teachers.length + 1}`);
    setEmail('');
    setPhone('');
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setEmployeeId(teacher.employeeId);
    setEmail(teacher.email);
    setPhone(teacher.phone || '');
    setSelectedSubjects(teacher.subjects?.map((s) => s._id) || []);
    setSelectedClasses(teacher.classes?.map((c) => c._id) || []);
    setIsModalOpen(true);
  };

  const handleSubmitTeacher = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTeacher) {
        const res = await api.put(`/teachers/${editingTeacher._id}`, {
          name,
          phone,
          subjects: selectedSubjects,
          classes: selectedClasses
        });
        if (res.data.success) {
          success('Teacher updated successfully');
          setIsModalOpen(false);
          fetchTeachers();
        }
      } else {
        const res = await api.post('/teachers', {
          name,
          employeeId,
          email,
          phone,
          subjects: selectedSubjects,
          classes: selectedClasses
        });
        if (res.data.success) {
          success('Teacher added and login credentials created (Password: Teacher@123)');
          setIsModalOpen(false);
          fetchTeachers();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permanent delete from MongoDB Database
  const handleDeleteTeacher = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/teachers/${deleteTarget._id}`);
      if (res.data.success) {
        success(res.data.message || `Teacher ${deleteTarget.name} permanently deleted from database`);
        setDeleteTarget(null);
        fetchTeachers();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      const res = await api.delete(`/teachers/${deactivateTarget._id}?deactivate=true`);
      if (res.data.success) {
        success(res.data.message || 'Teacher deactivated');
        setDeactivateTarget(null);
        fetchTeachers();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Deactivation failed');
    } finally {
      setIsDeactivating(false);
    }
  };

  const toggleSubject = (subId) => {
    if (selectedSubjects.includes(subId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subId));
    } else {
      setSelectedSubjects([...selectedSubjects, subId]);
    }
  };

  const toggleClass = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Faculty & Teacher Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage teacher profiles, subject specializations, daily teaching loads, and credentials
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Teacher
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="Search by name, ID, or email..."
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-500 font-semibold">
            Total Faculty: <strong>{teachers.length}</strong>
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Teacher
          </Button>
        </div>
      </div>

      {/* Teachers Table (Section 14) */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Teacher</th>
                  <th className="p-3.5">Employee ID</th>
                  <th className="p-3.5">Subjects</th>
                  <th className="p-3.5">Today's Load</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={teacher} size="md" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {teacher.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {teacher.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold font-mono text-slate-700 dark:text-slate-300">
                      {teacher.employeeId}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {teacher.subjects?.map((sub) => (
                          <span
                            key={sub._id}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-sm ${teacher.todayLoad >= 6
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-brand-600 dark:text-brand-400'
                            }`}
                        >
                          {teacher.todayLoad || 0}
                        </span>
                        <span className="text-[10px] text-slate-400">/ 8 pds</span>
                        {teacher.subLoad > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold rounded">
                            +{teacher.subLoad} sub
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {teacher.isAbsentToday ? (
                        <Badge variant="rose" dot>
                          Absent Today
                        </Badge>
                      ) : teacher.isActive ? (
                        <Badge variant="emerald" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="slate" dot>
                          Inactive
                        </Badge>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(teacher)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeactivateTarget(teacher)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title={teacher.isActive ? "Deactivate Teacher" : "Teacher Inactive"}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(teacher)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Teacher from Database"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher Profile' : 'Add New Teacher'}
        subtitle={
          editingTeacher
            ? `Update details for ${editingTeacher.name}`
            : 'Register a new faculty member with subjects, assigned class, and login credentials'
        }
      >
        <form onSubmit={handleSubmitTeacher} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. श्री. अमित शहा"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="EMP-1016"
                disabled={!!editingTeacher}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.com"
                disabled={!!editingTeacher}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (Mobile)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98201 00000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Class Teacher Assignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Class Teacher Assignment (वर्गशिक्षक वाटप - ऐच्छिक)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {classes.map((cls) => {
                const isSelected = selectedClasses.includes(cls._id);
                return (
                  <button
                    key={cls._id}
                    type="button"
                    onClick={() => toggleClass(cls._id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {cls.displayName || `${cls.className}-${cls.division}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teaching Specializations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Teaching Specializations (Subjects / शिकवण्याचे विषय)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {subjects.map((sub) => {
                const isChecked = selectedSubjects.includes(sub._id);
                return (
                  <button
                    key={sub._id}
                    type="button"
                    onClick={() => toggleSubject(sub._id)}
                    className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-colors ${isChecked
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span className="truncate">{sub.name}</span>
                    <span className="text-[10px] opacity-70 shrink-0 ml-1">({sub.code})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-brand-700 dark:text-brand-300">🔑 Login Credentials:</span> The teacher can log in using either their registered <strong>Email</strong> or <strong>Mobile number</strong> with default password <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-brand-600 dark:text-brand-400">Teacher@123</code>.
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingTeacher ? 'Save Changes' : 'Create Teacher Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Permanent Delete from Database Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher from Database"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}" (${deleteTarget?.employeeId}) from the database? This will permanently delete their account, login credentials, timetable slots, and remove them from class teacher assignments. This action cannot be undone.`}
        confirmText="Delete Permanently"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Deactivate Dialog */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Teacher"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will no longer be assigned to classes or available for substitutions.`}
        confirmText="Deactivate"
        variant="danger"
        isLoading={isDeactivating}
      />
    </div>
  );
};
