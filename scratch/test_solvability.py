import re
from collections import deque

with open('js/levels.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Parse level data using JS regex
levels = []
pattern = r'id:\s*(\d+)[\s\S]*?name:\s*"([^"]+)"[\s\S]*?map:\s*\[([\s\S]*?)\]'
for m in re.finditer(pattern, text):
    lvl_id = int(m.group(1))
    lvl_name = m.group(2)
    map_str = m.group(3)
    rows = []
    for l in map_str.strip().split('\n'):
        line_match = re.search(r'"([^"]+)"', l)
        if line_match:
            rows.append(line_match.group(1))
    levels.append({
        'id': lvl_id,
        'name': lvl_name,
        'map': rows
    })

def bfs(grid, start_pos, walkable_chars):
    rows = len(grid)
    cols = len(grid[0])
    visited = set()
    queue = deque([start_pos])
    visited.add(start_pos)
    
    while queue:
        r, c = queue.popleft()
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if (nr, nc) not in visited:
                    ch = grid[nr][nc]
                    if ch in walkable_chars:
                        visited.add((nr, nc))
                        queue.append((nr, nc))
    return visited

print(f"Loaded {len(levels)} levels.\n")

for lvl in levels:
    print(f"=== Level {lvl['id']}: {lvl['name']} ===")
    grid = lvl['map']
    # Find P
    p_pos = None
    elements = {}
    for r, row in enumerate(grid):
        for c, ch in enumerate(row):
            elements.setdefault(ch, []).append((r, c))
            if ch == 'P':
                p_pos = (r, c)
                
    print(f"  P at: {p_pos}")
    # Basic walkable: '.', 'P', 'O', 'E', 'X', 'Z', 'B', 'R' (walls '#' and consoles 'C' block, doors 'D' and 'G' block when closed)
    walkable_initial = set(['.', 'P', 'O', 'E', 'X', 'Z', 'B', 'R'])
    visited_init = bfs(grid, p_pos, walkable_initial)
    
    print(f"  Initial reachable tiles: {len(visited_init)}")
    
    # Check elements reached initially
    for ch in ['O', 'E', 'X', 'B', 'R', 'D', 'G', 'Z']:
        if ch in elements:
            total = len(elements[ch])
            reached = sum(1 for pos in elements[ch] if pos in visited_init)
            print(f"    {ch}: {reached}/{total} reached initially")
            
    # If Level 4 or 5, simulate switch B being pressed (opens D) and switch R being pressed (opens G)
    if 'B' in elements or 'R' in elements:
        walkable_with_d = set(['.', 'P', 'O', 'E', 'X', 'Z', 'B', 'R', 'D'])
        visited_d = bfs(grid, p_pos, walkable_with_d)
        walkable_with_all = set(['.', 'P', 'O', 'E', 'X', 'Z', 'B', 'R', 'D', 'G'])
        visited_all = bfs(grid, p_pos, walkable_with_all)
        print("  After B pressed (D open):")
        for ch in ['O', 'E', 'X', 'R', 'G']:
            if ch in elements:
                reached = sum(1 for pos in elements[ch] if pos in visited_d)
                print(f"    {ch}: {reached}/{len(elements[ch])}")
        print("  After both B and R pressed (D and G open):")
        for ch in ['O', 'E', 'X']:
            if ch in elements:
                reached = sum(1 for pos in elements[ch] if pos in visited_all)
                print(f"    {ch}: {reached}/{len(elements[ch])}")
    print()
