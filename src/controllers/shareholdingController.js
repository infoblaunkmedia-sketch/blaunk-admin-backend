const XLSX = require('xlsx');
const shareholdingService = require('../services/shareholdingService');
const { MIS_HEADERS, MIS_ROW_KEYS } = require('../utils/shareholdingMis');

function resolveDataEntryBy(req) {
  return String(
    req.user?.employeeCode || req.user?.username || req.user?.name || req.user?.employeeName || '',
  ).trim();
}

async function saveShareholdingController(req, res) {
  const body = req.body || {};

  if (!body.pan) {
    return res.status(400).json({ message: 'PAN is required.' });
  }

  try {
    const dataEntryBy = resolveDataEntryBy(req);
    const result = await shareholdingService.upsertShareholding({
      ...body,
      ...(dataEntryBy ? { dataEntryBy } : {}),
    });

    return res.status(200).json({
      record: result.record,
      shareholder: result.shareholder,
      historyRecord: result.historyRecord,
      history: result.history,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('saveShareholding error:', error);
    const msg = error?.message || 'Failed to save shareholding record.';
    if (error?.code === 11000) {
      return res.status(400).json({
        message: 'Another history entry already exists for this year and project reference.',
      });
    }
    if (
      error?.name === 'ValidationError' ||
      error?.name === 'CastError' ||
      String(msg).includes('Invalid history') ||
      String(msg).includes('Another history entry') ||
      String(msg).includes('PAN is required')
    ) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: msg });
  }
}

async function getShareholdingController(req, res) {
  const { pan } = req.params;

  if (!pan) {
    return res.status(400).json({ message: 'PAN is required.' });
  }

  try {
    const combined = await shareholdingService.getCombinedByPan(pan);
    if (!combined) {
      return res.status(404).json({ message: 'No shareholding or employee credential found for this PAN.' });
    }
    return res.json({
      shareholder: combined.shareholder,
      history: combined.history,
      record: combined.record,
      credential: combined.credential,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getShareholding error:', error);
    return res.status(500).json({ message: 'Failed to load shareholding record.' });
  }
}

async function listShareholdingsController(req, res) {
  const { q, limit } = req.query || {};
  try {
    const records = await shareholdingService.listShareholdings({ q, limit });
    return res.json({ records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listShareholdings error:', error);
    return res.status(500).json({ message: 'Failed to list shareholding records.' });
  }
}

async function deleteShareholdingHistoryController(req, res) {
  const { pan, historyId } = req.params || {};
  if (!pan || !historyId) return res.status(400).json({ message: 'PAN and history id are required.' });
  try {
    const deletedCount = await shareholdingService.deleteHistoryById(pan, historyId);
    if (!deletedCount) return res.status(404).json({ message: 'History record not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deleteShareholdingHistory error:', error);
    return res.status(500).json({ message: 'Failed to delete history record.' });
  }
}

async function deleteShareholdingController(req, res) {
  const { pan } = req.params || {};
  if (!pan) return res.status(400).json({ message: 'PAN is required.' });
  try {
    const deletedCount = await shareholdingService.deleteByPan(pan);
    if (!deletedCount) return res.status(404).json({ message: 'Shareholding record not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deleteShareholding error:', error);
    return res.status(500).json({ message: 'Failed to delete shareholding record.' });
  }
}

async function listShareholdingMISController(req, res) {
  const { fromDate, toDate, financialYear, month, department, status } = req.query || req.body || {};

  try {
    const hasDateRange = Boolean(String(fromDate || '').trim() && String(toDate || '').trim());
    if (!hasDateRange && (!financialYear || !month)) {
      return res.status(400).json({ message: 'From date and to date are required.' });
    }

    const rows = await shareholdingService.listShareholdingMISRows({
      fromDate,
      toDate,
      financialYear,
      month,
      department,
      status,
    });

    return res.json({
      headers: MIS_HEADERS,
      rows,
      total: rows.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listShareholdingMIS error:', error);
    return res.status(500).json({ message: 'Failed to load MIS data.' });
  }
}

async function exportShareholdingMISController(req, res) {
  const { fromDate, toDate, financialYear, month, department, status, format } = req.body || {};

  try {
    const hasDateRange = Boolean(String(fromDate || '').trim() && String(toDate || '').trim());
    if (!hasDateRange && (!financialYear || !month)) {
      return res.status(400).json({ message: 'From date and to date are required.' });
    }
    if (format && String(format).toLowerCase() === 'pdf') {
      return res.status(400).json({
        message: 'PDF is not supported for Company Secretary MIS. Use Excel.',
      });
    }

    const misRows = await shareholdingService.listShareholdingMISRows({
      fromDate,
      toDate,
      financialYear,
      month,
      department,
      status,
    });

    if (misRows.length === 0) {
      return res.status(404).json({
        message: 'No data found to generate MIS for the selected date range.',
      });
    }

    const sheetRows = [
      MIS_HEADERS,
      ...misRows.map((row) => MIS_ROW_KEYS.map((key) => row[key] ?? '')),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(wb, ws, 'MIS_Shareholding');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="company-sec-mis-shareholding.xlsx"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return res.send(Buffer.from(buf));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('exportShareholdingMIS error:', error);
    return res.status(500).json({ message: 'Failed to generate MIS export.' });
  }
}

async function importShareholdingMISController(req, res) {
  if (!req.file?.buffer) {
    return res.status(400).json({ message: 'Excel file is required (field name: file).' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ message: 'Uploaded workbook has no sheets.' });
    }
    const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false,
    });
    const result = await shareholdingService.importShareholdingMISRows(sheetRows, {
      dataEntryBy: resolveDataEntryBy(req),
    });
    return res.json({
      message: `Imported ${result.imported} shareholding row(s).`,
      ...result,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('importShareholdingMIS error:', error);
    if (error.validationErrors) {
      return res.status(400).json({
        message: error.message || 'Validation failed for imported rows.',
        errors: error.validationErrors,
      });
    }
    return res.status(500).json({ message: error?.message || 'Failed to import MIS file.' });
  }
}

module.exports = {
  saveShareholdingController,
  listShareholdingsController,
  getShareholdingController,
  deleteShareholdingHistoryController,
  deleteShareholdingController,
  listShareholdingMISController,
  exportShareholdingMISController,
  importShareholdingMISController,
};

