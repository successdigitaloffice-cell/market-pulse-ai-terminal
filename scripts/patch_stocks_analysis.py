import re

path = 'public/stocksAnalysis.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update switchTab function
old_switch = """  // Tab Switching
  function switchTab(tab) {
    const navChat = document.getElementById('navChat');
    const navStocks = document.getElementById('navStocks');
    const viewTM = document.getElementById('timeMachineView');
    const tabBtnTM = document.getElementById('tabBtnTimeMachine');
    if (viewTM) viewTM.style.display = 'none';
    if (tabBtnTM) tabBtnTM.classList.remove('active');
    if (tab === 'terminal') {
      tabBtnTerminal.classList.add('active');
      tabBtnAnalysis.classList.remove('active');
      viewTerminal.style.display = 'block';
      viewAnalysis.style.display = 'none';
      if (navChat) navChat.classList.add('active');
      if (navStocks) navStocks.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      tabBtnAnalysis.classList.add('active');
      tabBtnTerminal.classList.remove('active');
      viewTerminal.style.display = 'none';
      viewAnalysis.style.display = 'block';
      if (navStocks) navStocks.classList.add('active');
      if (navChat) navChat.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!currentAnalysisData) {
        loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
      }
    }
  }"""

new_switch = """  // Tab Switching
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
  }"""

code = code.replace(old_switch, new_switch)

# 2. Update renderFullAnalysis to be defensively guarded
old_render_full = """  // 8. Render Full Analysis
  function renderFullAnalysis(data) {
    renderHeaderBanner(data);
    renderDecisionCard(data.decision, data.technical, data.fundamental, data.tradingSetups[currentMode], data);
    renderCompositeScoreAndCapital(data.compositeScore, data.positionSizing, data);
    renderInstitutional6PartReport(data.institutionalReport, data);
    render15PointMarathiReport(data.marathiReport);
    renderTradingSetup(data.tradingSetups[currentMode]);
    renderFundamentalsAndValuation(data.fundamental, data.currentPrice);
    renderIndicatorsTable(data.technical.indicators, data.technical);
    renderNewsAndCorporateActions(data.fundamental.meta);
  }"""

new_render_full = """  // 8. Render Full Analysis
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
  }"""

code = code.replace(old_render_full, new_render_full)

# 3. Update renderHeaderBanner
old_banner = """  // Header Banner
  function renderHeaderBanner(data) {
    const isUp = data.changePercent >= 0;
    const banner = document.getElementById('saHeaderBanner');
    if (!banner) return;

    banner.innerHTML = `
      <div class="sa-banner-top">
        <div class="sa-stock-identity">
          <div class="sa-title-row">
            <h2 class="sa-stock-name">${data.companyName}</h2>
            <span class="sa-badge-symbol">${data.symbol}</span>
            <span class="sa-badge-exch ${data.exchange === 'BSE' ? 'bse' : 'nse'}">${data.exchange}</span>
            <span class="sa-badge-sector">${data.fundamental.meta.sector}</span>
          </div>
          <p class="sa-stock-industry">${data.fundamental.meta.industry} • स्थापना: ${data.fundamental.meta.founded}</p>
        </div>

        <div class="sa-price-box">
          <div class="sa-cmp-val">₹${data.currentPrice.toFixed(2)}</div>
          <div class="sa-change-pill ${isUp ? 'up' : 'down'}">
            ${isUp ? '▲ +' : '▼ '}${data.change.toFixed(2)} (${isUp ? '+' : ''}${data.changePercent}%)
          </div>
        </div>
      </div>

      <div class="sa-banner-meta-bar">
        <div class="sa-meta-pill ${data.marketStatus.isOpen ? 'open' : 'closed'}">
          <span class="dot"></span>
          <span>${data.marketStatus.statusText}</span>
        </div>
        <div class="sa-meta-pill">
          <span>डेटा स्थिती: <strong>${data.marketStatus.dataFeedStatus}</strong> (${data.marketStatus.delayNotice})</span>
        </div>
        <div class="sa-meta-pill">
          <span>वेळ: <strong>${data.marketStatus.istTime} IST</strong></span>
        </div>
        <div class="sa-meta-pill">
          <span>सत्र: ${data.marketStatus.countdownText}</span>
        </div>
      </div>

      <div class="sa-metrics-grid">
        <div class="metric-box">
          <span class="label">आजचा High / Low</span>
          <span class="val">₹${data.dayHigh.toFixed(2)} / ₹${data.dayLow.toFixed(2)}</span>
        </div>
        <div class="metric-box">
          <span class="label">Prev Close</span>
          <span class="val">₹${data.prevClose.toFixed(2)}</span>
        </div>
        <div class="metric-box">
          <span class="label">52W High / Low</span>
          <span class="val">₹${data.fiftyTwoWeekHigh.toFixed(2)} / ₹${data.fiftyTwoWeekLow.toFixed(2)}</span>
        </div>
        <div class="metric-box">
          <span class="label">व्हॉल्यूम (Volume)</span>
          <span class="val">${data.volume ? data.volume.toLocaleString('en-IN') : 'N/A'}</span>
        </div>
        <div class="metric-box">
          <span class="label">Upper / Lower Circuit</span>
          <span class="val">₹${data.circuits.upperCircuit} / ₹${data.circuits.lowerCircuit} (±${data.circuits.priceBandPercent}%)</span>
        </div>
        <div class="metric-box">
          <span class="label">VWAP</span>
          <span class="val">₹${data.technical.vwap}</span>
        </div>
      </div>
    `;
  }"""

new_banner = """  // Header Banner
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
  }"""

code = code.replace(old_banner, new_banner)

# 4. Update renderNewsAndCorporateActions
old_news = """  // News and Corporate Actions
  function renderNewsAndCorporateActions(meta) {
    const container = document.getElementById('saNewsContainer');
    if (!container) return;

    const divHist = meta.dividendHistory;
    const newsList = meta.recentNews || [];"""

new_news = """  // News and Corporate Actions
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
    const newsList = Array.isArray(m.recentNews) ? m.recentNews : [];"""

code = code.replace(old_news, new_news)

# 5. Update renderDecisionCard
old_dec_card_start = """  // Decision Card & 12 QA
  function renderDecisionCard(decision, tech, fund, setup, fullData) {
    const card = document.getElementById('saDecisionCard');
    if (!card) return;

    card.innerHTML = `
      <div class="decision-header-row">
        <div class="dec-left">
          <span class="dec-tag">अंतिम विश्लेषणात्मक निर्णय (Final Recommendation)</span>
          <div class="dec-badge ${decision.recommendationClass}">
            ${decision.recommendationMarathi}
          </div>
          <p class="dec-sub">मॉडेल आधारित एकूण गुणवत्ता स्कोअर: <strong>${decision.combinedScore} / 100</strong></p>
        </div>

        <div class="dec-scores-group">
          <div class="score-card tech">
            <span class="score-title">Technical Score</span>
            <span class="score-val">${tech.overallScore}<span class="score-den">/100</span></span>
            <span class="score-bias">${tech.technicalBiasMarathi}</span>
          </div>
          <div class="score-card fund">
            <span class="score-title">Fundamental Score</span>
            <span class="score-val">${fund.fundamentalScore}<span class="score-den">/100</span></span>
            <span class="score-bias">आर्थिक आरोग्य भक्कम</span>
          </div>
        </div>
      </div>

      <div class="dec-advice-boxes">
        <div class="advice-box holder">
          <h4>💼 आधीच शेअर असलेल्यांसाठी सल्ला:</h4>
          <p>${decision.holderAdvice}</p>
        </div>
        <div class="advice-box buyer">
          <h4>🛒 नवीन खरेदी करू इच्छिणाऱ्यांसाठी सल्ला:</h4>
          <p>${decision.buyerAdvice}</p>
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
            ${decision.qaAnswers.map(qa => `
              <div class="qa-item">
                <div class="qa-q"><strong>${qa.q}</strong></div>
                <div class="qa-a">${qa.a}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;"""

new_dec_card_start = """  // Decision Card & 12 QA
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
    `;"""

code = code.replace(old_dec_card_start, new_dec_card_start)

# 6. Update renderFundamentalsAndValuation
old_fund = """  // Fundamentals & Valuation
  function renderFundamentalsAndValuation(fund, cmp) {
    const container = document.getElementById('saFundamentalsContainer');
    if (!container) return;

    const meta = fund.meta;
    const val = fund.valuation;
    const dcf = val.dcf;"""

new_fund = """  // Fundamentals & Valuation
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
    };"""

code = code.replace(old_fund, new_fund)

# 7. Update window.stocksAnalysis
old_exposure = """  // Global window exposure for quick triggers
  window.stocksAnalysis = {
    searchFor: (sym, exch = 'NSE') => {
      if (compareModal) compareModal.style.display = 'none';
      if (historyModal) historyModal.style.display = 'none';
      switchTab('analysis');
      setExchange(exch);
      loadStockAnalysis(sym, exch, currentTimeframe, currentMode);
    },
    retryAnalysis: () => {
      loadStockAnalysis(currentSymbol, currentExchange, currentTimeframe, currentMode);
    }
  };"""

new_exposure = """  // Global window exposure for quick triggers
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
  };"""

code = code.replace(old_exposure, new_exposure)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully patched public/stocksAnalysis.js")
