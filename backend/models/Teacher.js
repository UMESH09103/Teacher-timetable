import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: {
      type: String,
      trim: true // e.g. "दराडे डी.डी."
    },
    designation: {
      type: String,
      default: 'उपशिक्षक',
      trim: true // e.g. "प्राचार्य", "पर्यवेक्षक", "उपशिक्षक", "उपशिक्षिका"
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      }
    ],
    maxDailyPeriods: {
      type: Number,
      default: 6
    },
    avatar: {
      type: String,
      default: ''
    },
    joiningDate: {
      type: Date,
      default: Date.now
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

export const Teacher = mongoose.model('Teacher', teacherSchema);
