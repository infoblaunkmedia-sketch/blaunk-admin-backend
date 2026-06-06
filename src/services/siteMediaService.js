const SiteMediaAsset = require('../models/SiteMediaAsset');

const SOCIAL_MEDIA_SLOT_TITLES = {
  1: 'Instagram',
  2: 'Youtube',
  3: 'Facebook',
};

function socialMediaTitleForSlot(slot) {
  return SOCIAL_MEDIA_SLOT_TITLES[slot] || '';
}

const VALID_SECTIONS = new Set([
  'contact-us',
  'social-media',
  'become-a-seller',
  'contest',
  'refer-earn',
  'career',
  'home-page-slider',
  'gif-poster',
  'bgt-export-poster',
  'boutique-ellite11',
  'boutique-disclaimer',
  'testimonials',
]);

const SECTION_SLOT_LIMITS = {
  'contact-us': 10,
  'social-media': 13,
  'become-a-seller': 14,
  contest: 2,
  'refer-earn': 2,
  career: 3,
  'home-page-slider': 5,
  'gif-poster': 20,
  'bgt-export-poster': 3,
  'boutique-ellite11': 20,
  'boutique-disclaimer': 1,
  testimonials: 50,
};

const TESTIMONIAL_OCCUPATIONS = new Set([
  'owner',
  'manager',
  'founder',
  'retailer',
  'trader',
  'exporter',
  'wholesaler',
  'director',
]);

function slotsFromOneTo(max) {
  return Array.from({ length: max }, (_, i) => i + 1);
}

function normalizeSection(section) {
  return String(section || '').trim().toLowerCase();
}

function normalizeSlot(slot) {
  const n = Number(slot);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

function assertSlot(section, slot) {
  const sec = normalizeSection(section);
  if (!VALID_SECTIONS.has(sec)) {
    throw new Error('Invalid media section.');
  }
  const max = SECTION_SLOT_LIMITS[sec];
  if (!slot || slot > max) {
    throw new Error(`Slot must be between 1 and ${max} for this section.`);
  }
  return sec;
}

function resolveTitle(row) {
  const sec = normalizeSection(row.section);
  const slot = Number(row.slot);
  if (sec === 'social-media') {
    return String(row.title || '').trim() || socialMediaTitleForSlot(slot);
  }
  if (sec === 'boutique-ellite11' || sec === 'gif-poster') {
    return String(row.title || '').trim();
  }
  return String(row.title || '').trim();
}

function toRecord(doc) {
  if (!doc) return null;
  const row = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const title = resolveTitle(row);
  return {
    id: String(row._id),
    section: row.section,
    slot: row.slot,
    kind: row.kind,
    value: row.value || '',
    fileName: row.fileName || '',
    ...(title ? { title } : {}),
    ...(row.metadata != null ? { metadata: row.metadata } : {}),
    updatedAt: row.updatedAt,
  };
}

function toPublicRecord(doc) {
  const row = toRecord(doc);
  if (!row || !String(row.value || '').trim()) return null;
  const out = {
    section: row.section,
    slot: row.slot,
    kind: row.kind,
    value: row.value,
  };
  if (row.title) out.title = row.title;
  if (row.metadata != null) out.metadata = row.metadata;
  return out;
}

function normalizeTestimonialMetadata(raw) {
  const meta = raw && typeof raw === 'object' ? raw : {};
  const name = String(meta.name || '').trim();
  const occupation = String(meta.occupation || '').trim().toLowerCase();
  const country = String(meta.country || '').trim().toLowerCase();
  const rating = Number(meta.rating);
  const description = String(meta.description || '').trim();
  const sortOrder = Number(meta.sortOrder);
  const isActive = meta.isActive == null ? true : Boolean(meta.isActive);

  if (!name) throw new Error('Testimonial name is required.');
  if (!TESTIMONIAL_OCCUPATIONS.has(occupation)) {
    throw new Error('Invalid testimonial occupation.');
  }
  if (!/^[a-z]{2}$/.test(country)) {
    throw new Error('Testimonial country must be a 2-letter ISO code.');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Testimonial rating must be an integer from 1 to 5.');
  }
  if (!description) throw new Error('Testimonial description is required.');
  if (description.length > 70) {
    throw new Error('Testimonial description must be 70 characters or fewer.');
  }

  return {
    name,
    occupation,
    country,
    rating,
    description,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    isActive,
  };
}

function groupBySection(records) {
  const bySection = {};
  for (const row of records) {
    if (!bySection[row.section]) bySection[row.section] = [];
    const item = {
      slot: row.slot,
      kind: row.kind,
      value: row.value,
    };
    if (row.title) item.title = row.title;
    if (row.metadata != null) item.metadata = row.metadata;
    bySection[row.section].push(item);
  }
  for (const key of Object.keys(bySection)) {
    bySection[key].sort((a, b) => a.slot - b.slot);
  }
  return bySection;
}

/** Pick image items for fixed slot groups (skips empty slots — no “first N” guessing). */
function pickImageSlots(items, slots) {
  return slots
    .map((slot) => items.find((i) => i.slot === slot && i.kind === 'image' && i.value))
    .filter(Boolean)
    .map((i) => ({
      slot: i.slot,
      value: i.value,
      ...(i.title ? { title: i.title } : {}),
    }));
}

/** Pick image items in a slot range (for expandable admin groups). */
function pickImageSlotsInRange(items, startSlot, endSlot) {
  return items
    .filter(
      (i) =>
        i.slot >= startSlot
        && i.slot <= endSlot
        && i.kind === 'image'
        && i.value,
    )
    .sort((a, b) => a.slot - b.slot)
    .map((i) => ({
      slot: i.slot,
      value: i.value,
      ...(i.title ? { title: i.title } : {}),
    }));
}

/** Pick URL items for fixed slot groups (social links). */
function pickUrlSlots(items, slots) {
  return slots
    .map((slot) => items.find((i) => i.slot === slot && i.kind === 'url' && i.value))
    .filter(Boolean)
    .map((i) => ({
      slot: i.slot,
      value: i.value,
      ...(i.title ? { title: i.title } : {}),
    }));
}

/**
 * Frontend-friendly layout per section (named groups, not flat slot order).
 * Admin can upload 2 hero + 2 bottom — each group only includes its slot range.
 */
function buildSectionLayout(bySection) {
  const layout = {};

  const become = bySection['become-a-seller'];
  if (become) {
    layout['become-a-seller'] = {
      heroImage: pickImageSlots(become, [1])[0]?.value || '',
      heroSlider: pickImageSlots(become, [2, 3, 4]),
      bottomSlider: pickImageSlotsInRange(become, 5, SECTION_SLOT_LIMITS['become-a-seller']),
    };
  }

  const career = bySection.career;
  if (career) {
    layout.career = {
      topBanner: pickImageSlots(career, [1]),
      slider: pickImageSlots(career, [2, 3]),
    };
  }

  const social = bySection['social-media'];
  if (social) {
    layout['social-media'] = {
      links: pickUrlSlots(social, [1, 2, 3]),
      banners: pickImageSlotsInRange(social, 4, SECTION_SLOT_LIMITS['social-media']),
    };
  }

  const contact = bySection['contact-us'];
  if (contact) {
    layout['contact-us'] = {
      banners: pickImageSlots(contact, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    };
  }

  const contest = bySection.contest;
  if (contest) {
    layout.contest = { slider: pickImageSlots(contest, [1, 2]) };
  }

  const refer = bySection['refer-earn'];
  if (refer) {
    layout['refer-earn'] = { slider: pickImageSlots(refer, [1, 2]) };
  }

  const home = bySection['home-page-slider'];
  if (home) {
    layout['home-page-slider'] = { slider: pickImageSlots(home, [1, 2, 3, 4, 5]) };
  }

  const gif = bySection['gif-poster'];
  if (gif) {
    layout['gif-poster'] = {
      cards: pickImageSlots(gif, slotsFromOneTo(SECTION_SLOT_LIMITS['gif-poster'])),
    };
  }

  const bgt = bySection['bgt-export-poster'];
  if (bgt) {
    layout['bgt-export-poster'] = { posters: pickImageSlots(bgt, [1, 2, 3]) };
  }

  const boutique = bySection['boutique-ellite11'];
  if (boutique) {
    layout['boutique-ellite11'] = {
      images: pickImageSlots(boutique, slotsFromOneTo(SECTION_SLOT_LIMITS['boutique-ellite11'])),
    };
  }

  const disclaimer = bySection['boutique-disclaimer'];
  if (disclaimer) {
    layout['boutique-disclaimer'] = { banner: pickImageSlots(disclaimer, [1]) };
  }

  const testimonials = bySection.testimonials;
  if (testimonials) {
    layout.testimonials = {
      records: testimonials
        .filter((i) => i.kind === 'image' && i.value)
        .map((i) => ({
          slot: i.slot,
          value: i.value,
          ...(i.title ? { title: i.title } : {}),
          ...(i.metadata ? { metadata: i.metadata } : {}),
        })),
    };
  }

  return layout;
}

async function listAssets({ section } = {}) {
  const filter = {};
  const sec = normalizeSection(section);
  if (sec) {
    if (!VALID_SECTIONS.has(sec)) throw new Error('Invalid media section.');
    filter.section = sec;
  }
  const rows = await SiteMediaAsset.find(filter).sort({ section: 1, slot: 1 }).lean();
  return rows
    .filter((row) => {
      if (normalizeSection(row.section) !== 'social-media') return true;
      return Number(row.slot) <= SECTION_SLOT_LIMITS['social-media'];
    })
    .map(toRecord)
    .sort((a, b) => {
      if (a.section === 'testimonials' && b.section === 'testimonials') {
        const ao = Number(a?.metadata?.sortOrder ?? 0);
        const bo = Number(b?.metadata?.sortOrder ?? 0);
        if (ao !== bo) return ao - bo;
      }
      if (a.section === b.section) return a.slot - b.slot;
      return String(a.section).localeCompare(String(b.section));
    });
}

/** Public website: only slots with a non-empty value. */
async function listPublicAssets({ section } = {}) {
  const filter = { value: { $exists: true, $nin: ['', null] } };
  const sec = normalizeSection(section);
  if (sec) {
    if (!VALID_SECTIONS.has(sec)) throw new Error('Invalid media section.');
    filter.section = sec;
  }
  const rows = await SiteMediaAsset.find(filter).sort({ section: 1, slot: 1 }).lean();
  return rows
    .filter((row) => {
      const secName = normalizeSection(row.section);
      if (secName === 'social-media') {
        return Number(row.slot) <= SECTION_SLOT_LIMITS['social-media'];
      }
      if (secName === 'testimonials') {
        return row?.metadata?.isActive !== false;
      }
      return true;
    })
    .map(toPublicRecord)
    .filter(Boolean)
    .sort((a, b) => {
      if (a.section === 'testimonials' && b.section === 'testimonials') {
        const ao = Number(a?.metadata?.sortOrder ?? 0);
        const bo = Number(b?.metadata?.sortOrder ?? 0);
        if (ao !== bo) return ao - bo;
      }
      if (a.section === b.section) return a.slot - b.slot;
      return String(a.section).localeCompare(String(b.section));
    });
}

async function upsertSlot({ section, slot, kind, value, fileName, title, metadata }) {
  const slotNum = normalizeSlot(slot);
  if (!slotNum) throw new Error('Invalid slot number.');
  const sec = assertSlot(section, slotNum);

  const kindNorm = kind === 'url' ? 'url' : 'image';
  const valueStr = String(value || '').trim();

  if (kindNorm === 'url' && valueStr && !/^https?:\/\//i.test(valueStr)) {
    throw new Error('URL must start with http:// or https://');
  }

  const setFields = {
    kind: kindNorm,
    value: valueStr,
    fileName: String(fileName || '').trim(),
  };
  if (sec === 'social-media') {
    setFields.title = socialMediaTitleForSlot(slotNum);
  } else if (sec === 'boutique-ellite11' || sec === 'gif-poster') {
    setFields.title = String(title || '').trim();
  } else if (sec === 'testimonials') {
    setFields.title = String(title || '').trim();
    setFields.metadata = normalizeTestimonialMetadata(metadata);
  } else if (title != null) {
    setFields.title = String(title || '').trim();
  }

  const doc = await SiteMediaAsset.findOneAndUpdate(
    { section: sec, slot: slotNum },
    {
      $set: setFields,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  return toRecord(doc);
}

async function clearSlot({ section, slot }) {
  const slotNum = normalizeSlot(slot);
  if (!slotNum) throw new Error('Invalid slot number.');
  const sec = assertSlot(section, slotNum);
  await SiteMediaAsset.deleteOne({ section: sec, slot: slotNum });
  return { deleted: true };
}

module.exports = {
  VALID_SECTIONS,
  SECTION_SLOT_LIMITS,
  listAssets,
  listPublicAssets,
  groupBySection,
  buildSectionLayout,
  upsertSlot,
  clearSlot,
};
