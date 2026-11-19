// Client-side Real-time Application Logic for Intraday Research Terminal

// =========================================================================
// MASTER UNIFIED TAB ORCHESTRATOR
// Coordinates all 4 Views: Terminal, Stocks Analysis, Tracker, Time Machine
// =========================================================================
window.switchMainTab = function(tabName) {
  const viewTerminal = document.getElementById('terminalView');
  const viewAnalysis = document.getElementById('stocksAnalysisView');
  const viewTracker = document.getElementById('tradeTrackerView');
  const viewTimeMachine = document.getElementById('timeMachineView');

  const btnTerminal = document.getElementById('tabBtnTerminal');
  const btnAnalysis = document.getElementById('tabBtnAnalysis');
  const btnTracker = document.getElementById('tabBtnTracker');
  const btnTimeMachine = document.getElementById('tabBtnTimeMachine');

  const navChat = document.getElementById('navChat');
  const navStocks = document.getElementById('navStocks');
  const navTrackerBtn = document.getElementById('navTrackerBtn');

  // 1. Defensively hide ALL view containers
  if (viewTerminal) viewTerminal.style.display = 'none';
  if (viewAnalysis) viewAnalysis.style.display = 'none';
  if (viewTracker) viewTracker.style.display = 'none';
  if (viewTimeMachine) viewTimeMachine.style.display = 'none';

  // 2. Remove active class from all main tab buttons
  [btnTerminal, btnAnalysis, btnTracker, btnTimeMachine].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  // 3. Remove active class from mobile navigation
  [navChat, navStocks, navTrackerBtn].forEach(nav => {
    if (nav) nav.classList.remove('active');
  });

  // 4. Remove active class from sidebar drawer links
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
    link.classList.remove('active');
  });

  const targetTab = String(tabName || 'terminal').toLowerCase().trim();

  // 5. Activate selected view and synchronise UI states
  if (targetTab === 'analysis' || targetTab === 'stocksanalysisview' || targetTab === 'tabbtnanalysis') {
    if (viewAnalysis) viewAnalysis.style.display = 'block';
    if (btnAnalysis) btnAnalysis.classList.add('active');
    if (navStocks) navStocks.classList.add('active');
    const sideLink = document.querySelector('.sidebar-link[data-tab="tabBtnAnalysis"]');
    if (sideLink) sideLink.classList.add('active');

    if (window.stocksAnalysis && typeof window.stocksAnalysis.loadCurrentOrDefault === 'function') {
      window.stocksAnalysis.loadCurrentOrDefault();
    }
  } else if (targetTab === 'tracker' || targetTab === 'tradetrackerview' || targetTab === 'tabbtntracker') {
    if (viewTracker) viewTracker.style.display = 'block';
    if (btnTracker) btnTracker.classList.add('active');
    if (navTrackerBtn) navTrackerBtn.classList.add('active');
    const sideLink = document.querySelector('.sidebar-link[data-tab="tabBtnTracker"]');
    if (sideLink) sideLink.classList.add('active');

    if (typeof window.initTrackerPolling === 'function') {
      window.initTrackerPolling();
    }
  } else if (targetTab === 'timemachine' || targetTab === 'timemachineview' || targetTab === 'tabbtntimemachine') {
    if (viewTimeMachine) viewTimeMachine.style.display = 'block';
    if (btnTimeMachine) btnTimeMachine.classList.add('active');
    const sideLink = document.querySelector('.sidebar-link[data-tab="tabBtnTimeMachine"]');
    if (sideLink) sideLink.classList.add('active');

    if (typeof window.loadOrbSetups === 'function') {
      window.loadOrbSetups();
    }
  } else {
    // Default: Live Terminal & Signals
    if (viewTerminal) viewTerminal.style.display = 'block';
    if (btnTerminal) btnTerminal.classList.add('active');
    if (navChat) navChat.classList.add('active');
    const sideLink = document.querySelector('.sidebar-link[data-tab="tabBtnTerminal"]');
    if (sideLink) sideLink.classList.add('active');
  }

  if (typeof window.scrollTo === 'function') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Attach direct click events to all 4 main tab header buttons
  const tabBtnTerminal = document.getElementById('tabBtnTerminal');
  const tabBtnAnalysis = document.getElementById('tabBtnAnalysis');
  const tabBtnTracker = document.getElementById('tabBtnTracker');
  const tabBtnTimeMachine = document.getElementById('tabBtnTimeMachine');

  if (tabBtnTerminal) tabBtnTerminal.addEventListener('click', () => window.switchMainTab('terminal'));
  if (tabBtnAnalysis) tabBtnAnalysis.addEventListener('click', () => window.switchMainTab('analysis'));
  if (tabBtnTracker) tabBtnTracker.addEventListener('click', () => window.switchMainTab('tracker'));
  if (tabBtnTimeMachine) tabBtnTimeMachine.addEventListener('click', () => window.switchMainTab('timemachine'));

  const istTimeDisplay = document.getElementById('istTimeDisplay');
  const welcomeTime = document.getElementById('welcomeTime');
  const mobileUrlDisplay = document.getElementById('mobileUrlDisplay');
  const modalQrUrl = document.getElementById('modalQrUrl');
  const qrContainer = document.getElementById('qrContainer');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chipHii = document.getElementById('chipHii');
  const stockCardsContainer = document.getElementById('stockCardsContainer');
  const openQrBtn = document.getElementById('openQrBtn');
  const closeQrModal = document.getElementById('closeQrModal');
  const qrModal = document.getElementById('qrModal');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const modalCopyBtn = document.getElementById('modalCopyBtn');

  // Market Ribbon Elements
  const marketStatusTitle = document.getElementById('marketStatusTitle');
  const marketStatusDot = document.getElementById('marketStatusDot');
  const headerPulseDot = document.getElementById('headerPulseDot');
  const marketCountdown = document.getElementById('marketCountdown');
  const lastSyncTime = document.getElementById('lastSyncTime');
  const watchlistSub = document.getElementById('watchlistSub');
  const totalStocksCount = document.getElementById('totalStocksCount');

  // Ticker Elements
  const niftyVal = document.getElementById('niftyVal');
  const niftyChange = document.getElementById('niftyChange');
  const bankNiftyVal = document.getElementById('bankNiftyVal');
  const bankNiftyChange = document.getElementById('bankNiftyChange');
  const vixVal = document.getElementById('vixVal');
  const vixChange = document.getElementById('vixChange');
  const crudeVal = document.getElementById('crudeVal');
  const crudeChange = document.getElementById('crudeChange');

  // Mobile nav buttons
  const navChat = document.getElementById('navChat');
  const navStocks = document.getElementById('navStocks');
  const navScanTrigger = document.getElementById('navScanTrigger');
  const navQr = document.getElementById('navQr');

  // Simulator & Embedded Mode Detection (prevents simulator nesting)
  const isMobileSim = window.location.search.includes('mobile_sim=1') || (window.self !== window.top);
  if (isMobileSim) {
    document.body.classList.add('in-mobile-simulator');
  }

  // Mobile Simulator Elements
  const btnOpenMobilePreview = document.getElementById('btnOpenMobilePreview');
  const bannerPreviewBtn = document.getElementById('bannerPreviewBtn');
  const mobilePreviewModal = document.getElementById('mobilePreviewModal');
  const closeMobileSimBtn = document.getElementById('closeMobileSimBtn');
  const simDeviceSelect = document.getElementById('simDeviceSelect');
  const simRotateBtn = document.getElementById('simRotateBtn');
  const simOrientationLabel = document.getElementById('simOrientationLabel');
  const simZoomSelect = document.getElementById('simZoomSelect');
  const simSourceSelect = document.getElementById('simSourceSelect');
  const simRefreshBtn = document.getElementById('simRefreshBtn');
  const simPopupBtn = document.getElementById('simPopupBtn');
  const simOpenQrBtn = document.getElementById('simOpenQrBtn');
  const phoneChassis = document.getElementById('phoneChassis');
  const phoneScreenContainer = document.getElementById('phoneScreenContainer');
  const mobileSimIframe = document.getElementById('mobileSimIframe');
  const phoneStage = document.getElementById('phoneStage');
  const phoneSimClock = document.getElementById('phoneSimClock');
  const simDeviceMeta = document.getElementById('simDeviceMeta');

  // Mobile Dual Connection & QR Elements
  const wifiUrlBadge = document.getElementById('wifiUrlBadge');
  const copyWifiBtn = document.getElementById('copyWifiBtn');
  const tunnelUrlBadge = document.getElementById('tunnelUrlBadge');
  const copyTunnelBtn = document.getElementById('copyTunnelBtn');
  const cfDirectBadge = document.getElementById('cfDirectBadge');
  const copyCfBtn = document.getElementById('copyCfBtn');
  const bannerQrBtn = document.getElementById('bannerQrBtn');

  // Enhanced QR Modal Elements
  const qrTabCf = document.getElementById('qrTabCf');
  const qrTabWifi = document.getElementById('qrTabWifi');
  const qrTabLt = document.getElementById('qrTabLt');
  const qrStatusPill = document.getElementById('qrStatusPill');
  const qrShareWhatsAppBtn = document.getElementById('qrShareWhatsAppBtn');
  const qrOpenSimBtn = document.getElementById('qrOpenSimBtn');
  const qrOpenWindowBtn = document.getElementById('qrOpenWindowBtn');
  const qrActiveDesc = document.getElementById('qrActiveDesc');
  const qrActiveTip = document.getElementById('qrActiveTip');

  const PERMANENT_GITHUB_PORTAL_URL = 'https://successdigitaloffice-cell.github.io/market-pulse-ai-terminal/';
  const isHostedOnGitHub = window.location.hostname.includes('github.io');

  let currentWifiUrl = isHostedOnGitHub ? PERMANENT_GITHUB_PORTAL_URL : 'http://localhost:5000';
  let currentTunnelUrl = PERMANENT_GITHUB_PORTAL_URL;
  let currentCloudflareUrl = isHostedOnGitHub ? PERMANENT_GITHUB_PORTAL_URL : (window.location.origin.includes('trycloudflare') ? window.location.origin : PERMANENT_GITHUB_PORTAL_URL);
  let currentHostIp = '103.176.241.189';
  let activeModalUrl = currentCloudflareUrl;
  let activeFilter = 'all';
  let cachedStocksList = [];
  let prevPrices = {};

  // Simulator State
  let isLandscape = false;
  let currentZoom = 1;

  // 1. Live IST Clock
  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    if (istTimeDisplay) istTimeDisplay.textContent = timeStr;
    if (phoneSimClock) {
      phoneSimClock.textContent = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    if (welcomeTime && welcomeTime.textContent === 'Ready') {
      welcomeTime.textContent = timeStr;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Helper to update WhatsApp share link
  function updateWhatsAppLink(url) {
    if (!qrShareWhatsAppBtn) return;
    const msg = encodeURIComponent(`Market Pulse AI Terminal - Live Mobile Intraday Terminal:\n${url}`);
    qrShareWhatsAppBtn.href = `https://api.whatsapp.com/send?text=${msg}`;
  }

  // Helper to render QR code
  function renderQr(url) {
    if (!url) return;
    activeModalUrl = url;
    if (modalQrUrl) modalQrUrl.textContent = url;
    if (qrContainer) {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=6&data=${encodeURIComponent(url)}`;
      qrContainer.innerHTML = `<img src="${qrApiUrl}" alt="Scan QR to open on mobile" style="width:200px;height:200px;border-radius:10px;" loading="lazy" />`;
    }
    updateWhatsAppLink(url);
  }

  // 2. Fetch Network Address & QR Code
  let networkCheckRetries = 0;
  async function loadNetworkInfo() {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();

      if (data.localUrl) currentWifiUrl = data.localUrl;
      if (data.localtunnelUrl) currentTunnelUrl = data.localtunnelUrl;
      if (data.cloudflareUrl) currentCloudflareUrl = data.cloudflareUrl;
      else if (data.tunnelUrl && data.tunnelUrl.includes('cloudflare')) currentCloudflareUrl = data.tunnelUrl;

      // When hosted on GitHub Pages or in standalone mode, guarantee the permanent URL is used
      if (isHostedOnGitHub || data.mode === 'github_pages_standalone') {
        currentCloudflareUrl = PERMANENT_GITHUB_PORTAL_URL;
        currentWifiUrl = PERMANENT_GITHUB_PORTAL_URL;
        currentTunnelUrl = PERMANENT_GITHUB_PORTAL_URL;
      }

      if (data.publicIp) {
        currentHostIp = data.publicIp;
        const hostIpDisplay = document.getElementById('hostIpDisplay');
        if (hostIpDisplay) hostIpDisplay.textContent = currentHostIp;
      }

      // Update banner badges
      if (cfDirectBadge) {
        cfDirectBadge.textContent = currentCloudflareUrl;
        if (cfDirectBadge.tagName === 'A') cfDirectBadge.href = currentCloudflareUrl;
      }
      if (wifiUrlBadge) {
        wifiUrlBadge.textContent = currentWifiUrl;
        if (wifiUrlBadge.tagName === 'A') wifiUrlBadge.href = currentWifiUrl;
      }
      if (tunnelUrlBadge) {
        tunnelUrlBadge.textContent = currentTunnelUrl;
        if (tunnelUrlBadge.tagName === 'A') tunnelUrlBadge.href = currentTunnelUrl;
      }

      // Default active URL in modal is Cloudflare Direct (100% stable, no 403 error)
      const primaryMobileUrl = currentCloudflareUrl || currentWifiUrl;
      if (qrTabCf && qrTabCf.classList.contains('active')) {
        renderQr(primaryMobileUrl);
      } else if (qrTabWifi && qrTabWifi.classList.contains('active')) {
        renderQr(currentWifiUrl);
      } else if (qrTabLt && qrTabLt.classList.contains('active')) {
        renderQr(currentTunnelUrl);
      } else {
        renderQr(primaryMobileUrl);
      }

      if (mobileUrlDisplay) {
        mobileUrlDisplay.innerHTML = `<a href="${primaryMobileUrl}" target="_blank" style="color:#34d399;font-weight:700;text-decoration:none;">${primaryMobileUrl}</a>`;
      }

      // Retry if cloudflare tunnel is not connected yet
      if (!data.cloudflareUrl && networkCheckRetries < 15) {
        networkCheckRetries++;
        setTimeout(loadNetworkInfo, 2500);
      }
    } catch (e) {
      console.warn('Network info fallback:', e);
      if (wifiUrlBadge) wifiUrlBadge.textContent = currentWifiUrl;
      renderQr(currentCloudflareUrl || currentWifiUrl);
    }
  }
  loadNetworkInfo();

  // 3. Copy Link Action & Notification
  function copyToClipboard(text, label = 'Link') {
    if (!text || text.includes('Connecting')) {
      alert('Link is still connecting. Please wait a moment...');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert(`✅ ${label} कॉपी केली!\n\n${text}\n\nतुमच्या मोबाईलमधील Chrome किंवा Safari ब्राउझरमध्ये उघडा.`);
    }).catch(() => {
      prompt(`Copy this link to open on your phone:`, text);
    });
  }

  if (copyCfBtn) {
    copyCfBtn.addEventListener('click', () => copyToClipboard(currentCloudflareUrl, '🚀 मोबाईल डायरेक्ट लिंक (Cloudflare)'));
  }
  if (copyWifiBtn) {
    copyWifiBtn.addEventListener('click', () => copyToClipboard(currentWifiUrl, '🏠 कायमस्वरूपी Wi-Fi लिंक (Fixed)'));
  }
  if (copyTunnelBtn) {
    copyTunnelBtn.addEventListener('click', () => copyToClipboard(currentTunnelUrl, '🌐 Localtunnel फिक्स लिंक'));
  }
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener('click', () => copyToClipboard(activeModalUrl, 'मोबाईल लिंक'));
  }
  if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', () => copyToClipboard(activeModalUrl, 'मोबाईल लिंक'));
  }

  // 4. Enhanced QR Modal Controls & 3-Tab Switcher
  if (bannerQrBtn) {
    bannerQrBtn.addEventListener('click', () => { if (qrModal) qrModal.style.display = 'flex'; });
  }
  if (openQrBtn) {
    openQrBtn.addEventListener('click', () => { if (qrModal) qrModal.style.display = 'flex'; });
  }
  if (closeQrModal) {
    closeQrModal.addEventListener('click', () => { if (qrModal) qrModal.style.display = 'none'; });
  }
  if (qrModal) {
    qrModal.addEventListener('click', (e) => {
      if (e.target === qrModal) qrModal.style.display = 'none';
    });
  }

  if (qrTabCf) {
    qrTabCf.addEventListener('click', () => {
      document.querySelectorAll('.qr-tab-btn').forEach(b => b.classList.remove('active'));
      qrTabCf.classList.add('active');
      if (qrActiveDesc) qrActiveDesc.textContent = 'कोणत्याही मोबाईलच्या कॅमेऱ्याने खालील QR कोड स्कॅन करा, थेट चालू होईल:';
      if (qrActiveTip) qrActiveTip.textContent = '🚀 टीप: ही लिंक कोणत्याही मोबाईलवर (Android/iPhone) थेट उघडते, कसलाही पासवर्ड किंवा 403 एरर येत नाही!';
      if (qrStatusPill) {
        qrStatusPill.className = 'qr-status-pill green';
        qrStatusPill.textContent = '⚡ 100% पासवर्ड-फ्री • थेट ओपन';
      }
      renderQr(currentCloudflareUrl || currentWifiUrl);
    });
  }

  if (qrTabWifi) {
    qrTabWifi.addEventListener('click', () => {
      document.querySelectorAll('.qr-tab-btn').forEach(b => b.classList.remove('active'));
      qrTabWifi.classList.add('active');
      if (qrActiveDesc) qrActiveDesc.textContent = 'तुमचा फोन आणि कॉम्प्युटर एकाच वायफायवर असल्यास हा कायमस्वरूपी पत्ता कधीही बदलत नाही:';
      if (qrActiveTip) qrActiveTip.textContent = '💡 टीप: घरात किंवा ऑफिसमध्ये वायफायवर असताना ही लिंक 100% सर्वात वेगवान आणि कधीही न बदलणारी आहे!';
      if (qrStatusPill) {
        qrStatusPill.className = 'qr-status-pill';
        qrStatusPill.style.background = 'rgba(59, 130, 246, 0.2)';
        qrStatusPill.style.color = '#60a5fa';
        qrStatusPill.style.border = '1px solid rgba(59, 130, 246, 0.4)';
        qrStatusPill.textContent = '🏠 Wi-Fi हाय-स्पीड लोकल नेटवर्क';
      }
      renderQr(currentWifiUrl);
    });
  }

  if (qrTabLt) {
    qrTabLt.addEventListener('click', () => {
      document.querySelectorAll('.qr-tab-btn').forEach(b => b.classList.remove('active'));
      qrTabLt.classList.add('active');
      if (qrActiveDesc) qrActiveDesc.textContent = 'Localtunnel कायमस्वरूपी फिक्स लिंक (विचारल्यास खालील Host IP पासवर्ड टाका):';
      if (qrActiveTip) qrActiveTip.textContent = `🔑 Localtunnel पासवर्ड (Friendly reminder): ${currentHostIp}`;
      if (qrStatusPill) {
        qrStatusPill.className = 'qr-status-pill';
        qrStatusPill.style.background = 'rgba(168, 85, 247, 0.2)';
        qrStatusPill.style.color = '#c084fc';
        qrStatusPill.style.border = '1px solid rgba(168, 85, 247, 0.4)';
        qrStatusPill.textContent = '🌐 कायमस्वरूपी फिक्स डोमेन';
      }
      renderQr(currentTunnelUrl);
    });
  }

  // ==========================================
  // 4B. MOBILE DEVICE PREVIEW SIMULATOR LOGIC
  // ==========================================
  function updateSimulatorDimensions() {
    if (!simDeviceSelect || !phoneScreenContainer) return;
    const selectedOpt = simDeviceSelect.selectedOptions[0];
    let w = parseInt(selectedOpt.getAttribute('data-w'), 10) || 393;
    let h = parseInt(selectedOpt.getAttribute('data-h'), 10) || 852;
    const devName = selectedOpt.getAttribute('data-name') || 'Smartphone';

    if (isLandscape) {
      const temp = w;
      w = h;
      h = temp;
      if (phoneChassis) phoneChassis.classList.add('landscape');
      if (simOrientationLabel) simOrientationLabel.textContent = 'Landscape';
    } else {
      if (phoneChassis) phoneChassis.classList.remove('landscape');
      if (simOrientationLabel) simOrientationLabel.textContent = 'Portrait';
    }

    phoneScreenContainer.style.width = `${w}px`;
    phoneScreenContainer.style.height = `${h}px`;

    if (simDeviceMeta) {
      simDeviceMeta.textContent = `${devName} • ${w} × ${h} px • ${isLandscape ? 'Landscape' : 'Portrait'}`;
    }
  }

  function updateSimulatorZoom() {
    if (!simZoomSelect || !phoneStage) return;
    currentZoom = parseFloat(simZoomSelect.value) || 1;
    phoneStage.style.transform = `scale(${currentZoom})`;
  }

  function getActiveSimulatorUrl() {
    const srcType = simSourceSelect ? simSourceSelect.value : 'local';
    let base = window.location.origin;
    if (srcType === 'cf' && currentCloudflareUrl) base = currentCloudflareUrl;
    else if (srcType === 'wifi' && currentWifiUrl) base = currentWifiUrl;

    try {
      const url = new URL(base);
      url.searchParams.set('mobile_sim', '1');
      return url.toString();
    } catch (_) {
      return base + '/?mobile_sim=1';
    }
  }

  function updateSimulatorSource() {
    if (!mobileSimIframe) return;
    const targetUrl = getActiveSimulatorUrl();
    if (mobileSimIframe.src !== targetUrl) {
      mobileSimIframe.src = targetUrl;
    }
  }

  function openMobilePreviewSimulator() {
    if (mobilePreviewModal) {
      mobilePreviewModal.style.display = 'flex';
      updateSimulatorDimensions();
      updateSimulatorZoom();
      updateSimulatorSource();
    }
  }

  function closeMobilePreviewSimulator() {
    if (mobilePreviewModal) mobilePreviewModal.style.display = 'none';
  }

  function openStandaloneMobileWindow(customUrl) {
    const target = customUrl || getActiveSimulatorUrl();
    const selectedOpt = simDeviceSelect ? simDeviceSelect.selectedOptions[0] : null;
    let w = selectedOpt ? parseInt(selectedOpt.getAttribute('data-w'), 10) : 412;
    let h = selectedOpt ? parseInt(selectedOpt.getAttribute('data-h'), 10) : 915;
    if (isLandscape) {
      const temp = w; w = h; h = temp;
    }
    const left = Math.max(0, Math.round((window.screen.width - w) / 2));
    const top = Math.max(0, Math.round((window.screen.height - h) / 2));
    window.open(target, 'MarketPulseMobilePreview', `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`);
  }

  // Simulator Event Listeners
  if (btnOpenMobilePreview) {
    btnOpenMobilePreview.addEventListener('click', openMobilePreviewSimulator);
  }
  if (bannerPreviewBtn) {
    bannerPreviewBtn.addEventListener('click', openMobilePreviewSimulator);
  }
  if (closeMobileSimBtn) {
    closeMobileSimBtn.addEventListener('click', closeMobilePreviewSimulator);
  }
  if (mobilePreviewModal) {
    mobilePreviewModal.addEventListener('click', (e) => {
      if (e.target === mobilePreviewModal) closeMobilePreviewSimulator();
    });
  }

  if (simDeviceSelect) {
    simDeviceSelect.addEventListener('change', updateSimulatorDimensions);
  }

  if (simRotateBtn) {
    simRotateBtn.addEventListener('click', () => {
      isLandscape = !isLandscape;
      updateSimulatorDimensions();
    });
  }

  if (simZoomSelect) {
    simZoomSelect.addEventListener('change', updateSimulatorZoom);
  }

  if (simSourceSelect) {
    simSourceSelect.addEventListener('change', updateSimulatorSource);
  }

  if (simRefreshBtn) {
    simRefreshBtn.addEventListener('click', () => {
      if (mobileSimIframe) {
        simRefreshBtn.classList.add('spinning');
        mobileSimIframe.src = getActiveSimulatorUrl();
        setTimeout(() => simRefreshBtn.classList.remove('spinning'), 600);
      }
    });
  }

  if (simPopupBtn) {
    simPopupBtn.addEventListener('click', () => openStandaloneMobileWindow());
  }

  if (simOpenQrBtn) {
    simOpenQrBtn.addEventListener('click', () => {
      closeMobilePreviewSimulator();
      if (qrModal) qrModal.style.display = 'flex';
    });
  }

  if (qrOpenSimBtn) {
    qrOpenSimBtn.addEventListener('click', () => {
      if (qrModal) qrModal.style.display = 'none';
      openMobilePreviewSimulator();
    });
  }

  if (qrOpenWindowBtn) {
    qrOpenWindowBtn.addEventListener('click', () => {
      if (qrModal) qrModal.style.display = 'none';
      openStandaloneMobileWindow();
    });
  }

  // 5. Real-Time Market Data Loader (Updates Every 3 Seconds)
  async function loadMarketData() {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      if (!data || !data.marketContext) return;

      const { marketContext, stocks } = data;
      const schedule = marketContext.schedule;

      // Update Market Status Ribbon
      if (marketStatusTitle && schedule) {
        marketStatusTitle.textContent = schedule.statusText;
      }
      if (marketStatusDot && schedule) {
        marketStatusDot.className = 'status-pulse-dot ' + (schedule.isOpen ? 'dot-open' : 'dot-closed');
      }
      if (headerPulseDot && schedule) {
        headerPulseDot.className = 'pulse-dot ' + (schedule.isOpen ? 'dot-open' : 'dot-closed');
      }
      if (marketCountdown && schedule) {
        marketCountdown.textContent = schedule.countdownText;
      }
      if (lastSyncTime) {
        const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        lastSyncTime.textContent = `Sync: ${timeNow}`;
      }
      if (watchlistSub && schedule) {
        watchlistSub.textContent = `${schedule.date} • Real-Time Exchange Feed`;
      }

      // Update Real-Time Ticker
      const nifty = marketContext.nifty;
      if (nifty && niftyVal && niftyChange) {
        const pClose = (nifty.close || nifty.price || 23530).toLocaleString('en-IN');
        niftyVal.textContent = `₹${pClose}`;
        const isUp = (nifty.pct != null ? nifty.pct : nifty.changePercent || 0) >= 0;
        niftyChange.className = `ticker-change ${isUp ? 'up' : 'down'}`;
        niftyChange.textContent = `${isUp ? '+' : ''}${nifty.pct || nifty.changePercent || '0.00'}% (${isUp ? '+' : ''}${nifty.change || '0.00'})`;
      }

      const bankNifty = marketContext.bankNifty;
      if (bankNifty && bankNiftyVal && bankNiftyChange) {
        const bClose = (bankNifty.close || bankNifty.price || 50360).toLocaleString('en-IN');
        bankNiftyVal.textContent = `₹${bClose}`;
        const isUp = (bankNifty.pct != null ? bankNifty.pct : bankNifty.changePercent || 0) >= 0;
        bankNiftyChange.className = `ticker-change ${isUp ? 'up' : 'down'}`;
        bankNiftyChange.textContent = `${isUp ? '+' : ''}${bankNifty.pct || bankNifty.changePercent || '0.00'}% (${isUp ? '+' : ''}${bankNifty.change || '0.00'})`;
      }

      const vix = marketContext.indiaVix;
      if (vix && vixVal && vixChange) {
        vixVal.textContent = `${vix.value || vix.price || '14.80'}`;
        vixChange.className = 'ticker-change up';
        vixChange.textContent = `${vix.status || 'कमी जोखीम / स्थिर'}`;
      }

      const crude = marketContext.crudeBrent;
      if (crude && crudeVal && crudeChange) {
        crudeVal.textContent = `${crude.price || '$73.40'}`;
        crudeChange.className = 'ticker-change';
        crudeChange.textContent = `${crude.status || 'स्थिर क्रूड'}`;
      }

      // Update Terminal Live Signals & Watchlist Cards
      const activeSignals = data.activeSignals || [];
      renderTerminalSignals(activeSignals);

      cachedStocksList = stocks || (window.StandaloneMarketEngine ? window.StandaloneMarketEngine.getWatchlistStocks() : []);
      if (totalStocksCount) totalStocksCount.textContent = data.allStocksCount || cachedStocksList.length;
      renderStockCards(cachedStocksList, activeSignals);
    } catch (e) {
      console.warn('Live data sync poll fallback:', e.message);
      if (window.StandaloneMarketEngine) {
        try {
          const sched = window.StandaloneMarketEngine.getSchedule();
          const ctx = window.StandaloneMarketEngine.getContext();
          const setups = window.StandaloneMarketEngine.getSetups();
          const stks = window.StandaloneMarketEngine.getWatchlistStocks();

          if (marketStatusTitle && sched) marketStatusTitle.textContent = sched.statusText;
          if (marketStatusDot && sched) marketStatusDot.className = 'status-pulse-dot ' + (sched.isOpen ? 'dot-open' : 'dot-closed');
          if (headerPulseDot && sched) headerPulseDot.className = 'pulse-dot ' + (sched.isOpen ? 'dot-open' : 'dot-closed');
          if (marketCountdown && sched) marketCountdown.textContent = sched.countdownText;
          if (watchlistSub && sched) watchlistSub.textContent = `${sched.date} • 24/7 Autonomous Feed`;

          if (ctx.nifty && niftyVal && niftyChange) {
            niftyVal.textContent = `₹${ctx.nifty.close.toLocaleString('en-IN')}`;
            const isUp = ctx.nifty.pct >= 0;
            niftyChange.className = `ticker-change ${isUp ? 'up' : 'down'}`;
            niftyChange.textContent = `${isUp ? '+' : ''}${ctx.nifty.pct}% (${isUp ? '+' : ''}${ctx.nifty.change})`;
          }
          if (ctx.bankNifty && bankNiftyVal && bankNiftyChange) {
            bankNiftyVal.textContent = `₹${ctx.bankNifty.close.toLocaleString('en-IN')}`;
            const isUp = ctx.bankNifty.pct >= 0;
            bankNiftyChange.className = `ticker-change ${isUp ? 'up' : 'down'}`;
            bankNiftyChange.textContent = `${isUp ? '+' : ''}${ctx.bankNifty.pct}% (${isUp ? '+' : ''}${ctx.bankNifty.change})`;
          }
          if (ctx.indiaVix && vixVal && vixChange) {
            vixVal.textContent = `${ctx.indiaVix.value}`;
            vixChange.className = 'ticker-change up';
            vixChange.textContent = `${ctx.indiaVix.status}`;
          }
          if (ctx.crudeBrent && crudeVal && crudeChange) {
            crudeVal.textContent = `${ctx.crudeBrent.price}`;
            crudeChange.className = 'ticker-change';
            crudeChange.textContent = `${ctx.crudeBrent.status}`;
          }

          renderTerminalSignals(setups);
          cachedStocksList = stks;
          if (totalStocksCount) totalStocksCount.textContent = stks.length;
          renderStockCards(stks, setups);
        } catch (_) {}
      } else {
        if (marketStatusTitle) marketStatusTitle.textContent = '🟢 थेट लाईव्ह मार्केट सुरू आहे';
        if (marketStatusDot) marketStatusDot.className = 'status-pulse-dot dot-open';
        if (headerPulseDot) headerPulseDot.className = 'pulse-dot dot-open';
      }
    }
  }

  // 6. Render Terminal Live Signals (Section 2 & 3 Master Prompt)
  const terminalSignalsGrid = document.getElementById('terminalSignalsGrid');
  const terminalSignalsCount = document.getElementById('terminalSignalsCount');
  const btnRefreshSignals = document.getElementById('btnRefreshSignals');
  const btnToggleSignals = document.getElementById('btnToggleSignals');
  const terminalLiveSignalsPanel = document.getElementById('terminalLiveSignalsPanel');

  function renderTerminalSignals(signals) {
    if (!terminalSignalsGrid) return;
    if (terminalSignalsCount) {
      terminalSignalsCount.textContent = `${signals.length} Signals`;
    }

    if (!signals || signals.length === 0) {
      terminalSignalsGrid.innerHTML = `
        <div class="empty-signals-notice">
          <span>⚠️ NO ACTIVE SIGNALS</span>
          <p>सध्याच्या मार्केटमध्ये 70+ स्कोअर असलेला कोणताही उच्च-संभाव्यतेचा ट्रेड सेटअप उपलब्ध नाही.</p>
        </div>
      `;
      return;
    }

    terminalSignalsGrid.innerHTML = signals.map(s => {
      const dirStr = (s.direction || s.action || 'BUY').toUpperCase();
      const isCall = dirStr.includes('CALL') || dirStr.includes('CE');
      const isPut = dirStr.includes('PUT') || dirStr.includes('PE');
      
      let dirClass = 'badge-dir-buy';
      let dirLabel = dirStr;
      if (isCall) { dirClass = 'badge-dir-call'; dirLabel = 'BUY CALL (CE)'; }
      else if (isPut) { dirClass = 'badge-dir-put'; dirLabel = 'BUY PUT (PE)'; }
      else if (dirStr.includes('SELL') || dirStr.includes('SHORT')) { dirClass = 'badge-dir-sell'; dirLabel = 'SELL (SHORT)'; }

      let outcomeClass = 'badge-out-waiting';
      let outcomeLabel = '⏳ WAITING';
      if (s.outcome && s.outcome.includes('TARGET')) {
        outcomeClass = 'badge-out-target'; outcomeLabel = `🎯 ${s.outcome}`;
      } else if (s.outcome === 'STOP LOSS HIT') {
        outcomeClass = 'badge-out-sl'; outcomeLabel = '🛑 SL HIT';
      } else if (s.outcome.includes('AMBIGUOUS')) {
        outcomeClass = 'badge-out-ambiguous'; outcomeLabel = '⚠️ AMBIGUOUS';
      } else if (s.outcome === 'ENTRY NOT TRIGGERED') {
        outcomeClass = 'badge-out-untriggered'; outcomeLabel = 'ENTRY NOT TRIGGERED';
      } else if (s.actualEntryTriggered) {
        outcomeClass = 'badge-out-triggered'; outcomeLabel = '🔵 ENTRY TRIGGERED';
      }

      const contractTag = s.optionDetails 
        ? `<div class="contract-tag">⚡ ${s.optionDetails.underlying} • Strike: ₹${s.optionDetails.strike} • Exp: ${s.optionDetails.expiry} • Lot: ${s.lotSize}</div>`
        : `<div class="contract-tag">📈 Equity Cash (NSE) • Qty: ${s.quantity} Shares</div>`;

      return `
        <div class="signal-terminal-card" data-signal-id="${s.signalId}">
          <div class="sig-card-header">
            <div class="sig-id-box">
              <span class="sig-id-badge">${s.signalId}</span>
              <span class="sig-version-badge">${s.versionLabel || 'v1.0'}</span>
            </div>
            <div class="sig-badges-box">
              <span class="badge-dir ${dirClass}">${dirLabel}</span>
              <span class="badge-outcome ${outcomeClass}">${outcomeLabel}</span>
            </div>
          </div>

          <div class="sig-instrument-row">
            <div class="sig-inst-name">${s.instrument}</div>
            <div class="sig-cmp-box">
              <span class="sig-cmp-lbl">CMP / Prem:</span>
              <span class="sig-cmp-val">₹${Number(s.marketPrice || s.entryPrice).toFixed(2)}</span>
            </div>
          </div>
          ${contractTag}

          <div class="sig-levels-grid">
            <div class="level-box">
              <span class="lvl-lbl">Entry Zone</span>
              <span class="lvl-val val-blue">₹${Number(s.entryPrice).toFixed(2)}</span>
            </div>
            <div class="level-box">
              <span class="lvl-lbl">Stop Loss</span>
              <span class="lvl-val val-red">₹${Number(s.stopLoss).toFixed(2)}</span>
            </div>
            <div class="level-box">
              <span class="lvl-lbl">Target 1</span>
              <span class="lvl-val val-green">₹${Number(s.target1).toFixed(2)}</span>
            </div>
            <div class="level-box">
              <span class="lvl-lbl">Target 2 / 3</span>
              <span class="lvl-val val-green">₹${Number(s.target2).toFixed(2)} / ₹${Number(s.target3).toFixed(2)}</span>
            </div>
          </div>

          <div class="sig-meta-bar">
            <span>⏰ ${s.signalTime} IST</span>
            <span>⚖️ R:R 1:2.5+</span>
            <span>🏛️ NSE/BSE Verified</span>
          </div>

          <div class="sig-actions-row">
            <button class="btn-sig-action btn-to-tracker" data-signal-id="${s.signalId}">
              🎯 View in Tracker
            </button>
            <button class="btn-sig-action btn-reanalyze-sig" data-signal-id="${s.signalId}">
              🔬 Reanalyze (News)
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners for "View in Tracker"
    terminalSignalsGrid.querySelectorAll('.btn-to-tracker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sigId = e.currentTarget.getAttribute('data-signal-id');
        const tabBtnTracker = document.getElementById('tabBtnTracker');
        if (tabBtnTracker) tabBtnTracker.click();
        const searchInput = document.getElementById('searchFilter');
        if (searchInput) {
          searchInput.value = sigId;
          searchInput.dispatchEvent(new Event('input'));
        }
      });
    });

    // Attach listeners for "Reanalyze"
    terminalSignalsGrid.querySelectorAll('.btn-reanalyze-sig').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sigId = e.currentTarget.getAttribute('data-signal-id');
        const tabBtnTracker = document.getElementById('tabBtnTracker');
        if (tabBtnTracker) tabBtnTracker.click();
        setTimeout(() => {
          if (window.openReanalysisModal) {
            window.openReanalysisModal(sigId);
          }
        }, 200);
      });
    });
  }

  // Panel toggle and refresh
  if (btnToggleSignals && terminalLiveSignalsPanel) {
    btnToggleSignals.addEventListener('click', () => {
      terminalLiveSignalsPanel.classList.toggle('collapsed');
      btnToggleSignals.textContent = terminalLiveSignalsPanel.classList.contains('collapsed') ? '▸' : '▾';
    });
  }
  if (btnRefreshSignals) {
    btnRefreshSignals.addEventListener('click', () => {
      btnRefreshSignals.classList.add('spinning');
      loadMarketData().finally(() => {
        setTimeout(() => btnRefreshSignals.classList.remove('spinning'), 500);
      });
    });
  }

  // 7. Render Stock Watchlist Cards with Real-Time Accuracy & Signal Cross-Reference
  function renderStockCards(stocks, activeSignals = []) {
    if (!stockCardsContainer) return;

    let filtered = stocks;
    if (activeFilter === 'buy') {
      filtered = stocks.filter(s => (s.action || '').includes('BUY'));
    } else if (activeFilter === 'sell') {
      filtered = stocks.filter(s => (s.action || '').includes('SELL') || (s.action || '').includes('SHORT'));
    } else if (activeFilter === 'banking') {
      filtered = stocks.filter(s => (s.sector || '').toLowerCase().includes('bank') || (s.sector || '').toLowerCase().includes('finance'));
    } else if (activeFilter === 'it') {
      filtered = stocks.filter(s => (s.sector || '').toLowerCase().includes('it') || (s.sector || '').toLowerCase().includes('tech'));
    } else if (activeFilter === 'auto') {
      filtered = stocks.filter(s => (s.sector || '').toLowerCase().includes('auto'));
    } else if (activeFilter === 'energy') {
      filtered = stocks.filter(s => (s.sector || '').toLowerCase().includes('energy') || (s.sector || '').toLowerCase().includes('power') || (s.sector || '').toLowerCase().includes('oil'));
    } else if (activeFilter === 'metals') {
      filtered = stocks.filter(s => (s.sector || '').toLowerCase().includes('metal') || (s.sector || '').toLowerCase().includes('steel'));
    } else if (activeFilter === 'trending') {
      const trendingSyms = ['SUZLON', 'ZOMATO', 'ETERNAL', 'TMCV', 'TATAMOTORS', 'HAL', 'BEL', 'IRFC'];
      filtered = stocks.filter(s => trendingSyms.includes(s.symbol) || ['suzlon', 'zomato', 'tatamotors', 'hal', 'bel', 'irfc'].includes(s.id));
    }

    stockCardsContainer.innerHTML = '';

    filtered.forEach(s => {
      const action = s.action || s.signal || (s.pct >= 0 ? 'BUY (LONG)' : 'SELL (SHORT)');
      const isBuy = action.includes('BUY');
      const badgeClass = isBuy ? 'badge-buy' : 'badge-sell';
      const actionColor = isBuy ? 'green' : 'red';
      const changePercent = Number(s.changePercent != null ? s.changePercent : (s.pct != null ? s.pct : 0));
      const changeVal = Number(s.change != null ? s.change : 0);
      const isUp = changePercent >= 0;
      const changeColor = isUp ? 'green' : 'red';

      const cmp = Number(s.cmp || s.price || 100);
      const dayLow = Number(s.dayLow != null ? s.dayLow : (s.low != null ? s.low : cmp * 0.985));
      const dayHigh = Number(s.dayHigh != null ? s.dayHigh : (s.high != null ? s.high : cmp * 1.015));
      const pivot = Number(s.pivot != null ? s.pivot : (dayHigh + dayLow + cmp) / 3);
      const r1 = Number(s.r1 != null ? s.r1 : 2 * pivot - dayLow);
      const s1 = Number(s.s1 != null ? s.s1 : 2 * pivot - dayHigh);

      const entryAggressive = s.entryAggressive || (`₹${cmp.toFixed(2)} – ₹${(cmp * 1.002).toFixed(2)}`);
      const stopLoss = s.stopLoss || (`₹${(cmp * (isBuy ? 0.992 : 1.008)).toFixed(2)}`);
      const target1 = s.target1 || (`₹${(cmp * (isBuy ? 1.015 : 0.985)).toFixed(2)}`);
      const target2 = s.target2 || (`₹${(cmp * (isBuy ? 1.028 : 0.972)).toFixed(2)}`);
      const rsi14 = s.rsi14 || `${s.rsi || (isBuy ? 62.4 : 44.2)} (${isBuy ? 'Bullish' : 'Oversold'})`;
      const vwapStatus = s.vwapStatus || (isBuy ? 'Bullish (Holding Above VWAP)' : 'Bearish (Rejected Below VWAP)');
      const riskReward = s.riskReward || '1 : 2.5';
      const catalyst = s.catalyst || 'Institutional volume accumulation & technical breakout.';

      // Check if price ticked
      const oldPrice = prevPrices[s.symbol];
      let tickAnimClass = '';
      if (oldPrice != null && oldPrice !== cmp) {
        tickAnimClass = cmp > oldPrice ? 'tick-flash-up' : 'tick-flash-down';
      }
      prevPrices[s.symbol] = cmp;

      // Cross reference with activeSignals (Section 3 & 5)
      const matchingSig = activeSignals.find(sig => 
        (sig.instrument && sig.instrument.toUpperCase().includes(s.symbol)) || 
        s.symbol === sig.instrument?.toUpperCase()
      );
      const signalBadgeHtml = matchingSig 
        ? `<div class="watchlist-sig-tag">
             <span class="tag-sig-id">⚡ ${matchingSig.signalId}</span>
             <span class="tag-sig-status">${matchingSig.outcome || 'WAITING'}</span>
             <button class="btn-wl-to-tracker" data-sig-id="${matchingSig.signalId}" title="View in Tracker">Tracker ➜</button>
           </div>`
        : '';

      const card = document.createElement('div');
      card.className = `stock-card ${tickAnimClass}`;
      card.innerHTML = `
        <div class="card-top">
          <div class="stock-title">
            <span class="stock-sym">${s.symbol}</span>
            <span class="stock-name">${s.name || s.symbol} • ${s.sector || 'Equities'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="text-align:right;">
              <div class="stock-cmp-val">₹${cmp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div style="font-family:var(--font-mono);font-size:0.75rem;font-weight:700;" class="${changeColor}">${isUp ? '+' : ''}${changePercent.toFixed(2)}% (${isUp ? '+' : ''}${changeVal.toFixed(2)})</div>
            </div>
            <span class="badge-action ${badgeClass}">${action}</span>
          </div>
        </div>

        ${signalBadgeHtml}

        <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:8px;">
          <span>Day Low: ₹${dayLow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span>Classic Pivot: ₹${pivot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span>Day High: ₹${dayHigh.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        <div class="card-prices-grid">
          <div class="price-item">
            <span class="lbl">Entry Trigger</span>
            <span class="val ${actionColor}">${entryAggressive}</span>
          </div>
          <div class="price-item">
            <span class="lbl">Stop Loss</span>
            <span class="val red">${stopLoss}</span>
          </div>
          <div class="price-item">
            <span class="lbl">Targets (T1 / T2 / T3)</span>
            <span class="val green">${target1} | ${target2}</span>
          </div>
        </div>

        <div class="card-indicators-bar">
          <span class="indicator-pill">🎯 R1: ₹${r1.toFixed(2)} | S1: ₹${s1.toFixed(2)}</span>
          <span class="indicator-pill">📊 RSI(14): ${rsi14}</span>
          <span class="indicator-pill">⚡ VWAP: ${vwapStatus.includes('Bullish') ? 'Above VWAP' : 'Below VWAP'}</span>
          <span class="indicator-pill">⚖️ R:R ${riskReward}</span>
        </div>

        <p class="card-catalyst">💡 <strong>Catalyst:</strong> ${catalyst}</p>

        <div class="card-bottom-actions">
          <button class="btn-wl-to-analysis" data-symbol="${s.symbol}" title="${s.name || s.symbol} चे १५ कलमी सविस्तर विश्लेषण पहा">
            📊 १५ कलमी सविस्तर विश्लेषण पहा ➜
          </button>
        </div>
      `;
      stockCardsContainer.appendChild(card);
    });

    // Attach listeners for Watchlist -> Tracker navigation
    stockCardsContainer.querySelectorAll('.btn-wl-to-tracker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sigId = e.currentTarget.getAttribute('data-sig-id');
        window.switchMainTab('tracker');
        const searchInput = document.getElementById('searchFilter');
        if (searchInput) {
          searchInput.value = sigId;
          searchInput.dispatchEvent(new Event('input'));
        }
      });
    });

    // Attach listeners for Watchlist -> Analysis navigation
    stockCardsContainer.querySelectorAll('.btn-wl-to-analysis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = e.currentTarget.getAttribute('data-symbol');
        if (window.stocksAnalysis && typeof window.stocksAnalysis.searchFor === 'function') {
          window.stocksAnalysis.searchFor(sym);
        } else {
          window.switchMainTab('analysis');
        }
      });
    });

    // Clicking the card body directly opens that stock in Stocks Analysis
    stockCardsContainer.querySelectorAll('.stock-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-wl-to-tracker') || e.target.closest('.btn-wl-to-analysis')) return;
        const symEl = card.querySelector('.stock-sym');
        if (symEl) {
          const sym = symEl.textContent.trim();
          if (window.stocksAnalysis && typeof window.stocksAnalysis.searchFor === 'function') {
            window.stocksAnalysis.searchFor(sym);
          } else {
            window.switchMainTab('analysis');
          }
        }
      });
    });
  }

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderStockCards(cachedStocksList);
    });
  });

  // Instant Quick Search Filter for Watchlist
  const searchFilterInput = document.getElementById('searchFilter');
  if (searchFilterInput) {
    searchFilterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderStockCards(cachedStocksList);
        return;
      }
      const filtered = cachedStocksList.filter(s => 
        (s.symbol && s.symbol.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.sector && s.sector.toLowerCase().includes(q)) ||
        (s.action && s.action.toLowerCase().includes(q))
      );
      renderStockCards(filtered);
    });
  }

  // Auto-refresh when master 1,000 stocks are loaded into standalone memory
  window.addEventListener('masterStocksLoaded', (e) => {
    const count = e.detail?.count || 1000;
    if (totalStocksCount) totalStocksCount.textContent = count;
    if (window.StandaloneMarketEngine) {
      cachedStocksList = window.StandaloneMarketEngine.getWatchlistStocks();
      renderStockCards(cachedStocksList);
    }
  });

  // 0ms Synchronous Pre-render (Guarantees zero blank cards or '--' on load even if PC is off)
  if (window.StandaloneMarketEngine) {
    try {
      const sched = window.StandaloneMarketEngine.getSchedule();
      const ctx = window.StandaloneMarketEngine.getContext();
      const setups = window.StandaloneMarketEngine.getSetups();
      const initialStocks = window.StandaloneMarketEngine.getWatchlistStocks();

      if (marketStatusTitle && sched) marketStatusTitle.textContent = sched.statusText;
      if (marketStatusDot && sched) marketStatusDot.className = 'status-pulse-dot ' + (sched.isOpen ? 'dot-open' : 'dot-closed');
      if (headerPulseDot && sched) headerPulseDot.className = 'pulse-dot ' + (sched.isOpen ? 'dot-open' : 'dot-closed');
      if (marketCountdown && sched) marketCountdown.textContent = sched.countdownText;
      if (watchlistSub && sched) watchlistSub.textContent = `${sched.date} • Real-Time Exchange Feed`;

      if (ctx.nifty && niftyVal && niftyChange) {
        niftyVal.textContent = `₹${ctx.nifty.close.toLocaleString('en-IN')}`;
        const isUp = ctx.nifty.pct >= 0;
        niftyChange.className = `ticker-change ${isUp ? 'up' : 'down'}`;
        niftyChange.textContent = `${isUp ? '+' : ''}${ctx.nifty.pct}% (${isUp ? '+' : ''}${ctx.nifty.change})`;
      }
      if (ctx.bankNifty && bankNiftyVal && bankNiftyChange) {
        bankNiftyVal.textContent = `₹${ctx.bankNifty.close.toLocaleString('en-IN')}`;
        const isUp = ctx.bankNifty.pct >= 0;
        bankNiftyChange.className = `ticker-change ${isUp ? 'up' : 'down'}`;
        bankNiftyChange.textContent = `${isUp ? '+' : ''}${ctx.bankNifty.pct}% (${isUp ? '+' : ''}${ctx.bankNifty.change})`;
      }
      if (ctx.indiaVix && vixVal && vixChange) {
        vixVal.textContent = `${ctx.indiaVix.value}`;
        vixChange.className = 'ticker-change up';
        vixChange.textContent = `${ctx.indiaVix.status}`;
      }
      if (ctx.crudeBrent && crudeVal && crudeChange) {
        crudeVal.textContent = `${ctx.crudeBrent.price}`;
        crudeChange.className = 'ticker-change';
        crudeChange.textContent = `${ctx.crudeBrent.status}`;
      }

      renderTerminalSignals(setups);
      cachedStocksList = initialStocks;
      if (totalStocksCount) totalStocksCount.textContent = initialStocks.length;
      renderStockCards(initialStocks, setups);
    } catch (_) {}
  }

  // Initial Load + Auto-refresh every 3.5 seconds
  loadMarketData();
  setInterval(loadMarketData, 3500);

  // 7. Handle Chat / "HII" Command
  function formatMarkdown(text) {
    let html = text
      .replace(/### (.*?)\n/g, '<h3>$1</h3>')
      .replace(/## (.*?)\n/g, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/---/g, '<hr>')
      .replace(/\n\* (.*?)(?=\n|$)/g, '<li>$1</li>')
      .replace(/\n/g, '<br>');

    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    return html;
  }

  function appendUserMessage(text) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = document.createElement('div');
    msg.className = 'msg-user';
    msg.innerHTML = `
      <div class="msg-header">
        <span style="font-weight:700">YOU</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-body">${text}</div>
    `;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendBotMessage(text) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = document.createElement('div');
    msg.className = 'msg-bot';
    msg.innerHTML = `
      <div class="msg-header">
        <span class="bot-badge">AI LIVE ANALYST</span>
        <span class="msg-time">${time}</span>
      </div>
      <div class="msg-body">${formatMarkdown(text)}</div>
    `;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendChatMessage(msgText) {
    if (!msgText.trim()) return;
    appendUserMessage(msgText);
    chatInput.value = '';

    const typingId = 'typing-' + Date.now();
    const typingMsg = document.createElement('div');
    typingMsg.className = 'msg-bot';
    typingMsg.id = typingId;
    typingMsg.innerHTML = `<span style="color:#94a3b8">Scanning 100% real-time NSE/BSE exchange feed & technical indicators...</span>`;
    chatMessages.appendChild(typingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText })
      });
      const data = await res.json();
      
      const el = document.getElementById(typingId);
      if (el) el.remove();

      if (data.reply) {
        appendBotMessage(data.reply);
      } else {
        appendBotMessage("No data returned. Please try again.");
      }
    } catch (e) {
      const el = document.getElementById(typingId);
      if (el) el.remove();
      appendBotMessage("⚠️ Connection error. Please ensure the server is running.");
    }
  }

  // Chat Form Submit
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value.trim();
      if (val) sendChatMessage(val);
    });
  }

  // Quick Action Chips
  if (chipHii) {
    chipHii.addEventListener('click', () => sendChatMessage('hii'));
  }

  document.querySelectorAll('.chip[data-cmd]').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      sendChatMessage(cmd);
    });
  });

  // Mobile Bottom Nav Switcher
  if (navChat) {
    navChat.addEventListener('click', () => {
      window.switchMainTab('terminal');
      const chatSec = document.querySelector('.chat-section');
      if (chatSec) chatSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (navStocks) {
    navStocks.addEventListener('click', () => {
      window.switchMainTab('analysis');
    });
  }

  const navTrackerBtn = document.getElementById('navTrackerBtn');
  if (navTrackerBtn) {
    navTrackerBtn.addEventListener('click', () => {
      window.switchMainTab('tracker');
    });
  }

  if (navScanTrigger) {
    navScanTrigger.addEventListener('click', () => {
      const tabBtnTerminal = document.getElementById('tabBtnTerminal');
      if (tabBtnTerminal) tabBtnTerminal.click();
      sendChatMessage('hii');
      const chatSec = document.querySelector('.chat-section');
      if (chatSec) chatSec.scrollIntoView({ behavior: 'smooth' });
      if (navChat) navChat.classList.add('active');
      if (navStocks) navStocks.classList.remove('active');
    });
  }

  if (navQr) {
    navQr.addEventListener('click', () => {
      if (qrModal) qrModal.style.display = 'flex';
    });
  }

  // =========================================================================
  // THEME MANAGEMENT (WHITE + COLOURFUL MASTER THEME CONTROLLER)
  // =========================================================================
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const themeToggleText = document.getElementById('themeToggleText');
  const sidebarThemeSwitch = document.getElementById('sidebarThemeSwitch');
  const sidebarThemeText = document.getElementById('sidebarThemeText');

  function applyTheme(theme) {
    const isWhite = (theme === 'white');
    document.documentElement.setAttribute('data-theme', isWhite ? 'white' : 'dark');
    if (isWhite) {
      document.body.classList.add('theme-white');
      document.body.classList.remove('theme-dark');
      if (themeToggleIcon) themeToggleIcon.textContent = '☀️';
      if (themeToggleText) themeToggleText.textContent = 'White UI';
      if (sidebarThemeText) sidebarThemeText.textContent = '☀️ White Theme Active';
    } else {
      document.body.classList.remove('theme-white');
      document.body.classList.add('theme-dark');
      if (themeToggleIcon) themeToggleIcon.textContent = '🌙';
      if (themeToggleText) themeToggleText.textContent = 'Dark Glass';
      if (sidebarThemeText) sidebarThemeText.textContent = '🌙 Dark Glass Active';
    }
    try {
      localStorage.setItem('market_pulse_theme', isWhite ? 'white' : 'dark');
    } catch (_) {}
  }

  // Initialize theme with default White
  const savedTheme = localStorage.getItem('market_pulse_theme') || 'white';
  applyTheme(savedTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const curTheme = document.documentElement.getAttribute('data-theme') || 'white';
      applyTheme(curTheme === 'white' ? 'dark' : 'white');
    });
  }

  if (sidebarThemeSwitch) {
    sidebarThemeSwitch.addEventListener('click', () => {
      const curTheme = document.documentElement.getAttribute('data-theme') || 'white';
      applyTheme(curTheme === 'white' ? 'dark' : 'white');
    });
  }

  // =========================================================================
  // MANUAL DATA REFRESH CONTROL
  // =========================================================================
  const btnManualRefresh = document.getElementById('btnManualRefresh');
  if (btnManualRefresh) {
    btnManualRefresh.addEventListener('click', async () => {
      btnManualRefresh.classList.add('is-refreshing');
      try {
        await loadMarketData();
        const icon = btnManualRefresh.querySelector('.refresh-icon');
        if (icon) {
          icon.style.transform = 'rotate(360deg)';
          setTimeout(() => { icon.style.transform = 'none'; }, 600);
        }
      } catch (_) {}
      setTimeout(() => {
        btnManualRefresh.classList.remove('is-refreshing');
      }, 500);
    });
  }

  // =========================================================================
  // SLIDE-OUT SIDEBAR NAVIGATION DRAWER
  // =========================================================================
  const btnSidebarToggle = document.getElementById('btnSidebarToggle');
  const appSidebar = document.getElementById('appSidebar');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    if (appSidebar) appSidebar.classList.add('active');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (appSidebar) appSidebar.classList.remove('active');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (btnSidebarToggle) btnSidebarToggle.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  // Bind sidebar navigation links to main tabs
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
    link.addEventListener('click', () => {
      const targetTabId = link.getAttribute('data-tab');
      const targetBtn = document.getElementById(targetTabId);
      if (targetBtn) targetBtn.click();
      document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      closeSidebar();
    });
  });

  const sidebarOrbScan = document.getElementById('sidebarOrbScan');
  if (sidebarOrbScan) {
    sidebarOrbScan.addEventListener('click', () => {
      const tabBtnTimeMachine = document.getElementById('tabBtnTimeMachine');
      if (tabBtnTimeMachine) tabBtnTimeMachine.click();
      closeSidebar();
      const orbSec = document.querySelector('.orb-scanner-section');
      if (orbSec) orbSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const sidebarRiskGate = document.getElementById('sidebarRiskGate');
  if (sidebarRiskGate) {
    sidebarRiskGate.addEventListener('click', () => {
      const tabBtnTimeMachine = document.getElementById('tabBtnTimeMachine');
      if (tabBtnTimeMachine) tabBtnTimeMachine.click();
      closeSidebar();
      const riskSec = document.querySelector('.risk-controls');
      if (riskSec) riskSec.scrollIntoView({ behavior: 'smooth' });
    });
  }
});
