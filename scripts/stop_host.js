const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const STATUS_FILE = path.join(DATA_DIR, 'host_status.json');
const WATCHDOG_LOCK = path.join(DATA_DIR, 'watchdog.pid');
const TUNNEL_LOCK = path.join(DATA_DIR, 'tunnel.pid');

function execQuiet(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {
    return '';
  }
}

function isPidRunning(pid) {
  if (!pid) return false;
  try {
    const list = execQuiet(`tasklist /FI "PID eq ${pid}" /NH`);
    return list.includes(String(pid));
  } catch (_) {
    return false;
  }
}

function killPid(pid) {
  if (!pid) return;
  if (!isPidRunning(pid)) return;
  try {
    execQuiet(`taskkill /T /F /PID ${pid}`);
    console.log(`✅ Stopped process with PID: ${pid}`);
  } catch (_) {}
}

console.log('Stopping Market Pulse Terminal and Bot processes...');

// 1. Kill known recorded PIDs
let status = {};
try {
  if (fs.existsSync(STATUS_FILE)) {
    status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  }
} catch (_) {}

if (status.watchdogPid) killPid(status.watchdogPid);
if (status.serverPid) killPid(status.serverPid);
if (status.tunnelPid) killPid(status.tunnelPid);

// Check lock files
if (fs.existsSync(WATCHDOG_LOCK)) {
  try {
    const pid = parseInt(fs.readFileSync(WATCHDOG_LOCK, 'utf8').trim(), 10);
    killPid(pid);
  } catch (_) {}
}
if (fs.existsSync(TUNNEL_LOCK)) {
  try {
    const pid = parseInt(fs.readFileSync(TUNNEL_LOCK, 'utf8').trim(), 10);
    killPid(pid);
  } catch (_) {}
}

// 2. Kill any node process running files from 'share market'
try {
  const wmicOutput = execQuiet('wmic process where "name=\'node.exe\'" get processid,commandline /format:csv');
  const lines = wmicOutput.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('share market') && (line.includes('host_watchdog.js') || line.includes('tunnel.js') || line.includes('server.js'))) {
      const parts = line.trim().split(',');
      const pid = parts[parts.length - 1];
      if (pid && Number(pid) !== process.pid) {
        killPid(pid);
      }
    }
  }
} catch (_) {}

// 3. Kill cloudflared
try { execQuiet('taskkill /F /IM cloudflared.exe'); } catch (_) {}

// 4. Free port 5000
const netstat = execQuiet('netstat -ano | findstr :5000');
const netLines = netstat.split('\n').filter(l => l.includes('LISTENING'));
for (const line of netLines) {
  const parts = line.trim().split(/\s+/);
  const pid = parts[parts.length - 1];
  if (pid && pid !== '0' && Number(pid) !== process.pid) {
    killPid(pid);
  }
}

// 5. Clean lock files
try { if (fs.existsSync(WATCHDOG_LOCK)) fs.unlinkSync(WATCHDOG_LOCK); } catch (_) {}
try { if (fs.existsSync(TUNNEL_LOCK)) fs.unlinkSync(TUNNEL_LOCK); } catch (_) {}

try {
  status.status = 'stopped';
  status.serverPid = null;
  status.tunnelPid = null;
  status.watchdogPid = null;
  status.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf8');
} catch (_) {}

console.log('✅ Market Pulse Terminal is completely stopped.');
