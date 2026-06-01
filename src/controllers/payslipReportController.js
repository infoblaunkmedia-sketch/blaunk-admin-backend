const payslipReportService = require('../services/payslipReportService');
const employeeCredentialsService = require('../services/employeeCredentialsService');

async function listPayrollEmployeesController(req, res) {
  try {
    const records = await employeeCredentialsService.listEmployees({ limit: 1000 });
    const employees = (records || [])
      .map((r) => ({
        empCode: r.empCode || '',
        employeeName: r.employeeName || '',
        department: r.department || '',
      }))
      .filter((r) => r.empCode);
    return res.json({ employees });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listPayrollEmployees error:', err);
    return res.status(500).json({ message: 'Failed to load employees.' });
  }
}

async function listPayrollDepartmentsController(req, res) {
  try {
    const departments = await employeeCredentialsService.getDistinctDepartments();
    return res.json({ departments });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listPayrollDepartments error:', err);
    return res.status(500).json({ message: 'Failed to load departments.' });
  }
}

async function generatePayslipReportController(req, res) {
  const { financialYear, department, employeeCode, reportType, period, month, outputFormat } =
    req.body || {};

  const fmt = String(outputFormat || 'pdf').trim().toLowerCase();
  if (!['pdf', 'excel', 'display'].includes(fmt)) {
    return res.status(400).json({ message: 'outputFormat must be pdf or excel.' });
  }

  const code = String(employeeCode || '').trim();
  if (!code) {
    return res.status(400).json({ message: 'employeeCode is required.' });
  }
  const filters = {
    financialYear,
    employeeCode: code || undefined,
    department: code ? undefined : department,
    reportType,
    period,
    month,
  };
  try {
    const result = await payslipReportService.getReportData(filters);
    return res.json({
      data: { detailed: true, payslips: result.detailedPayslips },
      filters,
      outputFormat: fmt,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('payslip report getReportData error:', err);
    return res.status(500).json({ message: 'Failed to generate report data.' });
  }
}

module.exports = {
  listPayrollEmployeesController,
  listPayrollDepartmentsController,
  generatePayslipReportController,
};
