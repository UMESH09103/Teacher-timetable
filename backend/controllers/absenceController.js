import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Timetable } from '../models/Timetable.js';
import { Substitution } from '../models/Substitution.js';
import { Teacher } from '../models/Teacher.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { getDayOfWeek } from '../services/conflictService.js';

export const getAllAbsences = async (req, res, next) => {
  try {
    const { date, teacherId, status } = req.query;
    const query = {};

    if (date) query.date = date;
    if (teacherId) query.teacherId = teacherId;
    if (status) query.status = status;

    const absences = await TeacherAbsence.find(query)
      .populate('teacherId', 'name employeeId email phone avatar subjects')
      .populate('approvedBy', 'name email role')
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: absences.length,
      data: absences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a teacher absent, identifies affected timetable classes,
 * and generates pending substitution tickets automatically!
 */
export const createAbsence = async (req, res, next) => {
  try {
    const { teacherId, date, affectedPeriods, reason } = req.body;

    if (!teacherId || !date || !affectedPeriods || !affectedPeriods.length) {
      return res.status(400).json({
        success: false,
        message: 'Please provide teacherId, date, and select at least one affected period'
      });
    }

    const day = getDayOfWeek(date);
    if (day === 'Sunday') {
      return res.status(400).json({
        success: false,
        message: 'Sunday is a weekly school holiday (रविवार - साप्ताहिक शाळा सुट्टी). Faculty absence cannot be marked on Sunday.'
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Check if an absence record already exists for this date
    let absence = await TeacherAbsence.findOne({ teacherId, date });
    if (absence) {
      // Merge affected periods
      const combinedPeriods = Array.from(
        new Set([...absence.affectedPeriods, ...affectedPeriods.map(Number)])
      ).sort((a, b) => a - b);
      absence.affectedPeriods = combinedPeriods;
      absence.fromPeriod = Math.min(...combinedPeriods);
      absence.toPeriod = Math.max(...combinedPeriods);
      if (reason) absence.reason = reason;
      await absence.save();
    } else {
      const sortedPeriods = affectedPeriods.map(Number).sort((a, b) => a - b);
      absence = await TeacherAbsence.create({
        teacherId,
        date,
        fromPeriod: Math.min(...sortedPeriods),
        toPeriod: Math.max(...sortedPeriods),
        affectedPeriods: sortedPeriods,
        reason: reason || 'Medical Leave',
        status: 'pending',
        approvedBy: req.user ? req.user._id : null
      });
    }

    // Identify affected timetable classes on this weekday
    const affectedClasses = await Timetable.find({
      teacherId,
      day,
      periodNumber: { $in: affectedPeriods.map(Number) }
    })
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code colorHex');

    // Automatically create or update substitution records for these affected classes
    const createdSubs = [];
    for (const item of affectedClasses) {
      // Check if substitution ticket already exists
      let sub = await Substitution.findOne({
        date,
        periodNumber: item.periodNumber,
        classId: item.classId._id
      });

      if (!sub) {
        sub = await Substitution.create({
          date,
          periodNumber: item.periodNumber,
          classId: item.classId._id,
          subjectId: item.subjectId._id,
          roomNumber: item.roomNumber,
          originalTeacherId: teacherId,
          substituteTeacherId: null,
          absenceId: absence._id,
          status: 'pending'
        });
      } else {
        // If it was cancelled or unlinked, update it
        sub.originalTeacherId = teacherId;
        sub.absenceId = absence._id;
        await sub.save();
      }
      createdSubs.push(sub);
    }

    const populatedAbsence = await TeacherAbsence.findById(absence._id).populate(
      'teacherId',
      'name employeeId email avatar'
    );

    return res.status(201).json({
      success: true,
      message: `${teacher.name} marked absent for ${affectedPeriods.length} periods. ${affectedClasses.length} classes automatically scheduled for substitution coverage.`,
      data: {
        absence: populatedAbsence,
        affectedPeriodsCount: affectedPeriods.length,
        affectedClassesCount: affectedClasses.length,
        affectedClasses,
        substitutionsGenerated: createdSubs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAbsence = async (req, res, next) => {
  try {
    const absence = await TeacherAbsence.findById(req.params.id)
      .populate('teacherId', 'name shortName email');
    if (!absence) {
      return res.status(404).json({ success: false, message: 'Absence record not found' });
    }

    const teacherName = absence.teacherId?.name || 'Teacher';
    const teacherId = absence.teacherId?._id || absence.teacherId;
    const date = absence.date;

    // 1. Find all substitutions associated with this absence or this teacher on this date
    const relatedSubs = await Substitution.find({
      $or: [
        { absenceId: absence._id },
        { originalTeacherId: teacherId, date }
      ]
    }).populate('substituteTeacherId', 'name shortName');

    // 2. Notify assigned substitute teachers that their duty is cancelled because original teacher is present
    for (const sub of relatedSubs) {
      if (sub.substituteTeacherId) {
        const subTeacherId = sub.substituteTeacherId._id || sub.substituteTeacherId;
        const subUser = await User.findOne({ teacherId: subTeacherId });
        await Notification.create({
          recipient: subUser ? subUser._id : null,
          teacherId: subTeacherId,
          title: '🔄 बदली तासिका रद्द (Substitution Duty Cancelled)',
          message: `${date} रोजीची तासिका ${sub.periodNumber} साठीची आपली बदली तासिका रद्द करण्यात आली आहे, कारण मूळ शिक्षक (${teacherName}) हजर आहेत. (Original teacher ${teacherName} is now present; substitution duty has been cancelled.)`,
          type: 'system',
          isRead: false
        });
      }
    }

    // 3. Delete ALL substitutions for this absence / teacher on this date
    // When substitutions are deleted, the timetable automatically reverts back to the original teacher!
    await Substitution.deleteMany({
      $or: [
        { absenceId: absence._id },
        { originalTeacherId: teacherId, date }
      ]
    });

    // 4. Delete the TeacherAbsence record
    await TeacherAbsence.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Absence cancelled. All substitution duties have been deleted and lectures reassigned to ${teacherName}.`
    });
  } catch (error) {
    next(error);
  }
};
