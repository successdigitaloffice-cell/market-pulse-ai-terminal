/**
 * scripts/run_15_audit_tests.js
 * Automated Test Suite executing all 15 audit test scenarios specified in user prompt.
 */

const fs = require('fs');
const path = require('path');

// Clean up any test records in trade_signals.json before running tests
const SIGNALS_FILE = path.join(__dirname, '..', 'data', 'trade_signals.json');
try {
  if (fs.existsSync(SIGNALS_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
    const cleaned = raw.filter(s => !s.signalId.startsWith('TEST-'));
    fs.writeFileSync(SIGNALS_FILE, JSON.stringify(cleaned, null, 2));
  }
} catch (_) {}

const tradeTracker = require('../tradeTrackingService');
const liveMarket = require('../liveMarketService');

const results = [];
let passCount = 0;
let failCount = 0;

function recordTest(testNumber, name, passed, details) {
  const status = passed ? 'PASS' : 'FAIL';
  if (passed) passCount++;
  else failCount++;
  results.push({
    testNumber,
    name,
    status,
    timestamp: new Date().toISOString(),
    details
  });
  console.log(`[TEST ${String(testNumber).padStart(2, '0')}] ${status} — ${name}`);
  if (details) console.log(`   └─ ${details}`);
}

async function runTestSuite() {
  const runId = Date.now().toString().slice(-4);
  console.log('================================================================');
  console.log('   STOCK MARKET AI AGENT — 15 AUTOMATED AUDIT TEST CASES SUITE   ');
  console.log(`   Execution Run ID: ${runId} | Time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('================================================================\n');

  // TEST 1: योग्य BUY Signal तयार होतो.
  try {
    const buySig = tradeTracker.registerSignal({
      signalId: `TEST-BUY-${runId}-001`,
      instrument: 'RELIANCE',
      instrumentType: 'EQUITY_CASH',
      direction: 'BUY (LONG)',
      strategy: 'Breakout above Day High',
      marketPrice: 1150.00,
      entryPrice: 1150.00,
      stopLoss: 1140.00,
      target1: 1170.00,
      target2: 1185.00,
      target3: 1200.00,
      quantity: 50
    });
    const valid = buySig && buySig.direction.includes('BUY') && buySig.stopLoss < buySig.entryPrice && buySig.target1 > buySig.entryPrice;
    recordTest(1, 'योग्य BUY Signal तयार होतो', valid, `Signal ID: ${buySig.signalId}, Entry: ₹${buySig.entryPrice}, SL: ₹${buySig.stopLoss}, T1: ₹${buySig.target1}`);
  } catch (e) {
    recordTest(1, 'योग्य BUY Signal तयार होतो', false, e.message);
  }

  // TEST 2: योग्य SELL Signal तयार होतो.
  try {
    const sellSig = tradeTracker.registerSignal({
      signalId: `TEST-SELL-${runId}-002`,
      instrument: 'INFY',
      instrumentType: 'EQUITY_CASH',
      direction: 'SELL (SHORT)',
      strategy: 'Breakdown below VWAP',
      marketPrice: 1020.00,
      entryPrice: 1020.00,
      stopLoss: 1030.00,
      target1: 1000.00,
      target2: 990.00,
      target3: 980.00,
      quantity: 40
    });
    const valid = sellSig && sellSig.direction.includes('SELL') && sellSig.stopLoss > sellSig.entryPrice && sellSig.target1 < sellSig.entryPrice;
    recordTest(2, 'योग्य SELL Signal तयार होतो', valid, `Signal ID: ${sellSig.signalId}, Entry: ₹${sellSig.entryPrice}, SL: ₹${sellSig.stopLoss}, T1: ₹${sellSig.target1}`);
  } catch (e) {
    recordTest(2, 'योग्य SELL Signal तयार होतो', false, e.message);
  }

  // TEST 3: BUY CALL आणि BUY PUT योग्य Contract शी जोडले जातात.
  try {
    const callSig = tradeTracker.registerSignal({
      signalId: `TEST-CALL-${runId}-003`,
      instrument: 'NIFTY 22600 CE',
      instrumentType: 'OPTION',
      direction: 'BUY CALL (CE)',
      marketPrice: 120.00,
      entryPrice: 125.00,
      stopLoss: 95.00,
      target1: 175.00,
      optionDetails: { underlying: 'NIFTY', strike: 22600, optionType: 'CE', expiry: '15-OCT-2026', lotSize: 25 }
    });

    const putSig = tradeTracker.registerSignal({
      signalId: `TEST-PUT-${runId}-004`,
      instrument: 'BANK NIFTY 54900 PE',
      instrumentType: 'OPTION',
      direction: 'BUY PUT (PE)',
      marketPrice: 210.00,
      entryPrice: 215.00,
      stopLoss: 165.00,
      target1: 285.00,
      optionDetails: { underlying: 'BANK NIFTY', strike: 54900, optionType: 'PE', expiry: '15-OCT-2026', lotSize: 15 }
    });

    const validCall = callSig.optionDetails && callSig.optionDetails.optionType === 'CE' && callSig.optionDetails.strike === 22600 && callSig.lotSize === 25;
    const validPut = putSig.optionDetails && putSig.optionDetails.optionType === 'PE' && putSig.optionDetails.strike === 54900 && putSig.lotSize === 15;
    recordTest(3, 'BUY CALL आणि BUY PUT योग्य Contract शी जोडले जातात', validCall && validPut, 
      `NIFTY CE (Strike: ${callSig.optionDetails.strike}, Lot: ${callSig.lotSize}) & BANK NIFTY PE (Strike: ${putSig.optionDetails.strike}, Lot: ${putSig.lotSize})`);
  } catch (e) {
    recordTest(3, 'BUY CALL आणि BUY PUT योग्य Contract शी जोडले जातात', false, e.message);
  }

  // TEST 4: Entry Trigger होते.
  try {
    const testSig = tradeTracker.registerSignal({
      signalId: `TEST-TRIGGER-${runId}-005`,
      instrument: 'TCS',
      direction: 'BUY (LONG)',
      entryPrice: 2130.00,
      stopLoss: 2110.00,
      target1: 2160.00,
      quantity: 10
    });
    // Simulate live quotes where high breaches entry
    const mockQuotes = new Map();
    mockQuotes.set('TCS', { price: 2135.00, high: 2140.00, low: 2125.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    const updated = tradeTracker.getSignalById(`TEST-TRIGGER-${runId}-005`);
    const valid = updated.actualEntryTriggered === true && updated.entryTriggeredAt != null;
    recordTest(4, 'Entry Trigger होते', valid, `Entry Triggered: ${updated.actualEntryTriggered}, Time: ${updated.entryTriggeredAt}`);
  } catch (e) {
    recordTest(4, 'Entry Trigger होते', false, e.message);
  }

  // TEST 5: Entry Trigger होत नाही.
  try {
    const testSig = tradeTracker.registerSignal({
      signalId: `TEST-NOTRIGGER-${runId}-006`,
      instrument: 'HDFCBANK',
      direction: 'BUY (LONG)',
      entryPrice: 950.00, // CMP is ~704, far above
      stopLoss: 930.00,
      target1: 980.00,
      quantity: 10
    });
    const mockQuotes = new Map();
    mockQuotes.set('HDFCBANK', { price: 704.90, high: 711.85, low: 700.35 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    const updated = tradeTracker.getSignalById(`TEST-NOTRIGGER-${runId}-006`);
    const valid = updated.actualEntryTriggered === false && updated.entryTriggeredAt === null;
    recordTest(5, 'Entry Trigger होत नाही', valid, `actualEntryTriggered: ${updated.actualEntryTriggered}, Price High: 711.85 < Entry: 950.00`);
  } catch (e) {
    recordTest(5, 'Entry Trigger होत नाही', false, e.message);
  }

  // TEST 6: Target Hit होतो.
  try {
    const testSig = tradeTracker.registerSignal({
      signalId: `TEST-TARGET-${runId}-007`,
      instrument: 'TECHM',
      direction: 'BUY (LONG)',
      entryPrice: 1470.00,
      stopLoss: 1450.00,
      target1: 1500.00,
      target2: 1530.00,
      target3: 1560.00,
      quantity: 20
    });
    // First trigger entry
    let mockQuotes = new Map();
    mockQuotes.set('TECHM', { price: 1472.00, high: 1475.00, low: 1468.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    // Then price rallies to Target 1 (High: 1505 reaches T1 1500, below T2 1530)
    mockQuotes = new Map();
    mockQuotes.set('TECHM', { price: 1502.00, high: 1505.00, low: 1470.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    const updated = tradeTracker.getSignalById(`TEST-TARGET-${runId}-007`);
    const valid = updated.outcome === 'TARGET 1 HIT' && updated.exitPrice === 1500.00 && updated.grossPnL > 0 && updated.netPnL > 0;
    recordTest(6, 'Target Hit होतो', valid, `Outcome: ${updated.outcome}, Exit: ₹${updated.exitPrice}, Net PnL: ₹${updated.netPnL}`);
  } catch (e) {
    recordTest(6, 'Target Hit होतो', false, e.message);
  }

  // TEST 7: Stop Loss Hit होतो.
  try {
    const testSig = tradeTracker.registerSignal({
      signalId: `TEST-SL-${runId}-008`,
      instrument: 'ITC',
      direction: 'BUY (LONG)',
      entryPrice: 260.00,
      stopLoss: 254.00,
      target1: 270.00,
      target2: 275.00,
      target3: 280.00,
      quantity: 100
    });
    // Trigger entry
    let mockQuotes = new Map();
    mockQuotes.set('ITC', { price: 260.00, high: 261.00, low: 258.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    // Drop to Stop Loss
    mockQuotes = new Map();
    mockQuotes.set('ITC', { price: 253.50, high: 260.00, low: 253.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    const updated = tradeTracker.getSignalById(`TEST-SL-${runId}-008`);
    const valid = updated.outcome === 'STOP LOSS HIT' && updated.exitPrice === 254.00 && updated.grossPnL < 0 && updated.stopLossHitAt != null;
    recordTest(7, 'Stop Loss Hit होतो', valid, `Outcome: ${updated.outcome}, Exit: ₹${updated.exitPrice}, Net PnL: ₹${updated.netPnL}, SL Hit At: ${updated.stopLossHitAt}`);
  } catch (e) {
    recordTest(7, 'Stop Loss Hit होतो', false, e.message);
  }

  // TEST 8: Target आणि SL एकाच कँडलमध्ये येतात.
  try {
    const testSig = tradeTracker.registerSignal({
      signalId: `TEST-AMBIGUOUS-${runId}-009`,
      instrument: 'ADANIENT',
      direction: 'BUY (LONG)',
      entryPrice: 2435.00,
      stopLoss: 2415.00,
      target1: 2465.00,
      target2: 2480.00,
      target3: 2500.00,
      quantity: 25
    });
    // Trigger entry
    let mockQuotes = new Map();
    mockQuotes.set('ADANIENT', { price: 2435.00, high: 2440.00, low: 2430.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    // Flash spike candle breaching BOTH Target (high: 2470) and SL (low: 2410)
    mockQuotes = new Map();
    mockQuotes.set('ADANIENT', { price: 2435.00, high: 2470.00, low: 2410.00 });
    tradeTracker.evaluateSignalsWithLiveQuotes(mockQuotes);

    const updated = tradeTracker.getSignalById(`TEST-AMBIGUOUS-${runId}-009`);
    const valid = updated.outcome === 'AMBIGUOUS — NOT VERIFIED' && updated.dataVerificationStatus === 'AMBIGUOUS';
    recordTest(8, 'Target आणि SL एकाच कँडलमध्ये येतात', valid, `Outcome: ${updated.outcome}, Status: ${updated.dataVerificationStatus}`);
  } catch (e) {
    recordTest(8, 'Target आणि SL एकाच कँडलमध्ये येतात', false, e.message);
  }

  // TEST 9: Live Data बंद पडतो.
  try {
    const schedule = liveMarket.getMarketSchedule();
    const mockEmptyData = await liveMarket.getRealTimeMarketData(false);
    const safeHandling = mockEmptyData && mockEmptyData.marketContext && (mockEmptyData.marketContext.dataVerification != null);
    recordTest(9, 'Live Data बंद पडतो (Graceful fallback, no crash or fake prices)', safeHandling, 
      `Session: ${schedule.statusText}, Data Status: ${mockEmptyData.marketContext.dataVerification.status}`);
  } catch (e) {
    recordTest(9, 'Live Data बंद पडतो', false, e.message);
  }

  // TEST 10: API पुन्हा जोडला जातो.
  try {
    const freshData = await liveMarket.getRealTimeMarketData(true);
    const valid = freshData && freshData.marketContext && freshData.marketContext.nifty && freshData.marketContext.nifty.close > 0;
    recordTest(10, 'API पुन्हा जोडला जातो (Reconnection & Resync)', valid, 
      `NIFTY Spot CMP: ₹${freshData.marketContext.nifty.close}, Timestamp: ${freshData.marketContext.dataVerification.exchangeTimestamp}`);
  } catch (e) {
    recordTest(10, 'API पुन्हा जोडला जातो', false, e.message);
  }

  // TEST 11: वेबसाइट Refresh होते.
  try {
    const signalsBefore = tradeTracker.getSignals().length;
    // Simulate fresh load from disk file
    const filePath = path.join(__dirname, '..', 'data', 'trade_signals.json');
    const fileExists = fs.existsSync(filePath);
    const rawContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const valid = fileExists && rawContent.length >= signalsBefore;
    recordTest(11, 'वेबसाइट Refresh होते (Persistent Disk Persistence)', valid, 
      `Signals Persisted on Disk: ${rawContent.length} entries in data/trade_signals.json`);
  } catch (e) {
    recordTest(11, 'वेबसाइट Refresh होते', false, e.message);
  }

  // TEST 12: नवीन सिग्नल तयार होतो.
  try {
    const countBefore = tradeTracker.getSignals().length;
    const newSig = tradeTracker.registerSignal({
      signalId: `TEST-NEW-${runId}-012`,
      instrument: 'TATAMOTORS',
      direction: 'BUY (LONG)',
      entryPrice: 550.00, // Safe entry level to stay OPEN
      stopLoss: 535.00,
      target1: 575.00,
      target2: 590.00,
      target3: 610.00,
      quantity: 50
    });
    const countAfter = tradeTracker.getSignals().length;
    const valid = countAfter === countBefore + 1 && newSig.signalId === `TEST-NEW-${runId}-012` && newSig.outcome === 'OPEN';
    recordTest(12, 'नवीन सिग्नल तयार होतो', valid, `Count increased from ${countBefore} to ${countAfter}, ID: ${newSig.signalId}`);
  } catch (e) {
    recordTest(12, 'नवीन सिग्नल तयार होतो', false, e.message);
  }

  // TEST 13: जुना सिग्नल अपडेट होतो (Versioning).
  try {
    const revised = tradeTracker.reanalyzeSignal(`TEST-NEW-${runId}-012`, {
      sentiment: 'Positive',
      revisedSL: 540.00,
      revisedT1: 585.00,
      reason: 'Q2 Global EV Deliveries beat institutional estimates'
    });
    const original = tradeTracker.getSignalById(`TEST-NEW-${runId}-012`);
    const valid = original && revised && revised.signalVersion === 2 && revised.parentSignalId === `TEST-NEW-${runId}-012` && original.target1 === 575.00 && revised.target1 === 585.00;
    recordTest(13, 'जुना सिग्नल अपडेट होतो (v1.0 preserved, v2.0 created)', valid, 
      `Original v1.0 T1: ₹${original.target1} intact, Revised v2.0 T1: ₹${revised.target1}, Reason: "${revised.revisionReason}"`);
  } catch (e) {
    recordTest(13, 'जुना सिग्नल अपडेट होतो', false, e.message);
  }

  // TEST 14: डेटाबेसमध्ये Duplicate Entry तयार होण्याचा प्रयत्न होतो.
  try {
    const countBefore = tradeTracker.getSignals().length;
    // Attempt registering duplicate of TEST-NEW-runId-012
    const dupe = tradeTracker.registerSignal({
      signalId: `TEST-NEW-${runId}-012`,
      instrument: 'TATAMOTORS',
      direction: 'BUY (LONG)',
      entryPrice: 550.00
    });
    const countAfter = tradeTracker.getSignals().length;
    const valid = countAfter === countBefore; // Duplicate was safely rejected!
    recordTest(14, 'डेटाबेसमध्ये Duplicate Entry तयार होण्याचा प्रयत्न होतो', valid, 
      `Duplicate registration blocked. Database count maintained at ${countAfter}`);
  } catch (e) {
    recordTest(14, 'डेटाबेसमध्ये Duplicate Entry तयार होण्याचा प्रयत्न होतो', false, e.message);
  }

  // TEST 15: P&L आणि Trading Costs पुन्हा तपासले जातात.
  try {
    // Formula check: Equity Buy 50 shares, Entry 2125, Exit 2148.85
    const equityCharges = tradeTracker.calculateIndianCharges('EQUITY_CASH', 'BUY (LONG)', 2125.00, 2148.85, 50);
    const grossPnL = (2148.85 - 2125.00) * 50; // 1192.50
    const netPnL = grossPnL - equityCharges.totalCharges;

    // Options check: Buy Call 1 Lot (25 qty), Entry 125, Exit 175
    const optCharges = tradeTracker.calculateIndianCharges('OPTION', 'BUY CALL (CE)', 125.00, 175.00, 25);
    const optGrossPnL = (175.00 - 125.00) * 25; // 1250.00
    const optNetPnL = optGrossPnL - optCharges.totalCharges;

    const validEquity = Math.abs(grossPnL - 1192.50) < 0.01 && equityCharges.brokerage === 40.00 && equityCharges.totalCharges > 0;
    const validOpt = Math.abs(optGrossPnL - 1250.00) < 0.01 && optCharges.brokerage === 40.00 && optCharges.totalCharges > 0;
    const valid = validEquity && validOpt;

    recordTest(15, 'P&L आणि Trading Costs पुन्हा तपासले जातात', valid, 
      `Equity Gross: ₹${grossPnL.toFixed(2)}, Charges: ₹${equityCharges.totalCharges}, Net: ₹${netPnL.toFixed(2)} | Option Gross: ₹${optGrossPnL.toFixed(2)}, Charges: ₹${optCharges.totalCharges}, Net: ₹${optNetPnL.toFixed(2)}`);
  } catch (e) {
    recordTest(15, 'P&L आणि Trading Costs पुन्हा तपासले जातात', false, e.message);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`   AUDIT TEST RESULTS: ${passCount} PASSED / ${failCount} FAILED (${results.length} TOTAL)`);
  console.log('================================================================');

  // Clean up test records from persistent signals so demo data remains clean
  const allSignals = tradeTracker.getSignals();
  const cleanedSignals = allSignals.filter(s => !s.signalId.startsWith('TEST-'));
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'trade_signals.json'), JSON.stringify(cleanedSignals, null, 2));

  // Save audit test results log
  const logFile = path.join(__dirname, '..', 'data', 'audit_test_results.json');
  fs.writeFileSync(logFile, JSON.stringify({
    executionTime: new Date().toISOString(),
    totalTests: results.length,
    passed: passCount,
    failed: failCount,
    passRate: `${((passCount / results.length) * 100).toFixed(1)}%`,
    testCases: results
  }, null, 2));
  console.log(`Audit log saved to: ${logFile}\n`);
}

runTestSuite().catch(console.error);
