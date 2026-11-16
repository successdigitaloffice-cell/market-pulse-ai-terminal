/**
 * riskBudgetService.js
 * Market Pulse AI Terminal — Position Sizing & Pre-Trade Risk Gate Service
 * Adapted from day-trader-skill (MIT License, Jake Schincariol)
 * 
 * Provides:
 * 1. Capital budgeting & exact mathematical position sizing.
 * 2. Institutional pre-trade Risk Gate (PASS or BLOCK with strict reasons).
 * 3. Standardized bracket order ticket generation with simulated safety.
 */

const fs = require('fs');
const path = require('path');
const { getMarketSchedule } = require('./liveMarketService');

const CONFIG_FILE = path.join(__dirname, 'data', 'risk_config.json');

const DEFAULT_RISK_CONFIG = {
  accountCapital: 100000,          // ₹1,00,000 default account
  cashBufferPct: 10,               // 10% cash buffer left uninvested
  maxPositionPct: 50,              // Max 50% capital in single stock
  maxLossPerTradePct: 1.0,         // Max 1% capital loss per trade (₹1,000)
  maxLossPerTradeRupees: 1000,     // Hard cap ₹1,000
  maxDailyLossRupees: 3000,        // Max daily loss limit
  maxTradesPerDay: 5,              // Max 5 trades per session
  minRewardToRisk: 1.5,            // Minimum 1 : 1.5 R:R
  requireStopLoss: true,           // Stop loss is strictly mandatory
  noEntriesBefore: '09:30',        // Opening 15-min stabilization rule
  noEntriesAfter: '15:00',         // No fresh trades after 3:00 PM IST
  mandatoryExitBy: '15:10',        // All intraday positions squared off by 3:10 PM IST
  minStockPrice: 50,               // Penny stock filter (< ₹50 blocked)
  paperTradingOnly: true           // Strict simulated safety
};

/**
 * Loads current risk configuration
 */
function getRiskConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...DEFAULT_RISK_CONFIG, ...saved };
    } catch (_) {}
  }
  return { ...DEFAULT_RISK_CONFIG };
}

/**
 * Updates risk configuration
 */
function updateRiskConfig(updates) {
  const current = getRiskConfig();
  const merged = { ...current, ...updates };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
  } catch (_) {}
  return merged;
}

/**
 * Calculate institutional position size based on account limits and stop distance
 * @param {Object} params - { symbol, entry, stop, capital, maxLossRupees, lotSize }
 */
function calculatePositionSize(params) {
  const cfg = getRiskConfig();
  const rawCapital = Number(params.capital !== undefined ? params.capital : cfg.accountCapital);
  if (isNaN(rawCapital) || rawCapital <= 0) {
    throw new Error('Account capital must be a positive number.');
  }
  const capital = Math.max(1000, rawCapital);
  const entry = Number(params.entry || params.entryPrice);
  const stop = Number(params.stop || params.stopLoss);
  const side = (params.side || 'BUY').toUpperCase();
  const isBuy = side === 'BUY' || side === 'CALL';
  const lotSize = Math.max(1, Number(params.lotSize || 1));

  if (!entry || entry <= 0 || isNaN(entry)) {
    throw new Error('Entry price must be a positive number');
  }
  if (!stop || stop <= 0 || isNaN(stop)) {
    throw new Error('Stop loss price must be a positive number');
  }

  const riskPerShare = isBuy ? (entry - stop) : (stop - entry);
  if (riskPerShare <= 0) {
    throw new Error(`Stop loss (₹${stop}) must be ${isBuy ? 'below' : 'above'} entry price (₹${entry}) for ${side} trade.`);
  }

  let maxLossRupees = Number(params.maxLossRupees);
  if (isNaN(maxLossRupees) || maxLossRupees <= 0) {
    maxLossRupees = capital * (cfg.maxLossPerTradePct / 100) || cfg.maxLossPerTradeRupees;
  }
  maxLossRupees = Math.max(10, maxLossRupees);

  const maxPositionRupees = capital * (cfg.maxPositionPct / 100);
  const investableCash = capital * (1.0 - (cfg.cashBufferPct / 100));

  // Quantity determined by risk distance
  const qtyByRisk = Math.floor(maxLossRupees / riskPerShare);
  // Quantity determined by position cap
  const qtyByCap = Math.floor(maxPositionRupees / entry);
  // Quantity determined by available cash
  const qtyByCash = Math.floor(investableCash / entry);

  // Take smallest of the three to prevent over-allocation
  let rawQty = Math.max(0, Math.min(qtyByRisk, qtyByCap, qtyByCash));

  // If F&O lot size applies, round down to complete lots
  if (lotSize > 1) {
    const lots = Math.floor(rawQty / lotSize);
    rawQty = lots * lotSize;
  }

  const totalInvestment = Number((rawQty * entry).toFixed(2));
  const actualRiskRupees = Number((rawQty * riskPerShare).toFixed(2));
  const riskPctOfCapital = Number(((actualRiskRupees / capital) * 100).toFixed(2));

  return {
    symbol: (params.symbol || 'STOCK').toUpperCase(),
    side,
    entry,
    stop,
    riskPerShare: Number(riskPerShare.toFixed(2)),
    quantity: rawQty,
    lotSize,
    lots: lotSize > 1 ? rawQty / lotSize : null,
    totalInvestment,
    actualRiskRupees,
    riskPctOfCapital,
    limitingFactor: rawQty === qtyByRisk ? 'MAX_RISK_LIMIT' : (rawQty === qtyByCap ? 'POSITION_CAP' : 'CASH_BUFFER'),
    safeToTrade: rawQty > 0
  };
}

/**
 * Pre-Trade Risk Gate: Evaluates whether a planned trade passes institutional risk parameters
 * @param {Object} tradePlan - { symbol, side, entry, stop, target1, quantity, capital }
 * @param {Object} currentContext - Optional live market status & trade counts
 */
function evaluateRiskGate(tradePlan, currentContext = {}) {
  const cfg = getRiskConfig();
  const schedule = getMarketSchedule();
  const reasons = [];
  const warnings = [];

  const symbol = (tradePlan.symbol || '').toUpperCase().trim();
  const side = (tradePlan.side || 'BUY').toUpperCase();
  const entry = Number(tradePlan.entry || tradePlan.entryPrice);
  const stop = Number(tradePlan.stop || tradePlan.stopLoss);
  const target1 = Number(tradePlan.target1 || tradePlan.target);
  const quantity = Number(tradePlan.quantity || 0);

  // 0. Entry Price Validity Check
  if (!entry || entry <= 0 || isNaN(entry)) {
    reasons.push('INVALID_ENTRY: Entry price must be a strictly positive number.');
  }

  // 1. Mandatory Stop Loss Check
  if (cfg.requireStopLoss) {
    if (!stop || stop <= 0 || isNaN(stop)) {
      reasons.push('STOP_LOSS_MISSING: Intraday rules strictly require a protective stop loss.');
    } else if (entry > 0) {
      const isBuy = side === 'BUY' || side === 'CALL';
      if (isBuy && stop >= entry) {
        reasons.push(`INVALID_STOP: Stop loss (₹${stop}) must be strictly below entry price (₹${entry}) for BUY trade.`);
      } else if (!isBuy && stop <= entry) {
        reasons.push(`INVALID_STOP: Stop loss (₹${stop}) must be strictly above entry price (₹${entry}) for SELL trade.`);
      }
    }
  }

  // 1b. Target Direction Check
  if (target1 > 0 && entry > 0) {
    const isBuy = side === 'BUY' || side === 'CALL';
    if (isBuy && target1 <= entry) {
      reasons.push(`INVALID_TARGET: Target 1 (₹${target1}) must be strictly above entry price (₹${entry}) for BUY trade.`);
    } else if (!isBuy && target1 >= entry) {
      reasons.push(`INVALID_TARGET: Target 1 (₹${target1}) must be strictly below entry price (₹${entry}) for SELL trade.`);
    }
  }

  // 2. Minimum Reward to Risk Ratio Check
  if (entry > 0 && stop > 0 && target1 > 0) {
    const isBuy = side === 'BUY' || side === 'CALL';
    const risk = isBuy ? (entry - stop) : (stop - entry);
    const reward = isBuy ? (target1 - entry) : (entry - target1);
    const rr = risk > 0 ? (reward / risk) : 0;

    if (rr < cfg.minRewardToRisk) {
      reasons.push(`INSUFFICIENT_RR: Reward-to-Risk ratio (1 : ${rr.toFixed(2)}) is below minimum required 1 : ${cfg.minRewardToRisk}.`);
    }
  }

  // 3. Penny Stock & Minimum Price Filter
  if (entry < cfg.minStockPrice) {
    reasons.push(`PENNY_STOCK_BLOCKED: Instrument price (₹${entry}) is below institutional threshold ₹${cfg.minStockPrice}. High operator risk.`);
  }

  // 4. Intraday Trading Window Check
  if (schedule && schedule.istTime) {
    const timeMatch = schedule.istTime.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hr = parseInt(timeMatch[1], 10);
      const min = parseInt(timeMatch[2], 10);
      const curMinutes = hr * 60 + min;

      // 09:30 AM is 570 mins, 15:00 is 900 mins
      if (curMinutes < 570 && schedule.isOpen) {
        warnings.push('OPENING_RANGE_ACTIVE: Market is in the first 15 mins (09:15 - 09:30). High volatility; wait for range confirmation.');
      } else if (curMinutes > 900 && schedule.isOpen) {
        reasons.push('TIME_WINDOW_CLOSED: Fresh intraday entries are disallowed after 03:00 PM IST.');
      }
    }
  }

  // 5. Quantity & Capital Risk Check
  if (quantity <= 0) {
    reasons.push('ZERO_QUANTITY: Sized position is 0 shares. Risk per share exceeds allocated budget.');
  }

  const passed = reasons.length === 0;

  // Generate standardized bracket ticket
  const bracketTicket = {
    ticketId: `TICKET-${symbol}-${Date.now().toString().slice(-6)}`,
    symbol,
    action: side,
    orderType: 'BRACKET_LIMIT',
    entryPrice: entry,
    stopLoss: stop,
    takeProfit: target1,
    quantity,
    status: passed ? 'READY_FOR_PAPER_EXECUTION' : 'BLOCKED_BY_RISK_GATE',
    simulatedOnly: true,
    createdTime: new Date().toISOString()
  };

  return {
    verdict: passed ? 'PASS' : 'BLOCK',
    passed,
    reasons,
    warnings,
    bracketTicket,
    checkedAt: new Date().toISOString()
  };
}

module.exports = {
  getRiskConfig,
  updateRiskConfig,
  calculatePositionSize,
  evaluateRiskGate
};

