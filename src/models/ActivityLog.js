const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, trim: true, required: true },
    performedBy: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    module: { type: String, trim: true, default: '' },
    resourceId: { type: String, trim: true, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

activityLogSchema.index({ module: 1, timestamp: -1 });

const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
