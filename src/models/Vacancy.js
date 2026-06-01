const mongoose = require('mongoose');

const VACANCY_TYPES = ['Full Time', 'Part Time', 'Contract'];
const VACANCY_STATUSES = ['Open', 'Closed', 'On Hold'];

const vacancySchema = new mongoose.Schema(
  {
    vacancyId: { type: String, trim: true, unique: true, sparse: true },
    jobTitle: { type: String, trim: true, required: true },
    department: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    type: { type: String, enum: VACANCY_TYPES, default: 'Full Time' },
    description: { type: String, trim: true, default: '' },
    requiredExperience: { type: String, trim: true, default: '' },
    numberOfOpenings: { type: Number, default: 1, min: 0 },
    status: { type: String, enum: VACANCY_STATUSES, default: 'Open', index: true },
    postedDate: { type: String, trim: true, default: '' },
    closingDate: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

const Vacancy = mongoose.models.Vacancy || mongoose.model('Vacancy', vacancySchema);

module.exports = Vacancy;
module.exports.VACANCY_TYPES = VACANCY_TYPES;
module.exports.VACANCY_STATUSES = VACANCY_STATUSES;
