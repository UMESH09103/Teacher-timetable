const Standard = require('../models/Standard');

// @desc    Get all standards
// @route   GET /api/standards
// @access  Admin / Teacher
exports.getStandards = async (req, res, next) => {
  try {
    let standards = await Standard.find().lean();
    standards.sort((a, b) => {
      const numA = parseInt(String(a.name).match(/\d+/)?.[0] || '999', 10);
      const numB = parseInt(String(b.name).match(/\d+/)?.[0] || '999', 10);
      if (numA !== numB) return numA - numB;
      return String(a.name).localeCompare(String(b.name), undefined, { numeric: true });
    });
    res.json({ success: true, count: standards.length, data: standards });
  } catch (error) {
    next(error);
  }
};

// @desc    Create standard
// @route   POST /api/standards
// @access  Admin
exports.createStandard = async (req, res, next) => {
  try {
    const standard = await Standard.create(req.body);
    res.status(201).json({ success: true, data: standard });
  } catch (error) {
    next(error);
  }
};

// @desc    Update standard
// @route   PUT /api/standards/:id
// @access  Admin
exports.updateStandard = async (req, res, next) => {
  try {
    const standard = await Standard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!standard) {
      return res.status(404).json({ success: false, message: 'Standard not found' });
    }

    res.json({ success: true, data: standard });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete standard
// @route   DELETE /api/standards/:id
// @access  Admin
exports.deleteStandard = async (req, res, next) => {
  try {
    const standard = await Standard.findById(req.params.id);
    if (!standard) {
      return res.status(404).json({ success: false, message: 'Standard not found' });
    }

    await Standard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Standard deleted successfully' });
  } catch (error) {
    next(error);
  }
};
