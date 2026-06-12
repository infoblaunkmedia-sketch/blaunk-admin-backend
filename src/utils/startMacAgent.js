const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

/**
 * Starts the local MAC probe on the employee/server PC (127.0.0.1:9247).
 * Browsers cannot read hardware MAC; this small helper runs on each login machine.
 */
function startMacAgent(log = () => {}) {
  const disabled = String(process.env.START_MAC_AGENT || 'true').trim().toLowerCase();
  if (disabled === 'false' || disabled === '0' || disabled === 'off') return null;

  const agentPath = path.join(__dirname, '..', '..', '..', 'mac-agent', 'server.js');
  if (!fs.existsSync(agentPath)) {
    log('MAC agent script not found — skip auto-start');
    return null;
  }

  const port = process.env.MAC_AGENT_PORT || '9247';
  const child = spawn(process.execPath, [agentPath], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, MAC_AGENT_PORT: port, MAC_AGENT_HOST: '127.0.0.1' },
  });
  child.unref();
  log(`MAC agent listening on http://127.0.0.1:${port}/mac`);
  return child;
}

module.exports = { startMacAgent };
