import { Subject } from '../models/Subject.js';
import { Teacher } from '../models/Teacher.js';

export const getAllSubjects = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(query).sort({ name: 1 });

    // Attach count of teachers teaching each subject
    const subjectTeacherCounts = await Teacher.aggregate([
      { $unwind: '$subjects' },
      { $group: { _id: '$subjects', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(subjectTeacherCounts.map((s) => [s._id.toString(), s.count]));

    const result = subjects.map((sub) => ({
      ...sub.toObject(),
      teacherCount: countMap.get(sub._id.toString()) || 0
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, code, category, colorHex } = req.body;

    const existing = await Subject.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Subject with code ${code.toUpperCase()} already exists`
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category: category || 'Core',
      colorHex: colorHex || '#4F46E5'
    });

    return res.status(201).json({
      success: true,
      message: `Subject ${subject.name} created successfully`,
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    subject.isActive = false;
    await subject.save();

    return res.status(200).json({
      success: true,
      message: `Subject ${subject.name} deactivated successfully`
    });
  } catch (error) {
    next(error);
  }
};
