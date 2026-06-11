/** Shareholding MIS column order (67 columns). Duplicate header labels are allowed in Excel export. */
const MIS_HEADERS = [
  'Sr No',
  'PAN',
  'Updated At',
  'HR Employee Name',
  'HR Emp Code',
  'HR Department',
  'HR Designation',
  'HR Status',
  'Name (Shareholding)',
  'Mobile',
  'Email',
  'Aadhaar',
  'Address 1',
  'Address 2',
  'Landmark',
  'Area',
  'City',
  'State',
  'Pin Code',
  'Country',
  'Gender',
  'Form Submission',
  'Holding %',
  'Share Type',
  'Face Value',
  'No. of Shares',
  'Mode',
  'ISIN Code',
  'DP',
  'DP Number',
  'Beneficiary DP ID',
  'Folio Number',
  'Certificate No',
  'Distinctive From',
  'Distinctive To',
  'Year of Issuance',
  'Stakeholder',
  'Date of Allotment',
  'Remarks',
  'Pledge',
  'Status',
  'Exit Date',
  'Year',
  'Bank Name',
  'IFSC Code',
  'Bank Account No.',
  'Bank City',
  'Bank Country',
  'Pledge Status',
  'Status',
  'Nominee 1 Name',
  'Nominee 1 Mobile',
  'Nominee 1 Relation',
  'Nominee 1 %',
  'Nominee 1 PAN',
  'Nominee 2 Name',
  'Nominee 2 Mobile',
  'Nominee 2 Relation',
  'Nominee 2 %',
  'Nominee 2 PAN',
  'Nominee 3 Name',
  'Nominee 3 Mobile',
  'Nominee 3 Relation',
  'Nominee 3 %',
  'Nominee 3 PAN',
  'Last Re-edit Date',
  'Data Entry By',
];

const HEADER_ALIASES = {
  'sr no': 'Sr No',
  srno: 'Sr No',
  pan: 'PAN',
  'updated at': 'Updated At',
  'hr employee name': 'HR Employee Name',
  'hr emp code': 'HR Emp Code',
  'hr department': 'HR Department',
  'hr designation': 'HR Designation',
  'hr status': 'HR Status',
  'name (shareholding)': 'Name (Shareholding)',
  name: 'Name (Shareholding)',
  mobile: 'Mobile',
  email: 'Email',
  aadhaar: 'Aadhaar',
  'address 1': 'Address 1',
  address: 'Address 1',
  'address 2': 'Address 2',
  landmark: 'Landmark',
  area: 'Area',
  city: 'City',
  state: 'State',
  'pin code': 'Pin Code',
  pincode: 'Pin Code',
  country: 'Country',
  gender: 'Gender',
  'form submission': 'Form Submission',
  'holding %': 'Holding %',
  'share type': 'Share Type',
  'face value': 'Face Value',
  'no. of shares': 'No. of Shares',
  mode: 'Mode',
  'isin code': 'ISIN Code',
  dp: 'DP',
  'dp number': 'DP Number',
  'beneficiary dp id': 'Beneficiary DP ID',
  'folio number': 'Folio Number',
  'certificate no': 'Certificate No',
  'certificate number': 'Certificate No',
  'distinctive from': 'Distinctive From',
  'distinctive to': 'Distinctive To',
  'year of issuance': 'Year of Issuance',
  stakeholder: 'Stakeholder',
  'date of allotment': 'Date of Allotment',
  remarks: 'Remarks',
  pledge: 'Pledge',
  status: 'Status',
  'exit date': 'Exit Date',
  year: 'Year',
  'bank name': 'Bank Name',
  'ifsc code': 'IFSC Code',
  'bank account no.': 'Bank Account No.',
  'bank account number': 'Bank Account No.',
  'bank city': 'Bank City',
  'bank country': 'Bank Country',
  'pledge status': 'Pledge Status',
  'nominee 1 name': 'Nominee 1 Name',
  'nominee 1 mobile': 'Nominee 1 Mobile',
  'nominee 1 relation': 'Nominee 1 Relation',
  'nominee 1 %': 'Nominee 1 %',
  'nominee 1 pan': 'Nominee 1 PAN',
  'nominee 2 name': 'Nominee 2 Name',
  'nominee 2 mobile': 'Nominee 2 Mobile',
  'nominee 2 relation': 'Nominee 2 Relation',
  'nominee 2 %': 'Nominee 2 %',
  'nominee 2 pan': 'Nominee 2 PAN',
  'nominee 3 name': 'Nominee 3 Name',
  'nominee 3 mobile': 'Nominee 3 Mobile',
  'nominee 3 relation': 'Nominee 3 Relation',
  'nominee 3 %': 'Nominee 3 %',
  'nominee 3 pan': 'Nominee 3 PAN',
  'last re-edit date': 'Last Re-edit Date',
  'data entry by': 'Data Entry By',
};

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function formatMisDate(value) {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value).trim();
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = dt.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function displayYear(value) {
  const s = String(value || '').trim();
  return s && s !== '_' ? s : '';
}

function normalizeNomineeEntry(raw) {
  if (!raw || typeof raw !== 'object') {
    return { name: '', mobile: '', relation: '', percentage: '', pan: '' };
  }
  return {
    name: String(raw.name || '').trim(),
    mobile: String(raw.mobile || '').replace(/\D/g, '').slice(0, 10),
    relation: String(raw.relation || '').trim(),
    percentage: raw.percentage == null || raw.percentage === '' ? '' : raw.percentage,
    pan: String(raw.pan || '').trim().toUpperCase(),
  };
}

function activeNominees(nominees) {
  const list = Array.isArray(nominees) ? nominees.map(normalizeNomineeEntry) : [];
  return list.filter((n) => n.name || n.mobile || n.relation || n.pan || n.percentage !== '');
}

function nomineeAt(nominees, index) {
  const list = activeNominees(nominees);
  return list[index] || normalizeNomineeEntry(null);
}

function buildMisRowArray(shareholding, credential, srNo) {
  const sh = shareholding || {};
  const c = credential || {};
  const n0 = nomineeAt(sh.nominees, 0);
  const n1 = nomineeAt(sh.nominees, 1);
  const n2 = nomineeAt(sh.nominees, 2);
  const updated = formatMisDate(sh.updatedAt);
  const pledge = sh.pledge || '';
  const shareStatus = sh.shareStatus || '';

  return [
    srNo,
    sh.pan || '',
    updated,
    c.employeeName || '',
    c.empCode || '',
    c.department || '',
    c.designation || '',
    c.status || '',
    sh.name || '',
    sh.mobile || '',
    sh.email || '',
    sh.aadhaar || '',
    sh.address || '',
    sh.addressLine2 || '',
    sh.landmark || '',
    sh.area || '',
    sh.city || '',
    sh.state || '',
    sh.pincode || '',
    sh.country || '',
    sh.gender || '',
    sh.formSubmission || '',
    sh.holdingPercent ?? '',
    sh.shareType || '',
    sh.faceValue ?? '',
    sh.numberOfShares ?? '',
    sh.mode || '',
    sh.isinCode || '',
    sh.dp || '',
    sh.dpNumber || '',
    sh.beneficiaryDpId || '',
    sh.folioNumber || '',
    sh.certificateNumber || '',
    sh.distinctiveFrom || '',
    sh.distinctiveTo || '',
    sh.yearOfIssuance || '',
    sh.stakeholder || '',
    sh.dateOfAllotment || '',
    sh.remarks || '',
    pledge,
    shareStatus,
    sh.exitDate || '',
    displayYear(sh.year),
    sh.bankName || '',
    sh.ifscCode || '',
    sh.bankAccountNumber || '',
    sh.bankCity || '',
    sh.bankCountry || '',
    pledge,
    shareStatus,
    n0.name || '',
    n0.mobile || '',
    n0.relation || '',
    n0.percentage ?? '',
    n0.pan || '',
    n1.name || '',
    n1.mobile || '',
    n1.relation || '',
    n1.percentage ?? '',
    n1.pan || '',
    n2.name || '',
    n2.mobile || '',
    n2.relation || '',
    n2.percentage ?? '',
    n2.pan || '',
    updated,
    sh.dataEntryBy || '',
  ];
}

const MIS_ROW_KEYS = [
  'srNo',
  'pan',
  'updatedAt',
  'hrEmployeeName',
  'hrEmpCode',
  'hrDepartment',
  'hrDesignation',
  'hrStatus',
  'nameShareholding',
  'mobile',
  'email',
  'aadhaar',
  'address1',
  'address2',
  'landmark',
  'area',
  'city',
  'state',
  'pinCode',
  'country',
  'gender',
  'formSubmission',
  'holdingPercent',
  'shareType',
  'faceValue',
  'numberOfShares',
  'mode',
  'isinCode',
  'dp',
  'dpNumber',
  'beneficiaryDpId',
  'folioNumber',
  'certificateNo',
  'distinctiveFrom',
  'distinctiveTo',
  'yearOfIssuance',
  'stakeholder',
  'dateOfAllotment',
  'remarks',
  'pledge',
  'status',
  'exitDate',
  'year',
  'bankName',
  'ifscCode',
  'bankAccountNo',
  'bankCity',
  'bankCountry',
  'pledgeStatus',
  'status2',
  'nominee1Name',
  'nominee1Mobile',
  'nominee1Relation',
  'nominee1Percent',
  'nominee1Pan',
  'nominee2Name',
  'nominee2Mobile',
  'nominee2Relation',
  'nominee2Percent',
  'nominee2Pan',
  'nominee3Name',
  'nominee3Mobile',
  'nominee3Relation',
  'nominee3Percent',
  'nominee3Pan',
  'lastReeditDate',
  'dataEntryBy',
];

function buildMisRowObject(shareholding, credential, srNo) {
  const values = buildMisRowArray(shareholding, credential, srNo);
  const row = {};
  MIS_ROW_KEYS.forEach((key, index) => {
    row[key] = values[index];
  });
  return row;
}

function cleanStr(value) {
  if (value == null) return '';
  return String(value).trim();
}

function cleanDigits(value, maxLen) {
  return cleanStr(value).replace(/\D/g, '').slice(0, maxLen);
}

function isValidPan(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(cleanStr(pan));
}

function parseNomineesFromRow(rowMap) {
  const nominees = [];
  for (let i = 1; i <= 3; i += 1) {
    const name = cleanStr(rowMap[`Nominee ${i} Name`]);
    const mobile = cleanDigits(rowMap[`Nominee ${i} Mobile`], 10);
    const relation = cleanStr(rowMap[`Nominee ${i} Relation`]);
    const percentageRaw = cleanStr(rowMap[`Nominee ${i} %`]);
    const pan = cleanStr(rowMap[`Nominee ${i} PAN`]).toUpperCase();
    if (!name && !mobile && !relation && !percentageRaw && !pan) continue;
    nominees.push({
      name,
      mobile,
      relation,
      percentage: percentageRaw ? Number(percentageRaw) : undefined,
      pan,
    });
  }
  return nominees;
}

function misRowMapToPayload(rowMap) {
  const pan = cleanStr(rowMap.PAN).toUpperCase();
  return {
    pan,
    name: cleanStr(rowMap['Name (Shareholding)']),
    mobile: cleanDigits(rowMap.Mobile, 10),
    email: cleanStr(rowMap.Email),
    aadhaar: cleanDigits(rowMap.Aadhaar, 12),
    address: cleanStr(rowMap['Address 1']),
    addressLine2: cleanStr(rowMap['Address 2']),
    landmark: cleanStr(rowMap.Landmark),
    area: cleanStr(rowMap.Area),
    city: cleanStr(rowMap.City),
    state: cleanStr(rowMap.State),
    pincode: cleanDigits(rowMap['Pin Code'], 6),
    country: cleanStr(rowMap.Country),
    gender: cleanStr(rowMap.Gender),
    formSubmission: cleanStr(rowMap['Form Submission']),
    holdingPercent: cleanStr(rowMap['Holding %']) ? Number(rowMap['Holding %']) : undefined,
    shareType: cleanStr(rowMap['Share Type']),
    faceValue: cleanStr(rowMap['Face Value']) ? Number(rowMap['Face Value']) : undefined,
    numberOfShares: cleanStr(rowMap['No. of Shares']) ? Number(rowMap['No. of Shares']) : undefined,
    mode: cleanStr(rowMap.Mode),
    isinCode: cleanStr(rowMap['ISIN Code']),
    dp: cleanStr(rowMap.DP),
    dpNumber: cleanStr(rowMap['DP Number']),
    beneficiaryDpId: cleanStr(rowMap['Beneficiary DP ID']),
    folioNumber: cleanStr(rowMap['Folio Number']),
    certificateNumber: cleanStr(rowMap['Certificate No']),
    distinctiveFrom: cleanStr(rowMap['Distinctive From']),
    distinctiveTo: cleanStr(rowMap['Distinctive To']),
    yearOfIssuance: cleanStr(rowMap['Year of Issuance']),
    stakeholder: cleanStr(rowMap.Stakeholder),
    dateOfAllotment: cleanStr(rowMap['Date of Allotment']),
    remarks: cleanStr(rowMap.Remarks),
    pledge: cleanStr(rowMap['Pledge Status'] || rowMap.Pledge),
    shareStatus: cleanStr(rowMap.Status || rowMap.Status2),
    exitDate: cleanStr(rowMap['Exit Date']),
    year: cleanStr(rowMap.Year),
    bankName: cleanStr(rowMap['Bank Name']),
    ifscCode: cleanStr(rowMap['IFSC Code']),
    bankAccountNumber: cleanStr(rowMap['Bank Account No.']),
    bankCity: cleanStr(rowMap['Bank City']),
    bankCountry: cleanStr(rowMap['Bank Country']),
    dataEntryBy: cleanStr(rowMap['Data Entry By']),
    nominees: parseNomineesFromRow(rowMap),
  };
}

function validateMisPayload(payload, rowNumber) {
  const errors = [];
  const label = rowNumber != null ? `Row ${rowNumber}` : 'Row';
  if (!payload.pan) {
    errors.push(`${label}: PAN is required.`);
  } else if (!isValidPan(payload.pan)) {
    errors.push(`${label}: Invalid PAN format (${payload.pan}).`);
  }
  if (payload.mobile && payload.mobile.length !== 10) {
    errors.push(`${label}: Mobile must be 10 digits.`);
  }
  if (payload.aadhaar && payload.aadhaar.length !== 12) {
    errors.push(`${label}: Aadhaar must be 12 digits.`);
  }
  if (payload.pincode && payload.pincode.length !== 6) {
    errors.push(`${label}: Pin Code must be 6 digits.`);
  }
  (payload.nominees || []).forEach((n, idx) => {
    if (n.pan && !isValidPan(n.pan)) {
      errors.push(`${label}: Nominee ${idx + 1} PAN is invalid.`);
    }
    if (n.mobile && n.mobile.length !== 10) {
      errors.push(`${label}: Nominee ${idx + 1} mobile must be 10 digits.`);
    }
    if (n.percentage != null && (n.percentage < 0 || n.percentage > 100)) {
      errors.push(`${label}: Nominee ${idx + 1} % must be between 0 and 100.`);
    }
  });
  return errors;
}

function mapSheetRowToCanonical(headers, values) {
  const rowMap = {};
  const statusIndexes = [];
  headers.forEach((header, index) => {
    const raw = cleanStr(header);
    if (!raw) return;
    const normalized = normalizeHeader(raw);
    const canonical = HEADER_ALIASES[normalized] || HEADER_ALIASES[normalized.replace(/\./g, '')] || raw;
    if (canonical === 'Status') {
      statusIndexes.push(index);
      if (statusIndexes.length === 1) {
        rowMap.Status = cleanStr(values[index]);
      } else if (statusIndexes.length === 2) {
        rowMap.Status2 = cleanStr(values[index]);
      }
      return;
    }
    rowMap[canonical] = values[index];
  });
  if (!rowMap.Status && rowMap.Status2) {
    rowMap.Status = rowMap.Status2;
  }
  if (rowMap['Pledge Status'] && !rowMap.Pledge) {
    rowMap.Pledge = rowMap['Pledge Status'];
  }
  return rowMap;
}

function sheetRowsToPayloads(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const headerRow = rows[0].map((cell) => cleanStr(cell));
  const payloads = [];
  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i] || [];
    const hasData = values.some((cell) => cleanStr(cell));
    if (!hasData) continue;
    const rowMap = mapSheetRowToCanonical(headerRow, values);
    payloads.push({
      rowNumber: i + 1,
      rowMap,
      payload: misRowMapToPayload(rowMap),
    });
  }
  return payloads;
}

module.exports = {
  MIS_HEADERS,
  MIS_ROW_KEYS,
  buildMisRowArray,
  buildMisRowObject,
  misRowMapToPayload,
  validateMisPayload,
  sheetRowsToPayloads,
  formatMisDate,
};
