const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

process.on('uncaughtException', (err) => {
  console.error('[Tunnel] Trapped Uncaught Exception:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Tunnel] Trapped Unhandled Rejection:', reason?.message || reason);
});

const PORT = parseInt(process.env.PORT, 10) || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const CLOUDFLARED_BIN = path.join(__dirname, 'bin', 'cloudflared.exe');
const TUNNEL_FILE = path.join(DATA_DIR, 'tunnel_info.json');
const TUNNEL_TXT = path.join(__dirname, 'tunnel_url.txt');
const CF_TXT = path.join(__dirname, 'CLOUDFLARE_URL.txt');
const LOCK_FILE = path.join(DATA_DIR, 'tunnel.pid');
const DESKTOP_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\user', 'Desktop');

const FIXED_SUBDOMAIN = process.env.TUNNEL_SUBDOMAIN || 'market-live-ai-terminal';
let cachedPublicIp = '103.29.157.166';
let activeCloudflareUrl = '';
let activeLocaltunnelUrl = `https://${FIXED_SUBDOMAIN}.loca.lt`;

if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
}

async function fetchPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3500) });
    const data = await res.json();
    if (data && data.ip) {
      cachedPublicIp = data.ip;
      return cachedPublicIp;
    }
  } catch (_) {}
  return cachedPublicIp;
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    const list = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    return list.includes(String(pid));
  } catch (_) {
    return false;
  }
}

// Single-instance mutex
if (fs.existsSync(LOCK_FILE)) {
  try {
    const existingPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
    if (existingPid && existingPid !== process.pid && isPidAlive(existingPid)) {
      console.log(`[Tunnel] Another Tunnel process is already active (PID ${existingPid}). Exiting duplicate.`);
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

function updateDesktopShortcuts(cfUrl, ltUrl, ip) {
  try {
    if (fs.existsSync(DESKTOP_DIR)) {
      const primaryUrl = cfUrl || ltUrl || 'http://localhost:5000';

      // 1. Mobile dashboard URL shortcut
      const mobileShortcutPath = path.join(DESKTOP_DIR, 'MARKET MOBILE DASHBOARD.url');
      const shortcutContent = `[InternetShortcut]\nURL=${primaryUrl}\nIconIndex=0\n`;
      fs.writeFileSync(mobileShortcutPath, shortcutContent, 'utf8');

      // 2. Permanent Launcher HTML file (never changes, supports 1-click mobile access)
      const launcherHtmlPath = path.join(DESKTOP_DIR, 'MARKET_PORTAL_PERMANENT.html');
      const launcherContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Market Live AI Terminal - 100% Mobile Access</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem 1rem; box-sizing: border-box; }
    .card { background: #1e293b; padding: 2.2rem; border-radius: 20px; border: 1px solid #334155; max-width: 540px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); text-align: center; }
    h1 { color: #38bdf8; margin: 0 0 0.5rem 0; font-size: 1.6rem; font-weight: 800; }
    p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.2rem; line-height: 1.5; }
    .btn-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.4rem; }
    .link-btn-cf { display: block; background: linear-gradient(135deg, #059669, #10b981); color: #fff; padding: 14px 20px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 1.05rem; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4); transition: transform 0.15s; }
    .link-btn-cf:hover { transform: translateY(-2px); }
    .link-btn-preview { display: block; background: linear-gradient(135deg, #7c3aed, #9333ea); color: #fff; padding: 13px 20px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 0.98rem; border: none; cursor: pointer; width: 100%; box-sizing: border-box; box-shadow: 0 4px 16px rgba(147, 51, 234, 0.35); }
    .link-btn-preview:hover { transform: translateY(-2px); }
    .link-btn-lt { display: block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; padding: 11px 20px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 0.9rem; }
    .alt-btn { display: block; background: #334155; color: #e2e8f0; padding: 10px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 0.88rem; border: 1px solid #475569; }
    .badge { display: inline-block; background: #10b981; color: #000; font-size: 0.72rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 6px; }
    .qr-wrap { background: #fff; padding: 12px; border-radius: 12px; display: inline-block; margin: 12px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .qr-wrap img { display: block; width: 160px; height: 160px; }
    .info-box { background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 12px; padding: 14px; text-align: left; font-size: 0.85rem; color: #cbd5e1; margin-top: 1rem; }
    .ip-badge { display: inline-block; background: #0f172a; color: #38bdf8; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 1px solid #0284c7; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📈 Market Live AI Terminal</h1>
    <p>मोबाईलवर कुठेही 4G/5G वर सहज उघडण्यासाठी खालील लिंक किंवा QR कोड वापरा:</p>

    <div class="qr-wrap">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(primaryUrl)}" alt="Scan QR for Mobile Access" />
    </div>

    <div class="btn-group">
      ${cfUrl ? `<a class="link-btn-cf" href="${cfUrl}" target="_blank">🚀 मोबाईल डायरेक्ट लिंक (नो एरर, नो पासवर्ड)<span class="badge">100% WORKING</span></a>` : ''}
      <button class="link-btn-preview" onclick="window.open('${primaryUrl}?mobile_sim=1','MarketPulseMobile','width=412,height=915,resizable=yes,scrollbars=yes')">📱 मोबाईल प्रिव्ह्यू विंडो (Phone Preview Window)</button>
      <a class="link-btn-lt" href="${ltUrl || 'https://market-live-ai-terminal.loca.lt'}" target="_blank">🌐 फिक्स लिंक (Localtunnel)</a>
      <a class="alt-btn" href="http://192.168.101.4:5000">🏠 घरचे Wi-Fi (192.168.101.4:5000)</a>
      <a class="alt-btn" href="http://localhost:5000">💻 लोकल PC (localhost:5000)</a>
    </div>

    <div class="info-box">
      <strong>🔑 Localtunnel पासवर्ड (विचारल्यास):</strong><br>
      Host Public IP: <span class="ip-badge">${ip || '103.176.241.189'}</span>
      <p style="margin:6px 0 0 0;font-size:0.75rem;color:#94a3b8;">टीप: वरील हिरवी 'मोबाईल डायरेक्ट लिंक' वापरल्यास पासवर्ड किंवा 403 एरर येत नाही.</p>
    </div>
  </div>
</body>
</html>`;
      fs.writeFileSync(launcherHtmlPath, launcherContent, 'utf8');
      const localPortalPath = path.join(__dirname, 'MARKET_PORTAL_PERMANENT.html');
      fs.writeFileSync(localPortalPath, launcherContent, 'utf8');
    }
  } catch (err) {
    console.error('[Tunnel] Failed to update desktop shortcuts:', err.message);
  }
}

function updateTunnelStatus() {
  try {
    const fixedUrl = `https://${FIXED_SUBDOMAIN}.loca.lt`;
    const primaryUrl = activeCloudflareUrl || activeLocaltunnelUrl || fixedUrl;
    const info = {
      status: 'connected',
      url: primaryUrl,
      cloudflareUrl: activeCloudflareUrl || null,
      localtunnelUrl: fixedUrl,
      fixedUrl: fixedUrl,
      publicIp: cachedPublicIp,
      tunnelPassword: cachedPublicIp,
      port: PORT,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(TUNNEL_FILE, JSON.stringify(info, null, 2), 'utf8');
    fs.writeFileSync(TUNNEL_TXT, primaryUrl, 'utf8');
    if (activeCloudflareUrl) fs.writeFileSync(CF_TXT, activeCloudflareUrl, 'utf8');
    updateDesktopShortcuts(activeCloudflareUrl, fixedUrl, cachedPublicIp);
  } catch (_) {}
}

let activeLtInstance = null;
let cloudflareChild = null;
let isShuttingDown = false;
let ltReconnectTimer = null;
let cfReconnectTimer = null;

// ==========================================
// 1. CLOUDFLARE TUNNEL (100% 403-FREE & DIRECT)
let cfBackoffMs = 5000;

// ==========================================
// 1. CLOUDFLARE TUNNEL (100% 403-FREE & DIRECT)
// ==========================================
function startCloudflared() {
  if (isShuttingDown || cloudflareChild) return;
  if (!fs.existsSync(CLOUDFLARED_BIN)) {
    console.warn('[Tunnel] cloudflared.exe not found at:', CLOUDFLARED_BIN);
    return;
  }

  console.log('[Tunnel] Starting Cloudflare Tunnel (100% Mobile 403-Free Engine)...');

  try {
    cloudflareChild = spawn(CLOUDFLARED_BIN, [
      'tunnel',
      '--url', `http://127.0.0.1:${PORT}`,
      '--no-autoupdate',
      '--protocol', 'auto'
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    cloudflareChild.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes('status 429')) {
        console.warn('[Tunnel] Cloudflare quick tunnel rate-limited (429). Backing off 60s and maintaining active connection.');
        cfBackoffMs = 60000;
      } else if (text.includes('failed') || text.includes('ERR')) {
        console.warn('[Tunnel] Cloudflare notification:', text.trim());
      }
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && match[0]) {
        activeCloudflareUrl = match[0];
        cfBackoffMs = 5000;
        console.log('=======================================================');
        console.log('🚀 CLOUDFLARE 100% MOBILE DIRECT LINK (ZERO 403 ERRORS):');
        console.log(`📱 ${activeCloudflareUrl}`);
        console.log('✨ No passwords, no interstitial, works everywhere on 4G/5G!');
        console.log('=======================================================');
        updateTunnelStatus();
      }
    });

    cloudflareChild.stdout.on('data', (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && match[0]) {
        activeCloudflareUrl = match[0];
        cfBackoffMs = 5000;
        updateTunnelStatus();
      }
    });

    cloudflareChild.on('close', (code) => {
      cloudflareChild = null;
      if (!isShuttingDown) {
        if (code !== 0) {
          cfBackoffMs = Math.min(Math.max(cfBackoffMs * 1.5, 8000), 60000);
          console.warn(`[Tunnel] Cloudflare tunnel exited with code ${code}. Reconnecting in ${Math.round(cfBackoffMs / 1000)}s...`);
        } else {
          cfBackoffMs = 5000;
          console.warn(`[Tunnel] Cloudflare tunnel closed. Reconnecting in 5s...`);
        }
        clearTimeout(cfReconnectTimer);
        cfReconnectTimer = setTimeout(startCloudflared, cfBackoffMs);
      }
    });

    cloudflareChild.on('error', (err) => {
      console.error('[Tunnel] Cloudflare tunnel error:', err.message);
      cloudflareChild = null;
      if (!isShuttingDown) {
        cfBackoffMs = Math.min(cfBackoffMs * 1.5, 60000);
        clearTimeout(cfReconnectTimer);
        cfReconnectTimer = setTimeout(startCloudflared, cfBackoffMs);
      }
    });

  } catch (err) {
    console.error('[Tunnel] Failed to spawn cloudflared:', err.message);
  }
}

// ==========================================
// 2. LOCALTUNNEL (FIXED SUBDOMAIN FALLBACK)
// ==========================================
let ltConnecting = false;

async function startLocaltunnel() {
  if (isShuttingDown || ltConnecting || activeLtInstance) return;
  ltConnecting = true;

  console.log(`[Tunnel] Starting Localtunnel for Fixed Subdomain "${FIXED_SUBDOMAIN}"...`);
  await fetchPublicIp();

  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: FIXED_SUBDOMAIN
    });

    const publicUrl = tunnel.url;

    if (!publicUrl || !publicUrl.toLowerCase().includes(FIXED_SUBDOMAIN.toLowerCase())) {
      console.warn(`[Tunnel] Assigned temporary domain "${publicUrl}" while preferred lease clears.`);
    }

    activeLtInstance = tunnel;
    activeLocaltunnelUrl = publicUrl;
    ltConnecting = false;

    console.log('=======================================================');
    console.log(`📱 Localtunnel Fixed URL: ${publicUrl}`);
    console.log(`🔑 Localtunnel Host IP: ${cachedPublicIp}`);
    console.log('=======================================================');

    updateTunnelStatus();

    tunnel.on('close', () => {
      console.log('[Tunnel] Localtunnel closed. Reconnecting in 4s...');
      activeLtInstance = null;
      if (!isShuttingDown) {
        clearTimeout(ltReconnectTimer);
        ltReconnectTimer = setTimeout(startLocaltunnel, 4000);
      }
    });

    tunnel.on('error', (err) => {
      console.warn('[Tunnel] Localtunnel error:', err?.message || err);
      try { tunnel.close(); } catch (_) {}
      activeLtInstance = null;
      if (!isShuttingDown) {
        clearTimeout(ltReconnectTimer);
        ltReconnectTimer = setTimeout(startLocaltunnel, 4000);
      }
    });

  } catch (err) {
    console.warn('[Tunnel] Localtunnel connect warning:', err.message);
    ltConnecting = false;
    if (!isShuttingDown) {
      clearTimeout(ltReconnectTimer);
      ltReconnectTimer = setTimeout(startLocaltunnel, 5000);
    }
  }
}

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('[Tunnel] Cleaning up tunnel processes...');
  clearTimeout(cfReconnectTimer);
  clearTimeout(ltReconnectTimer);
  if (cloudflareChild) {
    try { cloudflareChild.kill(); } catch (_) {}
  }
  if (activeLtInstance) {
    try { activeLtInstance.close(); } catch (_) {}
  }
  removeLock();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start tunnels once local server is ready on port 5000
function waitForServerThenStart(retries = 10) {
  const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
    if (res.statusCode === 200) {
      startCloudflared();
      startLocaltunnel();
    } else if (retries > 0) {
      setTimeout(() => waitForServerThenStart(retries - 1), 1000);
    } else {
      startCloudflared();
      startLocaltunnel();
    }
  });
  req.on('error', () => {
    if (retries > 0) {
      setTimeout(() => waitForServerThenStart(retries - 1), 1000);
    } else {
      startCloudflared();
      startLocaltunnel();
    }
  });
  req.setTimeout(1500, () => req.destroy());
}

waitForServerThenStart();
