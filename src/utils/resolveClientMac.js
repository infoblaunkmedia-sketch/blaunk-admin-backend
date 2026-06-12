const net = require('net');
const { execSync } = require('child_process');
const { normalizeMac } = require('./macAddress');

function parseMacFromArpOutput(text) {
  if (!text) return '';
  const match = String(text).match(
    /([0-9a-f]{2}[-:]){5}[0-9a-f]{2}|([0-9a-f]{2}[-:]){7}[0-9a-f]{2}/i,
  );
  return match ? match[0] : '';
}

function resolveMacWindows(clientIp) {
  try {
    // Populate ARP cache when the host is on the same LAN.
    try {
      execSync(`ping -n 1 -w 1000 ${clientIp}`, { stdio: 'ignore', timeout: 3000 });
    } catch {
      // Host may be unreachable; ARP entry might still exist.
    }
    const out = execSync(`arp -a ${clientIp}`, { encoding: 'utf8', timeout: 3000 });
    return parseMacFromArpOutput(out);
  } catch {
    return '';
  }
}

function resolveMacLinux(clientIp) {
  try {
    const out = execSync(`ip neigh show ${clientIp}`, { encoding: 'utf8', timeout: 3000 });
    const lladdr = out.match(/lladdr\s+([0-9a-f:-]+)/i);
    if (lladdr) return lladdr[1];
    const arpOut = execSync(`arp -n ${clientIp}`, { encoding: 'utf8', timeout: 3000 });
    return parseMacFromArpOutput(arpOut);
  } catch {
    return '';
  }
}

/**
 * Resolve hardware MAC from the client IPv4 using the server ARP/neighbor table.
 * Works when the API server and employee laptop are on the same office LAN.
 */
function resolveClientMacFromIp(clientIp) {
  const ip = String(clientIp || '').trim().replace(/^::ffff:/, '');
  if (!ip || !net.isIPv4(ip)) return '';

  const raw =
    process.platform === 'win32' ? resolveMacWindows(ip) : resolveMacLinux(ip);
  const normalized = normalizeMac(raw);
  return normalized || '';
}

module.exports = {
  resolveClientMacFromIp,
};
