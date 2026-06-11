const MacAddressConfig = require('../models/MacAddressConfig');

function rowFromDoc(doc) {
  return {
    id: doc._id.toString(),
    serviceProvider: doc.serviceProvider || '',
    macAddress: doc.macAddress || doc.uniqueCode || '',
  };
}

function itRowFromDoc(doc) {
  return {
    id: doc._id.toString(),
    macAddress: doc.macAddress || doc.uniqueCode || '',
    computerBrand: doc.computerBrand || '',
    systemType: doc.systemType || '',
    linkedType: doc.linkedType || '',
    linkedCode: doc.linkedCode || '',
    linkedName: doc.linkedName || '',
    status: doc.status || 'Active',
    approvedBy: doc.approvedBy || '',
    addedBy: doc.addedBy || '',
    createdAt: doc.createdAt,
  };
}

function isSecurityPoolRow(doc) {
  return doc.forRights !== true && doc.forItManagement !== true;
}

function isItManagementRow(doc) {
  return doc.forItManagement === true && doc.forRights !== true;
}

async function getAll() {
  const list = await MacAddressConfig.find({}).sort({ createdAt: 1 }).lean();
  return (list || []).filter(isSecurityPoolRow).map(rowFromDoc);
}

async function getMacForRightsSubject(type, employeeCode) {
  const t = type === '3pc' ? '3pc' : 'employee';
  const code = String(employeeCode || '').trim();
  if (!code) return '';
  const doc = await MacAddressConfig.findOne({
    forRights: true,
    rightsType: t,
    rightsEmployeeCode: code,
  }).lean();
  return doc?.macAddress || doc?.uniqueCode || '';
}

async function upsertMacForRightsSubject(type, employeeCode, macAddress) {
  const t = type === '3pc' ? '3pc' : 'employee';
  const code = String(employeeCode || '').trim();
  if (!code) return;
  const mac = macAddress != null ? String(macAddress).trim() : '';
  if (!mac) {
    await MacAddressConfig.deleteOne({
      forRights: true,
      rightsType: t,
      rightsEmployeeCode: code,
    });
    return;
  }
  await MacAddressConfig.findOneAndUpdate(
    { forRights: true, rightsType: t, rightsEmployeeCode: code },
    {
      $set: {
        forRights: true,
        rightsType: t,
        rightsEmployeeCode: code,
        macAddress: mac,
        serviceProvider: `Rights:${t}:${code}`,
      },
      $unset: { uniqueCode: '' },
    },
    { upsert: true, runValidators: true },
  );
}

async function createOne(serviceProvider, macAddress) {
  const doc = await MacAddressConfig.create({
    serviceProvider: serviceProvider != null ? String(serviceProvider).trim() : '',
    macAddress: macAddress != null ? String(macAddress).trim() : '',
  });
  return rowFromDoc(doc.toObject());
}

async function deleteById(id) {
  const result = await MacAddressConfig.findByIdAndDelete(id);
  return !!result;
}

async function saveAll(rows) {
  if (!Array.isArray(rows)) return getAll();
  const ids = rows.filter((r) => r.id).map((r) => r.id);
  const existing = await MacAddressConfig.find({ _id: { $in: ids } }).lean();
  const existingIds = new Set(existing.map((e) => e._id.toString()));
  for (const row of rows) {
    if (row.id && existingIds.has(row.id)) {
      await MacAddressConfig.findByIdAndUpdate(row.id, {
        $set: {
          serviceProvider: row.serviceProvider != null ? String(row.serviceProvider).trim() : '',
          macAddress: row.macAddress != null ? String(row.macAddress).trim() : '',
        },
        $unset: { uniqueCode: '' },
      });
    } else if (!row.id) {
      await createOne(row.serviceProvider, row.macAddress);
    }
  }
  return getAll();
}

async function getItDevices({ linkedType, linkedCode } = {}) {
  const query = { forItManagement: true, forRights: { $ne: true } };
  if (linkedType) query.linkedType = String(linkedType).trim();
  if (linkedCode) query.linkedCode = String(linkedCode).trim();
  const list = await MacAddressConfig.find(query).sort({ createdAt: -1 }).lean();
  return (list || []).filter(isItManagementRow).map(itRowFromDoc);
}

async function createItDevice(payload) {
  const body = payload || {};
  const mac = body.macAddress != null ? String(body.macAddress).trim() : '';
  if (!mac) {
    const err = new Error('MAC address is required.');
    err.statusCode = 400;
    throw err;
  }
  const linkedType = body.linkedType === '3pc' ? '3pc' : 'employee';
  const linkedCode = String(body.linkedCode || '').trim();
  if (!linkedCode) {
    const err = new Error('Employee / 3P code is required.');
    err.statusCode = 400;
    throw err;
  }
  const doc = await MacAddressConfig.create({
    forItManagement: true,
    serviceProvider: `IT:${linkedType}:${linkedCode}`,
    macAddress: mac,
    linkedType,
    linkedCode,
    linkedName: body.linkedName != null ? String(body.linkedName).trim() : '',
    computerBrand: body.computerBrand != null ? String(body.computerBrand).trim() : '',
    systemType: body.systemType != null ? String(body.systemType).trim() : '',
    status: body.status === 'Inactive' ? 'Inactive' : 'Active',
    approvedBy: body.approvedBy != null ? String(body.approvedBy).trim() : '',
    addedBy: body.addedBy != null ? String(body.addedBy).trim() : '',
  });
  return itRowFromDoc(doc.toObject());
}

async function updateItDevice(id, patch) {
  const existing = await MacAddressConfig.findById(id).lean();
  if (!existing || !isItManagementRow(existing)) return null;
  const $set = {};
  if (patch.macAddress !== undefined) $set.macAddress = String(patch.macAddress).trim();
  if (patch.computerBrand !== undefined) $set.computerBrand = String(patch.computerBrand).trim();
  if (patch.systemType !== undefined) $set.systemType = String(patch.systemType).trim();
  if (patch.status !== undefined) $set.status = patch.status === 'Inactive' ? 'Inactive' : 'Active';
  if (patch.approvedBy !== undefined) $set.approvedBy = String(patch.approvedBy).trim();
  const doc = await MacAddressConfig.findByIdAndUpdate(id, { $set }, { new: true }).lean();
  return doc ? itRowFromDoc(doc) : null;
}

async function deleteItDevice(id) {
  const existing = await MacAddressConfig.findById(id).lean();
  if (!existing || !isItManagementRow(existing)) return false;
  const result = await MacAddressConfig.findByIdAndDelete(id);
  return !!result;
}

module.exports = {
  getAll,
  createOne,
  deleteById,
  saveAll,
  getMacForRightsSubject,
  upsertMacForRightsSubject,
  getItDevices,
  createItDevice,
  updateItDevice,
  deleteItDevice,
};
