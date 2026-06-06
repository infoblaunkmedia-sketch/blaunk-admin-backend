const bannerService = require('./bannerService');
const dsaSliderService = require('./dsaSliderService');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

async function getMergedSlotContent({ page, position, country } = {}) {
  const pageNorm = cleanString(page).toLowerCase();
  const positionNorm = cleanString(position).toLowerCase();
  if (!pageNorm || !positionNorm) {
    throw new Error('page and position query params are required.');
  }

  const bannerResult = await bannerService.listPublicBanners({
    page: pageNorm,
    position: positionNorm,
  });
  const cms = bannerResult.records || [];

  let dsa = [];
  try {
    dsa = await dsaSliderService.listActiveBySlot({
      cmsPage: pageNorm,
      cmsPosition: positionNorm,
      country: cleanString(country),
    });
  } catch {
    dsa = [];
  }

  return { cms, dsa };
}

module.exports = {
  getMergedSlotContent,
};
