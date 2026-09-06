import { Timetable } from '../models/Timetable.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Substitution } from '../models/Substitution.js';
import { Class } from '../models/Class.js';
import { Teacher } from '../models/Teacher.js';
import { checkTimetableConflict, getDayOfWeek } from '../services/conflictService.js';
import { sortClassesAsc } from '../utils/sortUtils.js';

// Official school bell schedule (from Sheet1 of timetable)
export const PERIOD_TIMINGS = [
  { period: 1, startTime: '11:10', endTime: '11:50' },
  { period: 2, startTime: '11:50', endTime: '12:25' },
  { period: 3, startTime: '12:25', endTime: '01:00' },
  { period: 4, startTime: '01:00', endTime: '01:35' },
  { period: 5, startTime: '02:00', endTime: '02:35' },
  { period: 6, startTime: '02:35', endTime: '03:10' },
  { period: 7, startTime: '03:10', endTime: '03:45' },
  { period: 8, startTime: '03:45', endTime: '04:20' }
];

export const getTimetable = async (req, res, next) => {
  try {
    const { day, classId, teacherId, periodNumber, academicYear } = req.query;
    const query = {};

    if (day) query.day = day;
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;
    if (periodNumber) query.periodNumber = Number(periodNumber);
    if (academicYear) query.academicYear = academicYear;

    const entries = await Timetable.find(query)
      .populate('classId', 'className division roomNumber displayName marathiName')
      .populate('subjectId', 'name marathiName code colorHex')
      .populate('teacherId', 'name shortName designation employeeId avatar')
      .sort({ day: 1, periodNumber: 1 });

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets today's timetable with real-time overlay of absences and substitutions
 */
export const getTodayTimetable = async (req, res, next) => {
  try {
    const { date, classId, teacherId, periodNumber } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let day = getDayOfWeek(targetDate);
    // Sunday is a weekly school holiday
    if (day === 'Sunday') {
      return res.status(200).json({
        success: true,
        isHoliday: true,
        holidayReason: 'Sunday - Weekly School Holiday (रविवार - साप्ताहिक सुट्टी)',
        day: 'Sunday',
        date: targetDate,
        count: 0,
        data: []
      });
    }

    const query = { day };
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;
    if (periodNumber) query.periodNumber = Number(periodNumber);

    const regularEntries = await Timetable.find(query)
      .populate('classId', 'className division roomNumber displayName marathiName')
      .populate('subjectId', 'name marathiName code colorHex')
      .populate('teacherId', 'name shortName designation employeeId avatar')
      .sort({ periodNumber: 1 });

    // Fetch absences for this date
    const absences = await TeacherAbsence.find({ date: targetDate });
    const absenceMap = new Map();
    absences.forEach((a) => {
      a.affectedPeriods.forEach((p) => {
        absenceMap.set(`${a.teacherId.toString()}_${p}`, a);
      });
    });

    // Fetch substitutions for this date
    const substitutions = await Substitution.find({ date: targetDate })
      .populate('substituteTeacherId', 'name employeeId avatar')
      .populate('originalTeacherId', 'name employeeId');

    const subMap = new Map();
    substitutions.forEach((s) => {
      subMap.set(`${s.classId.toString()}_${s.periodNumber}`, s);
    });

    // Process entries with status overlay
    const combined = regularEntries.map((entry) => {
      const eObj = entry.toObject();
      const absenceKey = `${entry.teacherId?._id?.toString()}_${entry.periodNumber}`;
      const subKey = `${entry.classId?._id?.toString()}_${entry.periodNumber}`;

      const absence = absenceMap.get(absenceKey);
      const substitution = subMap.get(subKey);

      if (substitution && substitution.substituteTeacherId && substitution.status !== 'cancelled') {
        eObj.status = 'substitute';
        eObj.substitution = substitution;
        eObj.activeTeacher = substitution.substituteTeacherId;
        eObj.originalTeacher = entry.teacherId;
      } else if (absence || (substitution && substitution.status === 'pending')) {
        eObj.status = 'pending';
        eObj.absence = absence || null;
        eObj.substitution = substitution || null;
        eObj.originalTeacher = entry.teacherId;
        eObj.activeTeacher = null;
      } else {
        eObj.status = 'normal';
        eObj.activeTeacher = entry.teacherId;
      }

      return eObj;
    });

    return res.status(200).json({
      success: true,
      date: targetDate,
      day,
      count: combined.length,
      data: combined
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets live status of all classrooms for the current period (or requested period)
 */
export const getLiveTimetable = async (req, res, next) => {
  try {
    const { date, periodNumber: reqPeriod } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let day = getDayOfWeek(targetDate);
    if (day === 'Sunday') {
      const rawClasses = await Class.find({ isActive: true })
        .collation({ locale: 'en', numericOrdering: true })
        .sort({ className: 1, division: 1 });
      const classes = sortClassesAsc(rawClasses);
      const liveClasses = classes.map((cls) => ({
        class: cls,
        periodNumber: 0,
        periodInfo: { period: 0, label: 'Sunday Holiday', startTime: '-', endTime: '-' },
        subject: null,
        status: 'holiday',
        teacher: null,
        activeTeacher: null,
        originalTeacher: null,
        roomNumber: cls.roomNumber,
        reason: 'Sunday - Weekly School Holiday (रविवार - साप्ताहिक सुट्टी)'
      }));
      return res.status(200).json({
        success: true,
        isHoliday: true,
        holidayReason: 'Sunday - Weekly School Holiday (रविवार - साप्ताहिक सुट्टी)',
        activePeriod: 0,
        periodInfo: { period: 0, label: 'Sunday Holiday', startTime: '-', endTime: '-' },
        date: targetDate,
        day: 'Sunday',
        classes: liveClasses
      });
    }

    // Determine current period if not explicitly given
    let activePeriod = 1;
    if (reqPeriod) {
      activePeriod = Number(reqPeriod);
    } else {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      // Find which period falls into current time
      for (const p of PERIOD_TIMINGS) {
        const [sh, sm] = p.startTime.split(':').map(Number);
        const [eh, em] = p.endTime.split(':').map(Number);
        const startVal = sh * 60 + sm;
        const endVal = eh * 60 + em;
        if (currentTimeVal >= startVal && currentTimeVal <= endVal) {
          activePeriod = p.period;
          break;
        }
      }
    }

    const periodInfo = PERIOD_TIMINGS.find((p) => p.period === activePeriod) || PERIOD_TIMINGS[0];

    // Fetch all active classes
    const rawClasses = await Class.find({ isActive: true })
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ className: 1, division: 1 });
    const classes = sortClassesAsc(rawClasses);

    // Fetch timetable entries for this day and active period
    const entries = await Timetable.find({ day, periodNumber: activePeriod })
      .populate('classId', 'className division roomNumber displayName marathiName')
      .populate('subjectId', 'name marathiName code colorHex')
      .populate('teacherId', 'name shortName designation employeeId avatar');

    const entryMap = new Map(entries.map((e) => [e.classId?._id?.toString(), e]));

    // Fetch absences and substitutions for this date & period
    const absences = await TeacherAbsence.find({
      date: targetDate,
      affectedPeriods: activePeriod
    });
    const absentTeacherIds = new Set(absences.map((a) => a.teacherId.toString()));

    const substitutions = await Substitution.find({
      date: targetDate,
      periodNumber: activePeriod
    })
      .populate('substituteTeacherId', 'name employeeId avatar')
      .populate('originalTeacherId', 'name employeeId avatar');

    const subMap = new Map(substitutions.map((s) => [s.classId.toString(), s]));

    // Construct live classroom statuses
    const liveClasses = classes.map((cls) => {
      const entry = entryMap.get(cls._id.toString());
      const sub = subMap.get(cls._id.toString());

      if (!entry) {
        return {
          class: cls,
          periodNumber: activePeriod,
          periodInfo,
          subject: null,
          status: 'free',
          teacher: null,
          roomNumber: cls.roomNumber
        };
      }

      const isTeacherAbsent = absentTeacherIds.has(entry.teacherId?._id?.toString());

      if (sub && sub.substituteTeacherId && sub.status !== 'cancelled') {
        return {
          class: cls,
          periodNumber: activePeriod,
          periodInfo,
          subject: entry.subjectId,
          status: 'substitute',
          activeTeacher: sub.substituteTeacherId,
          originalTeacher: entry.teacherId,
          substitution: sub,
          roomNumber: entry.roomNumber || cls.roomNumber
        };
      } else if (isTeacherAbsent || (sub && sub.status === 'pending')) {
        return {
          class: cls,
          periodNumber: activePeriod,
          periodInfo,
          subject: entry.subjectId,
          status: 'pending',
          activeTeacher: null,
          originalTeacher: entry.teacherId,
          substitution: sub || null,
          roomNumber: entry.roomNumber || cls.roomNumber
        };
      } else {
        return {
          class: cls,
          periodNumber: activePeriod,
          periodInfo,
          subject: entry.subjectId,
          status: 'normal',
          activeTeacher: entry.teacherId,
          roomNumber: entry.roomNumber || cls.roomNumber
        };
      }
    });

    return res.status(200).json({
      success: true,
      activePeriod,
      periodInfo,
      date: targetDate,
      day,
      classes: liveClasses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets weekly timetable matrix (Monday-Friday, P1-P8) for a class or teacher
 */
export const getWeeklyTimetable = async (req, res, next) => {
  try {
    const { type, id } = req.query; // type: 'class' | 'teacher'
    if (!type || !id) {
      return res.status(400).json({ success: false, message: 'Please specify both type and id' });
    }

    const query = {};
    if (type === 'class') query.classId = id;
    if (type === 'teacher') query.teacherId = id;

    const entries = await Timetable.find(query)
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code colorHex')
      .populate('teacherId', 'name employeeId')
      .sort({ day: 1, periodNumber: 1 });

    return res.status(200).json({
      success: true,
      type,
      id,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    next(error);
  }
};

export const createTimetableEntry = async (req, res, next) => {
  try {
    const { day, periodNumber, classId, subjectId, teacherId, roomNumber, academicYear } = req.body;

    if (day === 'Sunday') {
      return res.status(400).json({
        success: false,
        message: 'Sunday is a weekly school holiday (रविवार - साप्ताहिक सुट्टी). Lectures cannot be scheduled on Sunday.'
      });
    }

    // Check conflict
    const conflict = await checkTimetableConflict({
      day,
      periodNumber,
      classId,
      teacherId,
      roomNumber
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflict.reason
      });
    }

    const timing = PERIOD_TIMINGS.find((p) => p.period === Number(periodNumber)) || {
      startTime: '08:00',
      endTime: '08:45'
    };

    const entry = await Timetable.create({
      day,
      periodNumber: Number(periodNumber),
      startTime: timing.startTime,
      endTime: timing.endTime,
      classId,
      subjectId,
      teacherId,
      roomNumber: roomNumber.trim(),
      academicYear: academicYear || '2026-2027'
    });

    const populated = await Timetable.findById(entry._id)
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code colorHex')
      .populate('teacherId', 'name employeeId');

    return res.status(201).json({
      success: true,
      message: 'Timetable entry added successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateTimetableEntry = async (req, res, next) => {
  try {
    const { day, periodNumber, classId, subjectId, teacherId, roomNumber } = req.body;

    const conflict = await checkTimetableConflict({
      day,
      periodNumber,
      classId,
      teacherId,
      roomNumber,
      excludeId: req.params.id
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflict.reason
      });
    }

    const updated = await Timetable.findByIdAndUpdate(
      req.params.id,
      {
        ...(day && { day }),
        ...(periodNumber && { periodNumber }),
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(teacherId && { teacherId }),
        ...(roomNumber && { roomNumber: roomNumber.trim() })
      },
      { new: true, runValidators: true }
    )
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code colorHex')
      .populate('teacherId', 'name employeeId');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTimetableEntry = async (req, res, next) => {
  try {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Timetable entry removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
