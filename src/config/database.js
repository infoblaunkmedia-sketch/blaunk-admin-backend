const mongoose = require('mongoose');

// Single MongoDB configuration + connection helper for the project.
// Database name is included directly in the MONGO_URI, so there is
// no need for a separate variable.

const MONGO_URI =
  process.env.MONGO_URI?.trim() || 'mongodb://127.0.0.1:27017/blaunk';

function isProductionLike() {
  return (
    process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
  );
}

async function connectDatabase() {
  const uri = isProductionLike()
    ? process.env.MONGO_URI?.trim()
    : MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is required in production. In Render: Environment → add MONGO_URI (e.g. MongoDB Atlas connection string).',
    );
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = {
  MONGO_URI,
  connectDatabase,
};

