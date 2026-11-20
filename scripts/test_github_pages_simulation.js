const fs = require('fs');
const vm = require('vm');

const elements = {};
function getEl(id, tag = 'div') {
  if (!elements[id]) {
    elements[id] = {
      id,
      tagName: tag.toUpperCase(),
      style: {},
      classList: {
        _set: new Set(),
        add: function(c) { this._set.add(c); },
        remove: function(c) { this._set.delete(c); },
        contains: function(c) { return this._set.has(c); },
        toggle: function(c) { if (this._set.has(c)) this._set.delete(c); else this._set.add(c); }
      },
      _children: [],
      get children() { return this._children; },
      set children(v) { this._children = v; },
      _innerHTML: '',
      get innerHTML() { return this._innerHTML; },
      set innerHTML(v) { this._innerHTML = v; if (v === '') this._children = []; },
      textContent: '',
      listeners: {},
      addEventListener: function(evt, handler) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(handler);
      },
      dispatchEvent: function(e) {
        (this.listeners[e.type] || []).forEach(h => h(e));
      },
      click: function() {
        this.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} });
      },
      appendChild: function(c) { this.children.push(c); },
      querySelectorAll: function(sel) {
        const res = [];
        function walk(n) {
          if (!n) return;
          if (sel.startsWith('.') && n.classList?.contains(sel.slice(1))) res.push(n);
          if (sel.startsWith('#') && n.id === sel.slice(1)) res.push(n);
          if (n.children) n.children.forEach(walk);
        }
        walk(this);
        return res;
      },
      querySelector: function(sel) {
        return this.querySelectorAll(sel)[0] || null;
      },
      contains: function() { return false; },
      closest: function() { return null; },
      getAttribute: function(a) { return this[a] || null; },
      setAttribute: function(a, v) { this[a] = v; }
    };
  }
  return elements[id];
}

const mockDoc = {
  getElementById: (id) => getEl(id),
  querySelectorAll: (sel) => {
    const list = Object.values(elements);
    const matches = [];
    list.forEach(el => {
      if (sel.startsWith('.') && el.classList.contains(sel.slice(1))) matches.push(el);
      if (sel.startsWith('#') && el.id === sel.slice(1)) matches.push(el);
    });
    return matches;
  },
  querySelector: (sel) => mockDoc.querySelectorAll(sel)[0] || null,
  createElement: (tag) => getEl('created_' + Math.random().toString(36).slice(2), tag),
  body: getEl('body'),
  documentElement: getEl('html'),
  addEventListener: (evt, h) => {
    if (!mockDoc.listeners) mockDoc.listeners = {};
    if (!mockDoc.listeners[evt]) mockDoc.listeners[evt] = [];
    mockDoc.listeners[evt].push(h);
  },
  dispatchEvent: (e) => {
    (mockDoc.listeners?.[e.type] || []).forEach(h => h(e));
  }
};

const mockWin = {
  document: mockDoc,
  location: {
    origin: 'https://successdigitaloffice-cell.github.io',
    pathname: '/market-pulse-ai-terminal/',
    hostname: 'successdigitaloffice-cell.github.io',
    href: 'https://successdigitaloffice-cell.github.io/market-pulse-ai-terminal/',
    search: '',
    protocol: 'https:'
  },
  localStorage: {
    _d: {},
    getItem: function(k) { return this._d[k] || null; },
    setItem: function(k, v) { this._d[k] = String(v); }
  },
  listeners: {},
  addEventListener: function(evt, h) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(h);
  },
  dispatchEvent: function(e) {
    (this.listeners[e.type] || []).forEach(h => h(e));
  },
  scrollTo: () => {},
  navigator: { clipboard: { writeText: async () => {} } },
  URL: URL,
  fetch: async function(url) {
    if (url.includes('/api/')) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => { throw new Error('Unexpected token < in JSON at position 0'); }
      };
    }
    const realDb = JSON.parse(fs.readFileSync('public/data/nse_bse_master_stocks.json', 'utf8'));
    return {
      ok: true,
      status: 200,
      json: async () => realDb
    };
  }
};

class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail || {};
  }
}
mockWin.CustomEvent = CustomEvent;

const sandbox = {
  window: mockWin,
  document: mockDoc,
  get fetch() { return mockWin.fetch; },
  get localStorage() { return mockWin.localStorage; },
  console: console,
  setTimeout: (fn, ms) => { return setTimeout(fn, ms); },
  clearTimeout: clearTimeout,
  setInterval: () => {},
  clearInterval: () => {},
  URL: URL,
  URLSearchParams: URLSearchParams,
  Response: class {
    constructor(body, init) { this.body = body; this.status = init?.status || 200; this.ok = this.status >= 200 && this.status < 300; }
    async json() { return JSON.parse(this.body); }
  },
  CustomEvent: CustomEvent,
  Blob: class {},
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object
};

// Populate standard IDs
const ids = [
  'istTimeDisplay', 'welcomeTime', 'mobileUrlDisplay', 'modalQrUrl', 'qrContainer',
  'chatMessages', 'chatForm', 'chatInput', 'chipHii', 'stockCardsContainer',
  'openQrBtn', 'closeQrModal', 'qrModal', 'copyUrlBtn', 'modalCopyBtn',
  'marketStatusTitle', 'marketStatusDot', 'headerPulseDot', 'marketCountdown',
  'lastSyncTime', 'watchlistSub', 'totalStocksCount', 'niftyVal', 'niftyChange',
  'bankNiftyVal', 'bankNiftyChange', 'vixVal', 'vixChange', 'crudeVal', 'crudeChange',
  'terminalSignalsGrid', 'terminalSignalsCount', 'terminalLiveSignalsPanel',
  'btnToggleSignals', 'btnRefreshSignals', 'btnThemeToggle', 'themeToggleIcon',
  'themeToggleText', 'sidebarThemeSwitch', 'sidebarThemeText', 'btnManualRefresh',
  'btnSidebarToggle', 'appSidebar', 'closeSidebarBtn', 'sidebarBackdrop',
  'tabBtnTerminal', 'tabBtnAnalysis', 'tabBtnTracker', 'tabBtnTimeMachine',
  'terminalView', 'stocksAnalysisView', 'tradeTrackerView', 'timeMachineView',
  'navChat', 'navStocks', 'navTrackerBtn', 'navScanTrigger', 'navQr',
  'searchFilter'
];
ids.forEach(id => getEl(id));

console.log('Loading standaloneMarketEngine.js...');
vm.runInNewContext(fs.readFileSync('public/standaloneMarketEngine.js', 'utf8'), sandbox);

console.log('Loading app.js...');
vm.runInNewContext(fs.readFileSync('public/app.js', 'utf8'), sandbox);

console.log('Loading stocksAnalysis.js...');
vm.runInNewContext(fs.readFileSync('public/stocksAnalysis.js', 'utf8'), sandbox);

console.log('Loading tracker.js...');
vm.runInNewContext(fs.readFileSync('public/tracker.js', 'utf8'), sandbox);

console.log('Loading timeMachine.js...');
vm.runInNewContext(fs.readFileSync('public/timeMachine.js', 'utf8'), sandbox);

console.log('Triggering DOMContentLoaded...');
mockDoc.dispatchEvent({ type: 'DOMContentLoaded' });

setTimeout(() => {
  console.log('--- Checking UI state after DOMContentLoaded (0ms to 200ms) ---');
  console.log('Market status title:', getEl('marketStatusTitle').textContent);
  console.log('NIFTY val:', getEl('niftyVal').textContent);
  console.log('BANK NIFTY val:', getEl('bankNiftyVal').textContent);
  console.log('INDIA VIX val:', getEl('vixVal').textContent);
  console.log('Terminal signals count text:', getEl('terminalSignalsCount').textContent);
  console.log('Stock cards rendered count in container:', getEl('stockCardsContainer').children.length);
  console.log('Total stocks count element:', getEl('totalStocksCount').textContent);

  // Test instant search filter
  const sInput = getEl('searchFilter');
  sInput.value = 'RELIANCE';
  sInput.dispatchEvent({ type: 'input', target: sInput });
  console.log('After filtering for RELIANCE, cards count:', getEl('stockCardsContainer').children.length);

  sInput.value = '';
  sInput.dispatchEvent({ type: 'input', target: sInput });
  console.log('After clearing filter, cards count:', getEl('stockCardsContainer').children.length);
}, 250);
