const mongoose = require('mongoose');

const PAYROLL_STATUSES = ['Paid', 'Pending', 'Hold'];

const payrollSchema = new mongoose.Schema(
  {
    empCode: { type: String, trim: true, required: true, index: true },
    empName: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    month: { type: String, trim: true, required: true, index: true },
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    paymentDate: { type: String, trim: true, default: '' },
    paymentMode: { type: String, trim: true, default: '' },
    status: { type: String, enum: PAYROLL_STATUSES, default: 'Pending', index: true },
  },
  { timestamps: true },
);

payrollSchema.index({ empCode: 1, month: 1 });

const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;
module.exports.PAYROLL_STATUSES = PAYROLL_STATUSES;
