const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const LOG_PREFIX = '[blaunk-admin-backend]';
const { syncLine, syncRaw } = require('./utils/syncLog');

process.on('uncaughtException', (err) => {
  syncLine(LOG_PREFIX, 'uncaughtException', {
    message: err?.message || String(err),
    name: err?.name,
  });
  if (err?.stack) {
    syncRaw(err.stack);
  }
  // eslint-disable-next-line no-console
  console.error(`${LOG_PREFIX} uncaughtException`, err?.message || err);
  if (err?.stack) {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg =
    reason && typeof reason === 'object' && 'message' in reason
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : String(reason);
  syncLine(LOG_PREFIX, 'unhandledRejection', {
    message: msg,
    name: reason?.name,
    code: reason?.code,
  });
  if (reason?.stack) {
    syncRaw(reason.stack);
  }
  // eslint-disable-next-line no-console
  console.error(`${LOG_PREFIX} unhandledRejection`, msg);
  if (reason?.stack) {
    // eslint-disable-next-line no-console
    console.error(reason.stack);
  }
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { checkIPWhitelist } = require('./middleware/checkIPWhitelist');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const shareholdingRoutes = require('./routes/shareholdingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const employeeCredentialsRoutes = require('./routes/employeeCredentialsRoutes');
const rightsRoutes = require('./routes/rightsRoutes');
const payslipReportRoutes = require('./routes/payslipReportRoutes');
const captchaConfigRoutes = require('./routes/captchaConfigRoutes');
const ipAddressConfigRoutes = require('./routes/ipAddressConfigRoutes');
const macAddressConfigRoutes = require('./routes/macAddressConfigRoutes');
const adminIpWhitelistRoutes = require('./routes/adminIpWhitelistRoutes');
const thirdPartyCredentialRoutes = require('./routes/thirdPartyCredentialRoutes');
const userRoutes = require('./routes/userRoutes');
const staffUserRoutes = require('./routes/staffUserRoutes');
const individualCustomerService = require('./services/individualCustomerService');
const sellerService = require('./services/sellerService');
const sellerRoutes = require('./routes/sellerRoutes');
const dsaSliderRoutes = require('./routes/dsaSliderRoutes');
const dsaPayoutRoutes = require('./routes/dsaPayoutRoutes');
const matchCodeRoutes = require('./routes/matchCodeRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const referralRoutes = require('./routes/referralRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const giffRoutes = require('./routes/giffRoutes');
const shopRoutes = require('./routes/shopRoutes');
const shopCategoryRoutes = require('./routes/shopCategoryRoutes');
const shopService = require('./services/shopService');
const shopCategoryService = require('./services/shopCategoryService');
const siteMediaRoutes = require('./routes/siteMediaRoutes');
const contestQuizRoutes = require('./routes/contestQuizRoutes');
const planChargesRoutes = require('./routes/planChargesRoutes');
const publicSlotRoutes = require('./routes/publicSlotRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const verifierRoutes = require('./routes/verifierRoutes');
const categoryService = require('./services/categoryService');
const productService = require('./services/productService');
const orderService = require('./services/orderService');
const referralService = require('./services/referralService');
const dsaService = require('./services/dsaService');
const matchCodeService = require('./services/matchCodeService');
const ThirdPartyCredential = require('./models/ThirdPartyCredential');
const { activityLogMiddleware } = require('./middleware/activityLogMiddleware');
const issueRoutes = require('./routes/issueRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const vacancyRoutes = require('./routes/vacancyRoutes');
const countryRoutes = require('./routes/countryRoutes');
const countryService = require('./services/countryService');
const bannerService = require('./services/bannerService');
const giffService = require('./services/giffService');
const DsaSlider = require('./models/DsaSlider');
const { connectDatabase } = require('./config/database');
const authService = require('./services/authService');
const shareholdingService = require('./services/shareholdingService');

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS;

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

const allowedOrigins = new Set(
  [
    CLIENT_ORIGIN,
    'http://192.168.0.64:5173',
    'http://localhost:5175',
    ...(CLIENT_ORIGINS ? CLIENT_ORIGINS.split(',') : []),
  ]
    .map(normalizeOrigin)
    .filter(Boolean),
);
const isLocalDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizeOrigin(origin));

app.use(
  cors({
    origin(origin, callback) {
      const normalized = normalizeOrigin(origin);

      // Allow non-browser requests (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      // Explicitly allowed origins (Render env)
      if (allowedOrigins.has(normalized)) {
        return callback(null, true);
      }

      // Allow local frontend dev servers on any port (Vite/Cursor/preview)
      if (isLocalDevOrigin(normalized)) {
        return callback(null, true);
      }

      // Allow Vercel preview domains if you deploy from Vercel
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
// Ensure preflight requests succeed
app.options('*', cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(morgan('dev'));
app.use(activityLogMiddleware);

// IP whitelist: allow only requests from allowed_ips (bypass: /health, /admin/*)
app.use(checkIPWhitelist);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'blaunk-admin-auth' });
});

app.use('/admin', adminIpWhitelistRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shareholding', shareholdingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/employee-credentials', employeeCredentialsRoutes);
app.use('/api/rights', rightsRoutes);
app.use('/api/payslip-report', payslipReportRoutes);
app.use('/api/captcha', captchaConfigRoutes);
app.use('/api/ip-address', ipAddressConfigRoutes);
app.use('/api/mac-address', macAddressConfigRoutes);
app.use('/api/3p-credentials', thirdPartyCredentialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff-users', staffUserRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/dsa-sliders', dsaSliderRoutes);
app.use('/api/dsa-payouts', dsaPayoutRoutes);
app.use('/api/match-code', matchCodeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/giff', giffRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/shop-categories', shopCategoryRoutes);
app.use('/api/admin-personnel/media', siteMediaRoutes);
app.use('/api/site-media', siteMediaRoutes);
app.use('/api/contest-quiz', contestQuizRoutes);
app.use('/api/plan-charges', planChargesRoutes);
app.use('/api/public', publicSlotRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/verifiers', verifierRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/countries', countryRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

function logStartupEnvironment() {
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} Startup environment`, {
    node: process.version,
    cwd: process.cwd(),
    PORT: String(PORT),
    processPortEnv: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    mongoUriSet: Boolean(process.env.MONGO_URI?.trim()),
    jwtSecretSet: Boolean(process.env.JWT_SECRET?.trim()),
    cloudinarySet: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME?.trim()
        && process.env.CLOUDINARY_API_KEY?.trim()
        && process.env.CLOUDINARY_API_SECRET?.trim(),
    ),
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '(using default)',
  });
}

function logErrorDetail(label, error) {
  const meta = {
    name: error?.name,
    message: error?.message || String(error),
    code: error?.code,
  };
  syncLine(LOG_PREFIX, label, meta);
  if (error?.stack) {
    syncRaw(error.stack);
  }
  // eslint-disable-next-line no-console
  console.error(`${LOG_PREFIX} ${label}`, meta);
  if (error?.stack) {
    // eslint-disable-next-line no-console
    console.error(error.stack);
  }
}

async function start() {
  logStartupEnvironment();

  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} Step 1/3: MongoDB connection...`);
  try {
    await connectDatabase();
  } catch (error) {
    logErrorDetail('Step 1 FAILED (database connection)', error);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} Step 2/3: index cleanup + ensureAdminUser...`);
  try {
    // Cleanup old slot-based unique indexes if present.
    await Promise.all(
      [
        'section_1_country_1_slot_1',
        'mediaTab_1_section_1_country_1_slot_1',
        'mediaTab_1_section_1_country_1',
      ].map((name) => DsaSlider.collection.dropIndex(name).catch(() => undefined)),
    );
    await authService.ensureAdminUser();
    await countryService.ensureDefaultCountries();
    const seed = await individualCustomerService.ensureSeedIndividualsIfEmpty();
    if (seed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${seed.seeded} sample B2C customer(s).`);
    }
    await sellerService.migrateVendorStatuses();
    const sellerSeed = await sellerService.ensureSeedSellersIfEmpty();
    if (sellerSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${sellerSeed.seeded} sample seller(s).`);
    }
    await categoryService.ensureSeedCategories();
    await productService.ensureSeedProducts();
    await orderService.ensureSeedOrders();
    await referralService.ensureSeedReferrals();
    await bannerService.ensureSeedBanners();
    const bgtHeroSeed = await bannerService.ensureBgtCommonHeroBanners();
    if (bgtHeroSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtHeroSeed.seeded} BGT Common hero banner(s).`);
    }
    const bgtDiscoverySeed = await bannerService.ensureBgtDiscoveryHubBanners();
    if (bgtDiscoverySeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtDiscoverySeed.seeded} BGT Discovery Hub record(s).`);
    }
    const bgtExploreSeed = await bannerService.ensureBgtExploreGalleryBanners();
    if (bgtExploreSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtExploreSeed.seeded} BGT Explore Gallery image(s).`);
    }
    const bgtExplorerCarouselSeed = await bannerService.ensureBgtExplorerCarouselBanners();
    if (bgtExplorerCarouselSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtExplorerCarouselSeed.seeded} BGT Explorer Carousel slide(s).`);
    }
    const bgtIntlSourcingSeed = await bannerService.ensureBgtInternationalSourcingBanners();
    if (bgtIntlSourcingSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtIntlSourcingSeed.seeded} International Sourcing banner slide(s).`);
    }
    const bgtAdvantageSeed = await bannerService.ensureBgtBlaunkAdvantageBanners();
    if (bgtAdvantageSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtAdvantageSeed.seeded} Blaunk Exporter Directory record(s).`);
    }
    const bgtViewMoreHeroSeed = await bannerService.ensureBgtViewMoreHeroBanners();
    if (bgtViewMoreHeroSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtViewMoreHeroSeed.seeded} View More hero banner slide(s).`);
    }
    const bgtViewMoreSponsoredSeed = await bannerService.ensureBgtViewMoreSponsoredAdsBanners();
    if (bgtViewMoreSponsoredSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtViewMoreSponsoredSeed.seeded} View More sponsored ad banner(s).`);
    }
    const bgtViewMorePremiumSeed = await bannerService.ensureBgtViewMorePremiumShowcaseBanners();
    if (bgtViewMorePremiumSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtViewMorePremiumSeed.seeded} View More premium showcase banner(s).`);
    }
    const bgtViewMoreTrendingSeed = await bannerService.ensureBgtViewMoreTrendingDiscoveryBanners();
    if (bgtViewMoreTrendingSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtViewMoreTrendingSeed.seeded} View More trending discovery card(s).`);
    }
    const bgtViewMoreDealsSeed = await bannerService.ensureBgtViewMoreDealsOffersBanner();
    if (bgtViewMoreDealsSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded View More deals & offers banner.`);
    }
    const bgtViewMoreBrandFooterSeed = await bannerService.ensureBgtViewMoreBrandFooterBanner();
    if (bgtViewMoreBrandFooterSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded View More brand footer banner.`);
    }
    const bgtViewMoreSidebarSeed = await bannerService.ensureBgtViewMoreSidebarAdsBanners();
    if (bgtViewMoreSidebarSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtViewMoreSidebarSeed.seeded} View More sidebar ad(s).`);
    }
    const boutiqueHeroSeed = await bannerService.ensureBoutiqueHeroBanners();
    if (boutiqueHeroSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueHeroSeed.seeded} Boutique hero slide(s).`);
    }
    const boutiqueFashionSeed = await bannerService.ensureBoutiqueFashionAccessoriesBanners();
    if (boutiqueFashionSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueFashionSeed.seeded} Boutique fashion-accessories record(s).`);
    }
    const boutiqueTrendyStarSeed = await bannerService.ensureBoutiqueTrendyStarBanners();
    if (boutiqueTrendyStarSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueTrendyStarSeed.seeded} Boutique trendy-star record(s).`);
    }
    const boutiqueEditorialSeed = await bannerService.ensureBoutiqueEditorialGalleryBanners();
    if (boutiqueEditorialSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueEditorialSeed.seeded} Boutique editorial-gallery record(s).`);
    }
    const boutiqueNewLaunchSeed = await bannerService.ensureBoutiqueNewLaunchCarouselBanners();
    if (boutiqueNewLaunchSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueNewLaunchSeed.seeded} Boutique new-launch-carousel slide(s).`);
    }
    const boutiqueExclusiveVideoSeed = await bannerService.ensureBoutiqueExclusiveVideoBanners();
    if (boutiqueExclusiveVideoSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueExclusiveVideoSeed.seeded} Boutique exclusive-video record(s).`);
    }
    const boutiqueDisclaimerSeed = await bannerService.ensureBoutiqueDisclaimerUtilityBanners();
    if (boutiqueDisclaimerSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${boutiqueDisclaimerSeed.seeded} Boutique disclaimer-utility record(s).`);
    }
    const bgtViewMoreGiffSeed = await giffService.ensureBgtViewMoreGiffBanners();
    if (bgtViewMoreGiffSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${bgtViewMoreGiffSeed.seeded} BGT View More GIFF record(s).`);
    }
    const catSeed = await shopCategoryService.ensureSeedCategoriesIfEmpty();
    if (catSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${catSeed.seeded} B-Store categor(ies).`);
    }
    const shopSeed = await shopService.ensureSeedShopsIfEmpty();
    if (shopSeed.seeded > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Seeded ${shopSeed.seeded} B-Store shop(s).`);
    }
    const mig = await shareholdingService.migrateLegacyShareholdingsIfNeeded();
    if (mig.migrated > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Migrated ${mig.migrated} legacy shareholding document(s) to Shareholder + History.`);
    }
    await dsaService.syncAdminDsasFromCredentials();
    const planChargesService = require('./services/planChargesService');
    await planChargesService.seedDefaultsIfEmpty();
    const { startExpireSliderJob } = require('./jobs/expireSliders');
    startExpireSliderJob();
    await ThirdPartyCredential.collection.dropIndex('matchCode_1').catch(() => undefined);
    const activeMatch = await matchCodeService.getActive();
    if (activeMatch?.code) {
      const sync = await matchCodeService.syncAllThirdPartyCredentials(activeMatch.code);
      if (sync.modifiedCount > 0) {
        // eslint-disable-next-line no-console
        console.log(`${LOG_PREFIX} Synced ${sync.modifiedCount} 3P credential(s) to active Match Code.`);
      }
    }
  } catch (error) {
    logErrorDetail('Step 2 FAILED (post-connect startup)', error);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} Step 3/3: HTTP listen on port ${PORT}...`);
  try {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Listening on port ${PORT}`);
    });
  } catch (error) {
    logErrorDetail('Step 3 FAILED (HTTP bind)', error);
    process.exit(1);
  }
}

start().catch((error) => {
  logErrorDetail('Fatal: unhandled error in start()', error);
  process.exit(1);
});

