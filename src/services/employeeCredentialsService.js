const EmployeeCredentials = require('../models/EmployeeCredentials');

/** Schema top-level keys that can be saved (matches EmployeeCredentials model). */
const ALLOWED_KEYS = new Set([
  'pan', 'employeeName', 'mobile', 'email', 'aadhaar', 'empCode', 'address', 'city', 'zip',
  'country', 'state', 'gender', 'yearlyCtc', 'department', 'designation', 'bankName', 'ifscCode',
  'micrCode', 'bankAccountNumber', 'medicalInsuranceNo', 'medicalInsurer', 'gratuityNo', 'gratuityInsurer',
  'bonus', 'pfRequest', 'esiInsuranceNo', 'npsSubscriptionNo', 'ctcDivisorDays', 'pfContributionEmployer',
  'bankArea', 'bankCity', 'doj', 'doc', 'centreName', 'confirmationStatus',
  'monthlyLeaves', 'nps', 'esi', 'jobGrade', 'uan', 'pf', 'remarks', 'status', 'exitDate',
  'basicSalary', 'hra', 'lta', 'medicalAllowance', 'cea', 'foodAllowance', 'supplementaryAllowance',
  'mea', 'pTax', 'healthInsurance', 'esiSalary', 'pfContribution', 'npsEmployer', 'npsEmployee',
  'roundOff', 'ctcMonthly', 'ctcPerDay', 'gratuity', 'references', 'employeePhotoUrl', 'employeeDocumentUrl',
]);

/**
 * Build a clean update object: only allowed keys, no undefined (MongoDB doesn't store undefined).
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, unknown>}
 */
function cleanPayload(payload) {
  const cleaned = {};
  for (const key of Object.keys(payload)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (payload[key] === undefined) continue;
    cleaned[key] = payload[key];
  }
  return cleaned;
}

async function upsertEmployeeCredentialsMongo(payload) {
  if (!payload || !payload.pan) {
    throw new Error('PAN is required for upsert');
  }
  const normalizedPan = String(payload.pan || '').trim().toUpperCase();
  const toSet = cleanPayload({ ...payload, pan: normalizedPan });
  const record = await EmployeeCredentials.findOneAndUpdate(
    { pan: normalizedPan },
    { $set: toSet },
    {
      returnDocument: 'after',
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  ).lean();

  return record;
}

async function getEmployeeCredentialsByPanMongo(pan) {
  const normalizedPan = String(pan || '').trim().toUpperCase();
  const record = await EmployeeCredentials.findOne({ pan: normalizedPan }).lean();
  return record;
}

async function getDistinctDepartments() {
  const departments = await EmployeeCredentials.distinct('department');
  return (departments || []).filter((d) => d != null && String(d).trim() !== '');
}

async function listEmployees({ q, department, limit = 200 } = {}) {
  const query = {};
  if (department) query.department = String(department).trim();
  if (q && String(q).trim()) {
    const needle = String(q).trim();
    query.$or = [
      { empCode: { $regex: needle, $options: 'i' } },
      { employeeName: { $regex: needle, $options: 'i' } },
      { pan: { $regex: needle, $options: 'i' } },
      { mobile: { $regex: needle, $options: 'i' } },
      { email: { $regex: needle, $options: 'i' } },
    ];
  }

  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  const list = await EmployeeCredentials.find(query)
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .lean();
  return list || [];
}

async function deleteByPan(pan) {
  const normalizedPan = String(pan || '').trim().toUpperCase();
  if (!normalizedPan) throw new Error('PAN is required');
  const res = await EmployeeCredentials.deleteOne({ pan: normalizedPan });
  return res.deletedCount || 0;
}

/**
 * List employees for payslip report filtered by department, etc.
 * Returns full salary/allowance/deduction fields for detailed payslip.
 * @param {{ department?: string, financialYear?: string, reportType?: string, period?: string, month?: string }} filters
 */
async function listForReport(filters) {
  const query = {};
  const empCode = String(filters.employeeCode || '').trim();
  if (empCode) {
    query.empCode = empCode;
  } else if (filters.department) {
    query.department = filters.department;
  }
  const list = await EmployeeCredentials.find(query)
    .select(
      'empCode employeeName department designation bankName bankAccountNumber uan aadhaar doj jobGrade city pan ' +
      'basicSalary hra lta medicalAllowance cea foodAllowance supplementaryAllowance mea ' +
      'ctcMonthly yearlyCtc pTax healthInsurance esiSalary pfContribution npsEmployer npsEmployee roundOff pf esi',
    )
    .lean();
  return list || [];
}

async function upsertEmployeeCredentials(payload) {
  return upsertEmployeeCredentialsMongo(payload);
}

async function getEmployeeCredentialsByPan(pan) {
  return getEmployeeCredentialsByPanMongo(pan);
}

module.exports = {
  upsertEmployeeCredentials,
  getEmployeeCredentialsByPan,
  getDistinctDepartments,
  listEmployees,
  deleteByPan,
  listForReport,
};

