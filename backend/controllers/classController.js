import { Class } from '../models/Class.js';
import { Timetable } from '../models/Timetable.js';
import { sortClassesAsc } from '../utils/sortUtils.js';

export const getAllClasses = async (req, res, next) => {
  try {
    const { search, academicYear } = req.query;
    const query = { isActive: true };

    if (academicYear) query.academicYear = academicYear;
    if (search) {
      query.$or = [
        { className: { $regex: search, $options: 'i' } },
        { division: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const classes = await Class.find(query)
      .populate('classTeacher', 'name employeeId email phone')
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ className: 1, division: 1 });

    const sorted = sortClassesAsc(classes);

    return res.status(200).json({
      success: true,
      count: sorted.length,
      data: sorted
    });
  } catch (error) {
    next(error);
  }
};

export const getClassById = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id).populate(
      'classTeacher',
      'name employeeId email phone'
    );

    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const timetable = await Timetable.find({ classId: cls._id })
      .populate('subjectId', 'name code colorHex')
      .populate('teacherId', 'name employeeId')
      .sort({ day: 1, periodNumber: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ...cls.toObject(),
        timetable
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const { className, division, academicYear, classTeacher, roomNumber, studentCount } = req.body;

    const existing = await Class.findOne({
      className: className.trim(),
      division: division.trim().toUpperCase(),
      academicYear: academicYear || '2026-2027'
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Class ${className}-${division} already exists for academic year ${academicYear || '2026-2027'}`
      });
    }

    const newClass = await Class.create({
      className: className.trim(),
      division: division.trim().toUpperCase(),
      academicYear: academicYear || '2026-2027',
      classTeacher: classTeacher || null,
      roomNumber: roomNumber.trim(),
      studentCount: studentCount || 40
    });

    const populated = await Class.findById(newClass._id).populate(
      'classTeacher',
      'name employeeId email'
    );

    return res.status(201).json({
      success: true,
      message: `Class ${newClass.className}-${newClass.division} created successfully`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('classTeacher', 'name employeeId email');

    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: cls
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    cls.isActive = false;
    await cls.save();

    return res.status(200).json({
      success: true,
      message: `Class ${cls.className}-${cls.division} deactivated successfully`
    });
  } catch (error) {
    next(error);
  }
};
