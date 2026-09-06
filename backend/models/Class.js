import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true // e.g. "5", "6", "7", "8", "9", "10"
    },
    division: {
      type: String,
      required: true,
      trim: true // e.g. "A", "B", "C"
    },
    displayName: {
      type: String,
      trim: true // e.g. "5-A (5 वी अ)"
    },
    marathiName: {
      type: String,
      trim: true // e.g. "5 वी अ"
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    studentCount: {
      type: Number,
      default: 45
    },
    boysCount: {
      type: Number,
      default: 25
    },
    girlsCount: {
      type: Number,
      default: 20
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Unique combination of className + division + academicYear
classSchema.index({ className: 1, division: 1, academicYear: 1 }, { unique: true });

export const Class = mongoose.model('Class', classSchema);
