# Market Pulse AI Terminal & Intraday Share Market Trading Bot

> **100% Real-Time NSE/BSE Precision Terminal & Day Trader Intraday Platform**  
> Complete with 1,000 Master Stock Database, Time Machine Monte Carlo Engine, ORB Breakout Scanner, Pre-Trade Risk Gating, and Clean White + Colourful UI.

---

## 🏛️ Overview

**Market Pulse AI Terminal** is a full-featured, institutional-grade intraday share market analytics and paper trading workstation designed for the Indian equities and derivatives markets (NSE & BSE).

Powered by modern financial modeling, multi-factor technical analysis, and an adapted 11-skill algorithmic suite inspired by the MIT-licensed `day-trader-skill`, Market Pulse provides retail and institutional traders with mathematical edge, strict risk constraints, and empirical backtesting before risking real capital.

---

## ⚡ Key Highlights & Core Features

### 1. 1,000 Master Stock Database & High-Speed Search
* **Coverage**: Complete coverage of 1,000 active Indian equities spanning Large Cap, Mid Cap, Small Cap, and Micro Cap sectors.
* **Instant Query Benchmark**: High-efficiency in-memory indexing executing 50 search queries in `< 50ms` (guaranteed sub-10ms per query).
* **Exchange Support**: Integrated NSE & BSE ticker mapping with live tick polling and fallback recovery.

### 2. Time Machine Monte Carlo Engine (`timeMachineEngine.js`)
* **10,000 Session Replays**: Replays the remainder of the trading day up to 10,000 times using empirical intraday volatility from 5-minute bars.
* **Honest Odds Calculation**: Computes exact mathematical probabilities for Target Hit first ($P(\text{target})$), Stop Loss Hit first ($P(\text{stop})$), or Neither by market close.
* **Empirical $R$ Multiples**: Estimates probability-weighted Expected $R$ and distribution quantiles (p10, median, p90).
* **Guards**: Enforces strict mathematical invariant conservation and rejects inverted stops or targets.

### 3. Opening Range Breakout (ORB) Engine (`orbScannerEngine.js`)
* **15-Minute ORB Architecture**: Identifies Opening Range High, Low, and Midpoint on the opening 15-minute candle.
* **Target Multiples**: Automatically generates $1R$, $2R$, and $3R$ profit targets with midpoint protective stops.
* **Live Universe Scanner**: Scans all 1,000 stocks for triggered breakouts (`TRIGGERED`), pending setups (`WAITING`), or expired conditions (`EXPIRED`).

### 4. Position Sizing & Pre-Trade Risk Gate (`riskBudgetService.js`)
* **4-Guard Budgeting**: Calculates optimal share quantity constrained by:
  1. Maximum Loss per Trade (default 1% of equity).
  2. Single-Position Capital Cap (max 50% of portfolio).
  3. Strict Cash Buffer (retains minimum 10% in liquid cash).
  4. Exchange / Broker Maximum Order Value limits.
* **Pre-Trade Risk Gate**: Automatic `PASS` or `BLOCK` compliance engine. Rejects orders with missing stops, inverted levels, penny stocks (< ₹50), or sub-optimal Reward-to-Risk ($< 1.5$).
* **F&O Rounding**: Auto-aligns derivative contracts with official NSE lot sizes (e.g., NIFTY 25, BANKNIFTY 15).
* **Strict Paper Trading**: Emits standardized limit bracket tickets for paper execution. Zero false live execution claims.

### 5. Multi-View Modern UI & White + Colourful Design System
* **Premium White Theme**: Clean white surfaces (`#ffffff`), light slate backgrounds (`#f8fafc`), high-contrast slate typography (`#0f172a`), and vibrant semantic accents.
* **No Dark Patches & Zero Blurry Shadows**: 100% bracket symmetry (994/994) with zero unstyled classes.
* **4 Dedicated Views**:
  * **View 1: Live Terminal**: Streaming ticker, live signals grid, active setup cards, and interactive AI research terminal.
  * **View 2: Stocks Analysis**: Deep 6-factor fundamental breakdown, DCF valuation, ratio analysis, and bilingual Marathi institutional research reports.
  * **View 3: 30-Day Tracker**: Complete trade journal with audit logs, cumulative PnL, win-rate metrics, and verified outcome badges.
  * **View 4: Time Machine**: Interactive Monte Carlo replay simulator with parameters slider and visual probability gauges.
* **Smartphone Simulator & Mobile Access**: Built-in virtual phone chassis preview and QR code generator for LAN/Cloudflare access.

---

## 🛠️ Architecture & Project Structure

```
share-market/
├── public/                    # Frontend Client Application
│   ├── index.html             # Multi-view SPA layout (Terminal, Analysis, Tracker, Time Machine)
│   ├── style.css              # Master White + Colourful Design System (994 balanced rules)
│   ├── app.js                 # Reactive frontend controller & live WebSocket/polling manager
│   ├── timeMachine.js         # Client-side Time Machine Monte Carlo interactive controller
│   └── tracker.js             # 30-Day performance journal & audit log controller
│
├── data/                      # Data Stores & Master Databases
│   ├── nse_bse_master_stocks.json  # 1,000 Master NSE/BSE Equities Database
│   ├── trade_signals.json          # Active & historical trade signals
│   ├── trade_audit_log.json        # Permanent append-only audit trail
│   ├── timemachine_simulations.json# Cached Monte Carlo simulation runs
│   └── theme_palette.json          # Design token definitions
│
├── scripts/                   # Auditing, Maintenance & Automation Tools
│   ├── python_css_developer.py     # Python-powered CSS compiler & structural syntax auditor
│   ├── python_terminal_host.py     # ANSI high-contrast terminal diagnostics
│   ├── host_watchdog.js            # Self-healing server monitor (auto-restart on crash)
│   ├── run_gap_and_accuracy_audit.js# 36 Automated gap & mathematical verification tests
│   ├── run_master_upgrade_audit.js # 21 Unified master upgrade tests
│   ├── run_16_master_audit_tests.js# 16 Baseline functionality tests
│   └── verify_1000_data_and_skills.js# Database integrity & 11 skills verification
│
├── server.js                  # Master HTTP/REST/Static Server (Port 5000)
├── timeMachineEngine.js       # Monte Carlo Simulation Engine
├── orbScannerEngine.js        # 15-Minute Opening Range Breakout Scanner Engine
├── riskBudgetService.js       # Pre-Trade Risk Gate & Position Sizing Engine
├── liveMarketService.js       # Real-time NSE/BSE tick ingestion & quote engine
├── stockAnalysisService.js    # Multi-factor technical & fundamental analyst
└── tradeTrackingService.js    # Single-source-of-truth signal & outcome tracker
```

---

## 🚀 Quickstart & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: 3.10 or higher (for CSS compilation & terminal diagnostics)

### 1. Clone the Repository
```bash
git clone https://github.com/successdigitaloffice-cell/market-pulse-ai-terminal.git
cd market-pulse-ai-terminal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch the Server
```bash
npm start
```
* Or on Windows, double click `START_MARKET_BOT.bat`.

The portal will be live at:
* **Local Machine**: `http://localhost:5000`
* **Mobile / LAN**: `http://<your-local-ip>:5000`

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stocks` | Returns full universe of 1,000 master stocks |
| `GET` | `/api/stocks/search?q=TATAMOTORS` | High-speed symbol & company name search |
| `GET` | `/api/scanner/orb` | Returns live Opening Range Breakout candidates |
| `POST`| `/api/timemachine/run` | Executes 10,000 Monte Carlo session replays |
| `POST`| `/api/risk/calculate-size` | Calculates 4-guard position sizing for a setup |
| `POST`| `/api/risk/evaluate-gate` | Evaluates pre-trade compliance (PASS / BLOCK) |
| `GET` | `/api/tracker` | Returns verified 30-day signal performance journal |
| `GET` | `/health` | Returns server health and active PID status |

---

## 🧪 Automated Testing & Verification

The project includes 73 automated tests covering 100% of the core math, risk gates, database integrity, and REST endpoints:

```bash
# 1. Run 36 Gap & Accuracy Tests (Monte Carlo, ORB math, Search benchmark)
node scripts/run_gap_and_accuracy_audit.js

# 2. Run 21 Master Upgrade Tests (End-to-end integration)
node scripts/run_master_upgrade_audit.js

# 3. Run 16 Baseline Tests (Centralized tracking & safety)
node scripts/run_16_master_audit_tests.js

# 4. Run CSS Structural & Bracket Balance Audit
python scripts/python_css_developer.py --audit
```

**Test Status**: ✅ **73 / 73 Tests Passing (100% Success Rate)**.

---

## ⚖️ License & Risk Disclaimer

* **Software License**: Distributed under the [MIT License](LICENSE).
* **Educational & Simulation Disclaimer**: This software is built strictly for educational, analytical, and simulated paper-trading research. Intraday equity and derivatives trading involves substantial risk of capital loss. Past simulation results from the Time Machine or ORB Scanner do not guarantee future profits. Always consult a SEBI-registered financial advisor before deploying real capital.
