import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    startTime: {
      type: String,
      required: true,
      default: '08:00'
    },
    endTime: {
      type: String,
      required: true,
      default: '08:45'
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    academicYear: {
      type: String,
      default: '2026-2027',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent Class double booking: A class cannot have two subjects in the same period on the same day
timetableSchema.index({ day: 1, periodNumber: 1, classId: 1, academicYear: 1 }, { unique: true });

// Index for fast query by teacher and day
timetableSchema.index({ day: 1, periodNumber: 1, teacherId: 1, academicYear: 1 });

// Index for fast query by room and day
timetableSchema.index({ day: 1, periodNumber: 1, roomNumber: 1, academicYear: 1 });

export const Timetable = mongoose.model('Timetable', timetableSchema);
