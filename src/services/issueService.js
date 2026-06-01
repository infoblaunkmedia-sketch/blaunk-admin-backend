const Issue = require('../models/Issue');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

async function nextRnNumber() {
  const count = await Issue.countDocuments();
  return `RN-${String(count + 1).padStart(6, '0')}`;
}

function toDto(doc) {
  if (!doc) return null;
  const resolvedDate = doc.resolvedAt
    ? new Date(doc.resolvedAt).toISOString().slice(0, 10)
    : '';
  return {
    id: String(doc._id),
    rnNumber: doc.rnNumber || '',
    customerName: doc.customerName || '',
    customerId: doc.customerId || '',
    article: doc.article || '',
    issueType: doc.issueType || '',
    vendorName: doc.vendorName || '',
    vendorResponse: doc.vendorResponse || '',
    penaltyAmount: Number(doc.penaltyAmount || 0),
    status: doc.status || 'Pending',
    country: doc.country || '',
    raisedDate: doc.raisedDate || (doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : ''),
    resolvedDate,
    email: doc.email || '',
    mobile: doc.mobile || '',
    description: doc.description || '',
  };
}

async function listIssues({ status, q, fromDate, toDate, limit = 500 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      query.createdAt = { $gte: from, $lte: to };
    }
  }
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { rnNumber: re },
      { customerName: re },
      { customerId: re },
      { issueType: re },
      { vendorName: re },
    ];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 2000);
  const rows = await Issue.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();
  return rows.map(toDto);
}

async function getIssueById(id) {
  const row = await Issue.findById(id).lean();
  return toDto(row);
}

async function saveIssue(payload) {
  const body = payload || {};
  const status = cleanString(body.status) || 'Pending';
  const set = {
    customerId: cleanString(body.customerId),
    customerName: cleanString(body.customerName),
    email: cleanString(body.email),
    mobile: cleanString(body.mobile),
    article: cleanString(body.article),
    issueType: cleanString(body.issueType),
    description: cleanString(body.description || body.article),
    vendorName: cleanString(body.vendorName),
    vendorResponse: cleanString(body.vendorResponse),
    penaltyAmount: Number(body.penaltyAmount || 0),
    status,
    country: cleanString(body.country),
    raisedDate: cleanString(body.raisedDate) || new Date().toISOString().slice(0, 10),
    resolvedAt:
      status === 'Resolved' || status === 'Closed'
        ? body.resolvedAt
          ? new Date(body.resolvedAt)
          : new Date()
        : null,
  };

  let doc;
  const id = cleanString(body.id);
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  if (isObjectId) {
    doc = await Issue.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).lean();
    if (!doc) throw new Error('Issue not found.');
  } else {
    doc = (
      await Issue.create({
        ...set,
        rnNumber: cleanString(body.rnNumber) || (await nextRnNumber()),
      })
    ).toObject();
  }
  return toDto(doc);
}

async function patchIssueStatus(id, status) {
  const next = cleanString(status);
  if (!next) throw new Error('status is required.');
  const patch = {
    status: next,
    resolvedAt: next === 'Resolved' || next === 'Closed' ? new Date() : null,
  };
  const doc = await Issue.findByIdAndUpdate(id, { $set: patch }, { returnDocument: 'after' }).lean();
  if (!doc) return null;
  return toDto(doc);
}

async function deleteIssueById(id) {
  const res = await Issue.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

module.exports = {
  listIssues,
  getIssueById,
  saveIssue,
  patchIssueStatus,
  deleteIssueById,
};
