const mongoose = require('mongoose');

const vacancyConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    applyEmail: { type: String, trim: true, default: 'careers@blaunk.com' },
  },
  { timestamps: true },
);

const VacancyConfig =
  mongoose.models.VacancyConfig || mongoose.model('VacancyConfig', vacancyConfigSchema);

module.exports = VacancyConfig;
