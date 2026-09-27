import re

with open('js/levels.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract levels
level_blocks = re.findall(r'\bid:\s*(\d+)[\s\S]*?map:\s*\[([\s\S]*?)\]', text)
print(f"Found {len(level_blocks)} levels.")

for lvl_id, map_content in level_blocks:
    raw_lines = [l.strip() for l in map_content.strip().split('\n') if l.strip()]
    cleaned = []
    for l in raw_lines:
        m = re.search(r'"([^"]+)"', l)
        if m:
            cleaned.append(m.group(1))
    print(f"\n--- Level {lvl_id} (Rows: {len(cleaned)}) ---")
    for r_idx, row in enumerate(cleaned):
        if len(row) != 30:
            print(f"  WARNING: Row {r_idx} len = {len(row)} (expected 30): {row}")
        
    # Check elements: P, E/X, O, B, R, D, G, Z
    elements = {}
    for r_idx, row in enumerate(cleaned):
        for c_idx, ch in enumerate(row):
            elements[ch] = elements.get(ch, 0) + 1
    print(f"  Elements: {elements}")
