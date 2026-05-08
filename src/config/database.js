const mongoose = require('mongoose');

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

  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} DB: connect attempt`, {
    productionLike,
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    mongoUriFromEnv: Boolean(process.env.MONGO_URI?.trim()),
    target: redactMongoUri(uri || '(missing — will fail)'),
  });

  if (!uri) {
    throw new Error(
      'MONGO_URI is required in production. In Render: Environment → add MONGO_URI (e.g. MongoDB Atlas connection string).',
    );
  }

  const t0 = Date.now();
  try {
    await mongoose.connect(uri);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`${LOG_PREFIX} DB: mongoose.connect error`, {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      reason: err?.reason?.message || err?.reason,
    });
    if (err?.stack) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    }
    throw err;
  }

  // eslint-disable-next-line no-console
  console.log(`${LOG_PREFIX} DB: connected OK`, { ms: Date.now() - t0 });
  return mongoose.connection;
}

module.exports = {
  MONGO_URI,
  connectDatabase,
};

