import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    marathiName: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Core', 'Language', 'Science & Tech', 'Arts & Physical', 'Elective'],
      default: 'Core'
    },
    colorHex: {
      type: String,
      default: '#4F46E5'
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

export const Subject = mongoose.model('Subject', subjectSchema);
