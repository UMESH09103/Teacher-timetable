import mongoose from 'mongoose';

const categoryDetailSchema = new mongoose.Schema(
  {
    boys: { type: Number, default: 0, min: 0 },
    girls: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const categoryStrengthSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    month: {
      type: String,
      default: 'September 2026'
    },
    dateStr: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    },
    categories: {
      sc: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) },
      st: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) },
      ntvj: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) },
      sbc: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) },
      obc: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) },
      open: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) },
      minority: { type: categoryDetailSchema, default: () => ({ boys: 0, girls: 0, total: 0 }) }
    },
    totalBoys: { type: Number, default: 0 },
    totalGirls: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

categoryStrengthSchema.index({ classId: 1, month: 1 }, { unique: true });

// Pre-save calculation
categoryStrengthSchema.pre('save', function (next) {
  const mainCats = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open'];
  const allCats = ['sc', 'st', 'ntvj', 'sbc', 'obc', 'open', 'minority'];
  let sumBoys = 0;
  let sumGirls = 0;

  allCats.forEach((cat) => {
    if (this.categories[cat]) {
      const b = Number(this.categories[cat].boys) || 0;
      const g = Number(this.categories[cat].girls) || 0;
      this.categories[cat].boys = b;
      this.categories[cat].girls = g;
      this.categories[cat].total = b + g;
      if (mainCats.includes(cat)) {
        sumBoys += b;
        sumGirls += g;
      }
    }
  });

  this.totalBoys = sumBoys;
  this.totalGirls = sumGirls;
  this.grandTotal = sumBoys + sumGirls;
  next();
});

export const CategoryStrength = mongoose.model('CategoryStrength', categoryStrengthSchema);
