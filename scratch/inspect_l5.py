with open('js/levels.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pattern = r'id:\s*5[\s\S]*?map:\s*\[([\s\S]*?)\]'
m = re.search(pattern, text)
raw_lines = [l.strip() for l in m.group(1).strip().split('\n') if l.strip()]
grid = [re.search(r'"([^"]+)"', l).group(1) for l in raw_lines]

r_pos = [(r, c) for r, row in enumerate(grid) for c, ch in enumerate(row) if ch == 'R'][0]
print(f"R is at: {r_pos}")
for r in range(13, 18):
    print(f"Row {r:02d}: {grid[r]}")
