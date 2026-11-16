/**
 * timeMachineEngine.js
 * Market Pulse AI Terminal — Time Machine Monte Carlo Replay & Probability Engine
 * Adapted from day-trader-skill (MIT License, Jake Schincariol)
 * 
 * Replays intraday day trade setups before risking capital:
 * Runs 1,000 to 10,000 Monte Carlo replays using empirical 5-minute bar returns,
 * calculating honest probabilities for Target Hit vs Stop Loss Hit vs Open at Close,
 * and outputs empirical R-expectancy and a rigorous "Coin Flip" verdict.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SIM_FILE = path.join(DATA_DIR, 'timemachine_simulations.json');

// Pseudo-random number generator for deterministic seedable replays
function createRng(seed = 19) {
  let s = Math.floor(Math.abs(seed)) || 19;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Calculates percentile from a sorted array
 */
function getPercentile(sortedArr, q) {
  if (!sortedArr || sortedArr.length === 0) return 0;
  const idx = Math.min(Math.floor(q * sortedArr.length), sortedArr.length - 1);
  return sortedArr[Math.max(0, idx)];
}

/**
 * Generates an empirical bar-ratio pool from historical 5-min bars or ATR model
 */
function buildBarPool(historicalBars, barsLeft = 50, rng = Math.random) {
  const pool = [];
  if (Array.isArray(historicalBars) && historicalBars.length >= 20) {
    for (let i = 1; i < historicalBars.length; i++) {
      const prev = historicalBars[i - 1].close || historicalBars[i - 1].c;
      const cur = historicalBars[i];
      if (prev > 0) {
        pool.push({
          o: (cur.open || cur.o || prev) / prev,
          h: (cur.high || cur.h || prev) / prev,
          l: (cur.low || cur.l || prev) / prev,
          c: (cur.close || cur.c || prev) / prev
        });
      }
    }
  }
  
  // Default robust distribution based on typical intraday 5m stock volatility (0.25% - 0.40% std dev)
  if (pool.length < 20) {
    const volatility5m = 0.0035; // ~0.35% per 5-min bar
    for (let i = 0; i < 100; i++) {
      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const ret = z * volatility5m;
      const c = 1.0 + ret;
      const h = Math.max(1.0, c) + Math.abs(z * volatility5m * 0.4);
      const l = Math.min(1.0, c) - Math.abs(z * volatility5m * 0.4);
      pool.push({ o: 1.0, h, l, c });
    }
  }
  return pool;
}

/**
 * Run Time Machine Monte Carlo Simulation
 * @param {Object} plan - { symbol, side, entry, stop, target, targetR, barsLeft, seed, replays }
 * @param {Array} historicalBars - Optional actual 5-min bars
 */
function runSimulation(plan, historicalBars = null) {
  const symbol = (plan.symbol || 'NIFTY').toUpperCase();
  const side = (plan.side || 'BUY').toUpperCase();
  const isBuy = side === 'BUY' || side === 'CALL';
  const entry = Number(plan.entry || plan.entryPrice || 100);
  const stop = Number(plan.stop || plan.stopLoss || (isBuy ? entry * 0.99 : entry * 1.01));
  const target = Number(plan.target || plan.target1 || (isBuy ? entry * 1.02 : entry * 0.98));

  if (!entry || entry <= 0 || isNaN(entry)) {
    throw new Error('Invalid plan: Entry price must be a positive number.');
  }
  if (!stop || stop <= 0 || isNaN(stop)) {
    throw new Error('Invalid plan: Stop loss price must be a positive number.');
  }
  if (!target || target <= 0 || isNaN(target)) {
    throw new Error('Invalid plan: Target price must be a positive number.');
  }

  // Strict Stop Loss Direction Validation
  if (isBuy && stop >= entry) {
    throw new Error(`Invalid plan: Stop loss (₹${stop}) must be strictly below entry price (₹${entry}) for a BUY trade.`);
  }
  if (!isBuy && stop <= entry) {
    throw new Error(`Invalid plan: Stop loss (₹${stop}) must be strictly above entry price (₹${entry}) for a SELL trade.`);
  }

  // Strict Target Direction Validation
  if (isBuy && target <= entry) {
    throw new Error(`Invalid plan: Target price (₹${target}) must be strictly above entry price (₹${entry}) for a BUY trade.`);
  }
  if (!isBuy && target >= entry) {
    throw new Error(`Invalid plan: Target price (₹${target}) must be strictly below entry price (₹${entry}) for a SELL trade.`);
  }
  
  const risk = isBuy ? (entry - stop) : (stop - entry);
  const targetDistance = isBuy ? (target - entry) : (entry - target);
  const rTarget = Number((targetDistance / risk).toFixed(2));
  const replays = Math.max(100, Math.min(plan.replays || 2000, 20000));
  const seed = plan.seed !== undefined ? plan.seed : 19;
  const barsLeft = Math.max(5, Math.min(plan.barsLeft || 50, 75)); // standard 75 bars in 6.25 hr session
  const windowJitter = plan.window || 2;

  const rng = createRng(seed);
  const pool = buildBarPool(historicalBars, barsLeft, rng);

  const outcomes = [];
  const closes = [];
  const samplePaths = [];
  const keepPathCount = 50;

  for (let r = 0; r < replays; r++) {
    let p = entry;
    let outcome = null;
    const path = (r < keepPathCount) ? [entry] : null;

    for (let b = 0; b < barsLeft; b++) {
      // Pick random bar from pool with slight window jitter
      const pickIdx = Math.floor(rng() * pool.length);
      const ratio = pool[pickIdx];

      const barHigh = p * ratio.h;
      const barLow = p * ratio.l;
      const barClose = p * ratio.c;

      if (!outcome) {
        // Conservative assumption: Stop loss is checked before Target in every bar
        if (isBuy) {
          if (barLow <= stop) {
            outcome = 'STOP';
          } else if (barHigh >= target) {
            outcome = 'TARGET';
          }
        } else {
          if (barHigh >= stop) {
            outcome = 'STOP';
          } else if (barLow <= target) {
            outcome = 'TARGET';
          }
        }
      }

      p = barClose;
      if (path) path.push(Number(p.toFixed(2)));
    }

    outcomes.push(outcome || 'CLOSE');
    closes.push(p);
    if (path) samplePaths.push(path);
  }

  // Calculate statistics
  const targetCount = outcomes.filter(o => o === 'TARGET').length;
  const stopCount = outcomes.filter(o => o === 'STOP').length;
  const closeCount = outcomes.filter(o => o === 'CLOSE').length;

  const pTarget = Number((targetCount / replays).toFixed(4));
  const pStop = Number((stopCount / replays).toFixed(4));
  const pNeither = Number((closeCount / replays).toFixed(4));

  const greenCount = outcomes.filter((o, idx) => {
    if (o === 'TARGET') return true;
    if (o === 'CLOSE') {
      return isBuy ? closes[idx] > entry : closes[idx] < entry;
    }
    return false;
  }).length;
  const pGreen = Number((greenCount / replays).toFixed(4));

  // Compute R values
  const rValues = outcomes.map((o, idx) => {
    if (o === 'TARGET') return rTarget;
    if (o === 'STOP') return -1.0;
    const finalDiff = isBuy ? (closes[idx] - entry) : (entry - closes[idx]);
    return Number((finalDiff / risk).toFixed(2));
  });

  const avgR = Number((rValues.reduce((a, b) => a + b, 0) / replays).toFixed(3));

  closes.sort((a, b) => a - b);
  const medianClose = Number(getPercentile(closes, 0.50).toFixed(2));
  const p5Close = Number(getPercentile(closes, 0.05).toFixed(2));
  const p95Close = Number(getPercentile(closes, 0.95).toFixed(2));

  // Mathematical Verdict logic (comparing target share against break-even share)
  const decidedTotal = targetCount + stopCount;
  let verdict = 'Close to a coin flip';
  let verdictCategory = 'NEUTRAL';
  let honestOddsText = '';

  if (decidedTotal > 0) {
    const targetShare = targetCount / decidedTotal;
    const breakEvenShare = 1.0 / (1.0 + rTarget);
    const gap = targetShare - breakEvenShare;

    if (gap >= 0.15) {
      verdict = 'Strongly toward target (High Probability Setup)';
      verdictCategory = 'BULLISH_EDGE';
    } else if (gap >= 0.05) {
      verdict = 'Leans toward target (Positive Expectancy)';
      verdictCategory = 'MODERATE_EDGE';
    } else if (gap <= -0.15) {
      verdict = 'Strongly toward stop (Unfavorable Setup)';
      verdictCategory = 'HIGH_RISK';
    } else if (gap <= -0.05) {
      verdict = 'Leans toward stop (Negative Expectancy)';
      verdictCategory = 'NEGATIVE_EDGE';
    } else {
      verdict = rTarget === 1.0 ? 'Close to a coin flip (50/50 odds)' : 'Close to break-even (Marginal edge)';
      verdictCategory = 'COIN_FLIP';
    }

    honestOddsText = `Replayed ${replays.toLocaleString()} times: Target hit ${(pTarget * 100).toFixed(1)}%, Stop hit ${(pStop * 100).toFixed(1)}%, Open at session close ${(pNeither * 100).toFixed(1)}%. Break-even required: ${(breakEvenShare * 100).toFixed(1)}%. Verdict: ${verdict}.`;
  } else {
    honestOddsText = `Replayed ${replays.toLocaleString()} times: Neither Stop nor Target touched before session close in majority of runs.`;
  }

  const result = {
    simulationId: `TM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    plan: {
      symbol,
      side,
      entry,
      stop,
      target,
      risk: Number(risk.toFixed(2)),
      rewardToRisk: rTarget,
      barsLeft,
      replays,
      seed
    },
    probabilities: {
      targetHitPct: Number((pTarget * 100).toFixed(1)),
      stopHitPct: Number((pStop * 100).toFixed(1)),
      openAtClosePct: Number((pNeither * 100).toFixed(1)),
      greenOverallPct: Number((pGreen * 100).toFixed(1))
    },
    distribution: {
      medianClose,
      p5Close,
      p95Close,
      expectedR: avgR
    },
    verdict,
    verdictCategory,
    honestOddsSummary: honestOddsText,
    samplePaths: samplePaths.slice(0, 10)
  };

  // Persist recent simulation run safely with atomic write protection
  try {
    let existing = [];
    if (fs.existsSync(SIM_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(SIM_FILE, 'utf8') || '[]');
      } catch (_) {
        existing = [];
      }
    }
    existing.unshift(result);
    if (existing.length > 50) existing = existing.slice(0, 50);
    const tmpFile = `${SIM_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(existing, null, 2), 'utf8');
    fs.renameSync(tmpFile, SIM_FILE);
  } catch (_) {}

  return result;
}

/**
 * Get recent Time Machine simulation logs
 */
function getRecentSimulations() {
  try {
    if (fs.existsSync(SIM_FILE)) {
      return JSON.parse(fs.readFileSync(SIM_FILE, 'utf8') || '[]');
    }
  } catch (_) {}
  return [];
}

module.exports = {
  runSimulation,
  getRecentSimulations
};

