const Vacancy = require('../models/Vacancy');
const VacancyConfig = require('../models/VacancyConfig');

const DEFAULT_APPLY_EMAIL = 'careers@blaunk.com';

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

async function nextVacancyId() {
  const rows = await Vacancy.find({ vacancyId: /^VAC-/i }, { vacancyId: 1 }).lean();
  let max = 0;
  for (const row of rows) {
    const match = String(row.vacancyId || '').match(/VAC-(\d+)/i);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `VAC-${String(max + 1).padStart(5, '0')}`;
}

function formatPackageLpa(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  if (/lpa/i.test(raw)) return raw;
  if (/^\d+(\.\d+)?$/.test(raw)) return `${raw} LPA`;
  return raw;
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    jobTitle: doc.jobTitle || '',
    requiredExperience: doc.requiredExperience || '',
    location: doc.location || '',
    packageLpa: doc.packageLpa || '',
    qualification: doc.qualification || '',
    applyEmail: doc.applyEmail || 'careers@blaunk.com',
    numberOfOpenings: Number(doc.numberOfOpenings || 0),
    status: doc.status || 'Open',
    vacancyId: doc.vacancyId || '',
    // legacy fields kept for older records / reports
    department: doc.department || '',
    description: doc.description || '',
    postedDate: doc.postedDate || '',
    type: doc.type || 'Full Time',
    closingDate: doc.closingDate || '',
  };
}

async function getVacancyApplyEmail() {
  const doc = await VacancyConfig.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default', applyEmail: DEFAULT_APPLY_EMAIL } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return cleanString(doc?.applyEmail) || DEFAULT_APPLY_EMAIL;
}

async function setVacancyApplyEmail(emailInput) {
  const applyEmail = cleanString(emailInput);
  if (!applyEmail) throw new Error('Apply email is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyEmail)) {
    throw new Error('Apply email must be a valid email address.');
  }
  const doc = await VacancyConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: { applyEmail }, $setOnInsert: { key: 'default' } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return cleanString(doc?.applyEmail) || DEFAULT_APPLY_EMAIL;
}

async function listVacancies({ department, status, q, limit = 500, publicOnly = false } = {}) {
  const query = {};
  if (publicOnly) {
    query.status = 'Open';
  } else if (status) {
    query.status = status;
  }
  if (department) query.department = department;
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { jobTitle: re },
      { location: re },
      { requiredExperience: re },
      { packageLpa: re },
      { qualification: re },
    ];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 2000);
  const rows = await Vacancy.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();
  const applyEmail = await getVacancyApplyEmail();
  return rows.map((doc) => ({ ...toDto(doc), applyEmail })).filter(Boolean);
}

async function listPublicVacancies() {
  return listVacancies({ publicOnly: true, limit: 200 });
}

async function getVacancyById(id) {
  return toDto(await Vacancy.findById(id).lean());
}

async function saveVacancy(payload) {
  const body = payload || {};
  if (!cleanString(body.jobTitle)) throw new Error('Role title is required.');
  if (!cleanString(body.requiredExperience)) throw new Error('Experience is required.');
  if (!cleanString(body.location)) throw new Error('Location is required.');
  if (!cleanString(body.packageLpa)) throw new Error('Package LPA is required.');
  if (!cleanString(body.qualification)) throw new Error('Qualification is required.');

  const openings = Number(body.numberOfOpenings);
  if (!Number.isFinite(openings) || openings < 1) {
    throw new Error('Vacancies must be at least 1.');
  }

  const applyEmail = cleanString(body.applyEmail) || 'careers@blaunk.com';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyEmail)) {
    throw new Error('Apply email must be a valid email address.');
  }

  const set = {
    jobTitle: cleanString(body.jobTitle),
    requiredExperience: cleanString(body.requiredExperience),
    location: cleanString(body.location),
    packageLpa: formatPackageLpa(body.packageLpa),
    qualification: cleanString(body.qualification),
    applyEmail,
    numberOfOpenings: openings,
    status: 'Open',
    postedDate: new Date().toISOString().slice(0, 10),
  };

  let doc;
  const id = cleanString(body.id);
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  if (isObjectId) {
    doc = await Vacancy.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).lean();
    if (!doc) throw new Error('Vacancy not found.');
  } else {
    try {
      doc = (
        await Vacancy.create({
          ...set,
          vacancyId: await nextVacancyId(),
        })
      ).toObject();
    } catch (err) {
      if (err?.code === 11000) {
        throw new Error('Could not create vacancy (duplicate reference). Please try again.');
      }
      throw err;
    }
  }
  return toDto(doc);
}

async function deleteVacancyById(id) {
  const cleanId = cleanString(id);
  if (!/^[a-f\d]{24}$/i.test(cleanId)) {
    throw new Error('Invalid vacancy id.');
  }
  const res = await Vacancy.findByIdAndDelete(cleanId);
  return res ? 1 : 0;
}

module.exports = {
  getVacancyApplyEmail,
  setVacancyApplyEmail,
  listVacancies,
  listPublicVacancies,
  getVacancyById,
  saveVacancy,
  deleteVacancyById,
};
