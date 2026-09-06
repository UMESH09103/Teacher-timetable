import mongoose from 'mongoose';

const periodTimingSchema = new mongoose.Schema(
  {
    period: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    label: { type: String, default: '' }
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: 'विद्यामंदिर राजापूर'
    },
    schoolLogo: {
      type: String,
      default: '/school-logo.png'
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    contactEmail: {
      type: String,
      default: 'admin@school.com'
    },
    periodTimings: {
      type: [periodTimingSchema],
      default: [
        { period: 1, startTime: '11:10', endTime: '11:50', label: 'Period 1 (11:10 - 11:50)' },
        { period: 2, startTime: '11:50', endTime: '12:25', label: 'Period 2 (11:50 - 12:25)' },
        { period: 3, startTime: '12:25', endTime: '01:00', label: 'Period 3 (12:25 - 01:00)' },
        { period: 4, startTime: '01:00', endTime: '01:35', label: 'Period 4 (01:00 - 01:35)' },
        { period: 5, startTime: '02:00', endTime: '02:35', label: 'Period 5 (02:00 - 02:35)' },
        { period: 6, startTime: '02:35', endTime: '03:10', label: 'Period 6 (02:35 - 03:10)' },
        { period: 7, startTime: '03:10', endTime: '03:45', label: 'Period 7 (03:10 - 03:45)' },
        { period: 8, startTime: '03:45', endTime: '04:20', label: 'Period 8 (03:45 - 04:20)' }
      ]
    }
  },
  {
    timestamps: true
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
