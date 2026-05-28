const Testimonial = require('../models/Testimonial');
const { OCCUPATIONS } = require('../models/Testimonial');

const DESCRIPTION_MAX = 70;

function toRecord(doc) {
  if (!doc) return null;
  const row = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(row._id),
    name: row.name,
    occupation: row.occupation,
    country: row.country,
    rating: row.rating,
    description: row.description,
    profilePhotoUrl: row.profilePhotoUrl || '',
    sortOrder: row.sortOrder ?? 0,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPublicRecord(doc) {
  const row = toRecord(doc);
  if (!row) return null;
  return {
    name: row.name,
    occupation: row.occupation,
    country: row.country,
    rating: row.rating,
    description: row.description,
    profilePhotoUrl: row.profilePhotoUrl,
    sortOrder: row.sortOrder,
  };
}

function normalizeCountry(raw) {
  const name = String(raw || '').trim();
  if (!name || name.length < 2) {
    throw new Error('Country is required.');
  }
  if (name.length > 80) {
    throw new Error('Country name is too long.');
  }
  return name;
}

function normalizeOccupation(raw) {
  const occ = String(raw || '')
    .trim()
    .toLowerCase();
  if (!OCCUPATIONS.includes(occ)) {
    throw new Error(`Occupation must be one of: ${OCCUPATIONS.join(', ')}`);
  }
  return occ;
}

function normalizeRating(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error('Rating must be an integer from 1 to 5.');
  }
  return n;
}

function normalizeDescription(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new Error('Description is required.');
  if (text.length > DESCRIPTION_MAX) {
    throw new Error(`Description must be ${DESCRIPTION_MAX} characters or fewer.`);
  }
  return text;
}

function validatePayload(body, { partial = false } = {}) {
  const input = body || {};
  const out = {};

  if (!partial || input.name != null) {
    const name = String(input.name ?? '').trim();
    if (!name) throw new Error('Name is required.');
    out.name = name;
  }

  if (!partial || input.occupation != null) {
    out.occupation = normalizeOccupation(input.occupation);
  }

  if (!partial || input.country != null) {
    out.country = normalizeCountry(input.country);
  }

  if (!partial || input.rating != null) {
    out.rating = normalizeRating(input.rating);
  }

  if (!partial || input.description != null) {
    out.description = normalizeDescription(input.description);
  }

  if (!partial || input.profilePhotoUrl != null) {
    out.profilePhotoUrl = String(input.profilePhotoUrl ?? '').trim();
  }

  if (!partial || input.sortOrder != null) {
    const sortOrder = Number(input.sortOrder);
    out.sortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
  }

  if (!partial || input.isActive != null) {
    out.isActive = Boolean(input.isActive);
  }

  return out;
}

async function listTestimonials() {
  const rows = await Testimonial.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
  return rows.map(toRecord);
}

async function listPublicTestimonials() {
  const rows = await Testimonial.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return rows.map(toPublicRecord).filter(Boolean);
}

async function getTestimonialById(id) {
  const row = await Testimonial.findById(id).lean();
  return toRecord(row);
}

async function createTestimonial(body) {
  const data = validatePayload(body);
  if (data.isActive == null) data.isActive = true;
  const doc = await Testimonial.create(data);
  return toRecord(doc);
}

async function updateTestimonial(id, body) {
  const data = validatePayload(body, { partial: true });
  const doc = await Testimonial.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  return toRecord(doc);
}

async function deleteTestimonial(id) {
  await Testimonial.findByIdAndDelete(id);
  return { deleted: true };
}

module.exports = {
  OCCUPATIONS,
  DESCRIPTION_MAX,
  listTestimonials,
  listPublicTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
