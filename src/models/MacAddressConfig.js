const mongoose = require('mongoose');

const macAddressConfigSchema = new mongoose.Schema(
  {
    serviceProvider: { type: String, required: true, trim: true },
    macAddress: { type: String, default: '', trim: true },
    /** IT device registry (Employees / 3P tabs) */
    forItManagement: { type: Boolean, default: false },
    linkedType: { type: String, default: '', trim: true },
    linkedCode: { type: String, default: '', trim: true },
    linkedName: { type: String, default: '', trim: true },
    computerBrand: { type: String, default: '', trim: true },
    systemType: { type: String, default: '', trim: true },
    status: { type: String, default: 'Active', trim: true },
    approvedBy: { type: String, default: '', trim: true },
    addedBy: { type: String, default: '', trim: true },
    /** When true, row is bound to HR/Management rights (employee or 3PC code), not Security MAC pool */
    forRights: { type: Boolean, default: false },
    rightsType: { type: String, default: null },
    rightsEmployeeCode: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

macAddressConfigSchema.index(
  { rightsType: 1, rightsEmployeeCode: 1 },
  {
    unique: true,
    partialFilterExpression: { forRights: true },
  },
);

// Same collection as former UniqueCodeConfig so existing documents remain addressable
const MacAddressConfig =
  mongoose.models.MacAddressConfig ||
  mongoose.model('MacAddressConfig', macAddressConfigSchema, 'uniquecodeconfigs');

module.exports = MacAddressConfig;
