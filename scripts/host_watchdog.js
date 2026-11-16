const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'market_host.log');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const STATUS_FILE = path.join(DATA_DIR, 'host_status.json');
const SERVER_SCRIPT = path.join(PROJECT_ROOT, 'server.js');
const TUNNEL_SCRIPT = path.join(PROJECT_ROOT, 'tunnel.js');
const PORT = process.env.PORT || 5000;

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function safeConsole(msg) {
  try {
    if (process.stdout && process.stdout.isTTY) {
      process.stdout.write(msg);
    }
  } catch (_) {}
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  safeConsole(line);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
    rotateLogIfNeeded();
  } catch (_) {}
}

function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > 5 * 1024 * 1024) {
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = content.split('\n');
        const trimmed = lines.slice(-2000).join('\n');
        fs.writeFileSync(LOG_FILE, `--- Log Rotated at ${new Date().toISOString()} ---\n` + trimmed, 'utf8');
      }
    }
  } catch (_) {}
}

const LOCK_FILE = path.join(DATA_DIR, 'watchdog.pid');

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    const list = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    return list.includes(String(pid));
  } catch (_) {
    return false;
  }
}

// Single-Instance Mutex: Prevent duplicate watchdog processes from fighting each other
if (fs.existsSync(LOCK_FILE)) {
  try {
    const existingPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
    if (existingPid && existingPid !== process.pid && isPidAlive(existingPid)) {
      log(`[Watchdog] Another Watchdog instance is already active (PID ${existingPid}). Exiting duplicate instance.`);
      process.exit(0);
    }
  } catch (_) {}
}
try {
  fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf8');
} catch (_) {}

function removeLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const pidInFile = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      if (pidInFile === process.pid) fs.unlinkSync(LOCK_FILE);
    }
  } catch (_) {}
}

process.on('exit', removeLock);
process.on('uncaughtException', (err) => {
  log(`[Watchdog] CRITICAL Uncaught Exception: ${err?.stack || err?.message || err}`);
});
process.on('unhandledRejection', (reason) => {
  log(`[Watchdog] CRITICAL Unhandled Rejection: ${reason?.stack || reason?.message || reason}`);
});

let serverChild = null;
let tunnelChild = null;
let serverRestartCount = 0;
let tunnelRestartCount = 0;
let isShuttingDown = false;
let consecutiveFailures = 0;

function killProcessOnPort(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, { encoding: 'utf8', windowsHide: true });
    const lines = output.split('\n').filter(l => l.includes('LISTENING'));
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && Number(pid) !== process.pid) {
        try {
          execSync(`taskkill /T /F /PID ${pid}`, { stdio: 'ignore', windowsHide: true });
          log(`[Watchdog] Cleaned lingering process PID ${pid} from port ${targetPort}`);
        } catch (_) {}
      }
    }
  } catch (_) {}
}

function updateStatus(extra = {}) {
  try {
    let tunnelInfo = null;
    const tunnelInfoPath = path.join(DATA_DIR, 'tunnel_info.json');
    if (fs.existsSync(tunnelInfoPath)) {
      try {
        tunnelInfo = JSON.parse(fs.readFileSync(tunnelInfoPath, 'utf8'));
      } catch (_) {}
    }

    const current = {
      watchdogPid: process.pid,
      serverPid: serverChild ? serverChild.pid : null,
      tunnelPid: tunnelChild ? tunnelChild.pid : null,
      port: PORT,
      serverRestartCount,
      tunnelRestartCount,
      tunnelUrl: tunnelInfo ? tunnelInfo.url : null,
      updatedAt: new Date().toISOString(),
      ...extra
    };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(current, null, 2), 'utf8');
  } catch (_) {}
}

function checkServerHealth(callback) {
  let finished = false;
  const finish = (err, data) => {
    if (finished) return;
    finished = true;
    callback(err, data);
  };

  const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        finish(null, json);
      } catch (err) {
        finish(null, { raw: body });
      }
    });
  });

  req.on('error', (err) => finish(err));
  req.setTimeout(4000, () => {
    req.destroy();
    finish(new Error('Health check timeout (4s)'));
  });
}

function startServer() {
  if (isShuttingDown) return;

  // Ensure port 5000 is completely free before launching
  killProcessOnPort(PORT);

  log(`[Watchdog] Launching server: node "${SERVER_SCRIPT}"`);
  let logFd;
  try { logFd = fs.openSync(LOG_FILE, 'a'); } catch (_) {}
  const stdio = logFd ? ['ignore', logFd, logFd] : ['ignore', 'ignore', 'ignore'];

  serverChild = spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: PROJECT_ROOT,
    detached: true,
    windowsHide: true,
    env: { ...process.env, PORT: String(PORT) },
    stdio
  });

  log(`[Watchdog] Server started with PID: ${serverChild.pid}`);
  updateStatus({ status: 'server_running' });

  serverChild.on('exit', (code, signal) => {
    log(`[Watchdog] Server process exited (code: ${code}, signal: ${signal})`);
    serverChild = null;
    try { if (logFd) fs.closeSync(logFd); } catch (_) {}

    if (!isShuttingDown) {
      serverRestartCount++;
      log(`[Watchdog] Auto-restarting server in 3s (Restart #${serverRestartCount})...`);
      updateStatus({ status: 'server_restarting' });
      setTimeout(startServer, 3000);
    }
  });

  // Start tunnel 2 seconds after server starts
  setTimeout(() => {
    if (!tunnelChild && !isShuttingDown) {
      startTunnel();
    }
  }, 2000);
}

function startTunnel() {
  if (isShuttingDown) return;

  log(`[Watchdog] Launching tunnel: node "${TUNNEL_SCRIPT}"`);
  let logFd;
  try { logFd = fs.openSync(LOG_FILE, 'a'); } catch (_) {}
  const stdio = logFd ? ['ignore', logFd, logFd] : ['ignore', 'ignore', 'ignore'];

  tunnelChild = spawn(process.execPath, [TUNNEL_SCRIPT], {
    cwd: PROJECT_ROOT,
    detached: true,
    windowsHide: true,
    env: { ...process.env, PORT: String(PORT) },
    stdio
  });

  log(`[Watchdog] Tunnel started with PID: ${tunnelChild.pid}`);
  updateStatus({ status: 'running' });

  tunnelChild.on('exit', (code, signal) => {
    log(`[Watchdog] Tunnel process exited (code: ${code}, signal: ${signal})`);
    tunnelChild = null;
    try { if (logFd) fs.closeSync(logFd); } catch (_) {}

    if (!isShuttingDown) {
      tunnelRestartCount++;
      log(`[Watchdog] Auto-restarting tunnel in 4s (Restart #${tunnelRestartCount})...`);
      updateStatus({ status: 'tunnel_restarting' });
      setTimeout(startTunnel, 4000);
    }
  });
}

function forceRestartServer() {
  log('[Watchdog] 🔄 Self-Healing triggered: Restarting server...');
  if (serverChild && serverChild.pid) {
    try { execSync(`taskkill /T /F /PID ${serverChild.pid}`, { stdio: 'ignore', windowsHide: true }); } catch (_) {}
    serverChild = null;
  }
  killProcessOnPort(PORT);
  setTimeout(startServer, 1000);
}

// Periodic Health Checker & Auto-Healing (Runs every 20 seconds)
setInterval(() => {
  if (isShuttingDown || !serverChild) return;
  checkServerHealth((err, health) => {
    if (!err && health && health.status === 'healthy') {
      consecutiveFailures = 0;
      updateStatus({
        status: 'healthy',
        lastHealthCheck: new Date().toISOString()
      });
    } else {
      consecutiveFailures++;
      const errMsg = err ? err.message : 'Unknown server issue';
      log(`[Watchdog] ⚠️ Health check warning (${consecutiveFailures}/2): ${errMsg}`);
      updateStatus({
        status: 'health_warning',
        lastHealthError: errMsg
      });
      // 2 consecutive failures triggers auto-healing restart
      if (consecutiveFailures >= 2) {
        log('[Watchdog] 🚨 2 consecutive health failures detected. Initiating auto-healing restart...');
        consecutiveFailures = 0;
        forceRestartServer();
      }
    }
  });
}, 20000);

function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log('[Watchdog] Shutting down all processes gracefully...');

  if (serverChild && serverChild.pid) {
    try { execSync(`taskkill /T /F /PID ${serverChild.pid}`, { stdio: 'ignore', windowsHide: true }); } catch (_) {}
  }
  if (tunnelChild && tunnelChild.pid) {
    try { execSync(`taskkill /T /F /PID ${tunnelChild.pid}`, { stdio: 'ignore', windowsHide: true }); } catch (_) {}
  }
  try { execSync('taskkill /F /IM cloudflared.exe', { stdio: 'ignore', windowsHide: true }); } catch (_) {}
  killProcessOnPort(PORT);
  removeLock();
  updateStatus({ status: 'stopped' });
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

log('=======================================================');
log('[Watchdog] Market Pulse Host Watchdog Starting...');
log(`[Watchdog] Project Root: ${PROJECT_ROOT}`);
log(`[Watchdog] Port: ${PORT}`);
log('=======================================================');

startServer();
