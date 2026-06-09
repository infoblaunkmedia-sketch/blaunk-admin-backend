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

  let code = String(employeeCode || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ message: 'employeeCode is required.' });
  }
  const isAll = code === 'ALL' || code === '__ALL__';
  const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
  const selfCode = String(req.user?.employeeCode || req.user?.username || '').trim().toUpperCase();
  if (!isAdmin && !isAll && selfCode && code !== selfCode) {
    return res.status(403).json({ message: 'You can only view your own payslip.' });
  }
  const filters = {
    financialYear,
    employeeCode: isAll ? undefined : code,
    department: isAll ? undefined : (code ? undefined : department),
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

async function generateMyPayslipController(req, res) {
  const { financialYear, month, reportType, period, outputFormat } = req.body || {};
  const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
  const is3pc = String(req.user?.employeeType || '').toLowerCase() === '3pc';
  if (is3pc) {
    return res.status(403).json({ message: 'Payslip is available for internal employees only.' });
  }
  const code = String(req.user?.employeeCode || req.user?.username || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ message: 'Employee code is not linked to your account.' });
  }
  if (!financialYear) {
    return res.status(400).json({ message: 'financialYear is required.' });
  }

  const rt = String(reportType || 'monthly-payslip').trim().toLowerCase();
  const allowed = new Set(['monthly-payslip', 'yearly-payslip']);
  if (!allowed.has(rt)) {
    return res.status(400).json({ message: 'This report is not available for self-service.' });
  }
  if (rt === 'monthly-payslip' && !month) {
    return res.status(400).json({ message: 'month is required for monthly payslip.' });
  }

  const fmt = String(outputFormat || 'pdf').trim().toLowerCase();
  const filters = {
    financialYear,
    employeeCode: code,
    reportType: rt,
    period: period || (rt === 'yearly-payslip' ? 'Yearly' : 'Monthly'),
    month: rt === 'monthly-payslip' ? month : '',
  };
  try {
    const result = await payslipReportService.getReportData(filters);
    const payslips = (result.detailedPayslips || []).filter(
      (p) => String(p.employeeCode || '').toUpperCase() === code,
    );
    if (!payslips.length && !isAdmin) {
      return res.status(404).json({ message: 'No payslip found for the selected period.' });
    }
    return res.json({
      data: { detailed: true, payslips },
      filters,
      outputFormat: fmt === 'excel' ? 'excel' : 'pdf',
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('my payslip error:', err);
    return res.status(500).json({ message: 'Failed to generate payslip.' });
  }
}

module.exports = {
  listPayrollEmployeesController,
  listPayrollDepartmentsController,
  generatePayslipReportController,
  generateMyPayslipController,
};
