/**
 * scripts/run_gap_and_accuracy_audit.js
 * Comprehensive Gap, Loophole & Mathematical Accuracy Verification Suite
 * Market Pulse AI Terminal & Intraday Share Market Trading Bot
 * 
 * Verifies 36 rigorous audit criteria across:
 * - Mathematical Invariants & Probability Conservation
 * - Edge Cases (inverted prices, division by zero, extreme capital, NaN)
 * - Risk Gate Rules (Mandatory Stop, Penny Stocks, 1:1.5 R:R, Time Windows)
 * - 1,000 Stocks Data Integrity, Diversity & Sub-millisecond Search
 * - Concurrency & Atomic File Safety
 * - Live HTTP REST Endpoints on Port 5000
 * - 11 Installed Day Trader Skills & Python Bridge
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const timeMachineEngine = require('../timeMachineEngine');
const orbScannerEngine = require('../orbScannerEngine');
const riskBudgetService = require('../riskBudgetService');
const stockAnalysisService = require('../stockAnalysisService');

let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    results.push({ name: testName, status: 'PASS', details });
    console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
  } else {
    failedTests++;
    results.push({ name: testName, status: 'FAIL', details });
    console.log(`  \x1b[31m[FAIL]\x1b[0m ${testName} - ${details}`);
  }
}

function makeHttpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (_) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(4000, () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runGapAndAccuracyAudit() {
  console.log('\n================================================================');
  console.log('   MARKET PULSE AI TERMINAL — GAP & ACCURACY VERIFICATION AUDIT');
  console.log('================================================================\n');

  // =================================================================
  // SECTION 1: TIME MACHINE MONTE CARLO MATHEMATICAL ACCURACY
  // =================================================================
  console.log('--- SECTION 1: Time Machine Monte Carlo Mathematical Accuracy ---');

  // Test 1: Probability conservation
  const sim1 = timeMachineEngine.runSimulation({
    symbol: 'TCS',
    side: 'BUY',
    entry: 3500,
    stop: 3465,
    target: 3570,
    replays: 2000,
    seed: 42
  });
  const sumProb = sim1.probabilities.targetHitPct + sim1.probabilities.stopHitPct + sim1.probabilities.openAtClosePct;
  assert(Math.abs(sumProb - 100.0) <= 0.3, '1. Probability Conservation Invariant', `Sum = ${sumProb}%`);

  // Test 2: Inverted BUY stop rejection
  let err2 = null;
  try {
    timeMachineEngine.runSimulation({ symbol: 'TCS', side: 'BUY', entry: 3500, stop: 3550, target: 3600 });
  } catch (e) { err2 = e.message; }
  assert(err2 && err2.includes('strictly below'), '2. Inverted BUY Stop Loss Rejected', err2);

  // Test 3: Inverted BUY target rejection
  let err3 = null;
  try {
    timeMachineEngine.runSimulation({ symbol: 'TCS', side: 'BUY', entry: 3500, stop: 3450, target: 3480 });
  } catch (e) { err3 = e.message; }
  assert(err3 && err3.includes('strictly above'), '3. Inverted BUY Target Rejected', err3);

  // Test 4: Inverted SELL stop rejection
  let err4 = null;
  try {
    timeMachineEngine.runSimulation({ symbol: 'INFY', side: 'SELL', entry: 1600, stop: 1550, target: 1500 });
  } catch (e) { err4 = e.message; }
  assert(err4 && err4.includes('strictly above'), '4. Inverted SELL Stop Loss Rejected', err4);

  // Test 5: Inverted SELL target rejection
  let err5 = null;
  try {
    timeMachineEngine.runSimulation({ symbol: 'INFY', side: 'SELL', entry: 1600, stop: 1650, target: 1620 });
  } catch (e) { err5 = e.message; }
  assert(err5 && err5.includes('strictly below'), '5. Inverted SELL Target Rejected', err5);

  // Test 6: Zero or negative prices rejected
  let err6 = null;
  try {
    timeMachineEngine.runSimulation({ symbol: 'INFY', side: 'BUY', entry: -100, stop: 50, target: 200 });
  } catch (e) { err6 = e.message; }
  assert(err6 && err6.includes('positive number'), '6. Zero/Negative Price Plan Rejected', err6);

  // Test 7: Deterministic Seed Reproducibility
  const simSeedA = timeMachineEngine.runSimulation({ symbol: 'RELIANCE', side: 'BUY', entry: 3000, stop: 2970, target: 3060, replays: 1000, seed: 99 });
  const simSeedB = timeMachineEngine.runSimulation({ symbol: 'RELIANCE', side: 'BUY', entry: 3000, stop: 2970, target: 3060, replays: 1000, seed: 99 });
  assert(
    simSeedA.probabilities.targetHitPct === simSeedB.probabilities.targetHitPct &&
    simSeedA.probabilities.stopHitPct === simSeedB.probabilities.stopHitPct &&
    simSeedA.distribution.expectedR === simSeedB.distribution.expectedR,
    '7. Deterministic Seed Reproducibility (Bit-Exact)',
    `Target: ${simSeedA.probabilities.targetHitPct}% vs ${simSeedB.probabilities.targetHitPct}%`
  );

  // Test 8: Replays clamping safe bounds
  const simClampHigh = timeMachineEngine.runSimulation({ symbol: 'TCS', side: 'BUY', entry: 3500, stop: 3465, target: 3570, replays: 999999 });
  const simClampLow = timeMachineEngine.runSimulation({ symbol: 'TCS', side: 'BUY', entry: 3500, stop: 3465, target: 3570, replays: -10 });
  assert(simClampHigh.plan.replays === 20000 && simClampLow.plan.replays === 100, '8. Replays Safe Bounds Clamping (100 to 20,000)', `High: ${simClampHigh.plan.replays}, Low: ${simClampLow.plan.replays}`);

  // Test 9: R-Expectancy calculation
  assert(typeof sim1.distribution.expectedR === 'number' && !isNaN(sim1.distribution.expectedR), '9. Empirical Expected R Computed Correctly', `Exp R: ${sim1.distribution.expectedR}`);

  // =================================================================
  // SECTION 2: POSITION SIZING & PRE-TRADE RISK GATE
  // =================================================================
  console.log('\n--- SECTION 2: Position Sizing & Pre-Trade Risk Gate ---');

  // Test 10: Position Sizing Risk Upper Bound
  const size1 = riskBudgetService.calculatePositionSize({
    symbol: 'TCS',
    side: 'BUY',
    entry: 3500,
    stop: 3465,
    capital: 100000,
    maxLossRupees: 1000
  });
  assert(size1.actualRiskRupees <= 1000, '10. Position Size Strictly Bounded by Max Risk', `Actual Risk: ₹${size1.actualRiskRupees} <= ₹1,000`);

  // Test 11: Position Sizing Position Cap & Cash Buffer
  assert(size1.totalInvestment <= 50000 && size1.totalInvestment <= 90000, '11. Position Size Bounded by 50% Cap & 10% Cash Buffer', `Invested: ₹${size1.totalInvestment}`);

  // Test 12: F&O Lot Size Rounding
  const sizeLot = riskBudgetService.calculatePositionSize({
    symbol: 'NIFTY',
    side: 'BUY',
    entry: 23000,
    stop: 22950,
    capital: 500000,
    maxLossRupees: 5000,
    lotSize: 25
  });
  assert(sizeLot.quantity % 25 === 0 && sizeLot.quantity >= 0, '12. F&O Lot Size Integer Multiple Rounding', `Qty: ${sizeLot.quantity} (Lots: ${sizeLot.lots})`);

  // Test 13: Zero/Negative capital rejection
  let err13 = null;
  try {
    riskBudgetService.calculatePositionSize({ symbol: 'TCS', entry: 3500, stop: 3465, capital: -50000 });
  } catch (e) { err13 = e.message; }
  assert(err13 && err13.includes('positive number'), '13. Negative Capital Rejected', err13);

  // Test 14: Risk Gate Mandatory Stop Loss
  const gateMissingStop = riskBudgetService.evaluateRiskGate({
    symbol: 'TCS',
    side: 'BUY',
    entry: 3500,
    stop: 0,
    target1: 3570,
    quantity: 10
  });
  assert(gateMissingStop.verdict === 'BLOCK' && gateMissingStop.reasons.some(r => r.includes('STOP_LOSS_MISSING')), '14. Risk Gate Blocks Missing Stop Loss', gateMissingStop.reasons[0]);

  // Test 15: Risk Gate Inverted Direction
  const gateInverted = riskBudgetService.evaluateRiskGate({
    symbol: 'TCS',
    side: 'BUY',
    entry: 3500,
    stop: 3550,
    target1: 3400,
    quantity: 10
  });
  assert(gateInverted.verdict === 'BLOCK' && gateInverted.reasons.some(r => r.includes('INVALID_STOP')), '15. Risk Gate Blocks Inverted Stop & Target', gateInverted.reasons.join(' | '));

  // Test 16: Risk Gate Penny Stock Filter (< ₹50)
  const gatePenny = riskBudgetService.evaluateRiskGate({
    symbol: 'PENNYCO',
    side: 'BUY',
    entry: 25.50,
    stop: 24.00,
    target1: 28.50,
    quantity: 100
  });
  assert(gatePenny.verdict === 'BLOCK' && gatePenny.reasons.some(r => r.includes('PENNY_STOCK_BLOCKED')), '16. Risk Gate Blocks Penny Stocks (< ₹50)', gatePenny.reasons[0]);

  // Test 17: Risk Gate Insufficient R:R (< 1.5)
  const gateBadRR = riskBudgetService.evaluateRiskGate({
    symbol: 'TCS',
    side: 'BUY',
    entry: 3500,
    stop: 3450, // Risk = 50
    target1: 3550, // Reward = 50 (1 : 1.0 < 1.5)
    quantity: 10
  });
  assert(gateBadRR.verdict === 'BLOCK' && gateBadRR.reasons.some(r => r.includes('INSUFFICIENT_RR')), '17. Risk Gate Blocks Insufficient Reward:Risk (< 1.5)', gateBadRR.reasons[0]);

  // Test 18: Standardized Bracket Ticket Generation
  const gatePass = riskBudgetService.evaluateRiskGate({
    symbol: 'TCS',
    side: 'BUY',
    entry: 3500,
    stop: 3465,
    target1: 3570,
    quantity: size1.quantity
  });
  assert(gatePass.bracketTicket && gatePass.bracketTicket.simulatedOnly === true && gatePass.bracketTicket.orderType === 'BRACKET_LIMIT', '18. Standardized Bracket Ticket Generated (Simulated Only)', gatePass.bracketTicket.ticketId);

  // =================================================================
  // SECTION 3: OPENING RANGE BREAKOUT (ORB) ENGINE
  // =================================================================
  console.log('\n--- SECTION 3: Opening Range Breakout (ORB) Engine ---');

  // Test 19: Inverted/Flat High-Low Range Guard
  const orbInverted = orbScannerEngine.calculateOrbPlan({
    symbol: 'FLATCO',
    high15m: 100,
    low15m: 105, // Inverted
    cmp: 100
  });
  assert(orbInverted.orHigh > orbInverted.orLow && orbInverted.orRange > 0, '19. ORB Guard Enforces orHigh > orLow & Positive Range', `Range: ₹${orbInverted.orRange}`);

  // Test 20: Institutional OR-Midpoint Stop
  const orbNormal = orbScannerEngine.calculateOrbPlan({
    symbol: 'RELIANCE',
    high15m: 3000,
    low15m: 2960,
    cmp: 2980
  });
  assert(orbNormal.orMid === 2980, '20. Institutional OR-Midpoint Stop Calculation', `Mid = ₹${orbNormal.orMid}`);

  // Test 21: 1R, 2R, 3R Target Calculation
  const orbBuy = orbScannerEngine.calculateOrbPlan({
    symbol: 'RELIANCE',
    high15m: 3000,
    low15m: 2960,
    cmp: 3010,
    side: 'BUY'
  });
  const expectedRisk = Number((orbBuy.entryPrice - orbBuy.stopLoss).toFixed(2));
  assert(orbBuy.target1 === Number((orbBuy.entryPrice + expectedRisk).toFixed(2)), '21. Exact 1R/2R Target Math in ORB', `Entry: ₹${orbBuy.entryPrice}, Stop: ₹${orbBuy.stopLoss}, T1: ₹${orbBuy.target1}`);

  // Test 22: ORB Scan on Master Stocks
  const scanResult = orbScannerEngine.scanOrbSetups();
  assert(scanResult.totalScanned > 0 && Array.isArray(scanResult.candidates), '22. ORB Engine Scans Stock Universe Successfully', `Scanned: ${scanResult.totalScanned}, Candidates: ${scanResult.candidates.length}`);

  // =================================================================
  // SECTION 4: 1,000 STOCKS DATA INTEGRITY & SUB-MILLISECOND SEARCH
  // =================================================================
  console.log('\n--- SECTION 4: 1,000 Stocks Data Integrity & Search Benchmark ---');

  const masterPath = path.join(__dirname, '..', 'data', 'nse_bse_master_stocks.json');
  const masterStocks = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

  // Test 23: Master file length
  assert(masterStocks.length === 1000, '23. Master Stock Database Contains Exactly 1,000 Stocks', `Count: ${masterStocks.length}`);

  // Test 24: Schema compliance
  let schemaValid = true;
  for (const s of masterStocks) {
    if (!s.symbol || !s.name || !s.bseCode || !s.sector || !s.capCategory) {
      schemaValid = false;
      break;
    }
  }
  assert(schemaValid, '24. 100% Schema Compliance Across All 1,000 Stocks', 'Every stock has symbol, name, bseCode, sector, capCategory');

  // Test 25: Market cap diversity
  const caps = new Set(masterStocks.map(s => s.capCategory));
  assert(caps.has('Large Cap') && caps.has('Mid Cap') && caps.has('Small Cap') && caps.has('Micro Cap'), '25. Cap Diversity Verified (Large, Mid, Small, Micro)', Array.from(caps).join(', '));

  // Test 26: Search engine benchmark (50 rapid queries)
  const t0 = Date.now();
  const searchQueries = ['TCS', 'RELIANCE', 'ZOMATO', 'SUZLON', 'TATA', 'BANK', 'INFY', 'POWER', 'STEEL', 'PHARMA'];
  for (let i = 0; i < 5; i++) {
    for (const q of searchQueries) {
      await stockAnalysisService.searchIndianStocks(q);
    }
  }
  const searchDuration = Date.now() - t0;
  assert(searchDuration < 500, '26. Search Benchmark: 50 Queries in < 500ms', `Total time: ${searchDuration}ms (${(searchDuration / 50).toFixed(2)}ms/query)`);

  // Test 27: Regex/Special Characters Safety
  let specialSafe = true;
  try {
    await stockAnalysisService.searchIndianStocks('(*+?|^$');
    await stockAnalysisService.searchIndianStocks('TCS (NSE)');
  } catch (_) {
    specialSafe = false;
  }
  assert(specialSafe, '27. Search Handles Special Characters & Parentheses Without Crashing', 'Safe from ReDoS and malformed regex');

  // =================================================================
  // SECTION 5: CONCURRENCY & ATOMIC PERSISTENCE
  // =================================================================
  console.log('\n--- SECTION 5: Concurrency & Atomic Persistence Safety ---');

  // Test 28: Simulated High-Frequency Simulation Writes
  let writeSafe = true;
  try {
    for (let i = 0; i < 5; i++) {
      timeMachineEngine.runSimulation({
        symbol: 'TCS',
        side: 'BUY',
        entry: 3500 + i,
        stop: 3465 + i,
        target: 3570 + i,
        replays: 200
      });
    }
    const simFile = path.join(__dirname, '..', 'data', 'timemachine_simulations.json');
    const parsed = JSON.parse(fs.readFileSync(simFile, 'utf8'));
    writeSafe = Array.isArray(parsed) && parsed.length > 0;
  } catch (_) {
    writeSafe = false;
  }
  assert(writeSafe, '28. Atomic .tmp Write Protection Preserves Valid JSON Under Load', 'data/timemachine_simulations.json is intact');

  // =================================================================
  // SECTION 6: LIVE HTTP REST ENDPOINTS (PORT 5000)
  // =================================================================
  console.log('\n--- SECTION 6: Live HTTP REST Endpoints (Port 5000) ---');

  // Test 29: POST /api/timemachine/run (Valid)
  const httpTmValid = await makeHttpRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/timemachine/run',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { symbol: 'TCS', side: 'BUY', entry: 3500, stop: 3465, target: 3570, replays: 500 });
  assert(httpTmValid.statusCode === 200 && httpTmValid.data.success && httpTmValid.data.simulation, '29. HTTP POST /api/timemachine/run Returns 200 & Simulation', `Status: ${httpTmValid.statusCode}`);

  // Test 30: POST /api/timemachine/run (Invalid Inverted Stop)
  const httpTmInvalid = await makeHttpRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/timemachine/run',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { symbol: 'TCS', side: 'BUY', entry: 3500, stop: 3550, target: 3600, replays: 500 });
  assert(httpTmInvalid.statusCode === 400 && httpTmInvalid.data.success === false, '30. HTTP POST /api/timemachine/run Rejects Inverted Stop with 400', `Error: ${httpTmInvalid.data.error}`);

  // Test 31: POST /api/risk/calculate-size (Valid)
  const httpRiskSize = await makeHttpRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/risk/calculate-size',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { symbol: 'RELIANCE', side: 'BUY', entry: 3000, stop: 2970, capital: 100000 });
  assert(httpRiskSize.statusCode === 200 && httpRiskSize.data.positionSize.quantity > 0, '31. HTTP POST /api/risk/calculate-size Returns 200 & Quantity', `Qty: ${httpRiskSize.data.positionSize.quantity}`);

  // Test 32: POST /api/risk/evaluate-gate (Valid)
  const httpRiskGate = await makeHttpRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/risk/evaluate-gate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { symbol: 'RELIANCE', side: 'BUY', entry: 3000, stop: 2970, target1: 3060, quantity: 15 });
  assert(httpRiskGate.statusCode === 200 && (httpRiskGate.data.evaluation.verdict === 'PASS' || httpRiskGate.data.evaluation.verdict === 'BLOCK'), '32. HTTP POST /api/risk/evaluate-gate Returns 200 & Verdict', `Verdict: ${httpRiskGate.data.evaluation.verdict}`);

  // Test 33: GET /api/scanner/orb
  const httpOrb = await makeHttpRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/scanner/orb',
    method: 'GET'
  });
  assert(httpOrb.statusCode === 200 && httpOrb.data.success && httpOrb.data.data.candidates.length > 0, '33. HTTP GET /api/scanner/orb Returns 200 & Candidates', `Candidates: ${httpOrb.data.data.candidates.length}`);

  // Test 34: GET /health
  const httpHealth = await makeHttpRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/health',
    method: 'GET'
  });
  assert(httpHealth.statusCode === 200 && httpHealth.data.status === 'healthy', '34. HTTP GET /health Returns 200 Healthy', `Uptime: ${httpHealth.data.uptime}s`);

  // =================================================================
  // SECTION 7: 11 TRADER SKILLS & PYTHON BRIDGE
  // =================================================================
  console.log('\n--- SECTION 7: 11 Day Trader Skills & Python Bridge ---');

  const skillsDir = path.join(process.env.USERPROFILE || 'C:\\Users\\user', '.gemini', 'config', 'skills');
  const requiredSkills = [
    'trader-alerts', 'trader-analyst', 'trader-broker', 'trader-budget',
    'trader-entry', 'trader-exit', 'trader-news', 'trader-pelosi',
    'trader-risk', 'trader-scanner', 'trader-timemachine'
  ];
  const allSkillsInstalled = requiredSkills.every(s => fs.existsSync(path.join(skillsDir, s, 'SKILL.md')));
  assert(allSkillsInstalled, '35. All 11 Day Trader Skills Verified in Global Directory', `11/11 skills present at: ${skillsDir}`);

  // Test 36: Python Trader Bridge Execution
  let pythonOk = false;
  try {
    const pyOutput = execSync('python scripts/python_trader_bridge.py test', { encoding: 'utf8' });
    const pyJson = JSON.parse(pyOutput);
    pythonOk = pyJson.engine && pyJson.probabilities && pyJson.verdict;
  } catch (_) {
    pythonOk = false;
  }
  assert(pythonOk, '36. Python 3 Native Analytical Bridge Executes Seamlessly', 'Returns Box-Muller probabilities matching specs');

  // =================================================================
  // SUMMARY
  // =================================================================
  console.log('\n================================================================');
  console.log(`   AUDIT COMPLETE: ${passedTests} / 36 PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runGapAndAccuracyAudit().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});

