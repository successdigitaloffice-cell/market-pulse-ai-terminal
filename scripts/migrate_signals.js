const fs = require('fs');
const path = require('path');
const tradeTracker = require('../tradeTrackingService');

console.log('--- Loading and Normalizing trade_signals.json ---');
const signals = tradeTracker.getSignals();
console.log(`Loaded ${signals.length} signals.`);

// Check first 3 signals
signals.slice(0, 3).forEach(s => {
  console.log(`\nSignal ID: ${s.signalId}`);
  console.log(`Instrument: ${s.instrument} (${s.direction})`);
  console.log(`Outcome: ${s.outcome}`);
  console.log(`Execution Mode: ${s.executionCategory}`);
  console.log(`1. Signal Generated: ${s.signalGeneratedAt}`);
  console.log(`2. Entry Triggered: ${s.entryTriggeredAt}`);
  console.log(`3. Order Submitted: ${s.orderSubmittedAt}`);
  console.log(`4. Order Filled: ${s.orderFilledAt}`);
  console.log(`5. Exit Triggered: ${s.exitTriggeredAt}`);
  console.log(`6. Order Closed: ${s.orderClosedAt}`);
});

// Force save back to ensure file is formatted with all audit fields
tradeTracker.evaluateSignalsWithLiveQuotes(new Map());
console.log('\n--- Migration & Normalization complete! ---');
