// Combines multiple minimum-detectable-RCS grids (all sharing the same
// geometry) into one, taking the elementwise minimum. Multiple PCL sensors
// together can detect a target as soon as any one of them can, so the
// combined minimum detectable RCS at a cell is the smallest value
// contributed by any sensor there. NaN marks "not detectable" and is
// ignored unless every sensor is NaN at that cell.
export function combineMinDetectableRcsGrids(
  grids: number[][][][],
): number[][][] {
  if (grids.length === 0) {
    return [];
  }
  return grids[0].map((row, i) =>
    row.map((col, j) =>
      col.map((_, k) => {
        let min = NaN;
        for (const grid of grids) {
          const value = grid[i][j][k];
          if (!Number.isNaN(value) && (Number.isNaN(min) || value < min)) {
            min = value;
          }
        }
        return min;
      }),
    ),
  );
}

// JSON.stringify turns NaN into null, so it can't round-trip through the
// save file directly. Encode/decode using the same -1 sentinel the backend
// uses for "not detectable" (see calculatePclMinimumDetectableRcs in
// backend.ts) around the JSON boundary instead.
export function encodeMinDetectableRcsGrid(grid: number[][][]): number[][][] {
  return grid.map((row) =>
    row.map((col) => col.map((v) => (Number.isNaN(v) ? -1 : v))),
  );
}

export function decodeMinDetectableRcsGrid(grid: number[][][]): number[][][] {
  return grid.map((row) =>
    row.map((col) => col.map((v) => (v === -1 ? NaN : v))),
  );
}
