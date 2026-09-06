import { Teacher } from '../models/Teacher.js';
import { Timetable } from '../models/Timetable.js';
import { Substitution } from '../models/Substitution.js';
import { TeacherAbsence } from '../models/TeacherAbsence.js';
import { User } from '../models/User.js';
import { Class } from '../models/Class.js';
import { getDayOfWeek } from '../services/conflictService.js';

export const getAllTeachers = async (req, res, next) => {
  try {
    const { search, subject, status, date } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (subject) {
      query.subjects = subject;
    }

    const teachers = await Teacher.find(query)
      .populate('subjects', 'name code colorHex')
      .populate('classes', 'className division roomNumber')
      .sort({ name: 1 });

    // Compute today's load for each teacher
    const targetDate = date || new Date().toISOString().split('T')[0];
    const day = getDayOfWeek(targetDate);

    const timetableLoads = await Timetable.aggregate([
      { $match: { day } },
      { $group: { _id: '$teacherId', count: { $sum: 1 } } }
    ]);
    const timetableMap = new Map(timetableLoads.map((i) => [i._id.toString(), i.count]));

    const subLoads = await Substitution.aggregate([
      {
        $match: {
          date: targetDate,
          status: { $in: ['assigned', 'completed'] },
          substituteTeacherId: { $ne: null }
        }
      },
      { $group: { _id: '$substituteTeacherId', count: { $sum: 1 } } }
    ]);
    const subMap = new Map(subLoads.map((i) => [i._id.toString(), i.count]));

    const absences = await TeacherAbsence.find({ date: targetDate });
    const absenceMap = new Map(absences.map((a) => [a.teacherId.toString(), a]));

    const teachersWithStats = teachers.map((t) => {
      const tObj = t.toObject();
      const regularLoad = timetableMap.get(t._id.toString()) || 0;
      const subLoad = subMap.get(t._id.toString()) || 0;
      const absence = absenceMap.get(t._id.toString());

      tObj.todayLoad = regularLoad + subLoad;
      tObj.regularLoad = regularLoad;
      tObj.subLoad = subLoad;
      tObj.isAbsentToday = !!absence;
      tObj.absenceDetails = absence || null;
      return tObj;
    });

    return res.status(200).json({
      success: true,
      count: teachersWithStats.length,
      data: teachersWithStats
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('subjects', 'name code colorHex')
      .populate('classes', 'className division roomNumber');

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const day = getDayOfWeek(targetDate);

    // Regular schedule
    const schedule = await Timetable.find({ teacherId: teacher._id, day })
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code colorHex')
      .sort({ periodNumber: 1 });

    // Assigned substitutions for today
    const substitutions = await Substitution.find({
      date: targetDate,
      substituteTeacherId: teacher._id
    })
      .populate('classId', 'className division roomNumber')
      .populate('subjectId', 'name code colorHex')
      .populate('originalTeacherId', 'name employeeId')
      .sort({ periodNumber: 1 });

    // Check if absent
    const absence = await TeacherAbsence.findOne({
      teacherId: teacher._id,
      date: targetDate
    });

    const isSunday = day === 'Sunday';

    return res.status(200).json({
      success: true,
      data: {
        ...teacher.toObject(),
        schedule,
        substitutions,
        absence,
        day,
        targetDate,
        isHoliday: isSunday,
        holidayReason: isSunday ? 'Sunday - Weekly School Holiday (रविवार - साप्ताहिक सुट्टी)' : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createTeacher = async (req, res, next) => {
  try {
    const { name, employeeId, email, phone, subjects, classes, maxDailyPeriods } = req.body;

    // Check existing
    const existing = await Teacher.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId }]
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A teacher with this Email or Employee ID already exists'
      });
    }

    const teacher = await Teacher.create({
      name,
      employeeId,
      email: email.toLowerCase(),
      phone: phone || '',
      subjects: subjects || [],
      classes: classes || [],
      maxDailyPeriods: maxDailyPeriods || 6
    });

    // Create user login account for the teacher
    const defaultPassword = 'Teacher@123';
    await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      password: defaultPassword,
      role: 'teacher',
      teacherId: teacher._id
    });

    // If classes were assigned, link classTeacher on the Class documents
    if (classes && classes.length > 0) {
      await Class.updateMany(
        { _id: { $in: classes } },
        { $set: { classTeacher: teacher._id } }
      );
    }

    const populated = await Teacher.findById(teacher._id)
      .populate('subjects', 'name code colorHex')
      .populate('classes', 'className division roomNumber');

    return res.status(201).json({
      success: true,
      message: 'Teacher added successfully and login account created',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (req, res, next) => {
  try {
    const { name, phone, subjects, classes, maxDailyPeriods, isActive } = req.body;

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(subjects && { subjects }),
        ...(classes && { classes }),
        ...(maxDailyPeriods && { maxDailyPeriods }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    )
      .populate('subjects', 'name code colorHex')
      .populate('classes', 'className division roomNumber');

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Sync User account details
    await User.updateMany(
      { teacherId: teacher._id },
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone: String(phone).trim() }),
        ...(isActive !== undefined && { isActive })
      }
    );

    // Sync classTeacher assignments
    if (classes !== undefined) {
      await Class.updateMany(
        { classTeacher: teacher._id },
        { $unset: { classTeacher: '' } }
      );
      if (classes.length > 0) {
        await Class.updateMany(
          { _id: { $in: classes } },
          { $set: { classTeacher: teacher._id } }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const teacherName = teacher.name;

    // Support soft deactivation if query param ?deactivate=true is specified
    if (req.query.deactivate === 'true') {
      teacher.isActive = false;
      await teacher.save();
      await User.updateMany({ teacherId: teacher._id }, { isActive: false });
      return res.status(200).json({
        success: true,
        message: `Teacher ${teacherName} deactivated successfully`
      });
    }

    // Complete Database Deletion
    // 1. Delete from Teacher collection
    await Teacher.findByIdAndDelete(req.params.id);

    // 2. Delete login User accounts
    await User.deleteMany({
      $or: [
        { teacherId: teacher._id },
        { email: teacher.email.toLowerCase() }
      ]
    });

    // 3. Unassign as classTeacher in Classes
    await Class.updateMany(
      { classTeacher: teacher._id },
      { $unset: { classTeacher: '' } }
    );

    // 4. Remove assigned timetable slots
    await Timetable.deleteMany({ teacherId: teacher._id });

    // 5. Remove absence and substitution records
    await TeacherAbsence.deleteMany({ teacherId: teacher._id });
    await Substitution.deleteMany({
      $or: [
        { originalTeacherId: teacher._id },
        { substituteTeacherId: teacher._id }
      ]
    });

    return res.status(200).json({
      success: true,
      message: `Teacher ${teacherName} permanently deleted from database`
    });
  } catch (error) {
    next(error);
  }
};
