const mongoose = require('mongoose');

const standardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Standard name is required'],
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Standard', standardSchema);
