const Payroll = require('../models/Payroll');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    empCode: doc.empCode || '',
    empName: doc.empName || '',
    department: doc.department || '',
    month: doc.month || '',
    basicSalary: Number(doc.basicSalary || 0),
    allowances: Number(doc.allowances || 0),
    deductions: Number(doc.deductions || 0),
    netSalary: Number(doc.netSalary || 0),
    paymentDate: doc.paymentDate || '',
    paymentMode: doc.paymentMode || '',
    status: doc.status || 'Pending',
  };
}

async function listPayroll({ empCode, month, department, status, limit = 500 } = {}) {
  const query = {};
  if (empCode) query.empCode = new RegExp(cleanString(empCode), 'i');
  if (month) query.month = month;
  if (department) query.department = department;
  if (status) query.status = status;
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 2000);
  const rows = await Payroll.find(query).sort({ month: -1, empCode: 1 }).limit(safeLimit).lean();
  return rows.map(toDto);
}

async function getPayrollById(id) {
  return toDto(await Payroll.findById(id).lean());
}

async function createPayroll(payload) {
  const body = payload || {};
  if (!body.empCode || !body.month) throw new Error('empCode and month are required.');
  const doc = await Payroll.create({
    empCode: cleanString(body.empCode).toUpperCase(),
    empName: cleanString(body.empName),
    department: cleanString(body.department),
    month: cleanString(body.month),
    basicSalary: Number(body.basicSalary || 0),
    allowances: Number(body.allowances || 0),
    deductions: Number(body.deductions || 0),
    netSalary: Number(body.netSalary || 0),
    paymentDate: cleanString(body.paymentDate),
    paymentMode: cleanString(body.paymentMode),
    status: cleanString(body.status) || 'Pending',
  });
  return toDto(doc.toObject());
}

async function updatePayroll(id, payload) {
  const body = payload || {};
  const set = {};
  [
    'empCode',
    'empName',
    'department',
    'month',
    'paymentDate',
    'paymentMode',
    'status',
  ].forEach((k) => {
    if (body[k] !== undefined) set[k] = typeof body[k] === 'number' ? body[k] : cleanString(body[k]);
  });
  ['basicSalary', 'allowances', 'deductions', 'netSalary'].forEach((k) => {
    if (body[k] !== undefined) set[k] = Number(body[k] || 0);
  });
  const doc = await Payroll.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).lean();
  if (!doc) return null;
  return toDto(doc);
}

async function deletePayrollById(id) {
  const res = await Payroll.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

module.exports = {
  listPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayrollById,
};
