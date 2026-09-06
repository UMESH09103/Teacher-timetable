import { Attendance } from '../models/Attendance.js';
import { Class } from '../models/Class.js';
import { Teacher } from '../models/Teacher.js';
import { sortClassesAsc } from '../utils/sortUtils.js';

// Helper to normalize date string to YYYY-MM-DD
const normalizeDateStr = (dateInput) => {
  if (!dateInput) return new Date().toISOString().slice(0, 10);
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  return new Date(dateInput).toISOString().slice(0, 10);
};

/**
 * @desc Check if attendance exists for date & class
 * @route GET /api/attendance/check
 */
export const checkAttendance = async (req, res, next) => {
  try {
    const { date, classId } = req.query;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    const dateStr = normalizeDateStr(date);
    const existing = await Attendance.findOne({ dateStr, classId })
      .populate('classId', 'className division displayName roomNumber studentCount boysCount girlsCount')
      .populate('teacherId', 'name shortName employeeId phone');

    return res.status(200).json({
      success: true,
      exists: !!existing,
      dateStr,
      data: existing || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Submit or update daily attendance for a class
 * @route POST /api/attendance
 */
export const submitAttendance = async (req, res, next) => {
  try {
    const {
      date,
      classId,
      totalBoys = 0,
      totalGirls = 0,
      boysPresent = 0,
      boysAbsent = 0,
      girlsPresent = 0,
      girlsAbsent = 0,
      totalLeave = 0,
      records = [],
      remarks = ''
    } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    const dateStr = normalizeDateStr(date);
    const attendanceDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Determine submitting teacher ID
    const teacherId = req.user.teacherId?._id || req.user.teacherId || req.user._id;

    // Check if class exists
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Keep class baseline counts synced if provided
    if (totalBoys > 0 || totalGirls > 0) {
      classDoc.boysCount = Number(totalBoys) || classDoc.boysCount;
      classDoc.girlsCount = Number(totalGirls) || classDoc.girlsCount;
      classDoc.studentCount = classDoc.boysCount + classDoc.girlsCount;
      await classDoc.save();
    }

    // Check if record already exists for this date and class
    let existing = await Attendance.findOne({ dateStr, classId });

    if (existing) {
      existing.totalBoys = Number(totalBoys) || 0;
      existing.totalGirls = Number(totalGirls) || 0;
      existing.boysPresent = Number(boysPresent) || 0;
      existing.boysAbsent = Number(boysAbsent) || 0;
      existing.girlsPresent = Number(girlsPresent) || 0;
      existing.girlsAbsent = Number(girlsAbsent) || 0;
      existing.totalLeave = Number(totalLeave) || 0;
      existing.remarks = remarks || '';
      if (records && records.length > 0) existing.records = records;

      await existing.save();

      const populated = await Attendance.findById(existing._id)
        .populate('classId', 'className division displayName roomNumber')
        .populate('teacherId', 'name shortName employeeId');

      return res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: populated
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      date: attendanceDate,
      dateStr,
      classId,
      teacherId,
      totalBoys: Number(totalBoys) || 0,
      totalGirls: Number(totalGirls) || 0,
      boysPresent: Number(boysPresent) || 0,
      boysAbsent: Number(boysAbsent) || 0,
      girlsPresent: Number(girlsPresent) || 0,
      girlsAbsent: Number(girlsAbsent) || 0,
      totalLeave: Number(totalLeave) || 0,
      remarks: remarks || '',
      records: records || []
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('classId', 'className division displayName roomNumber')
      .populate('teacherId', 'name shortName employeeId');

    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get attendance history for a class or teacher
 * @route GET /api/attendance/history
 */
export const getAttendanceHistory = async (req, res, next) => {
  try {
    const { classId, teacherId, month, limit = 31 } = req.query;
    const query = {};

    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;

    if (month) {
      // e.g. "2026-09"
      query.dateStr = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query)
      .populate('classId', 'className division displayName roomNumber')
      .populate('teacherId', 'name shortName employeeId')
      .sort({ dateStr: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get class-wise attendance summary for all classes for a given date
 * @route GET /api/attendance/class-summary
 * @access Principal / Admin
 */
export const getClassWiseSummary = async (req, res, next) => {
  try {
    const { date, standard, division } = req.query;
    const dateStr = normalizeDateStr(date);

    // Build class filter
    const classFilter = { isActive: true };
    if (standard) classFilter.className = standard;
    if (division) classFilter.division = division;

    const rawClasses = await Class.find(classFilter)
      .populate('classTeacher', 'name shortName employeeId phone avatar')
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ className: 1, division: 1 });
    const classes = sortClassesAsc(rawClasses);

    // Fetch all attendance records for dateStr
    const attendanceRecords = await Attendance.find({ dateStr })
      .populate('teacherId', 'name shortName employeeId phone');

    const attMap = new Map();
    attendanceRecords.forEach((att) => {
      const cid = att.classId?.toString();
      attMap.set(cid, att);
    });

    let totalBoysEnrolled = 0;
    let totalGirlsEnrolled = 0;
    let totalBoysPresent = 0;
    let totalGirlsPresent = 0;
    let totalBoysAbsent = 0;
    let totalGirlsAbsent = 0;
    let submittedCount = 0;

    const summaryList = classes.map((cls) => {
      const att = attMap.get(cls._id.toString());
      const isSubmitted = !!att;

      const tBoys = att ? att.totalBoys : (cls.boysCount || 25);
      const tGirls = att ? att.totalGirls : (cls.girlsCount || 20);
      const tTotal = tBoys + tGirls;

      totalBoysEnrolled += tBoys;
      totalGirlsEnrolled += tGirls;

      if (isSubmitted) {
        submittedCount++;
        totalBoysPresent += att.boysPresent || 0;
        totalGirlsPresent += att.girlsPresent || 0;
        totalBoysAbsent += att.boysAbsent || 0;
        totalGirlsAbsent += att.girlsAbsent || 0;
      }

      return {
        classId: cls._id,
        className: cls.className,
        division: cls.division,
        displayName: cls.displayName || `Class ${cls.className}-${cls.division}`,
        marathiName: cls.marathiName || `${cls.className} वी ${cls.division}`,
        roomNumber: cls.roomNumber,
        classTeacher: cls.classTeacher,
        isSubmitted,
        attendanceId: att?._id || null,
        totalBoys: tBoys,
        totalGirls: tGirls,
        totalStudents: tTotal,
        boysPresent: att ? att.boysPresent : 0,
        boysAbsent: att ? att.boysAbsent : 0,
        girlsPresent: att ? att.girlsPresent : 0,
        girlsAbsent: att ? att.girlsAbsent : 0,
        totalPresent: att ? att.totalPresent : 0,
        totalAbsent: att ? att.totalAbsent : 0,
        totalLeave: att ? att.totalLeave : 0,
        percentage: att && tTotal > 0 ? Math.round((att.totalPresent / tTotal) * 100) : 0,
        updatedAt: att?.updatedAt || null,
        remarks: att?.remarks || ''
      };
    });

    const totalEnrolled = totalBoysEnrolled + totalGirlsEnrolled;
    const totalPresent = totalBoysPresent + totalGirlsPresent;
    const totalAbsent = totalBoysAbsent + totalGirlsAbsent;
    const overallPercentage = totalEnrolled > 0 && submittedCount > 0
      ? Math.round((totalPresent / (summaryList.filter(s => s.isSubmitted).reduce((acc, c) => acc + c.totalStudents, 0) || 1)) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      date: dateStr,
      metrics: {
        totalClasses: classes.length,
        submittedClasses: submittedCount,
        pendingClasses: classes.length - submittedCount,
        totalEnrolled,
        totalBoysEnrolled,
        totalGirlsEnrolled,
        totalPresent,
        totalBoysPresent,
        totalGirlsPresent,
        totalAbsent,
        totalBoysAbsent,
        totalGirlsAbsent,
        overallPercentage
      },
      data: summaryList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get attendance statistics for dashboard
 * @route GET /api/attendance/stats
 */
export const getAttendanceStats = async (req, res, next) => {
  try {
    const { date } = req.query;
    const dateStr = normalizeDateStr(date);

    const totalClasses = await Class.countDocuments({ isActive: true });
    const attendances = await Attendance.find({ dateStr });

    const submittedCount = attendances.length;
    const pendingCount = Math.max(0, totalClasses - submittedCount);

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalEnrolled = 0;

    attendances.forEach((a) => {
      totalPresent += a.totalPresent || 0;
      totalAbsent += a.totalAbsent || 0;
      totalEnrolled += (a.totalBoys || 0) + (a.totalGirls || 0);
    });

    const percentage = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

    return res.status(200).json({
      success: true,
      dateStr,
      data: {
        totalClasses,
        submittedCount,
        pendingCount,
        totalPresent,
        totalAbsent,
        totalEnrolled,
        percentage
      }
    });
  } catch (error) {
    next(error);
  }
};
