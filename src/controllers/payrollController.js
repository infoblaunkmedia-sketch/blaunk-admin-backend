const payrollService = require('../services/payrollService');

async function listPayrollController(req, res) {
  try {
    const records = await payrollService.listPayroll(req.query || {});
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list payroll.' });
  }
}

async function getPayrollController(req, res) {
  try {
    const record = await payrollService.getPayrollById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Payroll entry not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load payroll entry.' });
  }
}

async function createPayrollController(req, res) {
  try {
    const record = await payrollService.createPayroll(req.body || {});
    return res.status(201).json({ record });
  } catch (error) {
    const status = String(error?.message || '').toLowerCase().includes('required') ? 400 : 500;
    return res.status(status).json({ message: error.message || 'Failed to create payroll entry.' });
  }
}

async function updatePayrollController(req, res) {
  try {
    const record = await payrollService.updatePayroll(req.params.id, req.body || {});
    if (!record) return res.status(404).json({ message: 'Payroll entry not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update payroll entry.' });
  }
}

async function deletePayrollController(req, res) {
  try {
    const deleted = await payrollService.deletePayrollById(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Payroll entry not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete payroll entry.' });
  }
}

module.exports = {
  listPayrollController,
  getPayrollController,
  createPayrollController,
  updatePayrollController,
  deletePayrollController,
};
