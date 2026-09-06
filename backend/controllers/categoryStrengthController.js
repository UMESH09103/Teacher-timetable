import { CategoryStrength } from '../models/CategoryStrength.js';
import { Class } from '../models/Class.js';
import { Teacher } from '../models/Teacher.js';
import { sortClassesAsc } from '../utils/sortUtils.js';

// Helper to sanitize & sum category inputs
const sanitizeCategories = (categories = {}) => {
  const mainCats = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open'];
  const allCats = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open', 'minority'];
  const formatted = {};
  let totalBoys = 0;
  let totalGirls = 0;

  allCats.forEach((c) => {
    const b = Math.max(0, parseInt(categories?.[c]?.boys || 0, 10));
    const g = Math.max(0, parseInt(categories?.[c]?.girls || 0, 10));
    formatted[c] = { boys: b, girls: g, total: b + g };
    if (mainCats.includes(c)) {
      totalBoys += b;
      totalGirls += g;
    }
  });

  return { formatted, totalBoys, totalGirls, grandTotal: totalBoys + totalGirls };
};

/**
 * @desc Get category strength for logged in teacher's assigned class
 * @route GET /api/category-strength/my-class
 */
export const getMyCategoryStrength = async (req, res, next) => {
  try {
    const teacherId = req.user.teacherId?._id || req.user.teacherId || req.user._id;
    const targetMonth = req.query.month || 'September 2026';
    const requestedClassId = req.query.classId;

    // Find class where this teacher is assigned as classTeacher
    let classDoc = null;
    if (requestedClassId) {
      classDoc = await Class.findById(requestedClassId).populate('classTeacher', 'name employeeId');
    } else {
      classDoc = await Class.findOne({ classTeacher: teacherId, isActive: true })
        .populate('classTeacher', 'name employeeId');
      
      // Fallback: if teacher is not designated classTeacher, pick first class or allow view
      if (!classDoc) {
        classDoc = await Class.findOne({ isActive: true }).populate('classTeacher', 'name employeeId');
      }
    }

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'No class found' });
    }

    let record = await CategoryStrength.findOne({
      classId: classDoc._id,
      month: targetMonth
    }).populate('classId', 'className division displayName roomNumber')
      .populate('teacherId', 'name employeeId');

    if (!record) {
      // Create empty record for this class & month
      record = await CategoryStrength.create({
        classId: classDoc._id,
        teacherId,
        month: targetMonth,
        academicYear: '2026-2027'
      });
      record = await record.populate('classId teacherId', 'className division displayName name');
    }

    return res.status(200).json({
      success: true,
      data: record,
      classInfo: {
        classId: classDoc._id,
        className: classDoc.className,
        division: classDoc.division,
        displayName: classDoc.displayName || `Class ${classDoc.className}-${classDoc.division}`,
        classTeacherName: classDoc.classTeacher?.name || 'Class Teacher'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update category strength for logged in teacher's assigned class
 * @route POST /api/category-strength/my-class
 */
export const updateMyCategoryStrength = async (req, res, next) => {
  try {
    const teacherId = req.user.teacherId?._id || req.user.teacherId || req.user._id;
    const { classId, categories, month = 'September 2026', academicYear = '2026-2027' } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    const { formatted, totalBoys, totalGirls, grandTotal } = sanitizeCategories(categories);

    let record = await CategoryStrength.findOne({ classId, month });

    if (record) {
      record.categories = formatted;
      record.totalBoys = totalBoys;
      record.totalGirls = totalGirls;
      record.grandTotal = grandTotal;
      record.teacherId = teacherId;
      await record.save();
    } else {
      record = await CategoryStrength.create({
        classId,
        teacherId,
        month,
        academicYear,
        categories: formatted,
        totalBoys,
        totalGirls,
        grandTotal
      });
    }

    const populated = await CategoryStrength.findById(record._id)
      .populate('classId', 'className division displayName')
      .populate('teacherId', 'name employeeId');

    return res.status(200).json({
      success: true,
      message: 'Category strength saved successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all classes category strength report for Principal
 * @route GET /api/category-strength/all
 */
export const getAllCategoryStrength = async (req, res, next) => {
  try {
    const month = req.query.month || 'September 2026';
    const rawClasses = await Class.find({ isActive: true })
      .populate('classTeacher', 'name employeeId phone')
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ className: 1, division: 1 });
    const classes = sortClassesAsc(rawClasses);

    const records = await CategoryStrength.find({ month })
      .populate('classId', 'className division displayName')
      .populate('teacherId', 'name employeeId');

    const recordMap = new Map();
    records.forEach((r) => {
      const cid = r.classId?._id?.toString() || r.classId?.toString();
      recordMap.set(cid, r);
    });

    const categoryKeys = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open', 'minority'];

    // Accumulators for school grand totals
    const schoolTotals = {
      sc: { boys: 0, girls: 0, total: 0 },
      st: { boys: 0, girls: 0, total: 0 },
      ntvj: { boys: 0, girls: 0, total: 0 },
      sbc: { boys: 0, girls: 0, total: 0 },
      obc: { boys: 0, girls: 0, total: 0 },
      open: { boys: 0, girls: 0, total: 0 },
      minority: { boys: 0, girls: 0, total: 0 },
      totalBoys: 0,
      totalGirls: 0,
      grandTotal: 0
    };

    const classRows = classes.map((cls) => {
      const rec = recordMap.get(cls._id.toString());
      const cats = rec?.categories || {};

      categoryKeys.forEach((k) => {
        const b = cats[k]?.boys || 0;
        const g = cats[k]?.girls || 0;
        const t = cats[k]?.total || (b + g);

        schoolTotals[k].boys += b;
        schoolTotals[k].girls += g;
        schoolTotals[k].total += t;
      });

      const cBoys = rec?.totalBoys || 0;
      const cGirls = rec?.totalGirls || 0;
      const cTotal = rec?.grandTotal || 0;

      schoolTotals.totalBoys += cBoys;
      schoolTotals.totalGirls += cGirls;
      schoolTotals.grandTotal += cTotal;

      return {
        classId: cls._id,
        className: cls.className,
        division: cls.division,
        displayName: cls.displayName || `Class ${cls.className}-${cls.division}`,
        classTeacher: cls.classTeacher,
        isSubmitted: !!rec,
        categories: cats,
        totalBoys: cBoys,
        totalGirls: cGirls,
        grandTotal: cTotal,
        updatedAt: rec?.updatedAt || null
      };
    });

    return res.status(200).json({
      success: true,
      month,
      schoolTotals,
      data: classRows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Admin update category strength directly
 * @route POST /api/category-strength/admin-update
 */
export const updateAdminCategoryStrength = async (req, res, next) => {
  try {
    const { classId, categories, month = 'September 2026', academicYear = '2026-2027' } = req.body;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required' });
    }

    const { formatted, totalBoys, totalGirls, grandTotal } = sanitizeCategories(categories);
    const teacherId = req.user.teacherId?._id || req.user._id;

    let record = await CategoryStrength.findOne({ classId, month });

    if (record) {
      record.categories = formatted;
      record.totalBoys = totalBoys;
      record.totalGirls = totalGirls;
      record.grandTotal = grandTotal;
      await record.save();
    } else {
      record = await CategoryStrength.create({
        classId,
        teacherId,
        month,
        academicYear,
        categories: formatted,
        totalBoys,
        totalGirls,
        grandTotal
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category strength record updated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};
