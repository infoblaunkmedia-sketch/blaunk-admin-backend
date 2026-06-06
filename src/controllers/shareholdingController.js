const XLSX = require('xlsx');
const shareholdingService = require('../services/shareholdingService');

async function saveShareholdingController(req, res) {
  const {
    historyId,
    projectKey,
    pan,
    name,
    mobile,
    email,
    aadhaar,
    address,
    city,
    landmark,
    country,
    gender,
    holdingPercent,
    shareType,
    faceValue,
    numberOfShares,
    mode,
    isinCode,
    dpNumber,
    beneficiaryDpId,
    folioNumber,
    distinctiveFrom,
    distinctiveTo,
    yearOfIssuance,
    stakeholder,
    dateOfAllotment,
    remarks,
    exitDate,
    year,
    bankName,
    ifscCode,
    bankAccountNumber,
    bankCity,
    bankCountry,
    pledge,
    shareStatus,
    nominees = [],
  } = req.body || {};

  if (!pan) {
    return res.status(400).json({ message: 'PAN is required.' });
  }

  try {
    const result = await shareholdingService.upsertShareholding({
      historyId,
      projectKey,
      pan,
      name,
      mobile,
      email,
      aadhaar,
      address,
      city,
      landmark,
      country,
      gender,
      holdingPercent,
      shareType,
      faceValue,
      numberOfShares,
      mode,
      isinCode,
      dpNumber,
      beneficiaryDpId,
      folioNumber,
      distinctiveFrom,
      distinctiveTo,
      yearOfIssuance,
      stakeholder,
      dateOfAllotment,
      remarks,
      exitDate,
      year,
      bankName,
      ifscCode,
      bankAccountNumber,
      bankCity,
      bankCountry,
      pledge,
      shareStatus,
      nominees,
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
    if (
      String(msg).includes('Invalid history') ||
      String(msg).includes('Another history entry')
    ) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: 'Failed to save shareholding record.' });
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

async function exportShareholdingMISController(req, res) {
  const { financialYear, month, department, status, format } = req.body || {};

  try {
    if (!financialYear || !month) {
      return res.status(400).json({ message: 'Financial year and month are required.' });
    }
    if (format && String(format).toLowerCase() === 'pdf') {
      return res.status(400).json({
        message: 'PDF is not supported for Company Secretary MIS. Use Excel.',
      });
    }

    const merged = await shareholdingService.listShareholdingMISRows({
      financialYear,
      month,
      department,
      status,
    });

    const flat = merged.map(({ shareholding: sh, credential: c }) => ({
      PAN: sh.pan,
      'Updated At': sh.updatedAt ? new Date(sh.updatedAt).toISOString() : '',
      'HR Employee Name': c?.employeeName || '',
      'HR Emp Code': c?.empCode || '',
      'HR Department': c?.department || '',
      'HR Designation': c?.designation || '',
      'HR Status': c?.status || '',
      'Name (Shareholding)': sh.name || '',
      Mobile: sh.mobile || '',
      Email: sh.email || '',
      Aadhaar: sh.aadhaar || '',
      Address: sh.address || '',
      City: sh.city || '',
      Landmark: sh.landmark || '',
      Country: sh.country || '',
      Gender: sh.gender || '',
      'Holding %': sh.holdingPercent ?? '',
      'Share Type': sh.shareType || '',
      'Face Value': sh.faceValue ?? '',
      'No. of Shares': sh.numberOfShares ?? '',
      Mode: sh.mode || '',
      'ISIN Code': sh.isinCode || '',
      'DP Number': sh.dpNumber || '',
      'Beneficiary DP ID': sh.beneficiaryDpId || '',
      'Folio Number': sh.folioNumber || '',
      'Distinctive From': sh.distinctiveFrom || '',
      'Distinctive To': sh.distinctiveTo || '',
      'Year of Issuance': sh.yearOfIssuance || '',
      Stakeholder: sh.stakeholder || '',
      'Date of Allotment': sh.dateOfAllotment || '',
      Remarks: sh.remarks || '',
      'Exit Date': sh.exitDate || '',
      Year: sh.year || '',
      'Bank Name': sh.bankName || '',
      'IFSC Code': sh.ifscCode || '',
      'Bank Account No.': sh.bankAccountNumber || '',
      'Bank City': sh.bankCity || '',
      'Bank Country': sh.bankCountry || '',
      Pledge: sh.pledge || '',
      Status: sh.shareStatus || '',
      'Nominee 1 Name': sh.nominees?.[0]?.name || '',
      'Nominee 1 Mobile': sh.nominees?.[0]?.mobile || '',
      'Nominee 1 Relation': sh.nominees?.[0]?.relation || '',
      'Nominee 1 %': sh.nominees?.[0]?.percentage ?? '',
      'Nominee 1 PAN': sh.nominees?.[0]?.pan || '',
      'Nominee 2 Name': sh.nominees?.[1]?.name || '',
      'Nominee 2 Mobile': sh.nominees?.[1]?.mobile || '',
      'Nominee 2 Relation': sh.nominees?.[1]?.relation || '',
      'Nominee 2 %': sh.nominees?.[1]?.percentage ?? '',
      'Nominee 2 PAN': sh.nominees?.[1]?.pan || '',
      'Nominee 3 Name': sh.nominees?.[2]?.name || '',
      'Nominee 3 Mobile': sh.nominees?.[2]?.mobile || '',
      'Nominee 3 Relation': sh.nominees?.[2]?.relation || '',
      'Nominee 3 %': sh.nominees?.[2]?.percentage ?? '',
      'Nominee 3 PAN': sh.nominees?.[2]?.pan || '',
    }));

    const wb = XLSX.utils.book_new();
    let ws;
    if (flat.length === 0) {
      ws = XLSX.utils.aoa_to_sheet([['No shareholding rows for the selected MIS filters.']]);
    } else {
      ws = XLSX.utils.json_to_sheet(flat);
    }
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

module.exports = {
  saveShareholdingController,
  listShareholdingsController,
  getShareholdingController,
  deleteShareholdingHistoryController,
  deleteShareholdingController,
  exportShareholdingMISController,
};

