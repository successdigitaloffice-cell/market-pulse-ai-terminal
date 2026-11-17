const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('  COMPREHENSIVE AUDIT: ANALYSIS TAB & REAL WATCHLIST PRICES');
console.log('================================================================');

// 1. Mock DOM
function createMockElement(id = '', tag = 'div') {
  const children = [];
  const listeners = {};
  return {
    id,
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    },
    innerHTML: '',
    textContent: '',
    value: '',
    children,
    addEventListener: function(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    dispatchEvent: function(e) {
      const list = listeners[e.type] || [];
      list.forEach(h => h(e));
    },
    click: function() {
      const list = listeners['click'] || [];
      list.forEach(h => h({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} }));
    },
    appendChild: function(c) { children.push(c); },
    querySelectorAll: function(selector) {
      const matches = [];
      function search(el) {
        if (!el) return;
        if (selector.startsWith('.') && el.classList?.contains(selector.slice(1))) matches.push(el);
        if (selector.startsWith('#') && el.id === selector.slice(1)) matches.push(el);
        if (el.children) el.children.forEach(search);
      }
      search(this);
      return matches;
    },
    querySelector: function(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    contains: function() { return false; },
    closest: function() { return null; },
    getAttribute: function(attr) { return this[attr] || null; },
    setAttribute: function(attr, val) { this[attr] = val; }
  };
}

const elementsById = {};
function getOrCreateElem(id) {
  if (!elementsById[id]) elementsById[id] = createMockElement(id);
  return elementsById[id];
}

const mockDoc = {
  getElementById: (id) => getOrCreateElem(id),
  querySelectorAll: (selector) => {
    const list = Object.values(elementsById);
    const matches = [];
    list.forEach(el => {
      if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) matches.push(el);
      if (selector.startsWith('#') && el.id === selector.slice(1)) matches.push(el);
    });
    return matches;
  },
  querySelector: (sel) => mockDoc.querySelectorAll(sel)[0] || null,
  createElement: (tag) => createMockElement('', tag),
  body: getOrCreateElem('body'),
  documentElement: getOrCreateElem('html'),
  addEventListener: () => {}
};

const mockWin = {
  document: mockDoc,
  location: { origin: 'https://successdigitaloffice-cell.github.io', pathname: '/market-pulse-ai-terminal/', search: '' },
  localStorage: {
    _data: {},
    getItem: function(k) { return this._data[k] || null; },
    setItem: function(k, v) { this._data[k] = String(v); }
  },
  addEventListener: () => {},
  scrollTo: () => {},
  navigator: { clipboard: { writeText: async () => {} } },
  URL: URL,
  Response: class { constructor(b, i) { this.b = b; this.status = i?.status || 200; } async json() { return JSON.parse(this.b); } },
  Blob: class {},
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object
};

// 2. Load standaloneMarketEngine.js
const engineCode = fs.readFileSync('public/standaloneMarketEngine.js', 'utf8');
vm.runInNewContext(engineCode, {
  window: mockWin,
  document: mockDoc,
  console: { log: () => {}, warn: () => {}, error: console.error },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  URL: URL,
  Response: mockWin.Response,
  Blob: mockWin.Blob,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object
});

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[TEST ${total}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[TEST ${total}] FAIL: ${name}\n  Error: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[TEST ${total}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[TEST ${total}] FAIL: ${name}\n  Error: ${err.message}`);
    }
  }

  // TEST 1: Watchlist Real Prices Verification
  await testAsync('Watchlist /api/stocks returns authentic CMPs (No ₹100 default)', async () => {
    const res = await mockWin.fetch('/api/stocks');
    const data = await res.json();
    assert(data.success, 'Response must be success');
    assert(data.stocks.length >= 30, 'Must have at least 30 stocks');
    
    const fake100s = data.stocks.filter(s => s.cmp === 100);
    assert.strictEqual(fake100s.length, 0, `Found ${fake100s.length} stocks with fake ₹100 CMP!`);
    
    const tcs = data.stocks.find(s => s.symbol === 'TCS');
    assert(tcs && tcs.cmp > 2000, `TCS CMP should be > 2000, got ₹${tcs?.cmp}`);
    
    const rel = data.stocks.find(s => s.symbol === 'RELIANCE');
    assert(rel && rel.cmp > 1000, `RELIANCE CMP should be > 1000, got ₹${rel?.cmp}`);
    
    console.log(`   └─ Sample CMPs: TCS: ₹${tcs.cmp}, RELIANCE: ₹${rel.cmp}, Total: ${data.stocks.length} stocks verified.`);
  });

  // TEST 2: Analysis API Schema Verification
  await testAsync('Analysis API /api/analysis/stock returns complete institutional schema', async () => {
    const res = await mockWin.fetch('/api/analysis/stock?symbol=TCS');
    const json = await res.json();
    assert(json.success, 'Analysis response must be success');
    const d = json.data;
    assert(d.fundamental && d.fundamental.meta, 'Missing fundamental.meta');
    assert(d.fundamental.meta.dividendHistory, 'Missing dividendHistory');
    assert(d.fundamental.meta.dividendHistory.dps, 'Missing dividendHistory.dps');
    assert(d.fundamental.meta.recentNews && d.fundamental.meta.recentNews.length > 0, 'Missing recentNews');
    assert(d.technical && d.technical.indicators.length === 70, `Expected 70 indicators, got ${d.technical.indicators.length}`);
    assert(d.marathiReport && d.marathiReport.points.length === 15, `Expected 15 Marathi points, got ${d.marathiReport.points.length}`);
    assert(d.institutionalReport && d.institutionalReport.includes('संस्थागत संशोधन अहवाल'), 'Missing institutionalReport text');
    assert(d.positionSizing && d.positionSizing.quantity > 0, 'Missing positionSizing');
    console.log(`   └─ Verified 70 indicators, 15 Marathi points, dividendHistory, recentNews, position sizing.`);
  });

  // TEST 3: Compare API Verification
  await testAsync('Compare API /api/analysis/compare returns comparison array', async () => {
    const res = await mockWin.fetch('/api/analysis/compare?symbols=TCS,INFY,RELIANCE');
    const json = await res.json();
    assert(json.success, 'Compare response must be success');
    assert(Array.isArray(json.comparison), 'json.comparison must be an array');
    assert.strictEqual(json.comparison.length, 3, 'Must return 3 compared stocks');
    console.log(`   └─ Comparison items count: ${json.comparison.length} (${json.comparison.map(c => c.symbol).join(', ')})`);
  });

  // TEST 4: Search Suggestions API Verification
  await testAsync('Search API /api/analysis/search returns matching results', async () => {
    const res = await mockWin.fetch('/api/analysis/search?q=tata');
    const json = await res.json();
    assert(json.success, 'Search response must be success');
    assert(Array.isArray(json.results) && json.results.length > 0, 'Must return matching stocks');
    console.log(`   └─ Search 'tata' returned: ${json.results.map(r => r.symbol).join(', ')}`);
  });

  // TEST 5: stocksAnalysis.js client controller load and render
  await testAsync('stocksAnalysis.js renders full analysis without throwing TypeError', async () => {
    // Setup required DOM elements for stocksAnalysis
    const domIds = [
      'tabBtnTerminal', 'tabBtnAnalysis', 'terminalView', 'stocksAnalysisView',
      'saSearchInput', 'saSearchSuggestions', 'saExchNse', 'saExchBse',
      'saBtnRefresh', 'saBtnAddWatchlist', 'saBtnOpenCompare', 'saBtnOpenHistory',
      'saLoadingOverlay', 'saContentContainer', 'saErrorContainer',
      'saCompareModal', 'saCloseCompareModal', 'saCompareContainer', 'saCompareInput', 'saBtnRunCompare',
      'saHistoryModal', 'saCloseHistoryModal', 'saHistoryContainer',
      'saHeaderBanner', 'saDecisionCard', 'saCompositeScoreContainer',
      'saInstitutionalReportContainer', 'saMarathiReportContainer',
      'saTradingSetupContainer', 'saFundamentalsContainer', 'saIndicatorsContainer', 'saNewsContainer'
    ];
    domIds.forEach(getOrCreateElem);

    const saCode = fs.readFileSync('public/stocksAnalysis.js', 'utf8');
    vm.runInNewContext(saCode, {
      window: mockWin,
      document: mockDoc,
      console: { log: () => {}, warn: () => {}, error: console.error },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      URLSearchParams: class { get() { return null; } },
      navigator: mockWin.navigator,
      fetch: mockWin.fetch,
      Date: Date,
      Math: Math,
      JSON: JSON,
      Number: Number,
      String: String,
      Array: Array,
      Object: Object
    });

    assert(mockWin.stocksAnalysis, 'window.stocksAnalysis must be defined');
    assert.strictEqual(typeof mockWin.stocksAnalysis.loadStockAnalysis, 'function', 'loadStockAnalysis must be a function');
    assert.strictEqual(typeof mockWin.stocksAnalysis.searchFor, 'function', 'searchFor must be a function');

    await mockWin.stocksAnalysis.loadStockAnalysis('TCS');
    const errContainer = getOrCreateElem('saErrorContainer');
    assert(errContainer.style.display !== 'block', 'saErrorContainer should not be visible on success');
    
    const banner = getOrCreateElem('saHeaderBanner');
    assert(banner.innerHTML.includes('TCS'), 'Banner should contain TCS');
    
    const indContainer = getOrCreateElem('saIndicatorsContainer');
    assert(indContainer.innerHTML.includes('70 टेक्निकल इंडिकेटर्स'), 'Indicators table should be rendered');
    
    const marathiContainer = getOrCreateElem('saMarathiReportContainer');
    assert(marathiContainer.innerHTML.includes('15 मुद्द्यांचा'), '15-point Marathi report should be rendered');

    console.log(`   └─ Successfully rendered TCS analysis into DOM containers.`);
  });

  // TEST 6: app.js Unified Tab Orchestrator Verification
  test('app.js exposes window.switchMainTab and coordinates views', () => {
    // Setup required DOM elements for app.js
    const appIds = [
      'terminalView', 'stocksAnalysisView', 'tradeTrackerView', 'timeMachineView',
      'tabBtnTerminal', 'tabBtnAnalysis', 'tabBtnTracker', 'tabBtnTimeMachine',
      'navChat', 'navStocks', 'navTrackerBtn', 'stockCardsContainer'
    ];
    appIds.forEach(getOrCreateElem);

    const appCode = fs.readFileSync('public/app.js', 'utf8');
    vm.runInNewContext(appCode, {
      window: mockWin,
      document: mockDoc,
      console: { log: () => {}, warn: () => {}, error: () => {} },
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      URLSearchParams: class { get() { return null; } },
      navigator: mockWin.navigator,
      fetch: mockWin.fetch,
      Date: Date,
      Math: Math,
      JSON: JSON,
      Number: Number,
      String: String,
      Array: Array,
      Object: Object
    });

    assert.strictEqual(typeof mockWin.switchMainTab, 'function', 'window.switchMainTab must be defined');

    // Test switching to analysis tab
    mockWin.switchMainTab('analysis');
    assert.strictEqual(getOrCreateElem('stocksAnalysisView').style.display, 'block');
    assert.strictEqual(getOrCreateElem('terminalView').style.display, 'none');
    assert.strictEqual(getOrCreateElem('tradeTrackerView').style.display, 'none');
    assert.strictEqual(getOrCreateElem('timeMachineView').style.display, 'none');
    assert(getOrCreateElem('tabBtnAnalysis').classList.contains('active'), 'Analysis button should be active');

    // Test switching to tracker tab
    mockWin.switchMainTab('tracker');
    assert.strictEqual(getOrCreateElem('tradeTrackerView').style.display, 'block');
    assert.strictEqual(getOrCreateElem('stocksAnalysisView').style.display, 'none');
    assert(getOrCreateElem('tabBtnTracker').classList.contains('active'), 'Tracker button should be active');

    // Test switching to timemachine tab
    mockWin.switchMainTab('timemachine');
    assert.strictEqual(getOrCreateElem('timeMachineView').style.display, 'block');
    assert.strictEqual(getOrCreateElem('tradeTrackerView').style.display, 'none');
    assert(getOrCreateElem('tabBtnTimeMachine').classList.contains('active'), 'Time machine button should be active');

    // Test switching back to terminal
    mockWin.switchMainTab('terminal');
    assert.strictEqual(getOrCreateElem('terminalView').style.display, 'block');
    assert.strictEqual(getOrCreateElem('timeMachineView').style.display, 'none');
    assert(getOrCreateElem('tabBtnTerminal').classList.contains('active'), 'Terminal button should be active');

    console.log(`   └─ switchMainTab correctly coordinates all 4 views and buttons.`);
  });

  console.log('================================================================');
  console.log(`  AUDIT SUMMARY: ${passed} PASSED / ${total - passed} FAILED (${total} TOTAL)`);
  console.log('================================================================');
  assert.strictEqual(passed, total, 'All tests must pass');
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
