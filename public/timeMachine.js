/**
 * public/timeMachine.js
 * Frontend Controller for Time Machine & Risk Management Engine
 * Adapted from day-trader-skill (MIT License, Jake Schincariol)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const tabBtnTerminal = document.getElementById('tabBtnTerminal');
  const tabBtnAnalysis = document.getElementById('tabBtnAnalysis');
  const tabBtnTracker = document.getElementById('tabBtnTracker');
  const tabBtnTimeMachine = document.getElementById('tabBtnTimeMachine');

  const viewTerminal = document.getElementById('terminalView');
  const viewAnalysis = document.getElementById('stocksAnalysisView');
  const viewTracker = document.getElementById('tradeTrackerView');
  const viewTimeMachine = document.getElementById('timeMachineView');

  // Time Machine elements
  const tmSymbolInput = document.getElementById('tmSymbolInput');
  const tmSideSelect = document.getElementById('tmSideSelect');
  const tmEntryInput = document.getElementById('tmEntryInput');
  const tmStopInput = document.getElementById('tmStopInput');
  const tmTargetInput = document.getElementById('tmTargetInput');
  const tmReplaysSelect = document.getElementById('tmReplaysSelect');
  const btnRunSimulation = document.getElementById('btnRunSimulation');
  const tmResultBox = document.getElementById('tmResultBox');
  const tmLiveFeedback = document.getElementById('tmLiveFeedback');

  // ORB Scanner elements
  const btnScanOrb = document.getElementById('btnScanOrb');
  const orbResultsContainer = document.getElementById('orbResultsContainer');

  // Risk & Sizing elements
  const riskCapitalInput = document.getElementById('riskCapitalInput');
  const riskMaxLossInput = document.getElementById('riskMaxLossInput');
  const riskEntryInput = document.getElementById('riskEntryInput');
  const riskStopInput = document.getElementById('riskStopInput');
  const btnCalcSize = document.getElementById('btnCalcSize');
  const btnCheckRiskGate = document.getElementById('btnCheckRiskGate');
  const riskResultBox = document.getElementById('riskResultBox');
  const riskTicketBox = document.getElementById('riskTicketBox');

  // Real-time input validation & synchronization
  function updateLiveFeedbackAndSync() {
    const entry = parseFloat(tmEntryInput?.value || '0');
    const stop = parseFloat(tmStopInput?.value || '0');
    const target = parseFloat(tmTargetInput?.value || '0');
    const side = (tmSideSelect?.value || 'BUY').toUpperCase();
    const isBuy = side === 'BUY';

    // Synchronize Risk inputs if present
    if (riskEntryInput && entry > 0) riskEntryInput.value = entry;
    if (riskStopInput && stop > 0) riskStopInput.value = stop;

    if (!tmLiveFeedback) return;

    if (entry <= 0) {
      tmLiveFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
      tmLiveFeedback.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      tmLiveFeedback.style.color = '#fca5a5';
      tmLiveFeedback.innerHTML = '⚠️ वैध प्रवेश किंमत (Entry Price > 0) प्रविष्ट करा.';
      return;
    }

    if (isBuy) {
      if (stop >= entry) {
        tmLiveFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
        tmLiveFeedback.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        tmLiveFeedback.style.color = '#fca5a5';
        tmLiveFeedback.innerHTML = `⚠️ BUY ट्रेडसाठी स्टॉप लॉस (₹${stop}) प्रवेश किमतीपेक्षा (₹${entry}) कमी असणे आवश्यक आहे.`;
        return;
      }
      if (target <= entry) {
        tmLiveFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
        tmLiveFeedback.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        tmLiveFeedback.style.color = '#fca5a5';
        tmLiveFeedback.innerHTML = `⚠️ BUY ट्रेडसाठी टार्गेट (₹${target}) प्रवेश किमतीपेक्षा (₹${entry}) जास्त असणे आवश्यक आहे.`;
        return;
      }
    } else {
      if (stop <= entry) {
        tmLiveFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
        tmLiveFeedback.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        tmLiveFeedback.style.color = '#fca5a5';
        tmLiveFeedback.innerHTML = `⚠️ SELL ट्रेडसाठी स्टॉप लॉस (₹${stop}) प्रवेश किमतीपेक्षा (₹${entry}) जास्त असणे आवश्यक आहे.`;
        return;
      }
      if (target >= entry) {
        tmLiveFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
        tmLiveFeedback.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        tmLiveFeedback.style.color = '#fca5a5';
        tmLiveFeedback.innerHTML = `⚠️ SELL ट्रेडसाठी टार्गेट (₹${target}) प्रवेश किमतीपेक्षा (₹${entry}) कमी असणे आवश्यक आहे.`;
        return;
      }
    }

    const risk = isBuy ? (entry - stop) : (stop - entry);
    const targetDist = isBuy ? (target - entry) : (entry - target);
    const rr = risk > 0 ? (targetDist / risk).toFixed(2) : '0';

    tmLiveFeedback.style.background = 'rgba(16, 185, 129, 0.12)';
    tmLiveFeedback.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    tmLiveFeedback.style.color = '#6ee7b7';
    tmLiveFeedback.innerHTML = `✅ वैध सेटअप | Risk: ₹${risk.toFixed(2)} | Target: ₹${targetDist.toFixed(2)} | <strong>R:R Ratio = 1 : ${rr}</strong>`;
  }

  if (tmEntryInput) tmEntryInput.addEventListener('input', updateLiveFeedbackAndSync);
  if (tmStopInput) tmStopInput.addEventListener('input', updateLiveFeedbackAndSync);
  if (tmTargetInput) tmTargetInput.addEventListener('input', updateLiveFeedbackAndSync);
  if (tmSideSelect) tmSideSelect.addEventListener('change', updateLiveFeedbackAndSync);

  // Tab switching logic
  function showTimeMachineTab() {
    if (tabBtnTerminal) tabBtnTerminal.classList.remove('active');
    if (tabBtnAnalysis) tabBtnAnalysis.classList.remove('active');
    if (tabBtnTracker) tabBtnTracker.classList.remove('active');
    if (tabBtnTimeMachine) tabBtnTimeMachine.classList.add('active');

    if (viewTerminal) viewTerminal.style.display = 'none';
    if (viewAnalysis) viewAnalysis.style.display = 'none';
    if (viewTracker) viewTracker.style.display = 'none';
    if (viewTimeMachine) viewTimeMachine.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Automatically trigger fresh ORB scan on opening tab
    loadOrbSetups();
  }

  if (tabBtnTimeMachine) {
    tabBtnTimeMachine.addEventListener('click', showTimeMachineTab);
  }

  // Ensure other tab buttons hide Time Machine view
  if (tabBtnTerminal) {
    tabBtnTerminal.addEventListener('click', () => {
      if (tabBtnTimeMachine) tabBtnTimeMachine.classList.remove('active');
      if (viewTimeMachine) viewTimeMachine.style.display = 'none';
    });
  }
  if (tabBtnAnalysis) {
    tabBtnAnalysis.addEventListener('click', () => {
      if (tabBtnTimeMachine) tabBtnTimeMachine.classList.remove('active');
      if (viewTimeMachine) viewTimeMachine.style.display = 'none';
    });
  }
  if (tabBtnTracker) {
    tabBtnTracker.addEventListener('click', () => {
      if (tabBtnTimeMachine) tabBtnTimeMachine.classList.remove('active');
      if (viewTimeMachine) viewTimeMachine.style.display = 'none';
    });
  }

  // 1. Run Time Machine Simulation
  if (btnRunSimulation) {
    btnRunSimulation.addEventListener('click', async () => {
      const symbol = (tmSymbolInput?.value || 'TCS').trim().toUpperCase();
      const side = tmSideSelect?.value || 'BUY';
      const entry = parseFloat(tmEntryInput?.value || '0');
      const stop = parseFloat(tmStopInput?.value || '0');
      const target = parseFloat(tmTargetInput?.value || '0');
      const replays = parseInt(tmReplaysSelect?.value || '2000', 10);

      if (!entry || !stop || !target) {
        alert('कृपया Entry, Stop Loss, आणि Target किंमती प्रविष्ट करा.');
        return;
      }

      if (side === 'BUY') {
        if (stop >= entry) {
          alert(`अवैध सेटअप: BUY ट्रेडसाठी स्टॉप लॉस (₹${stop}) प्रवेश किमतीपेक्षा (₹${entry}) कमी असणे आवश्यक आहे.`);
          return;
        }
        if (target <= entry) {
          alert(`अवैध सेटअप: BUY ट्रेडसाठी टार्गेट (₹${target}) प्रवेश किमतीपेक्षा (₹${entry}) जास्त असणे आवश्यक आहे.`);
          return;
        }
      } else {
        if (stop <= entry) {
          alert(`अवैध सेटअप: SELL ट्रेडसाठी स्टॉप लॉस (₹${stop}) प्रवेश किमतीपेक्षा (₹${entry}) जास्त असणे आवश्यक आहे.`);
          return;
        }
        if (target >= entry) {
          alert(`अवैध सेटअप: SELL ट्रेडसाठी टार्गेट (₹${target}) प्रवेश किमतीपेक्षा (₹${entry}) कमी असणे आवश्यक आहे.`);
          return;
        }
      }

      btnRunSimulation.disabled = true;
      btnRunSimulation.innerHTML = '⏳ Replaying 10,000 runs...';

      try {
        const resp = await fetch('/api/timemachine/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, side, entry, stop, target, replays })
        });
        const data = await resp.json();

        if (data.success && data.simulation) {
          renderSimulationResult(data.simulation);
        } else {
          alert('सिम्युलेशन एरर: ' + (data.error || 'अज्ञात त्रुटी'));
        }
      } catch (err) {
        alert('API त्रुटी: ' + err.message);
      } finally {
        btnRunSimulation.disabled = false;
        btnRunSimulation.innerHTML = '⚡ Run Time Machine (सिम्युलेशन चालवा)';
      }
    });
  }

  function renderSimulationResult(sim) {
    if (!tmResultBox) return;
    const p = sim.probabilities;
    const d = sim.distribution;
    const v = sim.verdict;
    const cat = sim.verdictCategory;

    let badgeClass = 'badge-neutral';
    if (cat === 'BULLISH_EDGE' || cat === 'MODERATE_EDGE') badgeClass = 'badge-success';
    if (cat === 'HIGH_RISK' || cat === 'NEGATIVE_EDGE') badgeClass = 'badge-danger';

    tmResultBox.innerHTML = `
      <div class="sim-card card-glass">
        <div class="sim-header">
          <div>
            <h4>🎯 [${sim.plan.symbol}] ${sim.plan.side} SETUP ODDS — ${sim.plan.replays.toLocaleString()} REPLAYS</h4>
            <span class="sim-sub">Risk: ₹${sim.plan.risk} | Target R: ${sim.plan.rewardToRisk}R | Stop Rule: Protective Risk</span>
          </div>
          <span class="verdict-pill ${badgeClass}">${v}</span>
        </div>

        <div class="sim-metric-grid">
          <div class="sim-metric-box">
            <span class="sim-lbl">Target Hit Odds</span>
            <span class="sim-val text-green">${p.targetHitPct}%</span>
          </div>
          <div class="sim-metric-box">
            <span class="sim-lbl">Stop Loss Hit Odds</span>
            <span class="sim-val text-red">${p.stopHitPct}%</span>
          </div>
          <div class="sim-metric-box">
            <span class="sim-lbl">Open at Session Close</span>
            <span class="sim-val text-yellow">${p.openAtClosePct}%</span>
          </div>
          <div class="sim-metric-box">
            <span class="sim-lbl">Empirical Expected R</span>
            <span class="sim-val text-glow">${d.expectedR > 0 ? '+' : ''}${d.expectedR}R</span>
          </div>
        </div>

        <div class="sim-summary-note">
          <p>💡 <strong>Time Machine Verdict:</strong> ${sim.honestOddsSummary}</p>
        </div>
      </div>
    `;
    tmResultBox.style.display = 'block';
  }

  // 2. ORB Scanner
  async function loadOrbSetups() {
    if (!orbResultsContainer) return;
    orbResultsContainer.innerHTML = '<div class="muted">15-minute Opening Range Breakouts तपासले जात आहेत...</div>';

    try {
      const resp = await fetch('/api/scanner/orb');
      const json = await resp.json();
      if (json.success && json.data) {
        renderOrbResults(json.data);
      }
    } catch (_) {
      orbResultsContainer.innerHTML = '<div class="muted">स्कॅनर डेटा लोड होऊ शकला नाही.</div>';
    }
  }

  if (btnScanOrb) {
    btnScanOrb.addEventListener('click', loadOrbSetups);
  }

  function renderOrbResults(data) {
    if (!orbResultsContainer) return;
    const candidates = data.candidates || [];

    if (candidates.length === 0) {
      orbResultsContainer.innerHTML = '<div class="muted">कोणतेही ORB सेटअप सध्या उपलब्ध नाहीत.</div>';
      return;
    }

    let rowsHtml = candidates.map(c => {
      const statusBadge = c.status === 'TRIGGERED' 
        ? '<span class="status-badge-triggered">⚡ TRIGGERED</span>' 
        : '<span class="status-badge-waiting">⏳ WAITING</span>';

      return `
        <tr>
          <td><strong>${c.symbol}</strong><br><small class="muted">${c.name || ''}</small></td>
          <td class="mono">₹${c.cmp.toFixed(2)}</td>
          <td class="mono">High: ₹${c.orHigh}<br>Low: ₹${c.orLow}</td>
          <td class="mono text-glow">₹${c.orMid}</td>
          <td class="mono text-green">₹${c.target1} (1R)<br>₹${c.target2} (2R)</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-micro-replay" onclick="window.populateTimeMachine('${c.symbol}', '${c.side === 'MONITOR' ? 'BUY' : c.side}', ${c.entryPrice}, ${c.stopLoss}, ${c.target1})">
              ⏳ Replay
            </button>
          </td>
        </tr>
      `;
    }).join('');

    orbResultsContainer.innerHTML = `
      <div class="table-responsive">
        <table class="sub-table">
          <thead>
            <tr>
              <th>शेअर / इंडेक्स</th>
              <th>Live CMP</th>
              <th>15m Range (High/Low)</th>
              <th>OR-Midpoint Stop</th>
              <th>टार्गेट्स (Targets)</th>
              <th>स्थिती</th>
              <th>कृती</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // Populate helper to transfer ORB setup into Time Machine simulator
  window.populateTimeMachine = function(sym, side, entry, stop, target) {
    if (tmSymbolInput) tmSymbolInput.value = sym;
    if (tmSideSelect) tmSideSelect.value = side;
    if (tmEntryInput) tmEntryInput.value = entry;
    if (tmStopInput) tmStopInput.value = stop;
    if (tmTargetInput) tmTargetInput.value = target;

    // Also populate Risk Calculator
    const riskEntryInput = document.getElementById('riskEntryInput');
    const riskStopInput = document.getElementById('riskStopInput');
    if (riskEntryInput) riskEntryInput.value = entry;
    if (riskStopInput) riskStopInput.value = stop;

    // Refresh live feedback display
    updateLiveFeedbackAndSync();

    // Scroll to simulator
    const simBox = document.querySelector('.time-machine-controls');
    if (simBox) simBox.scrollIntoView({ behavior: 'smooth' });
  };

  // 3. Position Sizing & Pre-Trade Risk Gate
  if (btnCalcSize) {
    btnCalcSize.addEventListener('click', async () => {
      const capital = parseFloat(riskCapitalInput?.value || '100000');
      const maxLossRupees = parseFloat(riskMaxLossInput?.value || '1000');
      const entry = parseFloat(document.getElementById('riskEntryInput')?.value || tmEntryInput?.value || '0');
      const stop = parseFloat(document.getElementById('riskStopInput')?.value || tmStopInput?.value || '0');
      const symbol = (tmSymbolInput?.value || 'TCS').trim().toUpperCase();
      const side = tmSideSelect?.value || 'BUY';

      if (!entry || !stop) {
        alert('कृपया Entry आणि Stop Loss किंमती भरा.');
        return;
      }

      try {
        const resp = await fetch('/api/risk/calculate-size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, side, entry, stop, capital, maxLossRupees })
        });
        const data = await resp.json();
        if (data.success && data.positionSize) {
          renderPositionSizeResult(data.positionSize);
        } else {
          alert('त्रुटी: ' + (data.error || 'अज्ञात समस्या'));
        }
      } catch (e) {
        alert('API त्रुटी: ' + e.message);
      }
    });
  }

  function renderPositionSizeResult(size) {
    if (!riskResultBox) return;
    riskResultBox.innerHTML = `
      <div class="risk-summary-card card-glass">
        <h4>⚖️ MATHEMATICAL POSITION SIZE — [${size.symbol}]</h4>
        <div class="risk-kpi-grid">
          <div class="risk-kpi">
            <span class="lbl">शिफारस केलेले शेअर्स</span>
            <span class="val text-glow">${size.quantity} शेअर्स</span>
          </div>
          <div class="risk-kpi">
            <span class="lbl">एकूण गुंतवणूक भांडवल</span>
            <span class="val">₹${size.totalInvestment.toLocaleString('en-IN')}</span>
          </div>
          <div class="risk-kpi">
            <span class="lbl">प्रत्यक्ष जोखीम (Actual Risk)</span>
            <span class="val text-red">₹${size.actualRiskRupees.toLocaleString('en-IN')} (${size.riskPctOfCapital}%)</span>
          </div>
          <div class="risk-kpi">
            <span class="lbl">मर्यादा घटक (Limiting Factor)</span>
            <span class="val text-yellow">${size.limitingFactor}</span>
          </div>
        </div>
      </div>
    `;
    riskResultBox.style.display = 'block';
  }

  // Risk Gate Evaluator
  if (btnCheckRiskGate) {
    btnCheckRiskGate.addEventListener('click', async () => {
      const symbol = (tmSymbolInput?.value || 'TCS').trim().toUpperCase();
      const side = tmSideSelect?.value || 'BUY';
      const entry = parseFloat(document.getElementById('riskEntryInput')?.value || tmEntryInput?.value || '0');
      const stop = parseFloat(document.getElementById('riskStopInput')?.value || tmStopInput?.value || '0');
      const target = parseFloat(tmTargetInput?.value || (entry > stop ? entry * 1.02 : entry * 0.98));
      const capital = parseFloat(riskCapitalInput?.value || '100000');
      const maxLossRupees = parseFloat(riskMaxLossInput?.value || '1000');

      try {
        // First calculate exact size
        const sizeResp = await fetch('/api/risk/calculate-size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, side, entry, stop, capital, maxLossRupees })
        });
        const sizeData = await sizeResp.json();
        const quantity = sizeData.positionSize?.quantity || 1;

        // Then check risk gate
        const gateResp = await fetch('/api/risk/evaluate-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, side, entry, stop, target1: target, quantity })
        });
        const gateData = await gateResp.json();

        if (gateData.success && gateData.evaluation) {
          renderRiskGateResult(gateData.evaluation);
        }
      } catch (e) {
        alert('Risk Gate त्रुटी: ' + e.message);
      }
    });
  }

  function renderRiskGateResult(gate) {
    if (!riskTicketBox) return;
    const isPass = gate.verdict === 'PASS';
    const badge = isPass 
      ? '<span class="status-badge-triggered">🟢 PASS (ट्रेड सुरक्षित)</span>' 
      : '<span class="status-badge-blocked">🔴 BLOCK (नियम उल्लंघन)</span>';

    let reasonList = '';
    if (gate.reasons && gate.reasons.length > 0) {
      reasonList = `<div class="block-reasons-box"><strong>अडथळ्याची कारणे (Violations):</strong><ul>${gate.reasons.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
    }
    let warnList = '';
    if (gate.warnings && gate.warnings.length > 0) {
      warnList = `<div class="warn-box"><strong>सावधगिरीच्या सूचना:</strong><ul>${gate.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`;
    }

    const t = gate.bracketTicket;

    riskTicketBox.innerHTML = `
      <div class="ticket-card card-glass">
        <div class="ticket-header">
          <h4>🛡️ PRE-TRADE RISK GATE: ${badge}</h4>
          <span class="mono">${t.ticketId}</span>
        </div>
        ${reasonList}
        ${warnList}
        <div class="bracket-details-grid">
          <div><strong>शेअर:</strong> ${t.symbol}</div>
          <div><strong>कृती:</strong> ${t.action}</div>
          <div><strong>प्रवेश स्तर:</strong> ₹${t.entryPrice}</div>
          <div><strong>स्टॉप लॉस:</strong> ₹${t.stopLoss}</div>
          <div><strong>टार्गेट:</strong> ₹${t.takeProfit}</div>
          <div><strong>संख्या:</strong> ${t.quantity} Shares</div>
        </div>
        <div class="ticket-footer">
          <small class="muted">⚠️ कागदी चाचणी मोड (Paper Trading Only). थेट ब्रोकरकडे थेट ऑर्डर जात नाही.</small>
        </div>
      </div>
    `;
    riskTicketBox.style.display = 'block';
  }
});

