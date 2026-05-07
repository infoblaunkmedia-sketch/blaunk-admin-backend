const mongoose = require('mongoose');

const allowedIpSchema = new mongoose.Schema(
  {
    serviceProvider: { type: String, default: '', trim: true },
    ipAddress: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
    addedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

const AllowedIp =
  mongoose.models.AllowedIp || mongoose.model('AllowedIp', allowedIpSchema);

module.exports = AllowedIp;
