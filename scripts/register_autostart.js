const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RUNNER_VBS = path.join(PROJECT_ROOT, 'scripts', 'host_runner.vbs');
const STARTUP_DIR = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const STARTUP_SHORTCUT_VBS = path.join(STARTUP_DIR, 'MarketPulseBotHost.vbs');
const REG_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const REG_VAL_NAME = 'MarketPulseBotHost';

const isUninstall = process.argv.includes('--uninstall');
const isStatus = process.argv.includes('--status');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return null;
  }
}

function checkRegistry() {
  const result = runCommand(`reg query "${REG_KEY}" /v "${REG_VAL_NAME}"`);
  return Boolean(result && result.includes(REG_VAL_NAME));
}

function checkStartupFolder() {
  return fs.existsSync(STARTUP_SHORTCUT_VBS);
}

if (isStatus) {
  console.log('========================================================');
  console.log('🔍 Market Pulse Windows Autostart Status Check');
  console.log('========================================================');
  const startupOk = checkStartupFolder();
  const regOk = checkRegistry();
  console.log(`1. Windows Startup Folder Shortcut: ${startupOk ? '✅ Active (Silent Background)' : '❌ Not Configured'}`);
  console.log(`2. Duplicate Registry Check:       ${regOk ? '⚠️ Detected (Will be cleaned to prevent duplicates)' : '✅ Clean'}`);
  console.log('========================================================');
  process.exit(startupOk ? 0 : 1);
}

if (isUninstall) {
  console.log('Removing Windows Autostart entries...');
  try {
    execSync(`reg delete "${REG_KEY}" /v "${REG_VAL_NAME}" /f`, { stdio: 'ignore' });
  } catch (e) {}

  if (fs.existsSync(STARTUP_SHORTCUT_VBS)) {
    try {
      fs.unlinkSync(STARTUP_SHORTCUT_VBS);
      console.log('✅ Removed Startup folder launcher.');
    } catch (e) {
      console.error('❌ Failed to delete startup folder file:', e.message);
    }
  } else {
    console.log('ℹ️ Startup folder launcher already removed.');
  }
  process.exit(0);
}

// INSTALL SINGLE-INSTANCE PERMANENT AUTOSTART
console.log('========================================================');
console.log('🚀 Configuring Clean Permanent 24/7 Windows Autostart...');
console.log(`Target Script: ${RUNNER_VBS}`);
console.log('========================================================');

// 1. Clean any duplicate registry entry (to prevent dual instance startup conflict)
try {
  execSync(`reg delete "${REG_KEY}" /v "${REG_VAL_NAME}" /f`, { stdio: 'ignore' });
  console.log('ℹ️ Cleaned duplicate Registry Run entry to prevent multiple instances.');
} catch (_) {}

// 2. Configure Windows Startup Folder (Single Silent Launcher)
try {
  if (!fs.existsSync(STARTUP_DIR)) {
    fs.mkdirSync(STARTUP_DIR, { recursive: true });
  }
  const startupVbsContent = `' Auto-generated Single-Instance Windows Startup Launcher for Market Pulse Bot
Dim objShell
Set objShell = CreateObject("WScript.Shell")
objShell.Run "wscript.exe ""${RUNNER_VBS}""", 0, False
Set objShell = Nothing
`;
  fs.writeFileSync(STARTUP_SHORTCUT_VBS, startupVbsContent, 'utf8');
  console.log('✅ [1/1] Windows Startup folder single silent auto-launcher installed!');
} catch (err) {
  console.error('❌ Failed to create Startup folder launcher:', err.message);
}

// Verification
const startupSuccess = checkStartupFolder();

console.log('--------------------------------------------------------');
if (startupSuccess) {
  console.log('🎉 100% SUCCESS: Permanent Clean Autostart is Active!');
  console.log('Market Pulse Bot will automatically launch once silently whenever your PC boots.');
} else {
  console.log('⚠️ Notice: Startup check returned a warning.');
}
console.log('========================================================');
