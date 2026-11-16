#!/usr/bin/env python3
"""
scripts/python_css_developer.py
=============================================================================
Market Pulse AI Terminal — Python-Powered CSS Architecture & Theme Engine
=============================================================================
Features:
  1. Comprehensive CSS Syntax & Structural Balance Audit ({ vs }).
  2. Compiles a Unique, Ultra-Readable, Colorful, and Sorted Clean White Theme.
  3. Provides High-Contrast Visual Design for All Terminal Components.
  4. Exports Theme Tokens and Palette to data/theme_palette.json.
"""

import os
import sys
import re
import json

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSS_PATH = os.path.join(PROJECT_ROOT, "public", "style.css")

# =============================================================================
# COLOR PALETTE DEFINITION (UNIQUE, WHITE + COLOURFUL DESIGN SYSTEM)
# =============================================================================
PALETTE = {
    "white_theme": {
        "canvas_bg": "#f8fafc",
        "card_bg": "#ffffff",
        "card_hover": "#f1f5f9",
        "border": "#e2e8f0",
        "border_focus": "#2563eb",
        "shadow": "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
        "text_primary": "#0f172a",
        "text_secondary": "#334155",
        "text_muted": "#64748b"
    },
    "bullish_green": {
        "primary": "#16a34a",
        "light": "#22c55e",
        "bg": "#f0fdf4",
        "border": "#bbf7d0",
        "text": "#15803d"
    },
    "bearish_red": {
        "primary": "#dc2626",
        "light": "#ef4444",
        "bg": "#fef2f2",
        "border": "#fecaca",
        "text": "#991b1b"
    },
    "ai_purple": {
        "primary": "#7c3aed",
        "light": "#8b5cf6",
        "bg": "#faf5ff",
        "border": "#e9d5ff",
        "text": "#6d28d9"
    },
    "terminal_cyan": {
        "primary": "#0891b2",
        "light": "#06b6d4",
        "bg": "#ecfeff",
        "border": "#a5f3fc",
        "text": "#0e7490"
    },
    "warning_amber": {
        "primary": "#d97706",
        "light": "#f59e0b",
        "bg": "#fffbeb",
        "border": "#fde68a",
        "text": "#b45309"
    }
}

# =============================================================================
# SORTED WHITE + COLOURFUL MASTER CSS BLOCK
# =============================================================================
WHITE_AND_COLOURFUL_CSS = """
/* ========================================================================== */
/* ☀️ [CHAPTER 1] MASTER WHITE + COLOURFUL PREMIUM DESIGN SYSTEM              */
/* ========================================================================== */

/* 1.1 Root CSS Variables in White Theme */
[data-theme="white"], body.theme-white {
  --bg-main: #f8fafc;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --bg-card-solid: #ffffff;
  --bg-input: #ffffff;

  --border-glass: #e2e8f0;
  --border-glass-bright: #cbd5e1;
  --border-glass-glow: rgba(37, 99, 235, 0.20);
  --shadow-card: 0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03);

  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-muted: #64748b;
  --text-dim: #94a3b8;

  --color-green: #16a34a;
  --color-green-light: #22c55e;
  --color-green-bg: #f0fdf4;
  --color-green-border: #bbf7d0;

  --color-red: #dc2626;
  --color-red-light: #ef4444;
  --color-red-bg: #fef2f2;
  --color-red-border: #fecaca;

  --color-blue: #2563eb;
  --color-blue-light: #3b82f6;
  --color-blue-bg: #eff6ff;
  --color-blue-border: #bfdbfe;

  --color-purple: #7c3aed;
  --color-purple-light: #8b5cf6;
  --color-purple-bg: #faf5ff;
  --color-purple-border: #e9d5ff;

  --color-cyan: #0891b2;
  --color-cyan-light: #06b6d4;
  --color-cyan-bg: #ecfeff;
  --color-cyan-border: #a5f3fc;

  --color-amber: #d97706;
  --color-amber-light: #f59e0b;
  --color-amber-bg: #fffbeb;
  --color-amber-border: #fde68a;

  background-color: #f8fafc !important;
  color: #0f172a !important;
  background-image: 
    radial-gradient(circle at 10% 10%, rgba(37, 99, 235, 0.04) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(22, 163, 74, 0.04) 0%, transparent 45%),
    radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.03) 0%, transparent 60%) !important;
  background-attachment: fixed !important;
}

/* 1.2 Remove ALL blurry text shadows and dark glows globally in white theme */
[data-theme="white"] *,
body.theme-white * {
  text-shadow: none !important;
}

/* 1.3 Universal Surface Cards & Glass Panels */
[data-theme="white"] .card-glass,
[data-theme="white"] .tm-card,
[data-theme="white"] .sim-card,
[data-theme="white"] .ticket-card,
[data-theme="white"] .orb-scanner-section,
[data-theme="white"] .modal-card,
[data-theme="white"] .top-nav,
[data-theme="white"] .market-status-ribbon,
[data-theme="white"] .main-tabs-nav,
[data-theme="white"] .mobile-access-banner,
[data-theme="white"] .chat-section,
[data-theme="white"] .stock-card,
[data-theme="white"] .kpi-card,
[data-theme="white"] .tracker-verif-strip,
[data-theme="white"] .setup-card,
[data-theme="white"] .fund-card,
[data-theme="white"] .report-box,
[data-theme="white"] .indicators-section,
[data-theme="white"] .rules-box,
[data-theme="white"] .sa-control-panel,
[data-theme="white"] .sa-header-banner,
[data-theme="white"] .sa-decision-card,
[data-theme="white"] .sa-error-card,
[data-theme="white"] .sa-loading-box,
[data-theme="white"] .terminal-live-signals-panel,
[data-theme="white"] .tracker-breakdown-section,
[data-theme="white"] .tracker-table-section,
[data-theme="white"] .breakdown-card,
[data-theme="white"] .pnl-audit-box,
[data-theme="white"] .evidence-box,
[data-theme="white"] .sa-institutional-report-box,
[data-theme="white"] .position-sizing-block {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03) !important;
  color: #0f172a !important;
}

/* 1.4 Top Navigation & Brand */
[data-theme="white"] .top-nav {
  border-radius: 18px !important;
  margin-bottom: 16px !important;
}
[data-theme="white"] .logo-text {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .tagline {
  color: #64748b !important;
}
[data-theme="white"] .badge-ai {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25) !important;
}

/* 1.5 Header Action Buttons */
[data-theme="white"] .nav-btn-action,
[data-theme="white"] .btn-mobile-preview,
[data-theme="white"] .btn-qr,
[data-theme="white"] .theme-toggle-btn {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #1e293b !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) !important;
}
[data-theme="white"] .nav-btn-action:hover,
[data-theme="white"] .btn-mobile-preview:hover,
[data-theme="white"] .btn-qr:hover,
[data-theme="white"] .theme-toggle-btn:hover {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
  color: #1d4ed8 !important;
  transform: translateY(-1px) !important;
}
[data-theme="white"] .refresh-icon {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
[data-theme="white"] .ist-clock-pill {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}
[data-theme="white"] .clock-label {
  color: #64748b !important;
  font-weight: 700 !important;
}
[data-theme="white"] .clock-time {
  color: #0f172a !important;
  font-weight: 800 !important;
}

/* 1.6 Market Status Ribbon */
[data-theme="white"] .status-title {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .countdown-badge {
  background: #fffbeb !important;
  color: #b45309 !important;
  border: 1px solid #fde68a !important;
  font-weight: 700 !important;
}
[data-theme="white"] .accuracy-badge {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #bfdbfe !important;
  font-weight: 700 !important;
}
[data-theme="white"] .last-sync-badge {
  background: #f8fafc !important;
  color: #64748b !important;
  border: 1px solid #e2e8f0 !important;
  font-weight: 600 !important;
}
[data-theme="white"] .status-center {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}
[data-theme="white"] .live-dot-pulse {
  display: inline-block !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: #16a34a !important;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2) !important;
}

/* 1.7 Main Navigation Tabs */
[data-theme="white"] .main-tabs-nav {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  padding: 8px 12px !important;
}
[data-theme="white"] .main-tab-btn {
  color: #64748b !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;
}
[data-theme="white"] .main-tab-btn:hover {
  color: #0f172a !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}
[data-theme="white"] #tabBtnTerminal.active {
  color: #0891b2 !important;
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  box-shadow: 0 4px 14px rgba(8, 145, 178, 0.12) !important;
  font-weight: 800 !important;
}
[data-theme="white"] #tabBtnAnalysis.active {
  color: #15803d !important;
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.12) !important;
  font-weight: 800 !important;
}
[data-theme="white"] #tabBtnTracker.active {
  color: #b45309 !important;
  background: #fffbeb !important;
  border-color: #fde68a !important;
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.12) !important;
  font-weight: 800 !important;
}
[data-theme="white"] #tabBtnTimeMachine.active {
  color: #6d28d9 !important;
  background: #faf5ff !important;
  border-color: #e9d5ff !important;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.12) !important;
  font-weight: 800 !important;
}

/* 1.8 Scrolling Market Ticker Bar */
[data-theme="white"] .market-bar {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03) !important;
}
[data-theme="white"] .ticker-item {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  color: #0f172a !important;
}
[data-theme="white"] .ticker-item:hover {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}
[data-theme="white"] .ticker-label {
  color: #0f172a !important;
  font-weight: 700 !important;
}
[data-theme="white"] .ticker-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .ticker-val.up,
[data-theme="white"] .ticker-change.up {
  color: #15803d !important;
  font-weight: 800 !important;
}
[data-theme="white"] .ticker-val.down,
[data-theme="white"] .ticker-change.down {
  color: #b91c1c !important;
  font-weight: 800 !important;
}

/* 1.9 KPI Cards Grid */
[data-theme="white"] .kpi-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .kpi-card:hover {
  border-color: #93c5fd !important;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06) !important;
  transform: translateY(-2px) !important;
}
[data-theme="white"] .kpi-lbl {
  color: #64748b !important;
  font-weight: 700 !important;
  text-transform: uppercase;
}
[data-theme="white"] .kpi-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .kpi-sub-val {
  color: #334155 !important;
  font-weight: 600 !important;
}

/* 1.10 LIVE TRADE SIGNALS SECTION & SIGNAL CARDS */
.terminal-container-clean {
  display: flex !important;
  flex-direction: column !important;
  gap: 20px !important;
  width: 100% !important;
}

[data-theme="white"] .terminal-live-signals-panel {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 18px !important;
  padding: 20px 22px !important;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05) !important;
  width: 100% !important;
}

[data-theme="white"] .terminal-signals-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)) !important;
  gap: 16px !important;
  margin-top: 14px !important;
}

[data-theme="white"] .stock-cards-container {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)) !important;
  gap: 14px !important;
  margin-top: 14px !important;
}

/* Mobile Responsive Optimization (<= 768px) */
@media (max-width: 768px) {
  .terminal-signals-grid,
  .stock-cards-container {
    grid-template-columns: 1fr !important;
  }
  .terminal-live-signals-panel,
  .stocks-section {
    padding: 14px 12px !important;
  }
  .signals-panel-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }
}
[data-theme="white"] .signals-panel-header h2,
[data-theme="white"] .section-header h2,
[data-theme="white"] .section-header-compact h2 {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .signal-terminal-card {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04) !important;
  color: #0f172a !important;
}
[data-theme="white"] .signal-terminal-card:hover {
  border-color: #3b82f6 !important;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.12) !important;
  transform: translateY(-2px) !important;
}
[data-theme="white"] .sig-id-badge {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #bfdbfe !important;
  font-weight: 800 !important;
}
[data-theme="white"] .sig-version-badge {
  background: #f1f5f9 !important;
  color: #475569 !important;
  border: 1px solid #e2e8f0 !important;
  font-weight: 600 !important;
}
[data-theme="white"] .sig-inst-name {
  color: #0f172a !important;
  font-weight: 800 !important;
  font-size: 1.15rem !important;
}
[data-theme="white"] .sig-cmp-box {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
}
[data-theme="white"] .sig-cmp-lbl {
  color: #64748b !important;
  font-weight: 600 !important;
}
[data-theme="white"] .sig-cmp-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .contract-tag {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #334155 !important;
}
[data-theme="white"] .level-box {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
}
[data-theme="white"] .level-box .lvl-lbl {
  color: #64748b !important;
  font-weight: 600 !important;
}
[data-theme="white"] .level-box .lvl-val {
  font-weight: 800 !important;
}
[data-theme="white"] .val-blue {
  color: #1d4ed8 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .val-red {
  color: #b91c1c !important;
  font-weight: 800 !important;
}
[data-theme="white"] .val-green {
  color: #15803d !important;
  font-weight: 800 !important;
}
[data-theme="white"] .sig-meta-bar {
  color: #64748b !important;
  border-top: 1px solid #f1f5f9 !important;
}
[data-theme="white"] .btn-sig-action {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #1e293b !important;
  font-weight: 600 !important;
}
[data-theme="white"] .btn-sig-action:hover {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
  color: #1d4ed8 !important;
}
[data-theme="white"] .empty-signals-notice {
  background: #f8fafc !important;
  border: 1px dashed #cbd5e1 !important;
  padding: 24px !important;
  border-radius: 12px !important;
  text-align: center !important;
  color: #64748b !important;
  font-weight: 600 !important;
}

/* Direction Badges */
[data-theme="white"] .badge-dir.badge-call,
[data-theme="white"] .badge-dir.badge-buy {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #bbf7d0 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .badge-dir.badge-put,
[data-theme="white"] .badge-dir.badge-sell {
  background: #fef2f2 !important;
  color: #b91c1c !important;
  border: 1px solid #fecaca !important;
  font-weight: 800 !important;
}

/* Outcome Badges */
[data-theme="white"] .badge-outcome.badge-target {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #86efac !important;
  font-weight: 800 !important;
}
[data-theme="white"] .badge-outcome.badge-sl {
  background: #fef2f2 !important;
  color: #b91c1c !important;
  border: 1px solid #fca5a5 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .badge-outcome.badge-active {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #bfdbfe !important;
  font-weight: 800 !important;
}
[data-theme="white"] .badge-outcome.badge-wait {
  background: #fffbeb !important;
  color: #b45309 !important;
  border: 1px solid #fde68a !important;
  font-weight: 800 !important;
}

/* 1.11 WATCHLIST STOCK CARDS */
[data-theme="white"] .stock-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .stock-card:hover {
  border-color: #3b82f6 !important;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
  transform: translateY(-2px) !important;
}
[data-theme="white"] .stock-sym {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .stock-name {
  color: #64748b !important;
}
[data-theme="white"] .stock-cmp-val {
  color: #0f172a !important;
  font-weight: 800 !important;
  font-family: var(--font-mono) !important;
  font-size: 1.15rem !important;
}
[data-theme="white"] .badge-action.badge-buy {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #bbf7d0 !important;
  font-weight: 700 !important;
}
[data-theme="white"] .badge-action.badge-sell {
  background: #fef2f2 !important;
  color: #b91c1c !important;
  border: 1px solid #fecaca !important;
  font-weight: 700 !important;
}
[data-theme="white"] .price-item {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
}
[data-theme="white"] .price-item .lbl {
  color: #64748b !important;
}
[data-theme="white"] .price-item .val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .price-item .val.green {
  color: #15803d !important;
}
[data-theme="white"] .price-item .val.red {
  color: #b91c1c !important;
}
[data-theme="white"] .indicator-pill {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #334155 !important;
}
[data-theme="white"] .card-catalyst {
  background: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
  color: #1d4ed8 !important;
}
[data-theme="white"] .watchlist-sig-tag {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #bfdbfe !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-size: 0.72rem !important;
  font-weight: 700 !important;
}

/* 1.12 AI CHAT COMMAND SECTION */
[data-theme="white"] .chat-section {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .msg-bot {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #0f172a !important;
}
[data-theme="white"] .msg-bot .msg-header {
  border-bottom: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .msg-bot .bot-badge {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #bfdbfe !important;
  font-weight: 700 !important;
}
[data-theme="white"] .msg-bot .msg-body {
  color: #334155 !important;
}
[data-theme="white"] .msg-user {
  background: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
  color: #1e3a8a !important;
}
[data-theme="white"] .chat-input-bar {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
}
[data-theme="white"] .chat-input-bar input {
  background: #ffffff !important;
  color: #0f172a !important;
  font-weight: 600 !important;
}
[data-theme="white"] .btn-send {
  background: #2563eb !important;
  color: #ffffff !important;
  font-weight: 700 !important;
}
[data-theme="white"] .btn-send:hover {
  background: #1d4ed8 !important;
}

/* 1.13 STOCKS ANALYSIS SECTION */
[data-theme="white"] .sa-control-panel {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .sa-search-input,
[data-theme="white"] .sa-select {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}
[data-theme="white"] .sa-search-input:focus,
[data-theme="white"] .sa-select:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
}
[data-theme="white"] .sa-suggestions-box {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12) !important;
  color: #0f172a !important;
}
[data-theme="white"] .sa-suggestion-item {
  color: #1e293b !important;
  border-bottom: 1px solid #f1f5f9 !important;
}
[data-theme="white"] .sa-suggestion-item:hover {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
}
[data-theme="white"] .sa-btn-action {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #1e293b !important;
  font-weight: 600 !important;
}
[data-theme="white"] .sa-btn-action.primary {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #1d4ed8 !important;
}
[data-theme="white"] .sa-tf-btn,
[data-theme="white"] .sa-mode-btn,
[data-theme="white"] .sa-exch-btn {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #475569 !important;
}
[data-theme="white"] .sa-tf-btn.active,
[data-theme="white"] .sa-mode-btn.active,
[data-theme="white"] .sa-exch-btn.active {
  background: #eff6ff !important;
  border-color: #2563eb !important;
  color: #1d4ed8 !important;
  font-weight: 700 !important;
}

/* Analysis Header Banner */
[data-theme="white"] .sa-stock-name {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .sa-badge-symbol {
  background: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
  color: #1d4ed8 !important;
  font-weight: 700 !important;
}
[data-theme="white"] .sa-badge-sector {
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #475569 !important;
}

/* Decision Cards & Gauges */
[data-theme="white"] .score-card {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .score-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .score-title,
[data-theme="white"] .score-den {
  color: #64748b !important;
}
[data-theme="white"] .advice-box,
[data-theme="white"] .qa-item {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .advice-box h4,
[data-theme="white"] .qa-q {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .advice-box p,
[data-theme="white"] .qa-a {
  color: #334155 !important;
}

/* Marathi Research Report */
[data-theme="white"] .report-point-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
}
[data-theme="white"] .pt-title {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .pt-text {
  color: #334155 !important;
}
[data-theme="white"] .pt-num-badge {
  background: #eff6ff !important;
  color: #2563eb !important;
  font-weight: 800 !important;
}

/* Setup & Fundamentals */
[data-theme="white"] .setup-box,
[data-theme="white"] .fund-card,
[data-theme="white"] .dcf-card,
[data-theme="white"] .sh-item,
[data-theme="white"] .ratio-pill {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .setup-box .s-val,
[data-theme="white"] .fund-card h3,
[data-theme="white"] .dcf-val,
[data-theme="white"] .sh-val,
[data-theme="white"] .r-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .setup-rr-pill {
  background: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
}
[data-theme="white"] .rr-val {
  color: #1d4ed8 !important;
  font-weight: 800 !important;
}

/* Tables & ORB Scanner */
[data-theme="white"] .orb-table-container {
  overflow-x: auto !important;
  background: #ffffff !important;
  border-radius: 12px !important;
  margin-top: 12px !important;
}
[data-theme="white"] .sub-table thead th,
[data-theme="white"] .sa-ind-table th,
[data-theme="white"] .tracker-table th,
[data-theme="white"] .report-summary-table th {
  background: #f8fafc !important;
  color: #475569 !important;
  border-bottom: 2px solid #e2e8f0 !important;
  font-weight: 700 !important;
}
[data-theme="white"] .sub-table tbody tr,
[data-theme="white"] .sa-ind-table tbody tr,
[data-theme="white"] .tracker-table tbody tr,
[data-theme="white"] .report-summary-table tr {
  background: #ffffff !important;
  border-bottom: 1px solid #f1f5f9 !important;
}
[data-theme="white"] .sub-table tbody tr:hover,
[data-theme="white"] .sa-ind-table tr:hover td,
[data-theme="white"] .tracker-table tbody tr:hover {
  background: #f8fafc !important;
}
[data-theme="white"] .sub-table tbody td,
[data-theme="white"] .sa-ind-table td,
[data-theme="white"] .tracker-table td,
[data-theme="white"] .report-summary-table td {
  color: #1e293b !important;
}

/* 1.14 30-DAY TRADE TRACKER SECTION */
[data-theme="white"] .tracker-verif-strip {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .verif-val {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .verif-lbl {
  color: #64748b !important;
}
[data-theme="white"] .filter-btn,
[data-theme="white"] .tracker-period-btn {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #475569 !important;
  font-weight: 600 !important;
}
[data-theme="white"] .filter-btn.active,
[data-theme="white"] .tracker-period-btn.active {
  background: #eff6ff !important;
  border-color: #2563eb !important;
  color: #1d4ed8 !important;
  font-weight: 700 !important;
}
[data-theme="white"] .tracker-search-box input,
[data-theme="white"] .tracker-select {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

/* 1.15 TIME MACHINE SIMULATION SECTION */
[data-theme="white"] .tm-banner {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%) !important;
  border: 1px solid #ddd6fe !important;
}
[data-theme="white"] .tm-banner h2 {
  color: #4c1d95 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .tm-subtitle {
  color: #5b21b6 !important;
}
[data-theme="white"] .tm-banner-content {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}
[data-theme="white"] .time-machine-controls,
[data-theme="white"] .risk-controls,
[data-theme="white"] .form-actions {
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  margin-top: 14px !important;
}
[data-theme="white"] .sim-metric-box {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
}
[data-theme="white"] .sim-lbl {
  color: #64748b !important;
  font-weight: 600 !important;
}
[data-theme="white"] .bracket-details-grid {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .bracket-details-grid div {
  color: #1e293b !important;
}
[data-theme="white"] .compare-results-box,
[data-theme="white"] .history-results-box {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 10px !important;
  padding: 14px !important;
  margin-top: 12px !important;
}
[data-theme="white"] .tm-live-feedback {
  background: #eff6ff !important;
  border: 1px solid #bfdbfe !important;
  color: #1d4ed8 !important;
  padding: 10px 14px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  margin-top: 10px !important;
}
[data-theme="white"] .tunnel-pwd-hint {
  background: #fffbeb !important;
  border: 1px solid #fde68a !important;
  color: #b45309 !important;
  padding: 3px 8px !important;
  border-radius: 6px !important;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
}

/* 1.16 MODAL WINDOWS & SMARTPHONE SIMULATOR */
[data-theme="white"] .modal-backdrop,
[data-theme="white"] .mobile-sim-backdrop {
  background: rgba(15, 23, 42, 0.45) !important;
  backdrop-filter: blur(6px) !important;
}
[data-theme="white"] .modal-card {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.16) !important;
}
[data-theme="white"] .modal-header h3,
[data-theme="white"] .modal-header h2 {
  color: #0f172a !important;
  font-weight: 800 !important;
}
[data-theme="white"] .modal-sub {
  color: #64748b !important;
}
[data-theme="white"] .modal-close {
  color: #64748b !important;
}
[data-theme="white"] .modal-close:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}
[data-theme="white"] .phone-chassis {
  background: #ffffff !important;
  border: 8px solid #334155 !important;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3) !important;
}
[data-theme="white"] .phone-screen-frame {
  background: #f8fafc !important;
}
[data-theme="white"] .phone-clock {
  font-size: 0.8rem !important;
  font-weight: 700 !important;
  color: #0f172a !important;
}
[data-theme="white"] .sim-toolbar {
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
}
[data-theme="white"] .sim-select {
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}
[data-theme="white"] .sim-btn-text {
  font-weight: 600 !important;
}
[data-theme="white"] .sim-hint {
  font-size: 0.75rem !important;
  color: #64748b !important;
}

/* 1.17 COLOR TOKEN CLASSES (High-Contrast & Vibrant) */
[data-theme="white"] .text-green {
  color: #15803d !important;
  font-weight: 800 !important;
}
[data-theme="white"] .text-red {
  color: #b91c1c !important;
  font-weight: 800 !important;
}
[data-theme="white"] .text-glow {
  color: #0284c7 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .text-yellow,
[data-theme="white"] .text-amber {
  color: #b45309 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .text-purple {
  color: #6d28d9 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .text-cyan {
  color: #0891b2 !important;
  font-weight: 800 !important;
}
[data-theme="white"] .muted,
[data-theme="white"] .small {
  color: #64748b !important;
  font-size: 0.82rem !important;
}
[data-theme="white"] .chip-secondary {
  background: #f1f5f9 !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
  font-weight: 600 !important;
  padding: 5px 12px !important;
  border-radius: 20px !important;
  font-size: 0.8rem !important;
  cursor: pointer !important;
}
[data-theme="white"] .select-wrapper {
  position: relative !important;
  display: inline-block !important;
  width: 100% !important;
}
[data-theme="white"] .link-icon {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 16px !important;
  height: 16px !important;
  color: #2563eb !important;
}

/* 1.18 Sidebar Navigation Menu */
.btn-sidebar-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  margin-right: 8px;
}
.btn-sidebar-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
}
.app-sidebar {
  position: fixed;
  top: 0;
  left: -320px;
  width: 300px;
  height: 100vh;
  background: #ffffff;
  z-index: 1000;
  box-shadow: 10px 0 35px rgba(0, 0, 0, 0.1);
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
}
.app-sidebar.active {
  left: 0;
}
.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.sidebar-backdrop.active {
  opacity: 1;
  pointer-events: auto;
}
.sidebar-header {
  padding: 20px 22px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sidebar-logo {
  font-size: 1.5rem;
}
.sidebar-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}
.sidebar-sub {
  font-size: 0.75rem;
  color: #64748b;
}
.sidebar-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 4px 8px;
  border-radius: 6px;
}
.sidebar-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.sidebar-content {
  padding: 20px 16px;
  overflow-y: auto;
  flex: 1;
}
.sidebar-section-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
  font-weight: 700;
  margin: 16px 0 8px 12px;
}
.sidebar-section-title:first-child {
  margin-top: 0;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: #334155;
  font-size: 0.90rem;
  font-weight: 600;
  transition: all 0.2s ease;
  text-decoration: none;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  margin-bottom: 4px;
}
.sidebar-link:hover {
  background: #f1f5f9;
  color: #2563eb;
  transform: translateX(2px);
}
.sidebar-link.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
}
.sidebar-footer-box {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  text-align: center;
}
.sidebar-footer-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 600;
}
.btn-theme-pill {
  width: 100%;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.btn-theme-pill:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}
"""

def audit_css(path=CSS_PATH):
    """Audits CSS bracket balance, size, and rule count."""
    print("=" * 64)
    print("  PYTHON CSS ARCHITECTURE & STRUCTURAL AUDIT")
    print("=" * 64)
    if not os.path.exists(path):
        print(f"❌ Error: CSS file not found at: {path}")
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    open_b = content.count("{")
    close_b = content.count("}")
    file_size = len(content)

    print(f"File Path:         {path}")
    print(f"File Size:         {file_size:,} bytes ({round(file_size / 1024, 1)} KB)")
    print(f"Open Brackets {{:   {open_b}")
    print(f"Close Brackets }}:  {close_b}")

    balanced = (open_b == close_b)
    if balanced:
        print(f"✅ Bracket Balance: 100% PERFECTLY BALANCED ({open_b}/{close_b})")
    else:
        print(f"⚠️ Bracket Balance: MISMATCH DETECTED ({open_b} open vs {close_b} close)!")

    # Check key chapters
    has_white_theme = "☀️ [CHAPTER 1] MASTER WHITE + COLOURFUL PREMIUM DESIGN SYSTEM" in content
    print(f"White Theme Master CSS: {'✅ ACTIVE & INSTALLED' if has_white_theme else '⏳ PENDING INJECTION'}")
    print("=" * 64)
    return balanced

def compile_and_inject_css(path=CSS_PATH):
    """Injects or updates the White + Colourful Master CSS module in the stylesheet."""
    if not os.path.exists(path):
        print(f"❌ Error: CSS file not found at: {path}")
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    marker = "/* ==========================================================================\n   ☀️ [CHAPTER 1] MASTER WHITE + COLOURFUL PREMIUM DESIGN SYSTEM"
    if marker not in content:
        marker = "/* ========================================================================== */\n/* ☀️ [CHAPTER 1] MASTER WHITE + COLOURFUL PREMIUM DESIGN SYSTEM"

    # Clean previous injected white theme block if present
    if marker in content:
        split_parts = content.split(marker)
        content = split_parts[0].rstrip()

    content += "\n\n" + WHITE_AND_COLOURFUL_CSS.strip() + "\n"

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print("✅ Successfully compiled and injected White + Colourful CSS Master Architecture!")
    return audit_css(path)

def print_palette():
    """Prints colorful ANSI representation of the white theme design tokens."""
    print("\n========================================================")
    print("   MARKET PULSE AI TERMINAL — WHITE THEME COLOR PALETTE ")
    print("========================================================")
    print(" ⬜ Canvas Background:  #f8fafc (Crisp Light Slate)")
    print(" ◽ Cards & Surfaces:   #ffffff (Pure White with Soft Shadows)")
    print(" 🔵 Primary Blue:       #2563eb (Royal Blue #eff6ff bg)")
    print(" 🟢 Success / Buy:      #16a34a (Vibrant Emerald #f0fdf4 bg)")
    print(" 🔴 Sell / Stop Loss:   #dc2626 (Vivid Crimson #fef2f2 bg)")
    print(" 🟣 AI / Analysis:      #7c3aed (Cyber Violet #faf5ff bg)")
    print(" 🟡 Warning / OR-Mid:   #d97706 (Radiant Amber #fffbeb bg)")
    print(" 🔷 Cyan / Highlights:  #0891b2 (Electric Cyan #ecfeff bg)")
    print("========================================================\n")

def export_palette_json():
    """Exports palette definition to data/theme_palette.json."""
    out_dir = os.path.join(PROJECT_ROOT, "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "theme_palette.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(PALETTE, f, indent=2)
    print(f"✅ Exported design token palette to: {out_path}")

def main():
    args = sys.argv[1:]
    if "--palette" in args:
        print_palette()
        export_palette_json()
    elif "--audit" in args:
        audit_css()
    elif "--compile" in args or not args:
        print_palette()
        compile_and_inject_css()
        export_palette_json()
    else:
        print("Usage: python scripts/python_css_developer.py [--audit | --compile | --palette]")

if __name__ == "__main__":
    main()
