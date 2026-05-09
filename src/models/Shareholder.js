const mongoose = require('mongoose');

const shareholderSchema = new mongoose.Schema(
  {
    pan: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: String,
    mobile: String,
    email: String,
    aadhaar: String,
    address: String,
    city: String,
    landmark: String,
    country: String,
    gender: String,
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Shareholder || mongoose.model('Shareholder', shareholderSchema);
