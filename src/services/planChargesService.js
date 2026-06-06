const PlanCharges = require('../models/PlanCharges');

const DEFAULT_PLANS = [
  { planName: 'Bronze', durationMonths: 3, subscriptionFee: 300, renewalFee: 300, maxMRP: 300, offer: 'TRY FREE FOR 7 DAYS' },
  { planName: 'Silver', durationMonths: 6, subscriptionFee: 300, renewalFee: 300, maxMRP: 300, offer: 'TRY FREE FOR 7 DAYS' },
  { planName: 'Gold', durationMonths: 12, subscriptionFee: 500, renewalFee: 500, maxMRP: 500, offer: 'TRY FREE FOR 7 DAYS' },
  { planName: 'Diamond', durationMonths: 12, subscriptionFee: 999, renewalFee: 999, maxMRP: 999, offer: 'TRY FREE FOR 7 DAYS' },
  { planName: 'Platinum', durationMonths: 24, subscriptionFee: 1999, renewalFee: 1999, maxMRP: 1999, offer: 'FREE 1 M VIDEO ADS' },
  { planName: 'Infinity', durationMonths: 9999, subscriptionFee: 0, renewalFee: 0, maxMRP: 0, offer: 'Extended ad visibility' },
];

/** Legacy Media Upload plan labels → canonical PlanCharges name */
const LEGACY_PLAN_ALIASES = {
  'Standard (2M)': 'Bronze',
  'Silver (3M)': 'Silver',
  'Gold (6M)': 'Gold',
  'Platinum (1YR)': 'Platinum',
  'Premium (1YR)': 'Platinum',
  'Diamond (1YR)': 'Diamond',
};

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function resolvePlanName(raw) {
  const s = cleanString(raw);
  if (!s) return '';
  if (LEGACY_PLAN_ALIASES[s]) return LEGACY_PLAN_ALIASES[s];
  return s;
}

async function seedDefaultsIfEmpty() {
  const count = await PlanCharges.countDocuments();
  if (count > 0) {
    await ensureInfinityPlan();
    return;
  }
  await PlanCharges.insertMany(DEFAULT_PLANS.map((p) => ({ ...p, isActive: true })));
}

async function ensureInfinityPlan() {
  await PlanCharges.findOneAndUpdate(
    { planName: 'Infinity' },
    {
      planName: 'Infinity',
      durationMonths: 9999,
      subscriptionFee: 0,
      renewalFee: 0,
      maxMRP: 0,
      offer: 'Extended ad visibility',
      isActive: true,
    },
    { upsert: true },
  );
}

async function getDurationMonthsForPlan(planName) {
  await seedDefaultsIfEmpty();
  const canonical = resolvePlanName(planName);
  if (!canonical) return null;
  const row = await PlanCharges.findOne({ planName: canonical, isActive: { $ne: false } }).lean();
  return row ? Number(row.durationMonths) : null;
}

async function listActivePlans() {
  await seedDefaultsIfEmpty();
  return PlanCharges.find({ isActive: { $ne: false } }).sort({ durationMonths: 1 }).lean();
}

function formatDurationLabel(months) {
  const n = Number(months);
  if (n >= 9999) return 'Extended visibility';
  if (n >= 24) return '2 Yr Validity';
  if (n >= 12) return '1 Yr Validity';
  if (n >= 6) return '6 M Validity';
  if (n >= 3) return '3 M Validity';
  return `${n} M Validity`;
}

function toAdminDto(doc) {
  return {
    id: String(doc._id),
    planName: doc.planName,
    durationMonths: Number(doc.durationMonths || 0),
    duration: formatDurationLabel(doc.durationMonths),
    subscriptionFee: Number(doc.subscriptionFee || 0),
    renewalFee: Number(doc.renewalFee || 0),
    maxMRP: Number(doc.maxMRP || 0),
    offer: doc.offer || '',
    isActive: doc.isActive !== false,
  };
}

async function listAllPlansAdmin() {
  await seedDefaultsIfEmpty();
  const rows = await PlanCharges.find({}).sort({ durationMonths: 1 }).lean();
  return rows.map(toAdminDto);
}

async function updatePlanById(id, payload = {}) {
  await seedDefaultsIfEmpty();
  const patch = {};
  if (payload.subscriptionFee != null) {
    const n = Number(payload.subscriptionFee);
    if (!Number.isFinite(n) || n < 0) throw new Error('subscriptionFee must be a non-negative number');
    patch.subscriptionFee = n;
  }
  if (payload.renewalFee != null) {
    const n = Number(payload.renewalFee);
    if (!Number.isFinite(n) || n < 0) throw new Error('renewalFee must be a non-negative number');
    patch.renewalFee = n;
  }
  if (payload.maxMRP != null) {
    const n = Number(payload.maxMRP);
    if (!Number.isFinite(n) || n < 0) throw new Error('maxMRP must be a non-negative number');
    patch.maxMRP = n;
  }
  if (payload.offer != null) patch.offer = cleanString(payload.offer);
  if (payload.durationMonths != null) {
    const n = Number(payload.durationMonths);
    if (!Number.isFinite(n) || n < 1) throw new Error('durationMonths must be at least 1');
    patch.durationMonths = Math.floor(n);
  }
  if (!Object.keys(patch).length) throw new Error('No valid fields to update.');
  const doc = await PlanCharges.findByIdAndUpdate(id, { $set: patch }, { returnDocument: 'after' }).lean();
  if (!doc) throw new Error('Plan not found.');
  return toAdminDto(doc);
}

module.exports = {
  DEFAULT_PLANS,
  LEGACY_PLAN_ALIASES,
  resolvePlanName,
  seedDefaultsIfEmpty,
  ensureInfinityPlan,
  getDurationMonthsForPlan,
  listActivePlans,
  listAllPlansAdmin,
  updatePlanById,
  formatDurationLabel,
  toAdminDto,
};
