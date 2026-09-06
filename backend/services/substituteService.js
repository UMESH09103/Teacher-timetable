import { Teacher } from '../models/Teacher.js';
import { Timetable } from '../models/Timetable.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Substitution } from '../models/Substitution.js';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { getDayOfWeek } from './conflictService.js';

/**
 * Finds and ranks available substitute teachers for a specific class, period, and date.
 * Implements strict elimination of conflicts and multi-criteria scoring.
 */
export const findAvailableSubstituteTeachers = async ({
  date,
  periodNumber,
  classId,
  subjectId,
  absentTeacherId
}) => {
  const day = getDayOfWeek(date);
  if (day === 'Sunday') {
    return [];
  }

  // Retrieve target class & subject details
  const targetClass = await Class.findById(classId);
  const targetSubject = await Subject.findById(subjectId);

  // 1. Get all active teachers except the absent teacher
  const allTeachers = await Teacher.find({
    isActive: true,
    _id: { $ne: absentTeacherId }
  })
    .populate('subjects', 'name code')
    .populate('classes', 'className division');

  // 2. Identify all teachers marked absent on this date covering this period
  const absences = await TeacherAbsence.find({
    date,
    affectedPeriods: periodNumber
  }).select('teacherId');
  const absentTeacherIds = new Set(absences.map((a) => a.teacherId.toString()));

  // 3. Identify all teachers currently teaching in the regular timetable on this day & period
  const busyInTimetable = await Timetable.find({
    day,
    periodNumber
  }).select('teacherId');
  const busyTeacherIds = new Set(busyInTimetable.map((t) => t.teacherId.toString()));

  // 4. Identify all teachers already assigned to another substitution on this date & period
  const assignedSubs = await Substitution.find({
    date,
    periodNumber,
    status: { $in: ['assigned', 'completed'] },
    substituteTeacherId: { $ne: null }
  }).select('substituteTeacherId');
  const assignedSubTeacherIds = new Set(
    assignedSubs.map((s) => s.substituteTeacherId.toString())
  );

  // Filter down to strictly available teachers
  const availableTeachers = allTeachers.filter((t) => {
    const id = t._id.toString();
    if (absentTeacherIds.has(id)) return false;
    if (busyTeacherIds.has(id)) return false;
    if (assignedSubTeacherIds.has(id)) return false;
    return true;
  });

  // 5. Pre-calculate today's workload for all available candidates
  // Workload = Count of regular timetable classes on `day` + substitutions assigned today
  const candidateIds = availableTeachers.map((t) => t._id);

  const timetableLoads = await Timetable.aggregate([
    { $match: { day, teacherId: { $in: candidateIds } } },
    { $group: { _id: '$teacherId', count: { $sum: 1 } } }
  ]);
  const timetableLoadMap = new Map(timetableLoads.map((item) => [item._id.toString(), item.count]));

  const substitutionLoads = await Substitution.aggregate([
    {
      $match: {
        date,
        substituteTeacherId: { $in: candidateIds },
        status: { $in: ['assigned', 'completed'] }
      }
    },
    { $group: { _id: '$substituteTeacherId', count: { $sum: 1 } } }
  ]);
  const subLoadMap = new Map(substitutionLoads.map((item) => [item._id.toString(), item.count]));

  // 6. Score and rank candidates
  const scoredCandidates = availableTeachers.map((teacher) => {
    let score = 0;
    const reasons = [];
    const tId = teacher._id.toString();

    // Factor A: Free during period (+50 pts)
    score += 50;
    reasons.push({
      positive: true,
      text: `Free during Period ${periodNumber}`
    });

    // Factor B: Teaches the same subject (+30 pts)
    const teachesSubject = teacher.subjects.some(
      (s) => s._id.toString() === subjectId.toString()
    );
    if (teachesSubject) {
      score += 30;
      reasons.push({
        positive: true,
        text: `Specialist in ${targetSubject ? targetSubject.name : 'this subject'}`
      });
    } else {
      reasons.push({
        positive: false,
        text: `Different subject specialization (${teacher.subjects.map((s) => s.name).slice(0, 2).join(', ') || 'General'})`
      });
    }

    // Factor C: Class/Grade familiarity (+10 pts)
    const targetGrade = targetClass?.className;
    const hasClassOrGradeExperience = teacher.classes.some(
      (c) => c._id.toString() === classId.toString() || c.className === targetGrade
    );
    if (hasClassOrGradeExperience) {
      score += 10;
      reasons.push({
        positive: true,
        text: `Experienced with Grade ${targetGrade || 'level'}`
      });
    }

    // Factor D: Workload calculation (+10 pts if <= 3, -20 pts if >= 6)
    const regularPeriods = timetableLoadMap.get(tId) || 0;
    const subPeriods = subLoadMap.get(tId) || 0;
    const totalPeriodsToday = regularPeriods + subPeriods;

    if (totalPeriodsToday <= 3) {
      score += 10;
      reasons.push({
        positive: true,
        text: `Low workload today (${totalPeriodsToday} of 8 periods)`
      });
    } else if (totalPeriodsToday >= 6) {
      score -= 20;
      reasons.push({
        positive: false,
        text: `Heavy workload today (${totalPeriodsToday} of 8 periods)`
      });
    } else {
      reasons.push({
        positive: true,
        text: `Moderate workload today (${totalPeriodsToday} of 8 periods)`
      });
    }

    // Calculate percentage match (bound between 30% and 98%)
    // Max raw score = 50 + 30 + 10 + 10 = 100
    const matchPercentage = Math.min(Math.max(score, 30), 98);

    return {
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        employeeId: teacher.employeeId,
        email: teacher.email,
        phone: teacher.phone,
        avatar: teacher.avatar,
        subjects: teacher.subjects,
        classes: teacher.classes
      },
      score,
      matchPercentage,
      workloadToday: totalPeriodsToday,
      reasons,
      isBestMatch: false
    };
  });

  // Sort candidates by score descending, then by workload ascending
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.workloadToday - b.workloadToday;
  });

  if (scoredCandidates.length > 0) {
    scoredCandidates[0].isBestMatch = true;
  }

  return scoredCandidates;
};
