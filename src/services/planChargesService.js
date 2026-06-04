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

module.exports = {
  DEFAULT_PLANS,
  LEGACY_PLAN_ALIASES,
  resolvePlanName,
  seedDefaultsIfEmpty,
  ensureInfinityPlan,
  getDurationMonthsForPlan,
  listActivePlans,
};
