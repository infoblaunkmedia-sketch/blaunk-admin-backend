const cron = require('node-cron');
const DsaSlider = require('../models/DsaSlider');

function startExpireSliderJob() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const result = await DsaSlider.updateMany(
        { status: 'Active', expiryDate: { $lt: now } },
        { $set: { status: 'Expired' } },
      );
      // eslint-disable-next-line no-console
      console.log(`[ExpireSliders] ${result.modifiedCount} sliders expired`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ExpireSliders] job failed:', err);
    }
  });
}

module.exports = { startExpireSliderJob };
