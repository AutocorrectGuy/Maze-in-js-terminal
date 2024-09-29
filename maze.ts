type TileProp = 'isTraversed' | 'isStart' | 'isEnd' | 'isShortest' | 'isWall'
type Tile = { x: number; y: number; parent?: Tile } & { [K in TileProp]?: boolean }
type Emojis = { [K in TileProp]: string } & { isEmpty: string }

class Maze {
  private _rows: number
  private _cols: number
  private _grid: Tile[][]
  private _startTile: Tile
  private _endTile: Tile
  private _shortestPath: Tile[]
  private _emojis: Emojis

  // helpers
  private _currentQueue: Tile[]
  private _nextQueue: Tile[]
  private _currentTile: Tile
  private _isShortestPathVisible: boolean

  constructor() {
    this._rows = 31
    this._cols = 31
    this._grid = this._generateEmptyGrid()
    this._startTile = this._grid[1][1]
    this._currentTile = this._startTile
    this._startTile.isStart = true
    this._endTile = this._grid[this._rows - 2][this._cols - 2]
    this._endTile.isEnd = true
    this._shortestPath = []
    this._emojis = { isStart: '👨', isEnd: '🏠', isWall: '🟫', isEmpty: '🟩', isTraversed: '🟥', isShortest: '🟦' }
    this._currentQueue = [this._currentTile]
    this._nextQueue = []
    this._isShortestPathVisible = true
    this._run()
  }

  private _run = async () => {
    await this._generateMaze()
    await this._runBFS()
    this._draw()
  }

  private _reset = async () => {
    this._grid = this._generateEmptyGrid()
    this._startTile = this._grid[1][1]
    this._currentTile = this._startTile
    this._startTile.isStart = true
    this._endTile = this._grid[this._rows - 2][this._cols - 2]
    this._endTile.isEnd = true
    this._shortestPath = []
    this._currentQueue = [this._currentTile]
    this._nextQueue = []
    this._isShortestPathVisible = true
    await this._run()
  }

  private _generateMaze = async () => {
    let lastRowI = this._rows - 2
    let lastColI = this._cols - 2
    // set the walls grid with holes
    for (let i = 0; i < this._rows; i++)
      for (let j = 0; j < this._cols; j++)
        if (!(i % 2) || !(j % 2)) {
          this._grid[i][j].isWall = true
          await this._sleepAndRerender()
        }
    // carve the path
    for (let i = 1; i < lastRowI; i += 2)
      for (let j = 1; j < lastColI; j += 2) {
        Math.random() > 0.5 ? (this._grid[i][j + 1].isWall = false) : (this._grid[i + 1][j].isWall = false)
        await this._sleepAndRerender()
      }
    // enure that the maze is completabe
    for (let i = 2; i < lastRowI; i += 2) {
      this._grid[lastRowI][i].isWall = false
      this._grid[i][lastRowI].isWall = false
      await this._sleepAndRerender()
    }
  }

  private _runBFS = async () => {
    const stepForward = async () => {
      while (this._currentQueue.length) {
        this._currentTile = this._currentQueue.shift()!
        if (this._currentTile.isEnd) {
          // Maze completed
          await this._sleepAndRerender(200)
          this._saveShortestPathAsArray()
          await this._walkShortestPathAndReset()
          return
        }
        this._currentTile.isTraversed = true // mark as traversed
        this._findNeighbours() // find next cells to evaluate
      }
      this._currentQueue = this._nextQueue
      this._nextQueue = []
      await this._sleepAndRerender()
      if (!this._currentQueue.length) return
      stepForward()
    }

    stepForward()
  }

  private _findNeighbours = () => {
    const { x, y } = this._currentTile
    let dir = x + 1
    let tile = this._grid[y][dir]
    if (dir < this._cols && !tile.isWall && !tile.isTraversed) {
      tile.parent = this._currentTile
      this._nextQueue.push(tile)
    }
    dir = x - 1
    tile = this._grid[y][dir]
    if (dir >= 0 && !tile.isWall && !tile.isTraversed) {
      tile.parent = this._currentTile
      this._nextQueue.push(tile)
    }
    dir = y + 1
    tile = this._grid[dir][x]
    if (dir < this._rows && !tile.isWall && !tile.isTraversed) {
      tile.parent = this._currentTile
      this._nextQueue.push(tile)
    }
    dir = y - 1
    tile = this._grid[dir][x]
    if (dir >= 0 && !tile.isWall && !tile.isTraversed) {
      tile.parent = this._currentTile
      this._nextQueue.push(tile)
    }
  }

  private _saveShortestPathAsArray = () => {
    while (this._currentTile.parent) {
      this._shortestPath.push(this._currentTile)
      this._currentTile = this._currentTile.parent
    }
  }

  private _walkShortestPathAndReset = async () => {
    for (let i = this._shortestPath.length - 1; i > -1; i--) {
      this._shortestPath[i].isShortest = true
      await this._sleepAndRerender()
    }
    // blink couple of times
    for (let i = 0; i < 6; i++) {
      this._isShortestPathVisible = !this._isShortestPathVisible
      await this._sleepAndRerender(50)
    }

    await this._sleepAndRerender(500)
    await this._reset()
  }

  private _sleepAndRerender = (ms: number = 5) =>
    new Promise((resolve) =>
      setTimeout(() => {
        resolve(this._draw())
      }, ms)
    )

  private _generateEmptyGrid = (): Tile[][] =>
    [...Array(this._rows)].map((_, y) => [...Array(this._cols)].map((_, x) => ({ x, y })))

  private _draw = () => {
    console.clear()
    console.log(
      this._grid.reduce((accRow, row) => {
        return `${accRow}\n${row.reduce((accTile, { isStart, isEnd, isShortest, isWall, isTraversed }) => {
          return `${accTile}${
            isStart
              ? this._emojis.isStart
              : isEnd
              ? this._emojis.isEnd
              : isShortest && this._isShortestPathVisible
              ? this._emojis.isShortest
              : isWall
              ? this._emojis.isWall
              : isTraversed
              ? this._emojis.isTraversed
              : this._emojis.isEmpty
          }`
        }, '')}`
      }, '')
    )
  }
}

const maze = new Maze()
