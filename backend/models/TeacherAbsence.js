import mongoose from 'mongoose';

const teacherAbsenceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    fromPeriod: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    toPeriod: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    affectedPeriods: [
      {
        type: Number,
        required: true
      }
    ],
    reason: {
      type: String,
      default: 'Medical Leave',
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'covered', 'partial'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Unique index to prevent duplicate absence records for same teacher on same date
teacherAbsenceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export const TeacherAbsence = mongoose.model('TeacherAbsence', teacherAbsenceSchema);
