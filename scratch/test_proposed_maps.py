from collections import deque

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

# Test proposed Level 2
lvl2_map = [
    "##############################",
    "#P...................#......E#",
    "#..######..######....#..###..#",
    "#..#....#..#....#....#..#.#..#",
    "#..#..O.#..#.O..######..#.#..#",
    "#..#....#..#...............#.#",
    "#..##..##..##..##....#######.#",
    "#............................#",
    "#######..############..#######",
    "#.....#..#..........#..#.....#",
    "#..O..#..#....##....#..#..O..#",
    "#.....#..#....##....#..#.....#",
    "#######..############..#######",
    "#............................#",
    "#..######..######....#######.#",
    "#..#....#..#....#..........#.#",
    "#..#....#..#....######..#..#.#",
    "#..#....#..#....#....#..#..#.#",
    "#............................#",
    "##############################"
]
# In row 10 (idx 10), open col 6 and col 23
row10_list = list(lvl2_map[10])
row10_list[6] = '.'
row10_list[23] = '.'
lvl2_map[10] = "".join(row10_list)

print("Testing proposed Level 2:")
p_pos = (1, 1)
v = bfs(lvl2_map, p_pos, set(['.', 'P', 'O', 'E']))
orbs = [(r, c) for r, row in enumerate(lvl2_map) for c, ch in enumerate(row) if ch == 'O']
print(f"Orbs reachable in L2: {sum(1 for o in orbs if o in v)}/{len(orbs)}")
print(f"Exit reachable in L2: {(1, 28) in v}")

# Test proposed Level 4
lvl4_map = [
    "##############################",
    "#P..................#.......E#",
    "#........#....B.....#........#",
    "#...O....#..........#...O....#",
    "#######DD##############GG#####",
    "#............................#",
    "#..######....####....######..#",
    "#..#....#....#..#....#....#..#",
    "#..#....######..######....#..#",
    "#..#......................#..#",
    "#..#....######..######....#..#",
    "#..#....#....#..#....#....#..#",
    "#..######....#..#....######..#",
    "#............#..#............#",
    "#######GG#####..#####DD#######",
    "#............#..#............#",
    "#...R........#..#........O...#",
    "#............#..#............#",
    "#............................#",
    "##############################"
]
print("\nTesting proposed Level 4:")
v4_init = bfs(lvl4_map, (1, 1), set(['.', 'P', 'O', 'E', 'B', 'R']))
b_pos = [(r, c) for r, row in enumerate(lvl4_map) for c, ch in enumerate(row) if ch == 'B'][0]
r_pos = [(r, c) for r, row in enumerate(lvl4_map) for c, ch in enumerate(row) if ch == 'R'][0]
e_pos = [(r, c) for r, row in enumerate(lvl4_map) for c, ch in enumerate(row) if ch == 'E'][0]
orbs4 = [(r, c) for r, row in enumerate(lvl4_map) for c, ch in enumerate(row) if ch == 'O']

print(f"Initial: Switch B reachable? {b_pos in v4_init}")
print(f"Initial: Orbs reachable? {sum(1 for o in orbs4 if o in v4_init)}/{len(orbs4)}")

v4_b = bfs(lvl4_map, (1, 1), set(['.', 'P', 'O', 'E', 'B', 'R', 'D']))
print(f"After Switch B pressed (Door D open): Switch R reachable? {r_pos in v4_b}")
print(f"After Switch B pressed (Door D open): Orbs reachable? {sum(1 for o in orbs4 if o in v4_b)}/{len(orbs4)}")

v4_both = bfs(lvl4_map, (1, 1), set(['.', 'P', 'O', 'E', 'B', 'R', 'D', 'G']))
print(f"After both B and R pressed (D and G open): Exit reachable? {e_pos in v4_both}")
print(f"After both B and R pressed (D and G open): Orbs reachable? {sum(1 for o in orbs4 if o in v4_both)}/{len(orbs4)}")
