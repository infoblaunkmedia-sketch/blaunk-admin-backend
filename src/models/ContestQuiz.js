const mongoose = require('mongoose');

const contestQuizSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'win-contest' },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length === 4 && v.every((s) => String(s).trim());
        },
        message: 'Exactly four non-empty options are required.',
      },
    },
    deadlineMessage: { type: String, trim: true, default: '' },
    validUntil: { type: Date, required: true },
    correctOptionIndex: { type: Number, min: 0, max: 3, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ContestQuiz =
  mongoose.models.ContestQuiz || mongoose.model('ContestQuiz', contestQuizSchema);

module.exports = ContestQuiz;
