import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { School, BookOpen, Clock, User, Repeat, AlertCircle } from 'lucide-react';

export const ConfirmAssignModal = ({
  isOpen,
  onClose,
  onConfirm,
  substitutionTicket,
  selectedCandidate,
  isLoading = false
}) => {
  const [remarks, setRemarks] = useState('');

  if (!substitutionTicket || !selectedCandidate) return null;

  const className = `${substitutionTicket.classId?.className}-${substitutionTicket.classId?.division}`;
  const subjectName = substitutionTicket.subjectId?.name;
  const originalTeacherName = substitutionTicket.originalTeacherId?.name;
  const substituteTeacherName = selectedCandidate.teacher?.name;
  const period = substitutionTicket.periodNumber;

  const handleConfirm = () => {
    onConfirm({
      substitutionId: substitutionTicket._id,
      substituteTeacherId: selectedCandidate.teacher?._id,
      remarks
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Substitute Assignment"
      subtitle="Verify assignment details before notifying faculty"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <School className="w-3.5 h-3.5 text-slate-400" /> Class:
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              Class {className}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Subject:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {subjectName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Period:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Period {period}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-rose-500" /> Original Teacher:
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {originalTeacherName} (Absent)
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Repeat className="w-3.5 h-3.5 text-brand-500" /> Substitute:
            </span>
            <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
              {substituteTeacherName}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Remarks / Instructions (Optional)
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Conduct chapter 4 test review"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isLoading}>
            Confirm Assignment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
