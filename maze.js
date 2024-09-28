class Maze {
  constructor({ cols, rows } = { cols: 31, rows: 21 }) {
    this._rows = rows
    this._cols = cols
    this._grid = [...Array(this._rows)].map((_, y) =>
      [...Array(this._cols)].map((_, x) => ({
        isWall: false,
        isTraversed: false,
        isShortest: null,
        parent: null,
        x,
        y,
      }))
    )
    this._startTile = { x: 0, y: 0 }
    this._endTile = { x: 0, y: 0 }
    this._emoji = {}

    // for rendering
    this._isShortestPathHidden = true
    // Runs sequence of operations to start the maze program
    this._setEmojis()
    this._run()
  }

  // Main function that runs all the operations in correct order to run the maze
  _run = () => {
    this._generateBinaryTreeMaze()
    this._setStartAndEndTiles()
    this._runBreadthFirstSearch()
  }

  _reset = () => {
    // clear the tile data
    this._grid.forEach((row) =>
      row.forEach((tile) => {
        tile.isWall = false
        tile.isTraversed = false
        tile.isShortest = null
        tile.parent = null
        tile.isStart = false
        tile.isEnd = false
      })
    )
    this._isShortestPathHidden = true
    this._run()
  }

  // Visual representation of how the cells will look in the maze
  _setEmojis = () => {
    this._emoji = { start: '👨', end: '🏠', wall: '🟫', empty: '🟩', traversed: '🟥', shortest: '🟦' }
  }

  // TODO: generates random positions for start and end tiles
  _setStartAndEndTiles = () => {
    this._startTile = this._grid[1][1]
    this._startTile.isStart = true
    this._startTile.isShortest = true
    this._endTile = this._grid[this._rows - 2][this._cols - 2]
    this._endTile.isEnd = true
    this._endTile.isShortest = true
  }

  // generates maze using binary tree method
  _generateBinaryTreeMaze = () => {
    // create a layout of walls that will be used to carve the maze
    for (let i = 0; i < this._rows; i++)
      for (let j = 0; j < this._cols; j++) if (!(i % 2) || !(j % 2)) this._grid[i][j].isWall = true

    // carve the maze South and East
    const lastI = this._rows - 2
    const lastJ = this._cols - 2
    for (let i = 1; i <= lastI; i += 2) {
      for (let j = 1; j <= lastJ; j += 2) {
        const canCarveS = i < lastI
        const canCarveE = j < lastJ
        if (canCarveS && canCarveE)
          Math.random() > 0.5 ? (this._grid[i + 1][j].isWall = false) : (this._grid[i][j + 1].isWall = false)
        else if (canCarveS) this._grid[i + 1][j].isWall = false
        else if (canCarveE) this._grid[i][j + 1].isWall = false
      }
    }
  }

  _runBreadthFirstSearch = () => {
    let queue = [this._grid[this._startTile.y][this._startTile.x]]
    let nextQueue = []

    const stepIntoBatched = () => {
      while (queue.length) {
        const tile = queue.shift()
        const { x, y, isWall, isTraversed, isEnd } = tile

        if (isWall || isTraversed) continue
        if (isEnd) {
          // Route completed! Target found.
          this._traceShortestPath(tile)
          return
        }

        tile.isTraversed = true // Mark tile as traversed

        // Queue the neighbouring tiles and set parent tile to the current tile
        let d = x + 1
        let nextTile = this._grid[y][d]
        if (d < this._cols && !nextTile.isTraversed) {
          nextTile.parent = tile
          nextQueue.push(nextTile)
        }

        d = x - 1
        nextTile = this._grid[y][d]
        if (d >= 0 && !nextTile.isTraversed) {
          nextTile.parent = tile
          nextQueue.push(nextTile)
        }

        d = y + 1
        nextTile = this._grid[d][x]
        if (d < this._rows && !nextTile.isTraversed) {
          nextTile.parent = tile
          nextQueue.push(nextTile)
        }

        d = y - 1
        nextTile = this._grid[d][x]
        if (d >= 0 && !nextTile.isTraversed) {
          nextTile.parent = tile
          nextQueue.push(nextTile)
        }
      }

      // Redraw and recursively continue with the next step after the delay
      setTimeout(() => {
        queue = nextQueue
        nextQueue = []
        this._draw() // Ensure the grid is redrawn after updating the tile state
        stepIntoBatched()
      }, 50)
    }

    stepIntoBatched()
  }

  _traceShortestPath = async (tile) => {
    // collect the shortest path data
    const shortestPath = [this._endTile]
    while (tile.parent) {
      shortestPath.push(tile)
      tile.isShortest = true
      tile = tile.parent
    }
    shortestPath.push(this._startTile)
    shortestPath.reverse()

    // blink the shortest path for 3 times
    for (let i = 0; i < 7; i++) {
      this._isShortestPathHidden = !this._isShortestPathHidden
      this._draw() // Draw the final state after the loop finishes
      await this._sleep(50)
    }

    // wait a bit after blinking
    await this._sleep(300)

    // move the human to the target destination via shortest path
    shortestPath[0].isStart = false
    shortestPath[0].isShortest = false
    for (let i = 1; i < shortestPath.length; i++) {
      shortestPath[i - 1].isShortest = false
      shortestPath[i - 1].isStart = false
      shortestPath[i].isStart = true
      this._draw()
      await this._sleep(50)
    }

    // restart the maze
    await this._sleep(200)
    this._reset()
  }

  _draw = () => {
    console.clear()
    console.log(this._grid.reduce((rowAcc, row) => {
      return rowAcc + '\n' + row.reduce(
        (a, { isStart, isEnd, isTraversed, isWall, isShortest }) =>
          `${a}${
            isStart
              ? this._emoji.start
              : isEnd
              ? this._emoji.end
              : isShortest && !this._isShortestPathHidden
              ? this._emoji.shortest
              : isTraversed
              ? this._emoji.traversed
              : isWall
              ? this._emoji.wall
              : this._emoji.empty
          }`,
        ''
      )
    }, ''))
  }

  _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}

const maze = new Maze({ cols: 21, rows: 21 })
