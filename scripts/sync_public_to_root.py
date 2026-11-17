import shutil
import hashlib
import os

files = [
    'standaloneMarketEngine.js',
    'stocksAnalysis.js',
    'app.js',
    'tracker.js',
    'timeMachine.js',
    'style.css'
]

def get_hash(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

print("Synchronizing public/ files to repository root...")
for fname in files:
    src = os.path.join('public', fname)
    dst = fname
    shutil.copy2(src, dst)
    h_src = get_hash(src)
    h_dst = get_hash(dst)
    match = h_src == h_dst
    print(f"  {fname}: {'MATCH' if match else 'MISMATCH'} ({h_src[:8]})")

print("All root assets successfully synchronized with public/")
