const mongoose = require('mongoose');

const mediaSlotConfigSchema = new mongoose.Schema(
  {
    mediaTab: { type: String, required: true, trim: true, unique: true },
    maxSlots: { type: Number, required: true, min: 1, max: 500, default: 8 },
  },
  { timestamps: true },
);

const MediaSlotConfig =
  mongoose.models.MediaSlotConfig ||
  mongoose.model('MediaSlotConfig', mediaSlotConfigSchema);

module.exports = MediaSlotConfig;
