import json
import os
import re

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'nse_bse_master_stocks.json')
STANDALONE_PATH = os.path.join(os.path.dirname(__file__), '..', 'standaloneMarketEngine.js')
PUBLIC_STANDALONE_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'standaloneMarketEngine.js')
LIVE_SERVICE_PATH = os.path.join(os.path.dirname(__file__), '..', 'liveMarketService.js')

with open(DATA_PATH, 'r', encoding='utf-8') as f:
    stocks = json.load(f)

s_map = {s['symbol']: s for s in stocks}

# 1. Generate TOP_MEGA_CAPS list
mega_syms = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'SBIN', 'BHARTIARTL', 'ITC',
    'KOTAKBANK', 'LT', 'TATAMOTORS', 'HINDUNILVR', 'AXISBANK', 'MARUTI', 'SUNPHARMA',
    'TITAN', 'BAJFINANCE', 'TATASTEEL', 'ADANIENT', 'WIPRO', 'HCLTECH', 'NTPC',
    'POWERGRID', 'ONGC', 'COALINDIA', 'M&M', 'JSWSTEEL', 'ULTRACEMCO', 'ASIANPAINT', 'BAJAJFINSV'
]

mega_caps_code = "  const TOP_MEGA_CAPS = [\n"
for sym in mega_syms:
    s = s_map.get(sym)
    if not s:
        continue
    name_clean = s['name'].replace("'", "\\'")
    sec_clean = s['sector'].replace("'", "\\'")
    is_up = s['pct'] >= 0
    trend = 'BULLISH' if is_up else 'BEARISH'
    sig = 'STRONG BUY' if s['pct'] > 1.2 else ('BUY' if is_up else 'SELL')
    mega_caps_code += (
        f"    {{ symbol: '{sym}', name: '{name_clean}', cmp: {s['cmp']:.2f}, change: {s['change']:.2f}, "
        f"pct: {s['pct']:.2f}, exchange: 'NSE', sector: '{sec_clean}', high: {s['dayHigh']:.2f}, "
        f"low: {s['dayLow']:.2f}, volume: '{s['volume']}', pe: {s['pe']}, pb: {s['pb']}, rsi: {s['rsi']}, "
        f"trend: '{trend}', signal: '{sig}' }},\n"
    )
mega_caps_code += "  ];"

# Update standaloneMarketEngine.js
for path in [STANDALONE_PATH, PUBLIC_STANDALONE_PATH]:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(
        r'  const TOP_MEGA_CAPS = \[[\s\S]*?  \];',
        mega_caps_code,
        content
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated TOP_MEGA_CAPS in {path}")

# 2. Update BASELINE_STOCK_PRICES in liveMarketService.js
baseline_code = "// Baseline realistic reference quotes for major tracked equities\nconst BASELINE_STOCK_PRICES = {\n"
tracked_keys = [
    ('reliance', 'RELIANCE'), ('tcs', 'TCS'), ('hdfcbank', 'HDFCBANK'), ('icicibank', 'ICICIBANK'),
    ('infy', 'INFY'), ('sbin', 'SBIN'), ('tatamotors', 'TATAMOTORS'), ('itc', 'ITC'),
    ('bhartiartl', 'BHARTIARTL'), ('lt', 'LT'), ('sunpharma', 'SUNPHARMA'), ('maruti', 'MARUTI'),
    ('titan', 'TITAN'), ('bajfinance', 'BAJFINANCE'), ('jswsteel', 'JSWSTEEL'), ('tatasteel', 'TATASTEEL'),
    ('adanient', 'ADANIENT'), ('coalindia', 'COALINDIA'), ('ntpc', 'NTPC'), ('ongc', 'ONGC'),
    ('techm', 'TECHM'), ('zomato', 'ZOMATO'), ('suzlon', 'SUZLON'), ('irfc', 'IRFC'),
    ('hal', 'HAL'), ('bel', 'BEL')
]

for k, sym in tracked_keys:
    s = s_map.get(sym)
    if not s:
        continue
    baseline_code += (
        f"  {k}: {{ price: {s['cmp']:.2f}, prevClose: {s['prevClose']:.2f}, "
        f"high: {s['dayHigh']:.2f}, low: {s['dayLow']:.2f}, volume: 5000000 }},\n"
    )
baseline_code += "};"

if os.path.exists(LIVE_SERVICE_PATH):
    with open(LIVE_SERVICE_PATH, 'r', encoding='utf-8') as f:
        live_content = f.read()

    new_live = re.sub(
        r'// Baseline realistic reference quotes for major tracked equities[\s\S]*?const BASELINE_STOCK_PRICES = \{[\s\S]*?\};',
        baseline_code,
        live_content
    )

    # In liveMarketService.js, ensure sanity check is realistic:
    # We should allow quotes that are within 35% of baseline
    with open(LIVE_SERVICE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_live)
    print("Updated BASELINE_STOCK_PRICES in liveMarketService.js")

print("All Mega Caps & Baseline prices successfully synchronized with authentic exchange data!")
