require('dotenv').config();

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
const path = require('path');
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
const dsaSliderRoutes = require('./routes/dsaSliderRoutes');
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
app.use('/api/dsa-sliders', dsaSliderRoutes);

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
      ['section_1_country_1_slot_1', 'mediaTab_1_section_1_country_1_slot_1'].map((name) =>
        DsaSlider.collection.dropIndex(name).catch(() => undefined),
      ),
    );
    await authService.ensureAdminUser();
    const mig = await shareholdingService.migrateLegacyShareholdingsIfNeeded();
    if (mig.migrated > 0) {
      // eslint-disable-next-line no-console
      console.log(`${LOG_PREFIX} Migrated ${mig.migrated} legacy shareholding document(s) to Shareholder + History.`);
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

