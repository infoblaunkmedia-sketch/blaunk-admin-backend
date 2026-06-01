const Vacancy = require('../models/Vacancy');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

async function nextVacancyId() {
  const count = await Vacancy.countDocuments();
  return `VAC-${String(count + 1).padStart(5, '0')}`;
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    jobTitle: doc.jobTitle || '',
    department: doc.department || '',
    numberOfOpenings: Number(doc.numberOfOpenings || 0),
    description: doc.description || '',
    requiredExperience: doc.requiredExperience || '',
    location: doc.location || '',
    postedDate: doc.postedDate || '',
    status: doc.status || 'Open',
    type: doc.type || 'Full Time',
    closingDate: doc.closingDate || '',
    vacancyId: doc.vacancyId || '',
  };
}

async function listVacancies({ department, status, q, limit = 500 } = {}) {
  const query = {};
  if (department) query.department = department;
  if (status) query.status = status;
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ jobTitle: re }, { department: re }, { location: re }];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 2000);
  const rows = await Vacancy.find(query).sort({ postedDate: -1, createdAt: -1 }).limit(safeLimit).lean();
  return rows.map(toDto);
}

async function getVacancyById(id) {
  return toDto(await Vacancy.findById(id).lean());
}

async function saveVacancy(payload) {
  const body = payload || {};
  if (!body.jobTitle) throw new Error('jobTitle is required.');

  const set = {
    jobTitle: cleanString(body.jobTitle),
    department: cleanString(body.department),
    location: cleanString(body.location),
    type: cleanString(body.type) || 'Full Time',
    description: cleanString(body.description),
    requiredExperience: cleanString(body.requiredExperience),
    numberOfOpenings: Number(body.numberOfOpenings || 1),
    status: cleanString(body.status) || 'Open',
    postedDate: cleanString(body.postedDate) || new Date().toISOString().slice(0, 10),
    closingDate: cleanString(body.closingDate),
  };

  let doc;
  const id = cleanString(body.id);
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  if (isObjectId) {
    doc = await Vacancy.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).lean();
    if (!doc) throw new Error('Vacancy not found.');
  } else {
    doc = (
      await Vacancy.create({
        ...set,
        vacancyId: await nextVacancyId(),
      })
    ).toObject();
  }
  return toDto(doc);
}

async function deleteVacancyById(id) {
  const res = await Vacancy.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

module.exports = {
  listVacancies,
  getVacancyById,
  saveVacancy,
  deleteVacancyById,
};
