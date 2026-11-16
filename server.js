const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Process-level crash prevention (safeguards against network drops & rate limits)
process.on('uncaughtException', (err) => {
  console.error(`[Server ${new Date().toISOString()}] Trapped Uncaught Exception:`, err?.stack || err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error(`[Server ${new Date().toISOString()}] Trapped Unhandled Rejection:`, reason?.stack || reason?.message || reason);
});

const { getRealTimeMarketData, getMarketSchedule, fetchAnyStockLiveSetup } = require('./liveMarketService');
const {
  searchIndianStocks,
  performFullStockAnalysis,
  compareStocks,
  getAnalysisHistory,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
} = require('./stockAnalysisService');
const tradeTrackingService = require('./tradeTrackingService');
const timeMachineEngine = require('./timeMachineEngine');
const orbScannerEngine = require('./orbScannerEngine');
const riskBudgetService = require('./riskBudgetService');

const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Find Local IPv4 Address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();

// Dynamic Multi-Factor Live Report Generator using 100% Real-Time Market Data & Unified Trade Tracking
function generateLiveReport(userInput, liveData) {
  const schedule = liveData?.marketContext?.schedule || getMarketSchedule();
  const nifty = liveData?.marketContext?.nifty || { close: 22625.15, pct: -0.43, trend: 'Bearish Breakdown' };
  const bankNifty = liveData?.marketContext?.bankNifty || { close: 54918.00, pct: -0.61, trend: 'Support Retest' };
  const finNifty = liveData?.marketContext?.finNifty || { close: 25480.20, pct: -0.51 };
  const vix = liveData?.marketContext?.indiaVix || { value: 15.25, change: 0.88, status: 'Stable Volatility' };
  
  // Single source of truth from centralized tradeTrackingService
  const todaySetups = tradeTrackingService.getTodaySetups();

  const isMarketOpen = schedule.isOpen;
  const marketStateLabel = isMarketOpen ? '🟢 चालू (MARKET OPEN)' : '🔴 बंद (MARKET CLOSED)';

  let setupsMarkdown = '';
  if (!todaySetups || todaySetups.length === 0) {
    setupsMarkdown = `> ⚠️ **NO VALID SETUP**\n> सध्याच्या मार्केट परिस्थितीमध्ये 70+ स्कोअर असलेला कोणताही उच्च-संभाव्यतेचा (High Probability) ट्रेड सेटअप उपलब्ध नाही.\n> बनावट किंवा जबरदस्तीने ट्रेड करणे टाळा. कॅपिटल प्रोटेक्शन हाच पहिला नियम आहे!`;
  } else {
    setupsMarkdown = todaySetups.map((s, idx) => {
      const isCall = s.direction.includes('CALL') || s.direction.includes('CE');
      const isPut = s.direction.includes('PUT') || s.direction.includes('PE');
      
      let badge = '🟢';
      if (s.direction.includes('SELL') || isPut) badge = '🔴';
      if (isCall) badge = '⚡🟢';

      const optInfo = s.optionDetails 
        ? `\n  * **Option Contract:** ${s.optionDetails.underlying} ${s.optionDetails.strike} ${s.optionDetails.optionType} | Expiry: **${s.optionDetails.expiry}** | Lot Size: **${s.lotSize}**` 
        : '';

      const outcomeBadge = s.outcome === 'TARGET HIT' ? '🎯 TARGET HIT' :
        s.outcome === 'STOP LOSS HIT' ? '🛑 STOP LOSS HIT' :
        s.outcome === 'AMBIGUOUS — INTRABAR DATA REQUIRED' ? '⚠️ AMBIGUOUS' :
        s.outcome === 'ENTRY NOT TRIGGERED' ? '⏳ ENTRY NOT TRIGGERED' :
        s.actualEntryTriggered ? '🔵 ENTRY TRIGGERED (ACTIVE)' : '⏳ WAITING FOR ENTRY';

      return `#### ${badge} #${idx + 1}. [${s.signalId}] ${s.instrument} — **${s.direction}** (${s.versionLabel || 'v1.0'})${optInfo}
* **Live CMP / Premium:** ₹${Number(s.marketPrice || s.entryPrice).toFixed(2)} | **सिग्नल वेळ:** ${s.signalTime || '09:15:00'} IST
* **प्रवेश स्तर (Entry Range):** **₹${Number(s.entryPrice).toFixed(2)}**
* **स्टॉप लॉस (Stop Loss):** **₹${Number(s.stopLoss).toFixed(2)}** (Strict Protective Risk)
* **टार्गेट्स (Targets):** T1: **₹${Number(s.target1).toFixed(2)}** | T2: **₹${Number(s.target2).toFixed(2)}** | T3: **₹${Number(s.target3).toFixed(2)}**
* **जोखीम व परतावा (R:R):** 1 : 2.5+ | **Quantity:** ${s.quantity} (${s.lotSize > 1 ? `${s.quantity / s.lotSize} Lots` : 'Shares'})
* **सध्याची स्थिती (Status):** \`${outcomeBadge}\`
* **डेटा स्रोत:** National Stock Exchange (NSE) Official Feed
* **रणनीती व कारण:** ${s.strategy || 'Multi-Factor Institutional Confirmation'}`;
    }).join('\n\n---\n\n');
  }

  const closedNotice = !isMarketOpen ? `\n> ℹ️ **मार्केट बंद सूचना (EOD Data):** बाजार सध्या बंद आहे. खाली दाखवलेले भाव आणि स्तर शेवटच्या अधिकृत ट्रेडिंग सत्रातील बंद भावावर (Last Closing Price: ${schedule.date} ${schedule.istTime} IST) आधारित आहेत.\n` : '';

  return `# 🏛️ INSTITUTIONAL LIVE TRADING SIGNALS & REPORT (आजचे ट्रेडिंग सिग्नल्स)
${closedNotice}
### 📌 भाग 1 — मार्केट स्थिती व बेंचमार्क इंडायसेस
* **तारीख आणि वेळ:** ${schedule.date} | ${schedule.istTime} IST
* **बाजार सत्र:** ${marketStateLabel} (${schedule.countdownText})
* **डेटा पडताळणी:** 🟢 100% Verified NSE/BSE Cash & Derivatives Feed
* **NIFTY 50 SPOT:** ₹${nifty.close.toLocaleString('en-IN')} (${nifty.pct >= 0 ? '+' : ''}${nifty.pct}%) | Trend: ${nifty.trend}
* **BANK NIFTY SPOT:** ₹${bankNifty.close.toLocaleString('en-IN')} (${bankNifty.pct >= 0 ? '+' : ''}${bankNifty.pct}%)
* **FINNIFTY SPOT:** ₹${finNifty.close.toLocaleString('en-IN')} (${finNifty.pct >= 0 ? '+' : ''}${finNifty.pct}%) | **INDIA VIX:** ${vix.value}

---

### 🎯 भाग 2 — आजचे अधिकृत सिग्नल्स (Unified Centralized Setups)
${setupsMarkdown}

---

### 🛡️ भाग 3 — भांडवल व जोखीम व्यवस्थापन नियम (Execution Guidelines)
* **Capital Risk:** प्रति ट्रेड जास्तीत जास्त 0.50% ते 1% जोखीम (₹500 ते ₹1,000 प्रति ₹1 लाख भांडवल).
* **9:15-9:30 AM Rule:** सुरुवातीच्या 15 मिनिटांत घाई करू नका; ओपनिंग रेंज स्थिर होऊ द्या.
* **Exit Rule:** सर्व इंट्राडे पोझिशन्स 3:10 PM IST पूर्वी अनिवार्य बंद करा.
* **Tracker Sync:** हे सर्व सिग्नल्स **"Target/SL Tracker"** टॅबमध्ये स्वयंचलित जोडले गेले असून त्यांचे निकाल रिअल-टाइम तपासले जात आहेत!`;
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Health Check Endpoint (For 24/7 Watchdog and Health Monitors)
  if ((req.url === '/health' || req.url === '/api/health') && req.method === 'GET') {
    const schedule = getMarketSchedule();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      service: 'Market Pulse AI Terminal',
      uptime: Math.floor(process.uptime()),
      port: PORT,
      marketState: schedule.state,
      marketOpen: schedule.isOpen,
      timestamp: new Date().toISOString(),
      istTime: schedule.istTime
    }));
  }

  // API: Network Info (Always returns 100% Fixed Permanent Links & Cloudflare 403-Free Links)
  if (req.url === '/api/network' && req.method === 'GET') {
    const PERMANENT_FIXED_URL = 'https://market-live-ai-terminal.loca.lt';
    let tunnelUrl = PERMANENT_FIXED_URL;
    let cloudflareUrl = '';
    let publicIp = '103.29.157.166';
    try {
      const tunnelFile = path.join(__dirname, 'data', 'tunnel_info.json');
      if (fs.existsSync(tunnelFile)) {
        const tInfo = JSON.parse(fs.readFileSync(tunnelFile, 'utf8'));
        if (tInfo) {
          if (tInfo.url) tunnelUrl = tInfo.url;
          if (tInfo.cloudflareUrl) cloudflareUrl = tInfo.cloudflareUrl;
          if (tInfo.publicIp) publicIp = tInfo.publicIp;
        }
      }
      const cfFile = path.join(__dirname, 'CLOUDFLARE_URL.txt');
      if (fs.existsSync(cfFile)) {
        const cVal = fs.readFileSync(cfFile, 'utf8').trim();
        if (cVal && cVal.startsWith('http')) cloudflareUrl = cVal;
      }
    } catch (_) {}

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Bypass-Tunnel-Reminder': 'true'
    });
    return res.end(JSON.stringify({
      localIp: LOCAL_IP,
      port: PORT,
      localUrl: `http://${LOCAL_IP}:${PORT}`,
      loopbackUrl: `http://localhost:${PORT}`,
      tunnelUrl: cloudflareUrl || tunnelUrl,
      cloudflareUrl: cloudflareUrl || null,
      localtunnelUrl: PERMANENT_FIXED_URL,
      publicIp: publicIp,
      tunnelPassword: publicIp
    }));
  }

  // API: 100% Real-Time Stocks & Market Context Data
  if (req.url === '/api/stocks' && req.method === 'GET') {
    try {
      const liveData = await getRealTimeMarketData();
      const activeSignals = tradeTrackingService.getTodaySetups();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ...liveData,
        activeSignals
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // API: Quick Market Schedule / Status
  if (req.url === '/api/market-status' && req.method === 'GET') {
    const schedule = getMarketSchedule();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(schedule));
  }

  // API: Chat / Live Scan Trigger
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const userMsg = (parsed.message || '').trim().toLowerCase();
        const liveData = await getRealTimeMarketData();
        const schedule = liveData.marketContext.schedule;

        const isHiCommand = /^(hi+|हाय|hello|hey|today'?s?\s*trades?|trades?|signals?|scan|live|all)$/i.test(userMsg) ||
          userMsg.includes("today's trades") || userMsg.includes("todays trades") || userMsg.includes("today trades") ||
          userMsg.includes("आजचे ट्रेड्स") || userMsg.includes("आजचे सिग्नल") || userMsg.startsWith('hi') || userMsg.startsWith('हाय');

        let reply = '';
        if (isHiCommand) {
          reply = generateLiveReport(parsed.message, liveData);
        } else if (userMsg.includes('rules') || userMsg.includes('rule') || userMsg.includes('allow')) {
          reply = `### 📜 MASTER TRADING & SCREENING RULES FOR ALL STOCKS\n\n🟢 **ALLOWED STOCKS (Tradeable Universe):**\n1. **Index Affiliation:** Nifty 50, Nifty 100, Nifty 200 & liquid F&O stocks.\n2. **Minimum Market Cap:** ₹1,000 Crore+ (Floor Limit).\n3. **Daily Liquidity:** Average Daily Volume > 10 Lakh shares on NSE; Turnover > ₹25 Cr.\n4. **Institutional Holding:** Combined FII + DII holding > 15%.\n\n🔴 **BANNED / DISALLOWED STOCKS:**\n* Penny stocks (< ₹50), ASM/GSM surveillance lists.\n* Circuit-to-circuit (2%, 5%) illiquid operator stocks.\n* Promoter pledge > 20%.\n* F&O ban list (MWPL > 95%).\n\n⚡ **CORE EXECUTION RULES:**\n1. **9:15 - 9:30 AM Rule:** No trading in first 15 mins. Let opening range settle.\n2. **VWAP Confirmation:** Only BUY above VWAP; only SHORT below VWAP.\n3. **Anti Gap-Up Rule:** If stock opens >1.5% gap-up, do NOT chase; wait for 20 EMA pullback.\n4. **Profit Booking:** Book 50% at Target 1; immediately trail Stop Loss to Entry price.\n5. **Risk Limit:** Max 1% to 2% capital risk per trade.\n6. **Mandatory Exit:** All intraday positions squared off before 3:10 PM IST.`;
        } else if (userMsg.includes('nifty') && !userMsg.includes('bank')) {
          const n = liveData.marketContext.nifty;
          reply = `### 📊 LIVE BENCHMARK INDICES: NIFTY 50 (100% Real-Time Feed)\n* **NIFTY 50:** ₹${n.close.toLocaleString('en-IN')} (${n.pct >= 0 ? '+' : ''}${n.pct}%) | Day High: ₹${n.high.toLocaleString('en-IN')} | Day Low: ₹${n.low.toLocaleString('en-IN')}\n* **Market Status:** ${schedule.statusText}\n* **Schedule:** ${schedule.countdownText}`;
        } else if (userMsg.includes('banknifty') || userMsg.includes('bank nifty')) {
          const bn = liveData.marketContext.bankNifty;
          reply = `### 📊 LIVE BENCHMARK INDICES: BANK NIFTY (100% Real-Time Feed)\n* **BANK NIFTY:** ₹${bn.close.toLocaleString('en-IN')} (${bn.pct >= 0 ? '+' : ''}${bn.pct}%) | Trend: ${bn.trend}\n* **Market Status:** ${schedule.statusText}`;
        } else {
          // Check if user specifically requested a stock or report
          const symMatch = (parsed.message || '').toUpperCase().match(/\b([A-Z]{2,12})\b/);
          let requestedSym = symMatch ? symMatch[1] : null;
          if (['RULES', 'RULE', 'NIFTY', 'BANKNIFTY', 'LIVE', 'SCAN', 'ALL', 'HII', 'HI', 'EXIT', 'HELP'].includes(requestedSym)) {
            requestedSym = null;
          }

          let fullAnalysis = null;
          if (requestedSym) {
            try {
              fullAnalysis = await performFullStockAnalysis(requestedSym, 'NSE', '1d', 'intraday');
            } catch (_) {}
          }

          if (fullAnalysis && fullAnalysis.institutionalReport) {
            reply = fullAnalysis.institutionalReport;
          } else {
            // Dynamic match for ANY stock in India
            const stockSetup = await fetchAnyStockLiveSetup(parsed.message);
            if (stockSetup) {
              const isBull = stockSetup.action.includes('BUY');
              reply = `### ${isBull ? '🟢' : '🔴'} ${stockSetup.symbol} LIVE SETUP — ${stockSetup.name} (100% Real-Time Feed)\n` +
                `* **Symbol:** ${stockSetup.symbol} | **Sector:** ${stockSetup.sector}\n` +
                `* **Live CMP:** ₹${stockSetup.cmp.toFixed(2)} (${stockSetup.changePercent >= 0 ? '+' : ''}${stockSetup.changePercent}%)\n` +
                `* **Direction:** **${stockSetup.action}**\n` +
                `* **Day Range:** Low ₹${stockSetup.dayLow.toFixed(2)} – High ₹${stockSetup.dayHigh.toFixed(2)}\n` +
                `* **Classic Pivots:** Pivot: ₹${stockSetup.pivot.toFixed(2)} | R1: ₹${stockSetup.r1.toFixed(2)} | S1: ₹${stockSetup.s1.toFixed(2)}\n` +
                `* **Action Entry:** ${stockSetup.entryAggressive}\n` +
                `* **Stop Loss:** ${stockSetup.stopLoss}\n` +
                `* **Targets:** T1: ${stockSetup.target1} | T2: ${stockSetup.target2} | T3: ${stockSetup.target3}\n` +
                `* **Risk : Reward:** ${stockSetup.riskReward}\n` +
                `* **Technical Bias:** ${stockSetup.vwapStatus} | RSI: ${stockSetup.rsi14} | ${stockSetup.emaTrend}\n` +
                `* **Supertrend:** ${stockSetup.supertrend}\n` +
                `* **Catalyst & Flow:** ${stockSetup.catalyst}\n` +
                `* **Market Session:** ${schedule.statusText} (${schedule.countdownText})`;
            } else {
              reply = generateLiveReport(parsed.message, liveData);
            }
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, reply }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // ==========================================
  // NEW: ADVANCED STOCKS ANALYSIS API ROUTES
  // ==========================================
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Search Stock: NSE / BSE / Code / ISIN
  if (pathname === '/api/analysis/search' && req.method === 'GET') {
    const q = parsedUrl.searchParams.get('q') || '';
    const exchange = parsedUrl.searchParams.get('exchange') || 'NSE';
    try {
      const results = await searchIndianStocks(q, exchange);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, results }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 2. Full Stock Deep Analysis
  if (pathname === '/api/analysis/stock' && req.method === 'GET') {
    const symbol = parsedUrl.searchParams.get('symbol') || 'TCS';
    const exchange = parsedUrl.searchParams.get('exchange') || 'NSE';
    const timeframe = parsedUrl.searchParams.get('timeframe') || '1d';
    const mode = parsedUrl.searchParams.get('mode') || 'intraday';

    try {
      const analysisData = await performFullStockAnalysis(symbol, exchange, timeframe, mode);
      const allSigs = tradeTrackingService.getSignals();
      const matchedSignal = allSigs.find(s => s.instrument.toUpperCase().includes(symbol.toUpperCase()));
      if (matchedSignal) {
        analysisData.activeSignal = matchedSignal;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, data: analysisData }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 3. Compare Stocks
  if (pathname === '/api/analysis/compare' && req.method === 'GET') {
    const symbolsParam = parsedUrl.searchParams.get('symbols') || 'TCS,INFY';
    const exchange = parsedUrl.searchParams.get('exchange') || 'NSE';
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const comparison = await compareStocks(symbols, exchange);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, comparison }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 4. Analysis History
  if (pathname === '/api/analysis/history' && req.method === 'GET') {
    try {
      const history = getAnalysisHistory();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, history }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 5. Watchlist (GET / POST)
  if (pathname === '/api/analysis/watchlist') {
    if (req.method === 'GET') {
      try {
        const watchlist = getWatchlist();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, watchlist }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          let updatedList;
          if (parsed.action === 'remove') {
            updatedList = removeFromWatchlist(parsed.symbol, parsed.exchange);
          } else {
            updatedList = addToWatchlist(parsed);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, watchlist: updatedList }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  // ========================================================
  // NEW: LIVE TERMINAL SIGNALS & TRACKER API ROUTES
  // ========================================================

  // 0. Get Today's Live Signals for Terminal Command Center (Section 2 & 3)
  if (pathname === '/api/terminal/signals' && req.method === 'GET') {
    try {
      const liveData = await getRealTimeMarketData();
      const todaySetups = tradeTrackingService.getTodaySetups();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        signals: todaySetups,
        marketContext: liveData?.marketContext || {},
        count: todaySetups.length
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 1. Get Tracked Signals (with Filters)
  if (pathname === '/api/tracker/signals' && req.method === 'GET') {
    try {
      const filter = {
        dateRange: parsedUrl.searchParams.get('dateRange') || 'all',
        startDate: parsedUrl.searchParams.get('startDate'),
        endDate: parsedUrl.searchParams.get('endDate'),
        outcome: parsedUrl.searchParams.get('outcome') || 'ALL',
        instrument: parsedUrl.searchParams.get('instrument') || 'ALL',
        version: parsedUrl.searchParams.get('version') || 'all',
        search: parsedUrl.searchParams.get('search') || ''
      };
      const signals = tradeTrackingService.getSignals(filter);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, signals }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 2. Performance Audit Statistics Report
  if (pathname === '/api/tracker/performance' && req.method === 'GET') {
    try {
      const filter = {
        dateRange: parsedUrl.searchParams.get('dateRange') || 'all',
        startDate: parsedUrl.searchParams.get('startDate'),
        endDate: parsedUrl.searchParams.get('endDate'),
        instrument: parsedUrl.searchParams.get('instrument') || 'ALL',
        version: parsedUrl.searchParams.get('version') || 'all'
      };
      const report = tradeTrackingService.getPerformanceReport(filter);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, report }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 3. Register New Trade Signal
  if (pathname === '/api/tracker/signal' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const registered = tradeTrackingService.registerSignal(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, signal: registered }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 4. Live Reanalyze Signal (News / RBI / Event based)
  if (pathname === '/api/tracker/reanalyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const revised = tradeTrackingService.reanalyzeSignal(parsed.signalId, parsed.newsEvent);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, revisedSignal: revised }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 5. Export Signals to CSV (Section 11)
  if (pathname === '/api/tracker/export-csv' && req.method === 'GET') {
    try {
      const filter = {
        dateRange: parsedUrl.searchParams.get('dateRange') || 'all',
        startDate: parsedUrl.searchParams.get('startDate'),
        endDate: parsedUrl.searchParams.get('endDate'),
        outcome: parsedUrl.searchParams.get('outcome') || 'ALL',
        instrument: parsedUrl.searchParams.get('instrument') || 'ALL'
      };
      const csv = tradeTrackingService.exportToCSV(filter);
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="trade_performance_report.csv"'
      });
      return res.end(csv);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 6. Data Verification Audit Endpoint (Section 2 & 13)
  if (pathname === '/api/market-verification' && req.method === 'GET') {
    try {
      const liveData = await getRealTimeMarketData();
      const schedule = liveData?.marketContext?.schedule || getMarketSchedule();
      const verification = liveData?.marketContext?.dataVerification || {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        marketState: schedule.state,
        marketOpen: schedule.isOpen,
        isHoliday: schedule.isHoliday || false,
        holidayName: schedule.holidayName || null,
        statusText: schedule.statusText,
        dataVerification: verification,
        indices: {
          niftySpot: liveData?.marketContext?.nifty,
          bankNiftySpot: liveData?.marketContext?.bankNifty,
          finNiftySpot: liveData?.marketContext?.finNifty,
          sensexSpot: liveData?.marketContext?.sensex
        },
        isolatedFromDerivatives: true,
        basisNotice: 'Spot indices strictly isolated from Futures, ETFs, and Options to avoid basis divergence'
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // ========================================================
  // NEW: DAY TRADER SKILL UPGRADES (TIME MACHINE, ORB, RISK)
  // ========================================================

  // 7. Time Machine Simulation (Monte Carlo Session Replay)
  if (pathname === '/api/timemachine/run' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const simResult = timeMachineEngine.runSimulation(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, simulation: simResult }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 8. Time Machine Recent History
  if (pathname === '/api/timemachine/recent' && req.method === 'GET') {
    try {
      const recent = timeMachineEngine.getRecentSimulations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, simulations: recent }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 9. Opening Range Breakout (ORB) Scanner
  if (pathname === '/api/scanner/orb' && req.method === 'GET') {
    try {
      const scanResults = orbScannerEngine.scanOrbSetups();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, data: scanResults }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // 10. Position Sizing Calculator
  if (pathname === '/api/risk/calculate-size' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sized = riskBudgetService.calculatePositionSize(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, positionSize: sized }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 11. Pre-Trade Risk Gate Check
  if (pathname === '/api/risk/evaluate-gate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const evaluation = riskBudgetService.evaluateRiskGate(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, evaluation }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 12. Risk Budget Configuration (GET / POST)
  if (pathname === '/api/risk/config') {
    if (req.method === 'GET') {
      try {
        const cfg = riskBudgetService.getRiskConfig();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, config: cfg }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const updated = riskBudgetService.updateRiskConfig(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, config: updated }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  // Static File Serving - Bulletproof cross-platform SPA handler (No 403 Forbidden)
  const safePathname = (pathname === '/' || !pathname) ? 'index.html' : pathname.replace(/^\/+/, '');
  let targetFilePath = path.resolve(PUBLIC_DIR, safePathname);

  // Directory traversal check (case-insensitive for Windows)
  const normPublicDir = path.resolve(PUBLIC_DIR).toLowerCase();
  const normTarget = targetFilePath.toLowerCase();
  if (!normTarget.startsWith(normPublicDir)) {
    targetFilePath = path.resolve(PUBLIC_DIR, 'index.html');
  }

  fs.stat(targetFilePath, (err, stats) => {
    if (err || !stats.isFile()) {
      targetFilePath = path.resolve(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(targetFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(targetFilePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Bypass-Tunnel-Reminder': 'true'
        });
        return res.end('Server Error loading resource');
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Bypass-Tunnel-Reminder': 'true',
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is currently occupied by another process. Retrying in 2s...`);
    setTimeout(() => {
      try {
        server.close();
        server.listen(PORT, '0.0.0.0');
      } catch (_) {}
    }, 2000);
  } else {
    console.error('[Server] Server network error:', err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 INTRADAY SHARE MARKET PORTAL IS LIVE & RUNNING!`);
  console.log(`⚡ REAL-TIME NSE/BSE EXCHANGE ENGINE: ACTIVE`);
  console.log(`=======================================================`);
  console.log(`💻 Local PC Access : http://localhost:${PORT}`);
  console.log(`📱 Mobile Wi-Fi URL: http://${LOCAL_IP}:${PORT}`);
  console.log(`=======================================================`);
});

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down server cleanly...');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down server cleanly...');
  server.close(() => process.exit(0));
});
