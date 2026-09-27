from inspect_l5 import grid, r_pos
from collections import deque

visited = set([(1, 1)])
q = deque([(1, 1)])
while q:
    r, c = q.popleft()
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        nr, nc = r+dr, c+dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]):
            if (nr, nc) not in visited:
                if grid[nr][nc] not in ['#', 'C', 'D', 'G']:
                    visited.add((nr, nc))
                    q.append((nr, nc))

print(f"Is R {r_pos} reachable? {r_pos in visited}")
