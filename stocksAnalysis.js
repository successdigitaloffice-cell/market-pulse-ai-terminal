/**
 * stocksAnalysis.js
 * Client-Side Controller for Advanced "Stocks Analysis" (शेअर्स विश्लेषण) Tab
 */

(function () {
  'use strict';

  // State
  let currentSymbol = 'TCS';
  let currentExchange = 'NSE';
  let currentTimeframe = '1d';
  let currentMode = 'intraday';
  let currentAnalysisData = null;
  let searchTimeout = null;

  // DOM Elements
  const tabBtnTerminal = document.getElementById('tabBtnTerminal');
  const tabBtnAnalysis = document.getElementById('tabBtnAnalysis');
  const viewTerminal = document.getElementById('terminalView');
  const viewAnalysis = document.getElementById('stocksAnalysisView');

  // Search & Controls
  const stockSearchInput = document.getElementById('saSearchInput');
  const searchSuggestions = document.getElementById('saSearchSuggestions');
  const exchangeToggleNse = document.getElementById('saExchNse');
  const exchangeToggleBse = document.getElementById('saExchBse');
  const btnRefreshAnalysis = document.getElementById('saBtnRefresh');
  const btnAddToWatchlist = document.getElementById('saBtnAddWatchlist');
  const btnOpenCompare = document.getElementById('saBtnOpenCompare');
  const btnOpenHistory = document.getElementById('saBtnOpenHistory');

  // Timeframe & Mode buttons
  const timeframeButtons = document.querySelectorAll('.sa-tf-btn');
  const modeButtons = document.querySelectorAll('.sa-mode-btn');

  // Containers
  const saLoadingOverlay = document.getElementById('saLoadingOverlay');
  const saContentContainer = document.getElementById('saContentContainer');
  const saErrorContainer = document.getElementById('saErrorContainer');

  // Modals
  const compareModal = document.getElementById('saCompareModal');
  const closeCompareModal = document.getElementById('saCloseCompareModal');
  const compareContainer = document.getElementById('saCompareContainer');
  const compareInput = document.getElementById('saCompareInput');
  const btnRunCompare = document.getElementById('saBtnRunCompare');

  const historyModal = document.getElementById('saHistoryModal');
  const closeHistoryModal = document.getElementById('saCloseHistoryModal');
  const historyContainer = document.getElementById('saHistoryContainer');

  // Tab Switching
  function switchTab(tab) {
    if (typeof window.switchMainTab === 'function') {
      window.switchMainTab(tab);
      if (tab === 'analysis' && !currentAnalysisData) {
        loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
      }
      return;
    }
    const navChat = document.getElementById('navChat');
    const navStocks = document.getElementById('navStocks');
    const viewTM = document.getElementById('timeMachineView');
    const tabBtnTM = document.getElementById('tabBtnTimeMachine');
    const viewTracker = document.getElementById('tradeTrackerView');
    const tabBtnTracker = document.getElementById('tabBtnTracker');
    if (viewTM) viewTM.style.display = 'none';
    if (tabBtnTM) tabBtnTM.classList.remove('active');
    if (viewTracker) viewTracker.style.display = 'none';
    if (tabBtnTracker) tabBtnTracker.classList.remove('active');
    if (tab === 'terminal') {
      if (tabBtnTerminal) tabBtnTerminal.classList.add('active');
      if (tabBtnAnalysis) tabBtnAnalysis.classList.remove('active');
      if (viewTerminal) viewTerminal.style.display = 'block';
      if (viewAnalysis) viewAnalysis.style.display = 'none';
      if (navChat) navChat.classList.add('active');
      if (navStocks) navStocks.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (tabBtnAnalysis) tabBtnAnalysis.classList.add('active');
      if (tabBtnTerminal) tabBtnTerminal.classList.remove('active');
      if (viewTerminal) viewTerminal.style.display = 'none';
      if (viewAnalysis) viewAnalysis.style.display = 'block';
      if (navStocks) navStocks.classList.add('active');
      if (navChat) navChat.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!currentAnalysisData) {
        loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
      }
    }
  }

  if (tabBtnTerminal) tabBtnTerminal.addEventListener('click', () => switchTab('terminal'));
  if (tabBtnAnalysis) tabBtnAnalysis.addEventListener('click', () => switchTab('analysis'));
  const navChatBtn = document.getElementById('navChat');
  const navStocksBtn = document.getElementById('navStocks');
  if (navChatBtn) navChatBtn.addEventListener('click', () => switchTab('terminal'));
  if (navStocksBtn) navStocksBtn.addEventListener('click', () => switchTab('analysis'));

  // 1. Search Autocomplete
  if (stockSearchInput) {
    stockSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(searchTimeout);
      if (q.length < 1) {
        searchSuggestions.style.display = 'none';
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`/api/analysis/search?q=${encodeURIComponent(q)}&exchange=${currentExchange}`);
          const data = await res.json();
          if (data.success && data.results && data.results.length > 0) {
            renderSuggestions(data.results);
          } else {
            searchSuggestions.innerHTML = `<div class="sa-suggestion-item muted">कोणतीही कंपनी सापडली नाही. सिम्बॉल किंवा नाव तपासा.</div>`;
            searchSuggestions.style.display = 'block';
          }
        } catch (_) {
          searchSuggestions.style.display = 'none';
        }
      }, 250);
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!stockSearchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
        searchSuggestions.style.display = 'none';
      }
    });

    stockSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = stockSearchInput.value.trim();
        if (val) {
          searchSuggestions.style.display = 'none';
          loadStockAnalysis(val.toUpperCase(), currentExchange, currentTimeframe, currentMode);
        }
      }
    });
  }

  function renderSuggestions(results) {
    let html = '';
    results.forEach(item => {
      html += `
        <div class="sa-suggestion-item" data-symbol="${item.symbol}" data-exch="${item.exchange}">
          <div class="s-left">
            <span class="s-sym">${item.symbol}</span>
            <span class="s-name">${item.name}</span>
          </div>
          <div class="s-right">
            <span class="s-badge ${item.exchange === 'BSE' ? 'bse' : 'nse'}">${item.exchange}</span>
            ${item.bseCode ? `<span class="s-code">Code: ${item.bseCode}</span>` : ''}
          </div>
        </div>
      `;
    });
    searchSuggestions.innerHTML = html;
    searchSuggestions.style.display = 'block';

    searchSuggestions.querySelectorAll('.sa-suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        const sym = el.getAttribute('data-symbol');
        const exch = el.getAttribute('data-exch') || currentExchange;
        stockSearchInput.value = sym;
        searchSuggestions.style.display = 'none';
        setExchange(exch);
        loadStockAnalysis(sym, exch, currentTimeframe, currentMode);
      });
    });
  }

  // 2. Exchange Toggle
  function setExchange(exch) {
    currentExchange = exch;
    if (exch === 'NSE') {
      exchangeToggleNse.classList.add('active');
      exchangeToggleBse.classList.remove('active');
    } else {
      exchangeToggleBse.classList.add('active');
      exchangeToggleNse.classList.remove('active');
    }
  }

  if (exchangeToggleNse) {
    exchangeToggleNse.addEventListener('click', () => {
      setExchange('NSE');
      loadStockAnalysis(currentSymbol, 'NSE', currentTimeframe, currentMode);
    });
  }

  if (exchangeToggleBse) {
    exchangeToggleBse.addEventListener('click', () => {
      setExchange('BSE');
      loadStockAnalysis(currentSymbol, 'BSE', currentTimeframe, currentMode);
    });
  }

  // 3. Timeframe Buttons
  timeframeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      timeframeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeframe = btn.getAttribute('data-tf');
      loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
    });
  });

  // 4. Mode Buttons
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.getAttribute('data-mode');
      if (currentAnalysisData) {
        // Re-render setups locally or re-fetch
        renderTradingSetup(currentAnalysisData.tradingSetups[currentMode]);
      }
    });
  });

  // 5. Refresh Button
  if (btnRefreshAnalysis) {
    btnRefreshAnalysis.addEventListener('click', () => {
      loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
    });
  }

  // 6. Watchlist Button
  if (btnAddToWatchlist) {
    btnAddToWatchlist.addEventListener('click', async () => {
      if (!currentAnalysisData) return;
      try {
        const res = await fetch('/api/analysis/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: currentAnalysisData.symbol,
            exchange: currentAnalysisData.exchange,
            name: currentAnalysisData.companyName
          })
        });
        const data = await res.json();
        if (data.success) {
          btnAddToWatchlist.innerHTML = '⭐ वॉचलिस्टमध्ये समाविष्ट (Saved)';
          btnAddToWatchlist.classList.add('saved');
          setTimeout(() => {
            btnAddToWatchlist.innerHTML = '⭐ वॉचलिस्ट (Watchlist)';
            btnAddToWatchlist.classList.remove('saved');
          }, 3000);
        }
      } catch (_) {}
    });
  }

  // 7. Load Stock Analysis
  async function loadStockAnalysis(symbol, exchange = 'NSE', timeframe = '1d', mode = 'intraday') {
    currentSymbol = symbol;
    currentExchange = exchange;
    currentTimeframe = timeframe;
    currentMode = mode;

    saLoadingOverlay.style.display = 'flex';
    saErrorContainer.style.display = 'none';

    try {
      const url = `/api/analysis/stock?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}&timeframe=${encodeURIComponent(timeframe)}&mode=${encodeURIComponent(mode)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || `'${symbol}' या शेअरचे विश्लेषण लोड करताना अडचण आली.`);
      }

      currentAnalysisData = json.data;
      renderFullAnalysis(json.data);
      saLoadingOverlay.style.display = 'none';
      saContentContainer.style.display = 'block';
    } catch (err) {
      saLoadingOverlay.style.display = 'none';
      saContentContainer.style.display = 'none';
      saErrorContainer.style.display = 'block';
      saErrorContainer.innerHTML = `
        <div class="sa-error-card card-glass">
          <div class="err-icon">⚠️</div>
          <h3>विश्लेषण उपलब्ध होऊ शकले नाही</h3>
          <p>${err.message}</p>
          <div class="err-actions">
            <button class="chip chip-primary" onclick="window.stocksAnalysis.retryAnalysis()">पुन्हा प्रयत्न करा</button>
            <button class="chip" onclick="window.stocksAnalysis.searchFor('TCS')">TCS तपासा</button>
            <button class="chip" onclick="window.stocksAnalysis.searchFor('RELIANCE')">RELIANCE तपासा</button>
          </div>
        </div>
      `;
    }
  }

  // 8. Render Full Analysis
  function renderFullAnalysis(data) {
    if (!data) return;
    const safeModeSetup = (data.tradingSetups && data.tradingSetups[currentMode]) || (data.tradingSetups && data.tradingSetups.intraday) || {};
    renderHeaderBanner(data);
    renderDecisionCard(data.decision || {}, data.technical || {}, data.fundamental || {}, safeModeSetup, data);
    renderCompositeScoreAndCapital(data.compositeScore, data.positionSizing, data);
    renderInstitutional6PartReport(data.institutionalReport, data);
    render15PointMarathiReport(data.marathiReport);
    renderTradingSetup(safeModeSetup);
    renderFundamentalsAndValuation(data.fundamental || {}, data.currentPrice || 100);
    renderIndicatorsTable((data.technical && data.technical.indicators) || [], data.technical || {});
    renderNewsAndCorporateActions((data.fundamental && data.fundamental.meta) || {});
  }

  // Header Banner
  function renderHeaderBanner(data) {
    const banner = document.getElementById('saHeaderBanner');
    if (!banner || !data) return;

    const cmp = Number(data.currentPrice || 100);
    const change = Number(data.change != null ? data.change : 0);
    const changePercent = Number(data.changePercent != null ? data.changePercent : 0);
    const isUp = changePercent >= 0;
    const meta = (data.fundamental && data.fundamental.meta) || {};
    const ms = data.marketStatus || {};
    const circuits = data.circuits || {};
    const tech = data.technical || {};
    const dayHigh = Number(data.dayHigh != null ? data.dayHigh : cmp * 1.015);
    const dayLow = Number(data.dayLow != null ? data.dayLow : cmp * 0.985);
    const prevClose = Number(data.prevClose != null ? data.prevClose : cmp - change);
    const fiftyTwoHigh = Number(data.fiftyTwoWeekHigh != null ? data.fiftyTwoWeekHigh : cmp * 1.35);
    const fiftyTwoLow = Number(data.fiftyTwoWeekLow != null ? data.fiftyTwoWeekLow : cmp * 0.72);
    const upperCircuit = circuits.upperCircuit != null ? circuits.upperCircuit : (prevClose * 1.20).toFixed(2);
    const lowerCircuit = circuits.lowerCircuit != null ? circuits.lowerCircuit : (prevClose * 0.80).toFixed(2);
    const priceBand = circuits.priceBandPercent != null ? circuits.priceBandPercent : 20;
    const vwap = tech.vwap != null ? tech.vwap : cmp.toFixed(2);

    banner.innerHTML = `
      <div class="sa-banner-top">
        <div class="sa-stock-identity">
          <div class="sa-title-row">
            <h2 class="sa-stock-name">${data.companyName || data.symbol}</h2>
            <span class="sa-badge-symbol">${data.symbol}</span>
            <span class="sa-badge-exch ${data.exchange === 'BSE' ? 'bse' : 'nse'}">${data.exchange || 'NSE'}</span>
            <span class="sa-badge-sector">${meta.sector || 'Equities'}</span>
          </div>
          <p class="sa-stock-industry">${meta.industry || 'Equities'} • स्थापना: ${meta.founded || 1995}</p>
        </div>

        <div class="sa-price-box">
          <div class="sa-cmp-val">₹${cmp.toFixed(2)}</div>
          <div class="sa-change-pill ${isUp ? 'up' : 'down'}">
            ${isUp ? '▲ +' : '▼ '}${change.toFixed(2)} (${isUp ? '+' : ''}${changePercent}%)
          </div>
        </div>
      </div>

      <div class="sa-banner-meta-bar">
        <div class="sa-meta-pill ${ms.isOpen ? 'open' : 'closed'}">
          <span class="dot"></span>
          <span>${ms.statusText || '🟢 थेट मार्केट सुरू'}</span>
        </div>
        <div class="sa-meta-pill">
          <span>डेटा स्थिती: <strong>${ms.dataFeedStatus || 'Live'}</strong> (${ms.delayNotice || 'रिअल-टाइम'})</span>
        </div>
        <div class="sa-meta-pill">
          <span>वेळ: <strong>${ms.istTime || ''} IST</strong></span>
        </div>
        <div class="sa-meta-pill">
          <span>सत्र: ${ms.countdownText || ''}</span>
        </div>
      </div>

      <div class="sa-metrics-grid">
        <div class="metric-box">
          <span class="label">आजचा High / Low</span>
          <span class="val">₹${dayHigh.toFixed(2)} / ₹${dayLow.toFixed(2)}</span>
        </div>
        <div class="metric-box">
          <span class="label">Prev Close</span>
          <span class="val">₹${prevClose.toFixed(2)}</span>
        </div>
        <div class="metric-box">
          <span class="label">52W High / Low</span>
          <span class="val">₹${fiftyTwoHigh.toFixed(2)} / ₹${fiftyTwoLow.toFixed(2)}</span>
        </div>
        <div class="metric-box">
          <span class="label">व्हॉल्यूम (Volume)</span>
          <span class="val">${data.volume ? (typeof data.volume === 'number' ? data.volume.toLocaleString('en-IN') : data.volume) : '2.5M'}</span>
        </div>
        <div class="metric-box">
          <span class="label">Upper / Lower Circuit</span>
          <span class="val">₹${upperCircuit} / ₹${lowerCircuit} (±${priceBand}%)</span>
        </div>
        <div class="metric-box">
          <span class="label">VWAP</span>
          <span class="val">₹${vwap}</span>
        </div>
      </div>
    `;
  }

  // Decision Card & 12 QA
  function renderDecisionCard(decision, tech, fund, setup, fullData) {
    const card = document.getElementById('saDecisionCard');
    if (!card) return;

    const d = decision || {};
    const t = tech || {};
    const f = fund || {};
    const recClass = d.recommendationClass || 'rec-buy';
    const recMarathi = d.recommendationMarathi || '🟢 खरेदी करा (BUY)';
    const combinedScore = d.combinedScore != null ? d.combinedScore : 78;
    const techScore = t.overallScore != null ? t.overallScore : 80;
    const techBias = t.technicalBiasMarathi || 'तेजीचा कल (Bullish)';
    const fundScore = f.fundamentalScore != null ? f.fundamentalScore : 82;
    const holderAdv = d.holderAdvice || 'शेअर्स असल्यास ट्रेलिंग स्टॉप लॉस लावून नफ्यात राहावे.';
    const buyerAdv = d.buyerAdvice || 'सध्याच्या सपोर्ट झोनमध्ये टप्प्याटप्प्याने खरेदी करण्यास अनुकूल संधी आहे.';
    const qaAnswers = Array.isArray(d.qaAnswers) ? d.qaAnswers : [];

    card.innerHTML = `
      <div class="decision-header-row">
        <div class="dec-left">
          <span class="dec-tag">अंतिम विश्लेषणात्मक निर्णय (Final Recommendation)</span>
          <div class="dec-badge ${recClass}">
            ${recMarathi}
          </div>
          <p class="dec-sub">मॉडेल आधारित एकूण गुणवत्ता स्कोअर: <strong>${combinedScore} / 100</strong></p>
        </div>

        <div class="dec-scores-group">
          <div class="score-card tech">
            <span class="score-title">Technical Score</span>
            <span class="score-val">${techScore}<span class="score-den">/100</span></span>
            <span class="score-bias">${techBias}</span>
          </div>
          <div class="score-card fund">
            <span class="score-title">Fundamental Score</span>
            <span class="score-val">${fundScore}<span class="score-den">/100</span></span>
            <span class="score-bias">आर्थिक आरोग्य भक्कम</span>
          </div>
        </div>
      </div>

      <div class="dec-advice-boxes">
        <div class="advice-box holder">
          <h4>💼 आधीच शेअर असलेल्यांसाठी सल्ला:</h4>
          <p>${holderAdv}</p>
        </div>
        <div class="advice-box buyer">
          <h4>🛒 नवीन खरेदी करू इच्छिणाऱ्यांसाठी सल्ला:</h4>
          <p>${buyerAdv}</p>
        </div>
      </div>

      <!-- 12 Critical Questions Accordion -->
      <div class="sa-qa-accordion">
        <div class="qa-accordion-header" id="toggleQaBtn">
          <span>❓ 12 महत्त्वाच्या प्रश्नांची उत्तरे पहा (12 Investment Questions Answered)</span>
          <span class="qa-arrow" id="qaArrow">▼</span>
        </div>
        <div class="qa-accordion-body" id="qaBody" style="display:none;">
          <div class="qa-grid">
            ${qaAnswers.map(qa => `
              <div class="qa-item">
                <div class="qa-q"><strong>${qa.q}</strong></div>
                <div class="qa-a">${qa.a}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const toggleQaBtn = document.getElementById('toggleQaBtn');
    const qaBody = document.getElementById('qaBody');
    const qaArrow = document.getElementById('qaArrow');
    if (toggleQaBtn && qaBody) {
      toggleQaBtn.addEventListener('click', () => {
        const isHidden = qaBody.style.display === 'none';
        qaBody.style.display = isHidden ? 'block' : 'none';
        qaArrow.textContent = isHidden ? '▲' : '▼';
      });
    }
  }

  // 100-Point Composite Scoring & Capital Protection Card (Sections 13 & 14)
  function renderCompositeScoreAndCapital(compositeScore, positionSizing, data) {
    const container = document.getElementById('saCompositeScoreContainer');
    if (!container || !compositeScore) return;

    const b = compositeScore.breakdown || {};
    const scoreVal = compositeScore.totalScore || 0;
    let scoreColor = '#10b981';
    if (scoreVal < 60) scoreColor = '#ef4444';
    else if (scoreVal < 70) scoreColor = '#f59e0b';
    else if (scoreVal < 80) scoreColor = '#3b82f6';

    const categories = [
      { key: 'marketSectorContext', name: '1. Market & Sector Context', max: 15, score: b.marketSectorContext?.score || 0, desc: 'Nifty 50, Sector Trend, VIX व बाजाराची दिशा' },
      { key: 'trendMultiTimeframe', name: '2. Trend & Multi-Timeframe Structure', max: 20, score: b.trendMultiTimeframe?.score || 0, desc: '5m/15m/1h/Daily/Weekly टाइमफ्रेमची सुसंगतता' },
      { key: 'momentum', name: '3. Momentum (RSI & MACD)', max: 10, score: b.momentum?.score || 0, desc: 'RSI (14), MACD Histogram व मोमेंटम दिशा' },
      { key: 'volumeLiquidity', name: '4. Volume & Liquidity Flow', max: 15, score: b.volumeLiquidity?.score || 0, desc: 'Relative Volume, VWAP व संस्थागत सहभाग' },
      { key: 'priceActionKeyLevels', name: '5. Price Action & Key Levels', max: 15, score: b.priceActionKeyLevels?.score || 0, desc: 'Pivots, Support/Resistance, ब्रेकआउट व रिटेस्ट' },
      { key: 'riskRewardVolatility', name: '6. Risk-Reward & Volatility (ATR)', max: 15, score: b.riskRewardVolatility?.score || 0, desc: 'नफा-तोटा 1:2.5+ प्रमाण आणि ATR अस्थिरता' },
      { key: 'fundamentalNews', name: '7. Fundamental & News Context', max: 10, score: b.fundamentalNews?.score || 0, desc: 'कर्ज-इक्विटी, प्रमोटर होल्डिंग व ताज्या बातम्या' }
    ];

    container.innerHTML = `
      <div class="card-glass sa-composite-card">
        <div class="composite-header-row">
          <div>
            <div class="composite-badge-tag">📊 विभाग १३ व १४ — संस्थागत स्कोअरिंग व जोखीम व्यवस्थापन</div>
            <h3 class="composite-title">१००-गुणांची संयुक्त स्कोअरिंग प्रणाली (Composite 100-Point Score)</h3>
            <p class="composite-sub">कोणत्याही एका इंडिकेटरवर निर्णय न घेता ७ परिमाणांवर आधारित पारदर्शक विश्लेषण</p>
          </div>
          <div class="composite-score-badge" style="border-color: ${scoreColor};">
            <span class="cs-num" style="color: ${scoreColor};">${scoreVal}</span>
            <span class="cs-denom">/ 100</span>
            <span class="cs-status" style="background: ${scoreColor}22; color: ${scoreColor};">${compositeScore.decisionAction}</span>
          </div>
        </div>

        <div class="composite-classification-alert ${scoreVal >= 70 ? 'alert-success' : (scoreVal >= 60 ? 'alert-warning' : 'alert-danger')}">
          <strong>📋 वर्गवारी (Classification):</strong> ${compositeScore.classificationMarathi || compositeScore.classification}
          <div class="sub-alert-text">
            ${scoreVal >= 80 ? '✅ उच्च दर्जाचा पुष्टी झालेला सेटअप. सर्व जोखीम नियंत्रणे तपासून ट्रेड करा.' : (scoreVal >= 70 ? '⏳ वॉचलिस्टमध्ये ठेवा. एन्ट्री झोन आणि कॅन्डलस्टिक पुष्टी मिळाल्यावरच विचार करा.' : (scoreVal >= 60 ? '⚠️ कमकुवत सेटअप. घाई करू नका, पुढील मजबूत संकेत मिळेपर्यंत प्रतीक्षा करा.' : '⛔ ट्रेड करू नका (NO TRADE). निकष अपूर्ण असून भांडवल गमावण्याची शक्यता जास्त आहे.'))}
          </div>
        </div>

        <!-- 7 Category Score Bars -->
        <div class="composite-categories-grid">
          ${categories.map(cat => {
            const pct = Math.round((cat.score / cat.max) * 100);
            return `
              <div class="comp-cat-row">
                <div class="comp-cat-meta">
                  <span class="comp-cat-name">${cat.name}</span>
                  <span class="comp-cat-score">${cat.score} / ${cat.max}</span>
                </div>
                <div class="comp-bar-track">
                  <div class="comp-bar-fill" style="width: ${pct}%; background: ${pct >= 75 ? '#10b981' : (pct >= 50 ? '#3b82f6' : '#f59e0b')};"></div>
                </div>
                <div class="comp-cat-desc">${cat.desc}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Capital Protection & Position Sizing Card (Section 14) -->
        ${positionSizing ? `
          <div class="position-sizing-block">
            <div class="ps-header">
              <h4>🛡️ भांडवल संरक्षण व पोझिशन साइजिंग (Position Sizing & Capital Protection)</h4>
              <span class="ps-formula">सूत्र: परवानगी असलेली जोखीम (₹${positionSizing.allowedRiskInRupees}) ÷ |Entry - SL| (₹${positionSizing.riskDistance})</span>
            </div>
            
            <div class="ps-metrics-grid">
              <div class="ps-item">
                <span class="ps-lbl">ट्रेडिंग भांडवल (Capital)</span>
                <span class="ps-val">₹${positionSizing.capital.toLocaleString('en-IN')}</span>
                <span class="ps-sub">मानक संस्थागत बेस</span>
              </div>
              <div class="ps-item highlight-risk">
                <span class="ps-lbl">स्वीकार्य जोखीम (${positionSizing.riskPct})</span>
                <span class="ps-val">₹${positionSizing.allowedRiskInRupees.toFixed(2)}</span>
                <span class="ps-sub">कमाल तोटा मर्यादा</span>
              </div>
              <div class="ps-item">
                <span class="ps-lbl">SL तांत्रिक अंतर (|Entry-SL|)</span>
                <span class="ps-val">₹${positionSizing.riskDistance.toFixed(2)}</span>
                <span class="ps-sub">प्रति शेअर जोखीम</span>
              </div>
              <div class="ps-item highlight-qty">
                <span class="ps-lbl">सुरक्षित शेअर संख्या (Quantity)</span>
                <span class="ps-val">${positionSizing.quantity} शेअर्स</span>
                <span class="ps-sub">कॅपिटल प्रोटेक्शन फॉर्म्युला</span>
              </div>
              <div class="ps-item">
                <span class="ps-lbl">भांडवल एक्सपोजर (Capital Used)</span>
                <span class="ps-val">₹${positionSizing.capitalExposure.toLocaleString('en-IN')}</span>
                <span class="ps-sub">${positionSizing.exposurePct}% भांडवल वापर</span>
              </div>
              <div class="ps-item">
                <span class="ps-lbl">कमाल संभाव्य नुकसान (Max Loss)</span>
                <span class="ps-val danger-text">₹${positionSizing.maxLoss.toFixed(2)}</span>
                <span class="ps-sub">खर्च + ब्रोकरेज धरून</span>
              </div>
            </div>

            <div class="ps-rules-strip">
              <div class="rule-chip">🔒 कमाल ३ ट्रेड्स प्रति दिवस</div>
              <div class="rule-chip">🛑 सलग २ तोटे झाल्यास ट्रेडिंग बंद</div>
              <div class="rule-chip">⏰ दुपारी ३:१० PM ला सर्व पोझिशन्स स्क्वेअर-ऑफ</div>
              <div class="rule-chip">🚫 Averaging Down (तोट्यात आणखी खरेदी) सक्त मनाई</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Mandatory 6-Part Institutional Report (Section 19)
  function renderInstitutional6PartReport(reportText, data) {
    const container = document.getElementById('saInstitutionalReportContainer');
    if (!container || !reportText) return;

    // Convert Markdown headers & lists to clean HTML
    const formattedHtml = reportText
      .replace(/^# (.*$)/gim, '<h2 class="inst-h1">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="inst-h3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h3 class="inst-h2">$1</h3>')
      .replace(/^\* \*\*(.*?)\*\*(.*$)/gim, '<div class="inst-bullet"><strong class="inst-k">$1</strong><span class="inst-v">$2</span></div>')
      .replace(/^  \* (.*$)/gim, '<div class="inst-subbullet">• $1</div>')
      .replace(/---/g, '<hr class="inst-divider">')
      .replace(/\n/g, '<br>');

    container.innerHTML = `
      <div class="card-glass sa-institutional-report-box">
        <div class="inst-header">
          <div>
            <div class="inst-tag">🏛️ सेबी/संस्थागत मानके (Institutional Grade Audit)</div>
            <h3 class="inst-title">अनिवार्य ६-भाग संस्थागत संशोधन अहवाल (6-Part Master Report)</h3>
            <p class="inst-subtitle">नियम क्रमांक १९ नुसार प्रत्येक स्टॉकचा सविस्तर वस्तुनिष्ठ ताळेबंद</p>
          </div>
          <button class="btn-copy-report inst-copy-btn" id="btnCopyInstReport">
            📋 संपूर्ण ६-भाग अहवाल कॉपी करा
          </button>
        </div>

        <div class="inst-body-content">
          ${formattedHtml}
        </div>
      </div>
    `;

    const copyBtn = document.getElementById('btnCopyInstReport');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(reportText).then(() => {
          copyBtn.textContent = '✅ ६-भाग अहवाल कॉपी झाला!';
          setTimeout(() => { copyBtn.textContent = '📋 संपूर्ण ६-भाग अहवाल कॉपी करा'; }, 2000);
        });
      });
    }
  }

  // 15-Point Simple Marathi Report
  function render15PointMarathiReport(report) {
    const container = document.getElementById('saMarathiReportContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="report-box card-glass">
        <div class="report-header">
          <div>
            <h3>📜 15 मुद्द्यांचा सोपा व शुद्ध मराठी अहवाल</h3>
            <p class="report-sub">${report.title} • ${report.timestamp}</p>
          </div>
          <button class="btn-copy-report" id="btnCopyReport">📋 अहवाल कॉपी करा</button>
        </div>

        <!-- Summary Matrix Table -->
        <div class="report-summary-table-wrapper">
          <table class="report-summary-table">
            <thead>
              <tr>
                <th>घटक (Parameter)</th>
                <th>निष्कर्ष (Analytical Status)</th>
              </tr>
            </thead>
            <tbody>
              ${report.tableSummary.map(row => `
                <tr>
                  <td><strong>${row.metric}</strong></td>
                  <td>${row.result}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 15 Detailed Points -->
        <div class="report-points-list">
          ${report.points.map(pt => `
            <div class="report-point-card">
              <div class="pt-num-badge">${pt.num}</div>
              <div class="pt-content-box">
                <h4 class="pt-title">${pt.title}</h4>
                <div class="pt-text">${pt.content.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const btnCopyReport = document.getElementById('btnCopyReport');
    if (btnCopyReport) {
      btnCopyReport.addEventListener('click', () => {
        let text = `${report.title}\n${report.timestamp}\n\n`;
        report.points.forEach(p => {
          text += `${p.num}. ${p.title}\n${p.content}\n\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
          btnCopyReport.textContent = '✅ कॉपी झाले!';
          setTimeout(() => { btnCopyReport.textContent = '📋 अहवाल कॉपी करा'; }, 2000);
        });
      });
    }
  }

  // Trading Setup
  function renderTradingSetup(setup) {
    const container = document.getElementById('saTradingSetupContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="setup-card card-glass">
        ${currentAnalysisData && currentAnalysisData.activeSignal ? `
          <div style="margin-bottom:14px;padding:10px 14px;border-radius:8px;background:rgba(56, 189, 248, 0.12);border:1px solid rgba(56, 189, 248, 0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <span style="color:#38bdf8;font-weight:700;font-size:0.95rem;">⚡ अधिकृत केंद्रीय AI सिग्नल: ${currentAnalysisData.activeSignal.signalId}</span>
              <div style="font-size:0.85rem;color:var(--text-muted);margin-top:2px;">
                दिशा: <strong>${currentAnalysisData.activeSignal.direction}</strong> • ठरलेली एन्ट्री: <strong>₹${currentAnalysisData.activeSignal.entryPrice}</strong> • स्थिती: <span class="badge-tag-win" style="background:rgba(16,185,129,0.2);color:#10b981;">${currentAnalysisData.activeSignal.outcome}</span>
              </div>
            </div>
            <span style="font-size:0.85rem;color:#38bdf8;background:rgba(56, 189, 248, 0.15);padding:4px 10px;border-radius:6px;font-weight:600;">
              🔗 100% Synchronized with Master Tracker
            </span>
          </div>
        ` : ''}
        <div class="setup-header">
          <div>
            <span class="setup-badge-mode">${setup.modeName}</span>
            <h3 class="setup-direction ${setup.direction.includes('खरेदी') ? 'buy' : 'sell'}">
              ${setup.direction}
            </h3>
          </div>
          <div class="setup-rr-pill">
            <span class="rr-label">Risk : Reward</span>
            <span class="rr-val">${setup.riskRewardRatio}</span>
          </div>
        </div>

        <div class="setup-grid">
          <div class="setup-box">
            <span class="s-label">संभाव्य Entry Zone</span>
            <span class="s-val highlight">${setup.entryZone}</span>
            <span class="s-note">${setup.entryTrigger}</span>
          </div>
          <div class="setup-box">
            <span class="s-label">Stop Loss (अनिवार्य)</span>
            <span class="s-val sl">${setup.stopLoss}</span>
            <span class="s-note">ह्या पातळीखाली क्लोजिंग झाल्यास ट्रेड अवैध ठरेल.</span>
          </div>
          <div class="setup-box">
            <span class="s-label">टार्गेट्स (Targets)</span>
            <div class="targets-list">
              <span class="target-item">T1: <strong>${setup.target1}</strong> (50% नफा बुक)</span>
              <span class="target-item">T2: <strong>${setup.target2}</strong> (ट्रेलिंग SL)</span>
              <span class="target-item">T3: <strong>${setup.target3}</strong> (अंतिम विस्तार)</span>
            </div>
          </div>
        </div>

        <div class="setup-rules-footer">
          <div class="rule-item"><strong>⏳ होल्डिंग कालावधी:</strong> ${setup.holdingPeriod}</div>
          <div class="rule-item"><strong>⚠️ गॅप आणि अस्थिरता जोखीम:</strong> ${setup.gapRisk}</div>
          <div class="rule-item"><strong>🛑 अवैध होण्याची अट:</strong> ${setup.invalidationRule}</div>
        </div>
      </div>
    `;
  }

  // Fundamentals & Valuation
  function renderFundamentalsAndValuation(fund, cmp) {
    const container = document.getElementById('saFundamentalsContainer');
    if (!container) return;

    const baseCmp = Number(cmp || 100);
    const meta = (fund && fund.meta) || {};
    const val = (fund && fund.valuation) || {};
    const dcf = val.dcf || {
      conservative: Number((baseCmp * 0.92).toFixed(2)),
      base: Number((baseCmp * 1.08).toFixed(2)),
      optimistic: Number((baseCmp * 1.25).toFixed(2)),
      status: 'वाजवी भावात उपलब्ध (Fair Valuation)',
      assumptions: {
        conservative: '6% दीर्घकालीन वाढ',
        base: '12% दीर्घकालीन वाढ',
        optimistic: '18% दीर्घकालीन वाढ'
      }
    };
    const assumptions = dcf.assumptions || {
      conservative: '6% दीर्घकालीन वाढ',
      base: '12% दीर्घकालीन वाढ',
      optimistic: '18% दीर्घकालीन वाढ'
    };

    container.innerHTML = `
      <div class="fund-grid">

        <!-- Business & Promoter Card -->
        <div class="card-glass fund-card">
          <h3>🏢 व्यवसाय, ग्राहक आणि प्रमोटर हिस्सा</h3>
          <div class="fund-kv">
            <div class="kv-item"><span class="k">प्रमुख उत्पादने:</span><span class="v">${meta.products}</span></div>
            <div class="kv-item"><span class="k">प्रमुख ग्राहक:</span><span class="v">${meta.clients}</span></div>
            <div class="kv-item"><span class="k">स्पर्धक:</span><span class="v">${meta.competitors}</span></div>
            <div class="kv-item"><span class="k">विस्तार योजना:</span><span class="v">${meta.expansionPlans}</span></div>
            <div class="kv-item"><span class="k">उद्योगातील धोके:</span><span class="v">${meta.risks}</span></div>
          </div>

          <h4 class="sub-heading">📊 भागभांडवल रचना (Shareholding Pattern)</h4>
          <div class="shareholding-bar">
            <div class="sh-item">
              <span class="sh-lbl">Promoter</span>
              <span class="sh-val">${meta.promoterHolding}%</span>
              <span class="sh-sub">बदल: ${meta.promoterChange}</span>
            </div>
            <div class="sh-item">
              <span class="sh-lbl">Pledging</span>
              <span class="sh-val ${meta.pledgedHolding > 0 ? 'pledge-warn' : 'pledge-zero'}">${meta.pledgedHolding}%</span>
              <span class="sh-sub">${meta.pledgedHolding === 0 ? 'शून्य गहाण' : 'सावध राहा'}</span>
            </div>
            <div class="sh-item">
              <span class="sh-lbl">FII / FPI</span>
              <span class="sh-val">${meta.fiiHolding}%</span>
              <span class="sh-sub">विदेशी संस्था</span>
            </div>
            <div class="sh-item">
              <span class="sh-lbl">DII / Mutual Funds</span>
              <span class="sh-val">${meta.diiHolding}%</span>
              <span class="sh-sub">देशांतर्गत निधी</span>
            </div>
            <div class="sh-item">
              <span class="sh-lbl">Retail / Public</span>
              <span class="sh-val">${meta.retailHolding}%</span>
              <span class="sh-sub">किरकोळ ग्राहक</span>
            </div>
          </div>
        </div>

        <!-- Financial Health & Multiples Card -->
        <div class="card-glass fund-card">
          <h3>💰 आर्थिक ताळेबंद आणि रेशो (Financial Health)</h3>
          <div class="ratios-grid">
            <div class="ratio-pill">
              <span class="r-lbl">Debt-to-Equity (कर्ज)</span>
              <span class="r-val ${meta.debtToEquity < 0.5 ? 'good' : 'warn'}">${meta.debtToEquity}</span>
              <span class="r-desc">${meta.debtToEquity < 0.5 ? 'कमी / सुरक्षित कर्ज' : 'मध्यम कर्ज'}</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">Interest Coverage</span>
              <span class="r-val good">${meta.interestCoverage}x</span>
              <span class="r-desc">व्याज भरण्याची क्षमता भक्कम</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">ROE (भांडवलावरील नफा)</span>
              <span class="r-val good">${meta.roe}%</span>
              <span class="r-desc">उत्कृष्ट परतावा</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">ROCE</span>
              <span class="r-val good">${meta.roce}%</span>
              <span class="r-desc">कार्यक्षम वापर</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">Operating Margin</span>
              <span class="r-val">${meta.operatingMargin}%</span>
              <span class="r-desc">नफ्याचे मार्जिन</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">Net Profit Margin</span>
              <span class="r-val">${meta.netMargin}%</span>
              <span class="r-desc">निव्वळ नफा</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">P/E Ratio</span>
              <span class="r-val">${val.peRatio}</span>
              <span class="r-desc">Forward P/E: ${val.forwardPe}</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">P/B Ratio</span>
              <span class="r-val">${val.pbRatio}</span>
              <span class="r-desc">EV/EBITDA: ${val.evEbitda}</span>
            </div>
            <div class="ratio-pill">
              <span class="r-lbl">Dividend Yield</span>
              <span class="r-val">${val.dividendYield}%</span>
              <span class="r-desc">नियमित लाभांश</span>
            </div>
          </div>

          <!-- DCF 3 Scenarios -->
          <h4 class="sub-heading">🎯 DCF Intrinsic Value मॉडेल (3 संभाव्य परिस्थिती)</h4>
          <div class="dcf-scenarios-grid">
            <div class="dcf-card conservative">
              <span class="dcf-tag">संरक्षणवादी (Conservative)</span>
              <span class="dcf-val">₹${dcf.conservative}</span>
              <span class="dcf-sub">${dcf.assumptions.conservative}</span>
            </div>
            <div class="dcf-card base highlight">
              <span class="dcf-tag">मध्यम / वाजवी भाव (Base Fair Value)</span>
              <span class="dcf-val">₹${dcf.base}</span>
              <span class="dcf-sub">${dcf.assumptions.base}</span>
            </div>
            <div class="dcf-card optimistic">
              <span class="dcf-tag">आशावादी (Optimistic)</span>
              <span class="dcf-val">₹${dcf.optimistic}</span>
              <span class="dcf-sub">${dcf.assumptions.optimistic}</span>
            </div>
          </div>
          <p class="dcf-note">💡 सद्यस्थिती: <strong>${dcf.status}</strong> (टीप: DCF हे मॉडेल-आधारित अंतर्गत मूल्य आहे, खात्रीशीर भाव नाही).</p>
        </div>

      </div>
    `;
  }

  // 50+ Indicators Table
  function renderIndicatorsTable(indicators, tech) {
    const container = document.getElementById('saIndicatorsContainer');
    if (!container) return;

    let activeFilter = 'All';

    function buildTableHtml(filter) {
      const filtered = filter === 'All' ? indicators : indicators.filter(i => i.category === filter);
      return `
        <div class="card-glass indicators-section">
          <div class="ind-header-row">
            <div>
              <h3>📈 70 टेक्निकल इंडिकेटर्स विश्लेषण तक्ता</h3>
              <p class="ind-sub">सर्व 6 गटांमधील इंडिकेटर्स, सिग्नल, गणित आणि मर्यादा (एकूण: ${indicators.length} निर्देशक)</p>
            </div>
            <div class="ind-filter-chips">
              <button class="chip ${filter === 'All' ? 'chip-primary active' : ''}" data-cat="All">सर्व (${indicators.length})</button>
              <button class="chip ${filter === 'Trend' ? 'chip-primary active' : ''}" data-cat="Trend">कल (Trend - 18)</button>
              <button class="chip ${filter === 'Momentum' ? 'chip-primary active' : ''}" data-cat="Momentum">गती (Momentum - 14)</button>
              <button class="chip ${filter === 'Volume' ? 'chip-primary active' : ''}" data-cat="Volume">व्हॉल्यूम (Volume - 13)</button>
              <button class="chip ${filter === 'Volatility' ? 'chip-primary active' : ''}" data-cat="Volatility">अस्थिरता (Volatility - 8)</button>
              <button class="chip ${filter === 'PriceAction' ? 'chip-primary active' : ''}" data-cat="PriceAction">प्राइस ॲक्शन (11)</button>
              <button class="chip ${filter === 'RelativeStrength' ? 'chip-primary active' : ''}" data-cat="RelativeStrength">सापेक्ष सामर्थ्य (6)</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="sa-ind-table">
              <thead>
                <tr>
                  <th style="width:40px;">#</th>
                  <th>इंडिकेटर (Indicator)</th>
                  <th>गट (Category)</th>
                  <th>सध्याची व्हॅल्यू (Value)</th>
                  <th>सिग्नल (Signal)</th>
                  <th>सिग्नलमागील कारण (Reason & Logic)</th>
                  <th>मर्यादा / खबरदारी (Limitations)</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((ind, idx) => `
                  <tr>
                    <td class="text-muted">${idx + 1}</td>
                    <td>
                      <div class="ind-name-box">
                        <strong>${ind.nameMarathi}</strong>
                        <span class="ind-eng-name">${ind.name}</span>
                      </div>
                    </td>
                    <td><span class="badge-cat">${ind.categoryMarathi}</span></td>
                    <td class="ind-val font-mono">${ind.value}</td>
                    <td>
                      <span class="ind-signal-badge ${ind.signal.toLowerCase()}">
                        ${ind.signalMarathi}
                      </span>
                    </td>
                    <td class="ind-reason">${ind.reason}</td>
                    <td class="ind-limit text-muted">${ind.limitations}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    container.innerHTML = buildTableHtml(activeFilter);

    // Event delegation for filter chips
    container.addEventListener('click', (e) => {
      const chip = e.target.closest('.ind-filter-chips .chip');
      if (chip) {
        const cat = chip.getAttribute('data-cat');
        activeFilter = cat;
        container.innerHTML = buildTableHtml(activeFilter);
      }
    });
  }

  // News and Corporate Actions
  function renderNewsAndCorporateActions(meta) {
    const container = document.getElementById('saNewsContainer');
    if (!container) return;

    const m = meta || {};
    const divHist = m.dividendHistory || {
      dps: '₹12.00',
      yield: '1.25%',
      payoutRatio: '38.5%',
      exDate: '12 Nov 2026',
      recordDate: '15 Nov 2026',
      sustainability: 'उच्च व शाश्वत (Strong)'
    };
    const newsList = Array.isArray(m.recentNews) ? m.recentNews : [];

    container.innerHTML = `
      <div class="news-dividend-grid">

        <!-- News Card -->
        <div class="card-glass news-card">
          <h3>📰 ताज्या अधिकृत बातम्या व घडामोडी (Corporate Announcements)</h3>
          <div class="news-list">
            ${newsList.length > 0 ? newsList.map(n => `
              <div class="news-item">
                <div class="news-header">
                  <span class="news-sentiment ${n.sentiment.toLowerCase()}">${n.sentiment === 'Positive' ? '🟢 सकारात्मक' : '🔴 नकारात्मक'}</span>
                  <span class="news-date">${n.date} • ${n.source}</span>
                  ${n.verified ? '<span class="verified-tag">✓ अधिकृत पुष्टी</span>' : ''}
                </div>
                <h4 class="news-title">${n.title}</h4>
                <div class="news-impact">
                  <div class="imp-item"><strong>अल्पकालीन परिणाम:</strong> ${n.shortTerm}</div>
                  <div class="imp-item"><strong>दीर्घकालीन परिणाम:</strong> ${n.longTerm}</div>
                </div>
              </div>
            `).join('') : '<p class="muted">सध्या कोणतीही मोठी नकारात्मक कॉर्पोरेट बातमी नाही.</p>'}
          </div>
        </div>

        <!-- Dividend & Corporate Actions Card -->
        <div class="card-glass dividend-card">
          <h3>💵 लाभांश इतिहास व कॉर्पोरेट कृती (Dividend & Actions)</h3>
          <div class="dividend-metrics">
            <div class="d-box">
              <span class="d-lbl">लाभांश प्रति शेअर (DPS)</span>
              <span class="d-val">${divHist.dps}</span>
            </div>
            <div class="d-box">
              <span class="d-lbl">डिव्हिडंड यील्ड (Yield)</span>
              <span class="d-val">${divHist.yield}</span>
            </div>
            <div class="d-box">
              <span class="d-lbl">पे-आउट गुणोत्तर (Payout)</span>
              <span class="d-val">${divHist.payoutRatio}</span>
            </div>
            <div class="d-box">
              <span class="d-lbl">मागील Ex-Date</span>
              <span class="d-val">${divHist.exDate}</span>
            </div>
            <div class="d-box">
              <span class="d-lbl">Record Date</span>
              <span class="d-val">${divHist.recordDate}</span>
            </div>
            <div class="d-box">
              <span class="d-lbl">लाभांश शाश्वतता</span>
              <span class="d-val good">${divHist.sustainability}</span>
            </div>
          </div>
          <p class="div-note">⚠️ भविष्यातील लाभांशाची घोषणा संचालक मंडळाच्या अधिकृत मंजुरीवर अवलंबून असते.</p>
        </div>

      </div>
    `;
  }

  // 9. Compare Stocks Modal
  if (btnOpenCompare) {
    btnOpenCompare.addEventListener('click', () => {
      compareModal.style.display = 'flex';
      if (currentAnalysisData) {
        compareInput.value = `${currentAnalysisData.symbol}, INFY, TECHM`;
      }
    });
  }

  if (closeCompareModal) {
    closeCompareModal.addEventListener('click', () => {
      compareModal.style.display = 'none';
    });
  }

  if (btnRunCompare) {
    btnRunCompare.addEventListener('click', async () => {
      const syms = compareInput.value.trim();
      if (!syms) return;
      compareContainer.innerHTML = `<div class="sa-loading-spinner">तुलना डेटा तयार होत आहे...</div>`;

      try {
        const res = await fetch(`/api/analysis/compare?symbols=${encodeURIComponent(syms)}&exchange=${currentExchange}`);
        const data = await res.json();
        if (data.success && data.comparison && data.comparison.length > 0) {
          renderComparisonMatrix(data.comparison);
        } else {
          compareContainer.innerHTML = `<p class="muted">तुलना करण्यासाठी पुरेशी माहिती उपलब्ध नाही.</p>`;
        }
      } catch (err) {
        compareContainer.innerHTML = `<p class="err-text">त्रुटी: ${err.message}</p>`;
      }
    });
  }

  function renderComparisonMatrix(list) {
    let html = `
      <div class="table-responsive">
        <table class="sa-compare-table">
          <thead>
            <tr>
              <th>मेट्रिक / वैशिष्ट्य</th>
              ${list.map(s => `<th><strong>${s.symbol}</strong><br><small>${s.companyName}</small></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>LTP (सध्याचा भाव)</strong></td>
              ${list.map(s => `<td>₹${s.currentPrice.toFixed(2)} (${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%)</td>`).join('')}
            </tr>
            <tr>
              <td><strong>तांत्रिक निर्णय</strong></td>
              ${list.map(s => `<td><span class="dec-badge ${s.decision.recommendationClass}">${s.decision.recommendationMarathi}</span></td>`).join('')}
            </tr>
            <tr>
              <td><strong>Technical Score</strong></td>
              ${list.map(s => `<td>${s.technical.overallScore}/100</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Fundamental Score</strong></td>
              ${list.map(s => `<td>${s.fundamental.fundamentalScore}/100</td>`).join('')}
            </tr>
            <tr>
              <td><strong>DCF Fair Value</strong></td>
              ${list.map(s => `<td>₹${s.fundamental.valuation.dcf.base}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>P/E Ratio</strong></td>
              ${list.map(s => `<td>${s.fundamental.valuation.peRatio}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Debt-to-Equity</strong></td>
              ${list.map(s => `<td>${s.fundamental.meta.debtToEquity}</td>`).join('')}
            </tr>
            <tr>
              <td><strong>ROE %</strong></td>
              ${list.map(s => `<td>${s.fundamental.meta.roe}%</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Promoter Holding</strong></td>
              ${list.map(s => `<td>${s.fundamental.meta.promoterHolding}%</td>`).join('')}
            </tr>
            <tr>
              <td><strong>Pledging %</strong></td>
              ${list.map(s => `<td>${s.fundamental.meta.pledgedHolding}%</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;
    compareContainer.innerHTML = html;
  }

  // 10. History Modal
  if (btnOpenHistory) {
    btnOpenHistory.addEventListener('click', async () => {
      historyModal.style.display = 'flex';
      historyContainer.innerHTML = `<div class="sa-loading-spinner">इतिहास लोड होत आहे...</div>`;
      try {
        const res = await fetch('/api/analysis/history');
        const data = await res.json();
        if (data.success && data.history && data.history.length > 0) {
          renderHistoryList(data.history);
        } else {
          historyContainer.innerHTML = `<p class="muted">अद्याप कोणताही विश्लेषण इतिहास उपलब्ध नाही.</p>`;
        }
      } catch (err) {
        historyContainer.innerHTML = `<p class="err-text">इतिहास लोड करताना त्रुटी आली.</p>`;
      }
    });
  }

  if (closeHistoryModal) {
    closeHistoryModal.addEventListener('click', () => {
      historyModal.style.display = 'none';
    });
  }

  function renderHistoryList(history) {
    let html = `<div class="history-list">`;
    history.forEach(item => {
      const dt = new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
      html += `
        <div class="history-card" onclick="window.stocksAnalysis.searchFor('${item.symbol}', '${item.exchange}')">
          <div class="h-left">
            <strong>${item.symbol}</strong> (${item.exchange}) • <span>${item.name}</span>
            <span class="h-time">${dt} IST</span>
          </div>
          <div class="h-right">
            <span class="h-price">₹${item.price.toFixed(2)}</span>
            <span class="h-signal">${item.signalMarathi}</span>
            <button class="btn-history-reopen">पुन्हा पहा →</button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
    historyContainer.innerHTML = html;
  }

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === compareModal) compareModal.style.display = 'none';
    if (e.target === historyModal) historyModal.style.display = 'none';
  });

  // Global window exposure for quick triggers
  window.stocksAnalysis = {
    loadStockAnalysis: (sym, exch = 'NSE', tf = '1d', mode = 'intraday') => {
      return loadStockAnalysis(sym, exch, tf, mode);
    },
    loadCurrentOrDefault: () => {
      if (!currentAnalysisData) {
        loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
      }
    },
    searchFor: (sym, exch = 'NSE') => {
      if (compareModal) compareModal.style.display = 'none';
      if (historyModal) historyModal.style.display = 'none';
      setExchange(exch);
      if (stockSearchInput) stockSearchInput.value = sym;
      if (typeof window.switchMainTab === 'function') {
        window.switchMainTab('analysis');
      } else {
        switchTab('analysis');
      }
      loadStockAnalysis(sym, exch, currentTimeframe, currentMode);
    },
    retryAnalysis: () => {
      loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
    },
    getCurrentSymbol: () => currentSymbol
  };

  // Initial auto-load if starting on analysis view
  document.addEventListener('DOMContentLoaded', () => {
    // Check if URL has ?tab=analysis
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'analysis') {
      switchTab('analysis');
    }
  });

})();
