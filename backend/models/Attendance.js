import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  rollNumber: { type: String },
  studentName: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' }
});

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    dateStr: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher is required']
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    totalBoys: {
      type: Number,
      default: 0
    },
    totalGirls: {
      type: Number,
      default: 0
    },
    boysPresent: {
      type: Number,
      default: 0
    },
    boysAbsent: {
      type: Number,
      default: 0
    },
    girlsPresent: {
      type: Number,
      default: 0
    },
    girlsAbsent: {
      type: Number,
      default: 0
    },
    totalPresent: {
      type: Number,
      default: 0
    },
    totalAbsent: {
      type: Number,
      default: 0
    },
    totalLeave: {
      type: Number,
      default: 0
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    records: [attendanceRecordSchema]
  },
  {
    timestamps: true
  }
);

// Unique index: only 1 attendance submission per class per date
attendanceSchema.index({ dateStr: 1, classId: 1 }, { unique: true });
attendanceSchema.index({ teacherId: 1, dateStr: 1 });
attendanceSchema.index({ classId: 1, date: 1 });

// Pre-save hook: auto-calculate totals
attendanceSchema.pre('save', function (next) {
  if (this.records && this.records.length > 0) {
    this.totalPresent = this.records.filter((r) => r.status === 'present').length;
    this.totalAbsent = this.records.filter((r) => r.status === 'absent').length;
    this.totalLeave = this.records.filter((r) => r.status === 'leave').length;

    this.boysPresent = this.records.filter(
      (r) => (r.gender === 'male' || !r.gender) && r.status === 'present'
    ).length;
    this.boysAbsent = this.records.filter(
      (r) => (r.gender === 'male' || !r.gender) && r.status === 'absent'
    ).length;

    this.girlsPresent = this.records.filter(
      (r) => r.gender === 'female' && r.status === 'present'
    ).length;
    this.girlsAbsent = this.records.filter(
      (r) => r.gender === 'female' && r.status === 'absent'
    ).length;
  } else {
    this.totalPresent = (this.boysPresent || 0) + (this.girlsPresent || 0);
    this.totalAbsent = (this.boysAbsent || 0) + (this.girlsAbsent || 0);
  }
  next();
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
