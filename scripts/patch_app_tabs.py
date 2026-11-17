import re

path = 'public/app.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add window.switchMainTab orchestrator at the beginning of DOMContentLoaded
main_tab_orchestrator = '''
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Attach direct click events to all 4 main tab header buttons
  const tabBtnTerminal = document.getElementById('tabBtnTerminal');
  const tabBtnAnalysis = document.getElementById('tabBtnAnalysis');
  const tabBtnTracker = document.getElementById('tabBtnTracker');
  const tabBtnTimeMachine = document.getElementById('tabBtnTimeMachine');

  if (tabBtnTerminal) tabBtnTerminal.addEventListener('click', () => window.switchMainTab('terminal'));
  if (tabBtnAnalysis) tabBtnAnalysis.addEventListener('click', () => window.switchMainTab('analysis'));
  if (tabBtnTracker) tabBtnTracker.addEventListener('click', () => window.switchMainTab('tracker'));
  if (tabBtnTimeMachine) tabBtnTimeMachine.addEventListener('click', () => window.switchMainTab('timemachine'));
'''

code = code.replace(
    "document.addEventListener('DOMContentLoaded', () => {",
    "document.addEventListener('DOMContentLoaded', () => {\n" + main_tab_orchestrator
)

# 2. Update renderStockCards to add btn-wl-to-analysis and card click
old_card_end = """        <div class="card-indicators-bar">
          <span class="indicator-pill">🎯 R1: ₹${r1.toFixed(2)} | S1: ₹${s1.toFixed(2)}</span>
          <span class="indicator-pill">📊 RSI(14): ${rsi14}</span>
          <span class="indicator-pill">⚡ VWAP: ${vwapStatus.includes('Bullish') ? 'Above VWAP' : 'Below VWAP'}</span>
          <span class="indicator-pill">⚖️ R:R ${riskReward}</span>
        </div>

        <p class="card-catalyst">💡 <strong>Catalyst:</strong> ${catalyst}</p>
      `;
      stockCardsContainer.appendChild(card);
    });

    // Attach listeners for Watchlist -> Tracker navigation
    stockCardsContainer.querySelectorAll('.btn-wl-to-tracker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sigId = e.currentTarget.getAttribute('data-sig-id');
        const tabBtnTracker = document.getElementById('tabBtnTracker');
        if (tabBtnTracker) tabBtnTracker.click();
        const searchInput = document.getElementById('searchFilter');
        if (searchInput) {
          searchInput.value = sigId;
          searchInput.dispatchEvent(new Event('input'));
        }
      });
    });
  }"""

new_card_end = """        <div class="card-indicators-bar">
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
  }"""

code = code.replace(old_card_end, new_card_end)

# 3. Update bottom navigation buttons to use switchMainTab
old_mobile_nav = """  // Mobile Bottom Nav Switcher
  if (navChat) {
    navChat.addEventListener('click', () => {
      const tabBtnTerminal = document.getElementById('tabBtnTerminal');
      if (tabBtnTerminal) tabBtnTerminal.click();
      const chatSec = document.querySelector('.chat-section');
      if (chatSec) chatSec.scrollIntoView({ behavior: 'smooth' });
      navChat.classList.add('active');
      if (navStocks) navStocks.classList.remove('active');
    });
  }

  if (navStocks) {
    navStocks.addEventListener('click', () => {
      const tabBtnAnalysis = document.getElementById('tabBtnAnalysis');
      if (tabBtnAnalysis) tabBtnAnalysis.click();
      navStocks.classList.add('active');
      if (navChat) navChat.classList.remove('active');
      const navTrackerBtn = document.getElementById('navTrackerBtn');
      if (navTrackerBtn) navTrackerBtn.classList.remove('active');
    });
  }

  const navTrackerBtn = document.getElementById('navTrackerBtn');
  if (navTrackerBtn) {
    navTrackerBtn.addEventListener('click', () => {
      const tabBtnTracker = document.getElementById('tabBtnTracker');
      if (tabBtnTracker) tabBtnTracker.click();
      navTrackerBtn.classList.add('active');
      if (navChat) navChat.classList.remove('active');
      if (navStocks) navStocks.classList.remove('active');
    });
  }"""

new_mobile_nav = """  // Mobile Bottom Nav Switcher
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
  }"""

code = code.replace(old_mobile_nav, new_mobile_nav)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully patched public/app.js with Unified Tab Orchestrator and Watchlist-to-Analysis linking")
