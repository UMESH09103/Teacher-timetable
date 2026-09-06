import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import { Drawer } from '../../components/ui/Drawer';
import { CandidateCard } from '../../components/substitutions/CandidateCard';
import { ConfirmAssignModal } from '../../components/substitutions/ConfirmAssignModal';
import { useToast } from '../../context/ToastContext';
import {
  Repeat,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  School,
  BookOpen,
  Calendar,
  ArrowRight,
  Filter
} from 'lucide-react';
import api from '../../services/api';

export const SubstitutionCenter = () => {
  const { success, error } = useToast();
  const [substitutions, setSubstitutions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Candidate Finder Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchSubstitutions = async () => {
    try {
      setIsLoading(true);
      const url = `/substitutions?date=${selectedDate}${
        statusFilter !== 'all' ? `&status=${statusFilter}` : ''
      }`;
      const res = await api.get(url);
      if (res.data.success) {
        setSubstitutions(res.data.data);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load substitutions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstitutions();
  }, [selectedDate, statusFilter]);

  // Open substitute finder
  const handleOpenFinder = async (ticket) => {
    setActiveTicket(ticket);
    setIsDrawerOpen(true);
    setIsLoadingCandidates(true);

    try {
      const res = await api.get('/substitutions/candidates', {
        params: {
          date: ticket.date,
          periodNumber: ticket.periodNumber,
          classId: ticket.classId?._id || ticket.classId,
          subjectId: ticket.subjectId?._id || ticket.subjectId,
          absentTeacherId: ticket.originalTeacherId?._id || ticket.originalTeacherId
        }
      });

      if (res.data.success) {
        setCandidates(res.data.data);
      }
    } catch (err) {
      console.error(err);
      error('Failed to find substitute candidates');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleInitiateAssign = (candidate) => {
    setSelectedCandidate(candidate);
    setIsConfirmOpen(true);
  };

  const handleConfirmAssignment = async ({ substitutionId, substituteTeacherId, remarks }) => {
    setIsAssigning(true);
    try {
      const res = await api.post('/substitutions/assign', {
        substitutionId,
        substituteTeacherId,
        remarks
      });

      if (res.data.success) {
        success(res.data.message, 'Substitute Assigned');
        setIsConfirmOpen(false);
        setIsDrawerOpen(false);
        fetchSubstitutions();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setIsAssigning(false);
    }
  };

  // Reopen or cancel assignment
  const handleCancelAssignment = async (ticketId) => {
    try {
      const res = await api.delete(`/substitutions/${ticketId}`);
      if (res.data.success) {
        success('Substitute removed and slot reopened for assignment');
        fetchSubstitutions();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Cancel failed');
    }
  };

  // Metrics
  const pendingCount = substitutions.filter((s) => s.status === 'pending').length;
  const assignedCount = substitutions.filter(
    (s) => s.status === 'assigned' || s.status === 'completed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Overview Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Automatic Substitution Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI-ranked substitute allocation with conflict elimination and instantaneous faculty dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Overview Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
            <span className="text-base font-black text-amber-600 dark:text-amber-400 block leading-none">
              {pendingCount}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase">
              Pending
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block leading-none">
              {assignedCount}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
              Covered
            </span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['all', 'pending', 'assigned', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Substitutions Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : substitutions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Substitution Required
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            All classes are fully covered for this date. No teacher absences have pending substitution tickets.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Period</th>
                  <th className="p-3.5">Class</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Absent Faculty</th>
                  <th className="p-3.5">Assigned Substitute</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {substitutions.map((sub) => {
                  const isPending = sub.status === 'pending';

                  return (
                    <tr
                      key={sub._id}
                      className={`transition-colors ${
                        isPending
                          ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-black">
                          P{sub.periodNumber}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        Class {sub.classId?.className}-{sub.classId?.division}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {sub.classId?.roomNumber || sub.roomNumber}
                        </span>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {sub.subjectId?.name}
                      </td>

                      <td className="p-3.5 text-rose-600 dark:text-rose-400 font-medium">
                        {sub.originalTeacherId?.name}
                      </td>

                      <td className="p-3.5">
                        {sub.substituteTeacherId ? (
                          <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                            <Repeat className="w-3.5 h-3.5 shrink-0" />
                            <span>{sub.substituteTeacherId.name}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold italic flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Awaiting Candidate
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {sub.status === 'pending' && (
                          <Badge variant="amber" dot>
                            Needs Sub
                          </Badge>
                        )}
                        {sub.status === 'assigned' && (
                          <Badge variant="blue" dot>
                            Assigned
                          </Badge>
                        )}
                        {sub.status === 'completed' && (
                          <Badge variant="emerald" dot>
                            Completed
                          </Badge>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        {isPending ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenFinder(sub)}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
                            Find Substitute
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenFinder(sub)}
                            >
                              Reassign
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={() => handleCancelAssignment(sub._id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Candidate Recommendation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Smart Substitute Teacher Recommendation"
        subtitle={
          activeTicket
            ? `Available faculty for Class ${activeTicket.classId?.className}-${activeTicket.classId?.division} • Period ${activeTicket.periodNumber} (${activeTicket.subjectId?.name})`
            : ''
        }
        width="max-w-xl"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-xs text-brand-900 dark:text-brand-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Candidates are ranked using verified timetable status, subject specialization, grade familiarity, and teacher fatigue balancing. Conflicting teachers have been automatically excluded.
            </p>
          </div>

          {isLoadingCandidates ? (
            <div className="space-y-3 py-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No substitute teachers are available for this period. All active teachers are already booked.
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.teacher._id}
                  candidate={candidate}
                  onAssign={handleInitiateAssign}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>

      {/* Confirmation Dialog */}
      <ConfirmAssignModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        substitutionTicket={activeTicket}
        selectedCandidate={selectedCandidate}
        onConfirm={handleConfirmAssignment}
        isLoading={isAssigning}
      />
    </div>
  );
};
