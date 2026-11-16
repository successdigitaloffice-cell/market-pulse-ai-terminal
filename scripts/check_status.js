const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const STATUS_FILE = path.join(DATA_DIR, 'host_status.json');
const TUNNEL_FILE = path.join(DATA_DIR, 'tunnel_info.json');
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', 'market_host.log');
const PORT = 5000;

function execQuiet(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {
    return '';
  }
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    const list = execQuiet(`tasklist /FI "PID eq ${pid}" /NH`);
    return list.includes(String(pid));
  } catch (_) {
    return false;
  }
}

function checkRegistry() {
  const result = execQuiet('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v MarketPulseBotHost');
  return result.includes('MarketPulseBotHost');
}

function checkStartupFolder() {
  const startupPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'MarketPulseBotHost.vbs');
  return fs.existsSync(startupPath);
}

function checkPort(port) {
  const output = execQuiet(`netstat -ano | findstr :${port}`);
  const lines = output.split('\n').filter(l => l.includes('LISTENING'));
  if (lines.length > 0) {
    const parts = lines[0].trim().split(/\s+/);
    return { listening: true, pid: parts[parts.length - 1] };
  }
  return { listening: false, pid: null };
}

function pingHealth(port, callback) {
  let finished = false;
  const finish = (err, data) => {
    if (finished) return;
    finished = true;
    callback(err, data);
  };
  const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        finish(null, JSON.parse(data));
      } catch (err) {
        finish(null, { raw: data });
      }
    });
  });
  req.on('error', (e) => finish(e));
  req.setTimeout(3000, () => {
    req.destroy();
    finish(new Error('Local health check timed out'));
  });
}

function testTunnelUrl(url, callback) {
  if (!url || !url.startsWith('https://')) return callback(null, false);
  let finished = false;
  const finish = (ok) => {
    if (finished) return;
    finished = true;
    callback(null, ok);
  };
  try {
    const req = https.get(url, { headers: { 'User-Agent': 'MarketPulseCheck/1.0' }, timeout: 4000 }, (res) => {
      finish(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => finish(false));
    req.on('timeout', () => { req.destroy(); finish(false); });
  } catch (_) {
    finish(false);
  }
}

function formatDuration(sec) {
  if (sec == null) return 'N/A';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

console.log('================================================================');
console.log('📊 MARKET PULSE AI TERMINAL & BOT – SYSTEM STATUS CHECK');
console.log('================================================================');

// 1. Permanent Autostart Status
const regOk = checkRegistry();
const startupOk = checkStartupFolder();
console.log('[Permanent Autostart after PC Restart]');
console.log(`  • Windows Startup Launcher: ${startupOk ? '✅ Active (Silent Background Auto-start on reboot)' : '❌ Not Configured'}`);
console.log(`  • Single-Instance Guard:    ${!regOk ? '✅ Protected (No duplicate conflict)' : '⚠️ Warning (Duplicate registry detected)'}`);
console.log('');

// 2. Process & Port Status
const portInfo = checkPort(PORT);
let statusData = {};
try {
  if (fs.existsSync(STATUS_FILE)) {
    statusData = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  }
} catch (_) {}

let tunnelData = {};
try {
  if (fs.existsSync(TUNNEL_FILE)) {
    tunnelData = JSON.parse(fs.readFileSync(TUNNEL_FILE, 'utf8'));
  }
} catch (_) {}

const watchdogRunning = statusData.watchdogPid && isPidAlive(statusData.watchdogPid);
const serverRunning = portInfo.listening || (statusData.serverPid && isPidAlive(statusData.serverPid));
const tunnelRunning = statusData.tunnelPid && isPidAlive(statusData.tunnelPid);

console.log('[Market Pulse Host Processes]');
console.log(`  • Target Port:              ${PORT}`);
console.log(`  • Port 5000 Status:         ${portInfo.listening ? `🟢 Active (Listening - PID ${portInfo.pid})` : '🔴 Inactive (Not Listening)'}`);
console.log(`  • Watchdog PID:             ${watchdogRunning ? `🟢 Running (${statusData.watchdogPid})` : '🔴 Not running'}`);
console.log(`  • Server PID:               ${serverRunning ? `🟢 Running (${portInfo.pid || statusData.serverPid})` : '🔴 Not running'}`);
console.log(`  • Tunnel PID:               ${tunnelRunning ? `🟢 Running (${statusData.tunnelPid})` : '🔴 Not running'}`);
console.log(`  • Restarts Counter:         Server: ${statusData.serverRestartCount || 0} | Tunnel: ${statusData.tunnelRestartCount || 0}`);
console.log('');

// 3. Live Health Check
pingHealth(PORT, (err, health) => {
  console.log('[Live Health & URLs]');
  if (!err && health) {
    console.log(`  • Server Status:            ✅ HEALTHY & RESPONDING`);
    console.log(`  • Server Uptime:            ${formatDuration(health.uptime)}`);
    console.log(`  • IST Time:                 ${health.istTime || new Date().toLocaleTimeString('en-IN')}`);
    console.log(`  • Local PC URL:             http://localhost:${PORT}`);
  } else {
    console.log(`  • Server Status:            🔴 Server is not responding (${err ? err.message : 'Down'})`);
    console.log(`    💡 Tip: Double-click "START_MARKET_BOT.bat" or "RESTART_MARKET_BOT.bat" to start.`);
  }

  const activeUrl = tunnelData.url || statusData.tunnelUrl;
  if (activeUrl && tunnelRunning) {
    testTunnelUrl(activeUrl, (_, isLive) => {
      console.log(`  • Public Mobile Tunnel:     🌐 ${activeUrl} ${isLive ? '✅ [LIVE & REACHABLE]' : '⏳ [CONNECTING...]'}`);
      console.log('');
      printLogs();
    });
  } else if (activeUrl) {
    console.log(`  • Public Mobile Tunnel:     ⚠️ ${activeUrl} (Tunnel process inactive)`);
    console.log('');
    printLogs();
  } else {
    console.log(`  • Public Mobile Tunnel:     ⏳ Initializing / Not yet established`);
    console.log('');
    printLogs();
  }
});

function printLogs() {
  console.log('================================================================');
  console.log('📜 RECENT HOST LOGS (Last 12 lines):');
  console.log('================================================================');
  if (fs.existsSync(LOG_FILE)) {
    try {
      const content = fs.readFileSync(LOG_FILE, 'utf8').trim();
      const lines = content.split('\n');
      console.log(lines.slice(-12).join('\n'));
    } catch (_) {
      console.log('Could not read log file.');
    }
  } else {
    console.log('No log entries recorded yet.');
  }
  console.log('================================================================');
}
