#!/usr/bin/env python3
"""
scripts/python_trader_bridge.py
Python Trader Bridge & Analytical Engine for Market Pulse AI Terminal
Integrates with the 11 installed Day Trader Skills (MIT License, Jake Schincariol)
"""

import sys
import os
import json
import math
import random
import datetime

SKILLS_DIR = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\user"), ".gemini", "config", "skills")

def run_python_monte_carlo(symbol, side, entry, stop, target, replays=2000, seed=19):
    """
    Direct Python implementation of the 10,000 Monte Carlo Replay Engine
    matching trader-timemachine/timemachine.py specification.
    """
    random.seed(seed)
    is_buy = side.upper() in ("BUY", "CALL", "LONG")
    entry = float(entry)
    stop = float(stop)
    target = float(target)
    
    risk = (entry - stop) if is_buy else (stop - entry)
    if risk <= 0:
        return {"error": "Invalid plan: Risk must be positive."}
        
    target_dist = (target - entry) if is_buy else (entry - target)
    r_target = round(target_dist / risk, 2)
    
    outcomes = []
    closes = []
    
    # 5-min volatility model: ~0.35% standard deviation per bar across 60 remaining bars
    volatility = 0.0035
    bars_in_session = 60
    
    for _ in range(replays):
        p = entry
        outcome = None
        for _ in range(bars_in_session):
            # Box-Muller normal draw
            u1 = max(1e-6, random.random())
            u2 = random.random()
            z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
            
            pct_change = z * volatility
            bar_close = p * (1.0 + pct_change)
            bar_high = max(p, bar_close) + abs(z * volatility * 0.4 * p)
            bar_low = min(p, bar_close) - abs(z * volatility * 0.4 * p)
            
            if not outcome:
                # Conservative rule: stop-loss checked before target in every candle
                if is_buy:
                    if bar_low <= stop:
                        outcome = "STOP"
                    elif bar_high >= target:
                        outcome = "TARGET"
                else:
                    if bar_high >= stop:
                        outcome = "STOP"
                    elif bar_low <= target:
                        outcome = "TARGET"
            p = bar_close
            
        outcomes.append(outcome or "CLOSE")
        closes.append(p)
        
    target_count = outcomes.count("TARGET")
    stop_count = outcomes.count("STOP")
    close_count = outcomes.count("CLOSE")
    
    p_target = round(target_count / replays, 4)
    p_stop = round(stop_count / replays, 4)
    p_neither = round(close_count / replays, 4)
    
    decided = target_count + stop_count
    verdict = "Close to a coin flip"
    if decided > 0:
        target_share = target_count / decided
        break_even_share = 1.0 / (1.0 + r_target)
        gap = target_share - break_even_share
        if gap >= 0.15:
            verdict = "Strongly toward target (High Probability Setup)"
        elif gap >= 0.05:
            verdict = "Leans toward target (Positive Expectancy)"
        elif gap <= -0.15:
            verdict = "Strongly toward stop (Unfavorable Setup)"
        elif gap <= -0.05:
            verdict = "Leans toward stop (Negative Expectancy)"
        else:
            verdict = "Close to a coin flip / break-even"
            
    return {
        "engine": "Python 3 Native Bridge",
        "symbol": symbol.upper(),
        "side": "BUY" if is_buy else "SELL",
        "replays": replays,
        "seed": seed,
        "entry": entry,
        "stop": stop,
        "target": target,
        "targetR": r_target,
        "probabilities": {
            "targetHitPct": round(p_target * 100, 1),
            "stopHitPct": round(p_stop * 100, 1),
            "openAtClosePct": round(p_neither * 100, 1)
        },
        "verdict": verdict
    }

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        res = run_python_monte_carlo("TCS", "BUY", 3500, 3465, 3570, replays=1000)
        print(json.dumps(res, indent=2))
    else:
        print("Python Trader Bridge ready. Call with args or import functions.")

if __name__ == "__main__":
    main()

