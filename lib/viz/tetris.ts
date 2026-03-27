export default async function render(el: HTMLElement): Promise<void> {
  const d3 = await import('d3')

  const COLS = 10
  const ROWS = 20
  const CELL = 24
  const GAP = 1
  const width = COLS * (CELL + GAP) + GAP
  const height = ROWS * (CELL + GAP) + GAP

  const COLORS = ['#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000']

  const SHAPES = [
    [[1,1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1],[1,1]],
    [[0,1,1],[1,1,0]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]],
  ]

  // Build a static board with some pieces already "placed"
  const board: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(-1))

  // Fill bottom rows with random blocks (like a game in progress)
  for (let r = ROWS - 1; r >= ROWS - 6; r--) {
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.7) {
        board[r][c] = Math.floor(Math.random() * COLORS.length)
      }
    }
  }

  // Place a falling piece
  const pieceIdx = Math.floor(Math.random() * SHAPES.length)
  const piece = SHAPES[pieceIdx]
  const pieceX = 3
  const pieceY = 2
  for (let r = 0; r < piece.length; r++) {
    for (let c = 0; c < piece[r].length; c++) {
      if (piece[r][c]) board[pieceY + r][pieceX + c] = pieceIdx
    }
  }

  el.innerHTML = ''

  const svg = d3.select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)
    .style('background', '#111')
    .style('border-radius', '4px')
    .style('display', 'block')
    .style('margin', '0 auto')

  // Draw grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GAP + c * (CELL + GAP)
      const y = GAP + r * (CELL + GAP)
      const colorIdx = board[r][c]

      svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', CELL)
        .attr('height', CELL)
        .attr('rx', 3)
        .attr('fill', colorIdx >= 0 ? COLORS[colorIdx] : '#1a1a2e')
        .attr('opacity', colorIdx >= 0 ? 0.9 : 0.3)
        .attr('stroke', colorIdx >= 0 ? '#fff' : '#222')
        .attr('stroke-width', colorIdx >= 0 ? 0.5 : 0)
    }
  }

  // Animate: slowly drop a new piece
  const dropPiece = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const dropColor = COLORS[Math.floor(Math.random() * COLORS.length)]
  const dropX = 4
  let dropY = -dropPiece.length

  const cells = dropPiece.flatMap((row, r) =>
    row.map((v, c) => v ? svg.append('rect')
      .attr('width', CELL)
      .attr('height', CELL)
      .attr('rx', 3)
      .attr('fill', dropColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0) as d3.Selection<SVGRectElement, unknown, null, undefined> : null)
      .map((rect, c) => rect ? { rect, r, c } : null)
  ).filter(Boolean) as { rect: d3.Selection<SVGRectElement, unknown, null, undefined>; r: number; c: number }[]

  function updateDrop() {
    dropY++
    cells.forEach(({ rect, r, c }) => {
      const ry = dropY + r
      const cx = dropX + c
      rect
        .attr('x', GAP + cx * (CELL + GAP))
        .attr('y', GAP + ry * (CELL + GAP))
        .attr('opacity', ry >= 0 ? 0.9 : 0)
    })
    if (dropY < ROWS - 8) {
      setTimeout(updateDrop, 500)
    }
  }

  setTimeout(updateDrop, 300)
}
