const mongoose = require('mongoose');
const { syncLine, syncRaw } = require('../utils/syncLog');

// Single MongoDB configuration + connection helper for the project.
// Database name is included directly in the MONGO_URI, so there is
// no need for a separate variable.

const MONGO_URI =
  process.env.MONGO_URI?.trim() || 'mongodb://127.0.0.1:27017/blaunk';

const LOG_PREFIX = '[blaunk-admin-backend]';

/** Redact user:password in mongodb:// or mongodb+srv:// URIs for logs only. */
function redactMongoUri(uri) {
  if (!uri) return '(none)';
  return uri.replace(/^(mongodb(\+srv)?:\/\/)[^@]+@/i, '$1***:***@');
}

function isProductionLike() {
  return (
    process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  );
}

async function connectDatabase() {
  const productionLike = isProductionLike();
  const uri = productionLike
    ? process.env.MONGO_URI?.trim()
    : MONGO_URI;

  const attemptMeta = {
    productionLike,
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    mongoUriFromEnv: Boolean(process.env.MONGO_URI?.trim()),
    target: redactMongoUri(uri || '(missing — will fail)'),
  };
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} DB: connect attempt`, attemptMeta);
  syncLine(LOG_PREFIX, 'DB: connect attempt (stderr)', attemptMeta);

  if (!uri) {
    throw new Error(
      'MONGO_URI is required in production. In Render: Environment → add MONGO_URI (e.g. MongoDB Atlas connection string).',
    );
  }

  const t0 = Date.now();
  const connectOptions = {
    serverSelectionTimeoutMS: 25_000,
    connectTimeoutMS: 25_000,
  };
  if (process.env.MONGO_PREFER_IPV4 === 'true') {
    connectOptions.family = 4;
  }
  syncLine(LOG_PREFIX, 'DB: calling mongoose.connect', connectOptions);
  try {
    await mongoose.connect(uri, connectOptions);
  } catch (err) {
    const meta = {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      reason: err?.reason?.message || err?.reason,
    };
    syncLine(LOG_PREFIX, 'DB: mongoose.connect error', meta);
    if (err?.stack) {
      syncRaw(err.stack);
    }
    // eslint-disable-next-line no-console
    console.error(`${LOG_PREFIX} DB: mongoose.connect error`, meta);
    if (err?.stack) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    }
    throw err;
  }

  const okMeta = { ms: Date.now() - t0 };
  syncLine(LOG_PREFIX, 'DB: connected OK', okMeta);
  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} DB: connected OK`, okMeta);
  return mongoose.connection;
}

module.exports = {
  MONGO_URI,
  connectDatabase,
};

