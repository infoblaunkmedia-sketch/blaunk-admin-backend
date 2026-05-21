const MediaSlotConfig = require('../models/MediaSlotConfig');

const ALLOWED_MEDIA_TABS = ['Slider', 'Explore', 'Trendy Star', 'Global Store', 'Exclusive', 'New Launch', 'GIFF', 'Tour Package'];
const DEFAULT_MAX = 8;

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

async function ensureDefaults() {
  const existing = new Set((await MediaSlotConfig.find().select('mediaTab').lean()).map((d) => d.mediaTab));
  const toInsert = ALLOWED_MEDIA_TABS.filter((t) => !existing.has(t)).map((mediaTab) => ({
    mediaTab,
    maxSlots: DEFAULT_MAX,
  }));
  if (toInsert.length) await MediaSlotConfig.insertMany(toInsert);
}

async function listConfigs() {
  await ensureDefaults();
  const rows = await MediaSlotConfig.find({}).sort({ mediaTab: 1 }).lean();
  const byTab = new Map(rows.map((r) => [r.mediaTab, r]));
  return ALLOWED_MEDIA_TABS.map((mediaTab) => {
    const row = byTab.get(mediaTab);
    return {
      mediaTab,
      maxSlots: row ? Number(row.maxSlots) || DEFAULT_MAX : DEFAULT_MAX,
      updatedAt: row?.updatedAt || null,
    };
  });
}

async function getMaxSlotsForTab(mediaTab) {
  const tab = cleanString(mediaTab);
  if (!tab) return DEFAULT_MAX;
  await ensureDefaults();
  const row = await MediaSlotConfig.findOne({ mediaTab: tab }).lean();
  if (row && Number(row.maxSlots) >= 1) return Math.min(500, Math.max(1, Number(row.maxSlots)));
  return DEFAULT_MAX;
}

async function saveConfigs(items) {
  if (!Array.isArray(items)) throw new Error('configs must be an array');
  const allowed = new Set(ALLOWED_MEDIA_TABS);
  for (const raw of items) {
    const mediaTab = cleanString(raw?.mediaTab);
    if (!allowed.has(mediaTab)) throw new Error(`Invalid mediaTab: ${mediaTab}`);
    const n = parseInt(String(raw?.maxSlots), 10);
    if (!Number.isFinite(n) || n < 1 || n > 500) throw new Error(`maxSlots must be 1–500 for ${mediaTab}`);
  }
  for (const raw of items) {
    const mediaTab = cleanString(raw.mediaTab);
    const maxSlots = parseInt(String(raw.maxSlots), 10);
    await MediaSlotConfig.findOneAndUpdate(
      { mediaTab },
      { $set: { maxSlots } },
      { upsert: true, new: true },
    );
  }
  return listConfigs();
}

module.exports = {
  listConfigs,
  getMaxSlotsForTab,
  saveConfigs,
  ALLOWED_MEDIA_TABS,
  DEFAULT_MAX,
};
