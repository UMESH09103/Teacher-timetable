const Division = require('../models/Division');

// @desc    Get all divisions
// @route   GET /api/divisions
// @access  Admin / Teacher
exports.getDivisions = async (req, res, next) => {
  try {
    let divisions = await Division.find().lean();
    divisions.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' }));
    res.json({ success: true, count: divisions.length, data: divisions });
  } catch (error) {
    next(error);
  }
};

// @desc    Create division
// @route   POST /api/divisions
// @access  Admin
exports.createDivision = async (req, res, next) => {
  try {
    const division = await Division.create(req.body);
    res.status(201).json({ success: true, data: division });
  } catch (error) {
    next(error);
  }
};

// @desc    Update division
// @route   PUT /api/divisions/:id
// @access  Admin
exports.updateDivision = async (req, res, next) => {
  try {
    const division = await Division.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    res.json({ success: true, data: division });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete division
// @route   DELETE /api/divisions/:id
// @access  Admin
exports.deleteDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    await Division.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Division deleted successfully' });
  } catch (error) {
    next(error);
  }
};
