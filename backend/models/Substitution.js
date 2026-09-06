import mongoose from 'mongoose';

const substitutionSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    roomNumber: {
      type: String,
      default: ''
    },
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    substituteTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null
    },
    absenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherAbsence',
      default: null
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'completed', 'cancelled'],
      default: 'pending'
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for class substitution ticket on a specific date and period
substitutionSchema.index({ date: 1, periodNumber: 1, classId: 1 });

// Compound index to quickly find any assignments for a substitute teacher on a date/period
substitutionSchema.index({ date: 1, periodNumber: 1, substituteTeacherId: 1 });

export const Substitution = mongoose.model('Substitution', substitutionSchema);
