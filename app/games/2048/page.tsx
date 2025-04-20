'use client';

import { useState, useEffect } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'playing' | 'won' | 'lost';

interface TileData {
  id: number;
  value: number;
}

interface Tile extends TileData {
  mergedFrom: null | [TileData, TileData];
  isNew: boolean;
}

type Grid = (Tile | null)[][];

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [touchStart, setTouchStart] = useState<[number, number] | null>(null);

  useEffect(() => {
    initializeGame();
    const savedBestScore = localStorage.getItem('2048-best-score');
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore));
    }
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('2048-best-score', score.toString());
    }
  }, [score, bestScore]);

  const initializeGame = () => {
    const newGrid = Array(4).fill(null).map(() => Array(4).fill(null));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameState('playing');
  };

  const addRandomTile = (currentGrid: (Tile | null)[][]) => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (!currentGrid[i][j]) {
          emptyCells.push([i, j]);
        }
      }
    }

    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[row][col] = {
        id: Date.now() + Math.random(),
        value: Math.random() < 0.9 ? 2 : 4,
        mergedFrom: null,
        isNew: true
      };
    }
  };

  const move = (direction: Direction) => {
    if (gameState !== 'playing') return;

    const newGrid = JSON.parse(JSON.stringify(grid)) as Grid;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (newGrid[i][j]) {
          newGrid[i][j]!.mergedFrom = null;
          newGrid[i][j]!.isNew = false;
        }
      }
    }
    let moved = false;
    let newScore = score;

    const vector: [number, number] = {
      up: [-1, 0] as [number, number],
      right: [0, 1] as [number, number],
      down: [1, 0] as [number, number],
      left: [0, -1] as [number, number]
    }[direction];

    const getTraversals = () => {
      const traversals = { x: [0, 1, 2, 3], y: [0, 1, 2, 3] };
      if (direction === 'right') traversals.x.reverse();
      if (direction === 'down') traversals.y.reverse();
      return traversals;
    };

    const findFarthestPosition = (row: number, col: number, vector: [number, number]) => {
      let previous: [number, number] = [row, col];
      let current: [number, number] = [row + vector[0], col + vector[1]];

      while (
        current[0] >= 0 && current[0] < 4 &&
        current[1] >= 0 && current[1] < 4 &&
        !newGrid[current[0]][current[1]]
      ) {
        previous = current;
        current = [current[0] + vector[0], current[1] + vector[1]];
      }

      return {
        farthest: previous,
        next: current[0] >= 0 && current[0] < 4 && current[1] >= 0 && current[1] < 4 ? current : null
      };
    };

    const traversals = getTraversals();

    traversals.y.forEach(row => {
      traversals.x.forEach(col => {
        const tile = newGrid[row][col];
        if (tile) {
          const { farthest, next } = findFarthestPosition(row, col, vector);
          const nextTile = next ? newGrid[next[0]][next[1]] : null;

          if (nextTile && nextTile.value === tile.value && !nextTile.mergedFrom && next) {
            const merged: Tile = {
              id: Date.now() + Math.random(),
              value: tile.value * 2,
              mergedFrom: [tile, nextTile],
              isNew: false
            };

            newGrid[next[0]][next[1]] = merged;
            newGrid[row][col] = null;
            newScore += merged.value;

            if (merged.value === 2048 && gameState === 'playing') {
              setGameState('won');
            }

            moved = true;
          } else if (farthest[0] !== row || farthest[1] !== col) {
            newGrid[farthest[0]][farthest[1]] = tile;
            newGrid[row][col] = null;
            moved = true;
          }
        }
      });
    });

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);

      if (!hasAvailableMoves(newGrid)) {
        setGameState('lost');
      }
    }
  };

  const hasAvailableMoves = (currentGrid: (Tile | null)[][]) => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (!currentGrid[i][j]) return true;
        const tile = currentGrid[i][j];
        const adjacent = [
          [i - 1, j], [i + 1, j],
          [i, j - 1], [i, j + 1]
        ];
        for (const [r, c] of adjacent) {
          if (r >= 0 && r < 4 && c >= 0 && c < 4) {
            const neighbor = currentGrid[r][c];
            if (neighbor && neighbor.value === tile!.value) return true;
          }
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const keyMap: { [key: string]: Direction } = {
        ArrowUp: 'up',
        ArrowRight: 'right',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        w: 'up',
        d: 'right',
        s: 'down',
        a: 'left'
      };
      const direction = keyMap[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, grid]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart([e.touches[0].clientX, e.touches[0].clientY]);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart[0];
    const deltaY = touch.clientY - touchStart[1];
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        move(deltaX > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        move(deltaY > 0 ? 'down' : 'up');
      }
    }

    setTouchStart(null);
  };

  const getTileColor = (value: number) => {
    const colors: { [key: number]: string } = {
      2: 'bg-yellow-100 text-gray-700',
      4: 'bg-yellow-200 text-gray-700',
      8: 'bg-yellow-300 text-gray-700',
      16: 'bg-yellow-400 text-gray-700',
      32: 'bg-yellow-500 text-white',
      64: 'bg-yellow-600 text-white',
      128: 'bg-yellow-700 text-white',
      256: 'bg-yellow-800 text-white',
      512: 'bg-yellow-900 text-white',
      1024: 'bg-amber-500 text-white',
      2048: 'bg-amber-600 text-white'
    };
    return colors[value] || 'bg-amber-700 text-white';
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white">2048</h1>
            <p className="text-white/80">Join the tiles, get to 2048!</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 text-center min-w-[80px]">
              <div className="text-white/60 text-sm">SCORE</div>
              <div className="text-white font-bold">{score}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 text-center min-w-[80px]">
              <div className="text-white/60 text-sm">BEST</div>
              <div className="text-white font-bold">{bestScore}</div>
            </div>
          </div>
        </div>

        <div
          className="bg-white/10 backdrop-blur-md rounded-lg p-3 relative touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-4 gap-0 relative z-0">
            {Array(16).fill(null).map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-md" />
            ))}
          </div>

          <div className="absolute inset-3 z-10">
            {grid.map((row, rowIndex) =>
              row.map((tile, colIndex) => {
                if (!tile) return null;
                return (
                  <div
                    key={tile.id}
                    className={`absolute w-[calc(25%-6px)] aspect-square rounded-md flex items-center justify-center
                    font-bold text-2xl transition-all duration-100 ease-in-out ${getTileColor(tile.value)}
                    ${tile.isNew ? 'animate-pop-in' : ''}`}
                    style={{
                      top: `calc(${rowIndex} * (25% + 0px))`,
                      left: `calc(${colIndex} * (25% + 0px))`
                    }}
                  >
                    {tile.value}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={initializeGame}
            className="px-6 py-2 bg-yellow-400 text-black rounded-full font-bold
              hover:bg-yellow-300 transform hover:scale-105 active:scale-95 
              transition-all duration-300 shadow-lg"
          >
            New Game
          </button>
          <div className="text-white/70 text-sm">
            <span className="hidden md:inline">⬆️ ⬇️ ⬅️ ➡️ or WASD to move</span>
            <span className="md:hidden">Swipe to move tiles</span>
          </div>
        </div>
      </div>

      {gameState !== 'playing' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              {gameState === 'won' ? 'You Win! 🎉' : 'Game Over! 😢'}
            </h2>
            <p className="text-white/80 text-xl mb-6">Score: {score}</p>
            <button
              onClick={initializeGame}
              className="px-8 py-3 bg-yellow-400 text-black rounded-full font-bold text-lg
                hover:bg-yellow-300 transform hover:scale-105 active:scale-95 
                transition-all duration-300 shadow-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
