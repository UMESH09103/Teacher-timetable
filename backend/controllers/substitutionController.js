import { Substitution } from '../models/Substitution.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { findAvailableSubstituteTeachers } from '../services/substituteService.js';
import { checkSubstituteConflict } from '../services/conflictService.js';

export const getSubstitutions = async (req, res, next) => {
  try {
    const { date, status, teacherId, classId, periodNumber } = req.query;
    const query = {};

    if (date) query.date = date;
    if (status) query.status = status;
    if (classId) query.classId = classId;
    if (periodNumber) query.periodNumber = Number(periodNumber);
    if (teacherId) {
      query.$or = [{ originalTeacherId: teacherId }, { substituteTeacherId: teacherId }];
    }

    const substitutions = await Substitution.find(query)
      .populate('classId', 'className division roomNumber displayName marathiName')
      .populate('subjectId', 'name marathiName code colorHex')
      .populate('originalTeacherId', 'name shortName designation employeeId avatar')
      .populate('substituteTeacherId', 'name shortName designation employeeId avatar subjects phone')
      .populate('assignedBy', 'name role')
      .sort({ date: -1, periodNumber: 1 });

    return res.status(200).json({
      success: true,
      count: substitutions.length,
      data: substitutions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invokes smart substitute recommendation algorithm
 */
export const getSubstituteCandidates = async (req, res, next) => {
  try {
    const { date, periodNumber, classId, subjectId, absentTeacherId } = req.query;

    if (!date || !periodNumber || !classId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: date, periodNumber, classId, subjectId'
      });
    }

    const candidates = await findAvailableSubstituteTeachers({
      date,
      periodNumber: Number(periodNumber),
      classId,
      subjectId,
      absentTeacherId: absentTeacherId || null
    });

    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assigns a substitute teacher with atomic conflict check and notification dispatch
 */
export const assignSubstitute = async (req, res, next) => {
  try {
    const { substitutionId, substituteTeacherId, remarks } = req.body;

    if (!substitutionId || !substituteTeacherId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both substitutionId and substituteTeacherId'
      });
    }

    const sub = await Substitution.findById(substitutionId)
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code')
      .populate('originalTeacherId', 'name employeeId');

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Substitution ticket not found' });
    }

    // Strict double booking verification on backend
    const conflict = await checkSubstituteConflict({
      date: sub.date,
      periodNumber: sub.periodNumber,
      substituteTeacherId,
      classId: sub.classId._id,
      excludeSubstitutionId: sub._id
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflict.reason
      });
    }

    const substituteTeacher = await Teacher.findById(substituteTeacherId);
    if (!substituteTeacher) {
      return res.status(404).json({ success: false, message: 'Substitute teacher not found' });
    }

    // Update substitution record
    sub.substituteTeacherId = substituteTeacherId;
    sub.status = 'assigned';
    sub.assignedBy = req.user ? req.user._id : null;
    if (remarks) sub.remarks = remarks;
    await sub.save();

    // Update parent absence status if all its periods are covered
    if (sub.absenceId) {
      const allSubsForAbsence = await Substitution.find({ absenceId: sub.absenceId });
      const allAssigned = allSubsForAbsence.every((s) => s.status === 'assigned' || s.status === 'completed');
      await TeacherAbsence.findByIdAndUpdate(sub.absenceId, {
        status: allAssigned ? 'covered' : 'partial'
      });
    }

    // Find the user account of the substitute teacher to send notification
    const teacherUser = await User.findOne({ teacherId: substituteTeacherId });

    // Create Notification
    const className = `${sub.classId.className}-${sub.classId.division}`;
    await Notification.create({
      recipient: teacherUser ? teacherUser._id : null,
      teacherId: substituteTeacherId,
      title: '🔄 New Substitution Assigned',
      message: `You have been assigned to Class ${className} during Period ${sub.periodNumber} (${sub.subjectId.name}). Original Teacher: ${sub.originalTeacherId.name}.`,
      type: 'substitution_assigned',
      relatedSubstitutionId: sub._id,
      isRead: false
    });

    const populated = await Substitution.findById(sub._id)
      .populate('classId', 'className division roomNumber displayName marathiName')
      .populate('subjectId', 'name marathiName code colorHex')
      .populate('originalTeacherId', 'name shortName designation employeeId avatar')
      .populate('substituteTeacherId', 'name shortName designation employeeId avatar subjects phone')
      .populate('assignedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${substituteTeacher.name} to Class ${className} for Period ${sub.periodNumber}.`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubstitutionStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const sub = await Substitution.findById(req.params.id);

    if (!sub) {
      return res.status(404).json({ success: false, message: 'Substitution not found' });
    }

    if (status) sub.status = status;
    if (remarks !== undefined) sub.remarks = remarks;
    await sub.save();

    const populated = await Substitution.findById(sub._id)
      .populate('classId', 'className division roomNumber displayName marathiName')
      .populate('subjectId', 'name marathiName code colorHex')
      .populate('originalTeacherId', 'name shortName designation employeeId avatar')
      .populate('substituteTeacherId', 'name shortName designation employeeId avatar subjects phone');

    return res.status(200).json({
      success: true,
      message: `Substitution status updated to ${status}`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubstitution = async (req, res, next) => {
  try {
    const sub = await Substitution.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Substitution not found' });
    }

    // Reset back to pending substitute
    sub.substituteTeacherId = null;
    sub.status = 'pending';
    await sub.save();

    if (sub.absenceId) {
      await TeacherAbsence.findByIdAndUpdate(sub.absenceId, { status: 'partial' });
    }

    return res.status(200).json({
      success: true,
      message: 'Substitution assignment cancelled and reopened as pending'
    });
  } catch (error) {
    next(error);
  }
};
