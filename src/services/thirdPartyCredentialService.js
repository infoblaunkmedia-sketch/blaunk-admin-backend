const ThirdPartyCredential = require('../models/ThirdPartyCredential');
const employeeService = require('./employeeService');
const dsaService = require('./dsaService');
const matchCodeService = require('./matchCodeService');

function cleanStr(v) {
  return v == null ? '' : String(v);
}

function cleanRefs(refs) {
  if (!Array.isArray(refs)) return [];
  return refs.slice(0, 5).map((r) => ({
    name: cleanStr(r?.name),
    mobile: cleanStr(r?.mobile),
    designation: cleanStr(r?.designation),
    city: cleanStr(r?.city),
  }));
}

async function listThirdPartyCredentials({ q, limit = 200 } = {}) {
  const query = {};
  if (q && String(q).trim()) {
    const needle = String(q).trim();
    query.$or = [
      { department: { $regex: needle, $options: 'i' } },
      { name: { $regex: needle, $options: 'i' } },
      { threePEmplCode: { $regex: needle, $options: 'i' } },
      { matchCode: { $regex: needle, $options: 'i' } },
      { mobileNo: { $regex: needle, $options: 'i' } },
      { email: { $regex: needle, $options: 'i' } },
      { username: { $regex: needle, $options: 'i' } },
      { url: { $regex: needle, $options: 'i' } },
      { notes: { $regex: needle, $options: 'i' } },
    ];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  const list = await ThirdPartyCredential.find(query)
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .lean();
  return list || [];
}

async function getThirdPartyCredentialById(id) {
  const record = await ThirdPartyCredential.findById(id).lean();
  return record;
}

async function upsertThirdPartyCredential(payload) {
  const body = payload || {};
  if (!body.name || !String(body.name).trim()) throw new Error('Name is required');

  let generatedOrResolved3pCode = cleanStr(body.threePEmplCode).trim().toUpperCase();
  if (body.id) {
    const existing = await ThirdPartyCredential.findById(body.id).select('threePEmplCode').lean();
    if (existing?.threePEmplCode) {
      generatedOrResolved3pCode = String(existing.threePEmplCode).trim().toUpperCase();
    } else if (!generatedOrResolved3pCode) {
      generatedOrResolved3pCode = await employeeService.getNextEmployeeCode('3pc');
    }
  } else {
    generatedOrResolved3pCode = await employeeService.getNextEmployeeCode('3pc');
  }

  const matchCode = await matchCodeService.resolveActiveMatchCodeFor3p();

  const set = {
    department: cleanStr(body.department),
    name: cleanStr(body.name),
    aadharNo: cleanStr(body.aadharNo),
    mobileNo: cleanStr(body.mobileNo),
    email: cleanStr(body.email),
    panNo: cleanStr(body.panNo),
    tanNo: cleanStr(body.tanNo),
    passportNo: cleanStr(body.passportNo),
    gender: cleanStr(body.gender),
    address1: cleanStr(body.address1),
    address2: cleanStr(body.address2),
    city: cleanStr(body.city),
    zip: cleanStr(body.zip),
    country: cleanStr(body.country),
    state: cleanStr(body.state),
    threePCompanyName: cleanStr(body.threePCompanyName),
    threePEmplCode: generatedOrResolved3pCode,
    matchCode,
    threePEntity: cleanStr(body.threePEntity),
    businessCode: cleanStr(body.businessCode),
    branchCode: cleanStr(body.branchCode),
    gstTaxNo: cleanStr(body.gstTaxNo),
    bankName: cleanStr(body.bankName),
    ifscCode: cleanStr(body.ifscCode),
    bankAccountNumber: cleanStr(body.bankAccountNumber),
    bankCity: cleanStr(body.bankCity),
    bankCountry: cleanStr(body.bankCountry),
    swiftNo: cleanStr(body.swiftNo),
    ibanNo: cleanStr(body.ibanNo),
    doj: cleanStr(body.doj),
    ira: cleanStr(body.ira),
    remarks: cleanStr(body.remarks),
    status: cleanStr(body.status),
    exitDate: cleanStr(body.exitDate),
    verifiedStatus: cleanStr(body.verifiedStatus),
    businessDeposit: cleanStr(body.businessDeposit),
    sharingThreeP: cleanStr(body.sharingThreeP),
    sharingBlaunk: cleanStr(body.sharingBlaunk),
    references: cleanRefs(body.references),
    employeePhotoUrl: cleanStr(body.employeePhotoUrl),
    chqImageUrl: cleanStr(body.chqImageUrl),
    panImageUrl: cleanStr(body.panImageUrl),

    // legacy
    username: cleanStr(body.username),
    password: cleanStr(body.password),
    url: cleanStr(body.url),
    notes: cleanStr(body.notes),
  };

  let record;
  if (body.id) {
    record = await ThirdPartyCredential.findOneAndUpdate(
      { _id: body.id },
      {
        $set: set,
      },
      { returnDocument: 'after' },
    ).lean();
  } else {
    const created = await ThirdPartyCredential.create({
      ...set,
    });
    record = created.toObject();
  }

  if (record?.threePEmplCode) {
    await dsaService.ensureAdminDsa({
      dsaCode: record.threePEmplCode,
      name: record.name,
      companyName: record.threePCompanyName,
      mobile: record.mobileNo,
      email: record.email,
      country: record.country,
      status: record.status,
    });
  }

  return record;
}

async function deleteThirdPartyCredentialById(id) {
  const res = await ThirdPartyCredential.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

module.exports = {
  listThirdPartyCredentials,
  getThirdPartyCredentialById,
  upsertThirdPartyCredential,
  deleteThirdPartyCredentialById,
};

