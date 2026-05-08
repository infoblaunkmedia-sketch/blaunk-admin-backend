const fs = require('fs');

/**
 * Synchronous stderr write for deploy platforms (e.g. Render) where buffered
 * stdout may not flush before process.exit(1).
 */
function syncLine(prefix, message, detail) {
  let line = `${prefix} ${message}`;
  if (detail !== undefined) {
    line += ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
  }
  line += '\n';
  try {
    fs.writeSync(2, line);
  } catch {
    // ignore
  }
}

function syncRaw(text) {
  try {
    fs.writeSync(2, text.endsWith('\n') ? text : `${text}\n`);
  } catch {
    // ignore
  }
}

module.exports = { syncLine, syncRaw };
