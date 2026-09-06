const Teacher = require('../models/Teacher');
const Standard = require('../models/Standard');
const Division = require('../models/Division');
const Attendance = require('../models/Attendance');

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
// @access  Admin
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Run all independent queries in parallel
    const [teachers, standards, totalDivisions, todayAttendance, monthlyAgg, recentAttendance] = await Promise.all([
      Teacher.find().populate('assignedClasses.standard assignedClasses.division').lean(),
      Standard.find().lean(),
      Division.countDocuments(),
      Attendance.find({ date: { $gte: today, $lt: tomorrow } }).lean(),
      // Monthly attendance (last 6 months) — single aggregation
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            totalPresent: { $sum: '$totalPresent' },
            totalAbsent: { $sum: '$totalAbsent' },
            totalLeave: { $sum: '$totalLeave' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Current month attendance for standard-wise and teacher-wise
      Attendance.find({ date: { $gte: currentMonthStart, $lte: today } }).lean()
    ]);

    // Calculate totals from teachers
    let totalBoys = 0, totalGirls = 0;
    teachers.forEach(t => {
      (t.assignedClasses || []).forEach(ac => {
        totalBoys += parseInt(ac.boysCount) || 0;
        totalGirls += parseInt(ac.girlsCount) || 0;
      });
    });

    // Today's stats
    let presentToday = 0, absentToday = 0, leaveToday = 0;
    let boysPresentToday = 0, boysAbsentToday = 0, girlsPresentToday = 0, girlsAbsentToday = 0;
    todayAttendance.forEach(att => {
      presentToday += att.totalPresent || 0;
      absentToday += att.totalAbsent || 0;
      leaveToday += att.totalLeave || 0;
      boysPresentToday += att.boysPresent || 0;
      boysAbsentToday += att.boysAbsent || 0;
      girlsPresentToday += att.girlsPresent || 0;
      girlsAbsentToday += att.girlsAbsent || 0;
    });
    const totalMarked = presentToday + absentToday + leaveToday;
    const attendancePercentage = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

    // Monthly data from aggregation
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const found = monthlyAgg.find(m => m._id.year === yr && m._id.month === mo);
      const mp = found ? found.totalPresent : 0;
      const mt = found ? (found.totalPresent + found.totalAbsent + (found.totalLeave || 0)) : 0;
      monthlyData.push({
        month: `${monthNames[mo - 1]} ${yr}`,
        percentage: mt > 0 ? Math.round((mp / mt) * 100) : 0,
        present: mp,
        total: mt
      });
    }

    // Standard-wise and Teacher-wise from recentAttendance (in-memory grouping)
    const stdMap = {};
    const teachMap = {};
    recentAttendance.forEach(att => {
      const sid = att.standard.toString();
      if (!stdMap[sid]) stdMap[sid] = { present: 0, total: 0 };
      stdMap[sid].present += att.totalPresent || 0;
      stdMap[sid].total += (att.totalPresent || 0) + (att.totalAbsent || 0) + (att.totalLeave || 0);

      const tid = att.teacher.toString();
      if (!teachMap[tid]) teachMap[tid] = { present: 0, total: 0 };
      teachMap[tid].present += att.totalPresent || 0;
      teachMap[tid].total += (att.totalPresent || 0) + (att.totalAbsent || 0) + (att.totalLeave || 0);
    });

    const standardWiseData = [];
    standards.forEach(std => {
      const sid = std._id.toString();
      const data = stdMap[sid];
      const isAssigned = teachers.some(t =>
        (t.assignedClasses || []).some(ac =>
          (ac.standard?._id?.toString() || ac.standard?.toString()) === sid
        )
      );
      if ((data && data.total > 0) || isAssigned) {
        standardWiseData.push({
          standard: `Std ${std.name}`,
          percentage: data && data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
          present: data ? data.present : 0,
          total: data ? data.total : 0
        });
      }
    });

    let teacherWiseData = teachers.map(t => {
      const data = teachMap[t._id.toString()];
      const assignedClassStr = (t.assignedClasses || []).map(ac => {
        const sName = ac.standard?.name || '';
        const dName = ac.division?.name || '';
        return sName && dName ? `Std ${sName}-${dName}` : sName ? `Std ${sName}` : '';
      }).filter(Boolean).join(', ');

      const primaryClass = t.assignedClasses && t.assignedClasses[0];
      const stdNum = parseInt(String(primaryClass?.standard?.name || '').match(/\d+/)?.[0] || '999', 10);
      const divStr = String(primaryClass?.division?.name || '').trim();

      return {
        teacher: t.fullName,
        assignedClass: assignedClassStr,
        stdNum,
        divStr,
        percentage: data && data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
        present: data ? data.present : 0,
        total: data ? data.total : 0
      };
    });

    teacherWiseData.sort((a, b) => {
      if (a.stdNum !== b.stdNum) return a.stdNum - b.stdNum;
      return a.divStr.localeCompare(b.divStr, undefined, { numeric: true, sensitivity: 'base' });
    });

    const classTeachersCount = teachers.length;
    const totalClassesCount = classTeachersCount > 0 ? classTeachersCount : 18;

    res.json({
      success: true,
      data: {
        totalTeachers: classTeachersCount,
        totalClassTeachers: classTeachersCount,
        totalStudents: totalBoys + totalGirls,
        totalBoys,
        totalGirls,
        totalStandards: totalClassesCount,
        totalClasses: totalClassesCount,
        totalDivisions: totalClassesCount,
        presentToday,
        absentToday,
        leaveToday,
        boysPresentToday,
        boysAbsentToday,
        girlsPresentToday,
        girlsAbsentToday,
        attendancePercentage,
        monthlyData,
        standardWiseData,
        teacherWiseData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teacher dashboard stats
// @route   GET /api/dashboard/teacher
// @access  Teacher
exports.getTeacherDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run both queries in parallel
    const [teacher, teacherTodayAtt] = await Promise.all([
      Teacher.findById(req.user._id)
        .populate('assignedClasses.standard assignedClasses.division')
        .lean(),
      Attendance.find({
        teacher: req.user._id,
        date: { $gte: today, $lt: tomorrow }
      }).lean()
    ]);

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Build a lookup map from today's attendance
    const attMap = {};
    teacherTodayAtt.forEach(att => {
      const key = `${att.standard.toString()}_${att.division.toString()}`;
      attMap[key] = att;
    });

    let totalStudents = 0, totalBoys = 0, totalGirls = 0;
    let attendancePending = 0, attendanceCompleted = 0;
    const classDetails = [];

    for (const cls of teacher.assignedClasses) {
      if (!cls.standard || !cls.division) continue;

      const bCount = parseInt(cls.boysCount) || 0;
      const gCount = parseInt(cls.girlsCount) || 0;
      totalStudents += bCount + gCount;
      totalBoys += bCount;
      totalGirls += gCount;

      const key = `${cls.standard._id.toString()}_${cls.division._id.toString()}`;
      const todayAtt = attMap[key] || null;
      const isDone = !!todayAtt;
      if (isDone) attendanceCompleted++;
      else attendancePending++;

      classDetails.push({
        standard: cls.standard,
        division: cls.division,
        studentCount: bCount + gCount,
        boysCount: bCount,
        girlsCount: gCount,
        attendanceDone: isDone,
        attendance: todayAtt
      });
    }

    // Today's stats from already-fetched data
    let boysPresentToday = 0, boysAbsentToday = 0;
    let girlsPresentToday = 0, girlsAbsentToday = 0;
    let presentToday = 0, absentToday = 0;

    teacherTodayAtt.forEach(att => {
      boysPresentToday += att.boysPresent || 0;
      boysAbsentToday += att.boysAbsent || 0;
      girlsPresentToday += att.girlsPresent || 0;
      girlsAbsentToday += att.girlsAbsent || 0;
      presentToday += att.totalPresent || 0;
      absentToday += att.totalAbsent || 0;
    });

    const totalMarked = presentToday + absentToday;
    const attendancePercentage = totalMarked > 0 ? Math.round((presentToday / totalMarked) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalBoys,
        totalGirls,
        attendancePending,
        attendanceCompleted,
        attendancePercentage,
        boysPresentToday,
        boysAbsentToday,
        girlsPresentToday,
        girlsAbsentToday,
        presentToday,
        absentToday,
        assignedClasses: classDetails
      }
    });
  } catch (error) {
    next(error);
  }
};
