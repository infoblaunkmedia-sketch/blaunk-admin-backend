const mongoose = require('mongoose');

const contestSubmissionSchema = new mongoose.Schema(
  {
    quizKey: { type: String, required: true, default: 'win-contest', index: true },
    optionIndex: { type: Number, required: true, min: 0, max: 3 },
    answerText: { type: String, required: true, trim: true },
    participantName: { type: String, required: true, trim: true },
    participantEmail: { type: String, required: true, trim: true, lowercase: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    username: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

contestSubmissionSchema.index({ quizKey: 1, participantEmail: 1 }, { unique: true });

const ContestSubmission =
  mongoose.models.ContestSubmission ||
  mongoose.model('ContestSubmission', contestSubmissionSchema);

module.exports = ContestSubmission;
