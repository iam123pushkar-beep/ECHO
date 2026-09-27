from inspect_l5 import grid, r_pos
from collections import deque

visited = {(1, 1): None}
q = deque([(1, 1)])
while q:
    curr = q.popleft()
    r, c = curr
    if curr == r_pos:
        break
    for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
        nr, nc = r+dr, c+dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]):
            if (nr, nc) not in visited:
                if grid[nr][nc] not in ['#', 'C', 'D', 'G']:
                    visited[(nr, nc)] = curr
                    q.append((nr, nc))

curr = r_pos
path = []
while curr:
    path.append(curr)
    curr = visited.get(curr)
path.reverse()
print("Path to R (last 8 steps):", path[-8:])
for p in path[-8:]:
    print(f"Step {p}: '{grid[p[0]][p[1]]}'")
