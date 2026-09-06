import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';
import { Timetable } from '../models/Timetable.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Substitution } from '../models/Substitution.js';
import { getDayOfWeek } from '../services/conflictService.js';

export const getDashboardKpis = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const day = getDayOfWeek(targetDate);
    const isSunday = day === 'Sunday';

    const [totalTeachers, totalClasses, absencesToday, substitutionsToday] = await Promise.all([
      Teacher.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true }),
      isSunday ? Promise.resolve([]) : TeacherAbsence.find({ date: targetDate }),
      isSunday ? Promise.resolve([]) : Substitution.find({ date: targetDate })
    ]);

    const absentTeacherIds = new Set(absencesToday.map((a) => a.teacherId.toString()));
    const absentCount = absentTeacherIds.size;

    const pendingSubs = substitutionsToday.filter((s) => s.status === 'pending').length;
    const assignedSubs = substitutionsToday.filter(
      (s) => s.status === 'assigned' || s.status === 'completed'
    ).length;

    // Calculate free teachers in current period (or Period 1 if outside school hours)
    const allActiveTeachers = await Teacher.find({ isActive: true });
    const currentPeriod = 1; // baseline or dynamic

    let freeTeachersCount = totalTeachers;
    if (!isSunday) {
      const teachingNow = await Timetable.find({ day, periodNumber: currentPeriod }).select(
        'teacherId'
      );
      const teachingTeacherIds = new Set(teachingNow.map((t) => t.teacherId.toString()));

      const subNow = substitutionsToday.filter(
        (s) =>
          s.periodNumber === currentPeriod &&
          (s.status === 'assigned' || s.status === 'completed') &&
          s.substituteTeacherId
      );
      const subTeacherIds = new Set(subNow.map((s) => s.substituteTeacherId.toString()));

      freeTeachersCount = allActiveTeachers.filter((t) => {
        const id = t._id.toString();
        return !absentTeacherIds.has(id) && !teachingTeacherIds.has(id) && !subTeacherIds.has(id);
      }).length;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        totalClasses,
        absentToday: absentCount,
        pendingSubstitutions: pendingSubs,
        assignedSubstitutions: assignedSubs,
        freeTeachers: freeTeachersCount,
        targetDate,
        day,
        isHoliday: isSunday,
        holidayReason: isSunday ? 'Sunday - Weekly School Holiday (रविवार - साप्ताहिक सुट्टी)' : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsReports = async (req, res, next) => {
  try {
    const { range = 'month' } = req.query; // 'today', 'week', 'month'

    // 1. Teacher Workload Distribution
    const teachers = await Teacher.find({ isActive: true }).select('name subjects').limit(15);
    const teacherIds = teachers.map((t) => t._id);

    const weeklyWorkloads = await Timetable.aggregate([
      { $match: { teacherId: { $in: teacherIds } } },
      { $group: { _id: '$teacherId', weeklyPeriods: { $sum: 1 } } }
    ]);
    const weeklyWorkloadMap = new Map(
      weeklyWorkloads.map((w) => [w._id.toString(), w.weeklyPeriods])
    );

    const substitutionWorkloads = await Substitution.aggregate([
      {
        $match: {
          substituteTeacherId: { $in: teacherIds },
          status: { $in: ['assigned', 'completed'] }
        }
      },
      { $group: { _id: '$substituteTeacherId', subCount: { $sum: 1 } } }
    ]);
    const subCountMap = new Map(
      substitutionWorkloads.map((s) => [s._id.toString(), s.subCount])
    );

    const teacherWorkloadData = teachers.map((t) => ({
      name: t.name.replace('Mr. ', '').replace('Mrs. ', '').replace('Dr. ', ''),
      regularPeriods: weeklyWorkloadMap.get(t._id.toString()) || 0,
      substitutionsTaken: subCountMap.get(t._id.toString()) || 0,
      totalLoad: (weeklyWorkloadMap.get(t._id.toString()) || 0) + (subCountMap.get(t._id.toString()) || 0)
    }));

    // 2. Absences trend over last 7 days / sample days
    const recentAbsences = await TeacherAbsence.aggregate([
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);

    // 3. Substitution Status Breakdown
    const subStatuses = await Substitution.aggregate([
      { $group: { _id: '$status', value: { $sum: 1 } } }
    ]);

    const statusMap = {
      assigned: 'Assigned',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    const subStatusData = subStatuses.map((s) => ({
      name: statusMap[s._id] || s._id,
      value: s.value
    }));

    // 4. Most Substituted Teachers (who took leave)
    const mostAbsents = await Substitution.aggregate([
      { $group: { _id: '$originalTeacherId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const origTeacherIds = mostAbsents.map((m) => m._id);
    const origTeachers = await Teacher.find({ _id: { $in: origTeacherIds } });
    const origTeacherNameMap = new Map(origTeachers.map((t) => [t._id.toString(), t.name]));

    const mostSubstitutedTeachers = mostAbsents.map((m) => ({
      name: origTeacherNameMap.get(m._id.toString()) || 'Unknown Teacher',
      substitutionsRequired: m.count
    }));

    // 5. Period Coverage Demand (which periods see the most substitutions)
    const periodCoverage = await Substitution.aggregate([
      { $group: { _id: '$periodNumber', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const periodData = [1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
      const found = periodCoverage.find((item) => item._id === p);
      return {
        period: `Period ${p}`,
        count: found ? found.count : 0
      };
    });

    return res.status(200).json({
      success: true,
      range,
      data: {
        teacherWorkloadData,
        recentAbsences: recentAbsences.map((r) => ({ date: r._id, absences: r.count })),
        subStatusData,
        mostSubstitutedTeachers,
        periodData
      }
    });
  } catch (error) {
    next(error);
  }
};
