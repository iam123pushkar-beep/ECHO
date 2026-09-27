from collections import deque
import re

with open('js/levels.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's verify all 5 levels
# We'll test with our proposed updates to Level 2 and Level 4
# First check what's currently in levels.js:

pattern = r'id:\s*(\d+)[\s\S]*?name:\s*"([^"]+)"[\s\S]*?map:\s*\[([\s\S]*?)\]'
for m in re.finditer(pattern, text):
    lvl_id = int(m.group(1))
    lvl_name = m.group(2)
    map_str = m.group(3)
    rows = []
    for l in map_str.strip().split('\n'):
        lm = re.search(r'"([^"]+)"', l)
        if lm:
            rows.append(lm.group(1))
            
    print(f"Level {lvl_id}: {lvl_name} (Rows: {len(rows)})")
