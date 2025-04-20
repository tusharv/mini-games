'use client';

import { useState, useEffect, useRef } from 'react';

interface Cell {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  isHighlighted: boolean;
  isExploding?: boolean;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const DIFFICULTY_SETTINGS = {
  Easy: { size: 8, mines: 10 },
  Medium: { size: 12, mines: 20 },
  Hard: { size: 16, mines: 40 }
};

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<Cell[]>([]);
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const gameEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !gameOver && !hasWon) {
      timer = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, gameOver, hasWon]);

  const initializeGame = (selectedDifficulty: Difficulty) => {
    const { size, mines } = DIFFICULTY_SETTINGS[selectedDifficulty];
    const totalCells = size * size;
    
    // Create empty grid
    const newGrid: Cell[] = Array(totalCells).fill(null).map((_, index) => ({
      id: index,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
      isHighlighted: false
    }));

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const randomIndex = Math.floor(Math.random() * totalCells);
      if (!newGrid[randomIndex].isMine) {
        newGrid[randomIndex].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let i = 0; i < totalCells; i++) {
      if (!newGrid[i].isMine) {
        let neighbors = 0;
        const row = Math.floor(i / size);
        const col = i % size;

        // Check all 8 neighbors
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            if (r === 0 && c === 0) continue;
            
            const newRow = row + r;
            const newCol = col + c;
            const newIndex = newRow * size + newCol;

            if (
              newRow >= 0 && newRow < size &&
              newCol >= 0 && newCol < size &&
              newGrid[newIndex].isMine
            ) {
              neighbors++;
            }
          }
        }
        newGrid[i].neighborMines = neighbors;
      }
    }

    setGrid(newGrid);
    setDifficulty(selectedDifficulty);
    setIsPlaying(true);
    setFlagCount(0);
    setTime(0);
    setGameOver(false);
    setHasWon(false);
  };

  const revealCell = (index: number) => {
    if (!isPlaying || gameOver || hasWon) return;
    if (grid[index].isFlagged || grid[index].isRevealed) return;

    const newGrid = [...grid];
    
    if (grid[index].isMine) {
      handleGameEnd(newGrid, false);
    } else {
      revealNeighbors(index, newGrid);
      setGrid(newGrid);

      const unrevealed = newGrid.filter(cell => !cell.isRevealed).length;
      const { mines } = DIFFICULTY_SETTINGS[difficulty!];
      if (unrevealed === mines) {
        handleGameEnd(newGrid, true);
      }
    }
  };

  const revealNeighbors = (idx: number, newGrid: Cell[]) => {
    const size = Math.sqrt(grid.length);
    const row = Math.floor(idx / size);
    const col = idx % size;

    if (
      row < 0 || row >= size ||
      col < 0 || col >= size ||
      newGrid[idx].isRevealed ||
      newGrid[idx].isFlagged
    ) return;

    newGrid[idx].isRevealed = true;

    if (newGrid[idx].neighborMines === 0) {
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          if (r === 0 && c === 0) continue;
          
          const newRow = row + r;
          const newCol = col + c;
          const newIndex = newRow * size + newCol;

          if (
            newRow >= 0 && newRow < size &&
            newCol >= 0 && newCol < size
          ) {
            revealNeighbors(newIndex, newGrid);
          }
        }
      }
    }
  };

  const handleMiddleClick = (index: number) => {
    if (!isPlaying || gameOver || hasWon) return;
    if (!grid[index].isRevealed || grid[index].neighborMines === 0) return;

    const size = Math.sqrt(grid.length);
    const row = Math.floor(index / size);
    const col = index % size;
    const newGrid = [...grid];

    let flagCount = 0;
    const cellsToReveal: number[] = [];

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        
        const newRow = row + r;
        const newCol = col + c;
        const newIndex = newRow * size + newCol;

        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size
        ) {
          if (grid[newIndex].isFlagged) {
            flagCount++;
          } else if (!grid[newIndex].isRevealed) {
            cellsToReveal.push(newIndex);
          }
        }
      }
    }

    if (flagCount === grid[index].neighborMines) {
      let hitMine = false;

      cellsToReveal.forEach(idx => {
        if (grid[idx].isMine && !grid[idx].isFlagged) {
          hitMine = true;
          handleGameEnd(newGrid, false);
        } else if (!grid[idx].isFlagged) {
          revealNeighbors(idx, newGrid);
        }
      });

      setGrid(newGrid);
      
      if (hitMine) {
        handleGameEnd(newGrid, false);
      } else {
        const unrevealed = newGrid.filter(cell => !cell.isRevealed).length;
        const { mines } = DIFFICULTY_SETTINGS[difficulty!];
        if (unrevealed === mines) {
          handleGameEnd(newGrid, true);
        }
      }
    }
  };

  const handleCellClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isPlaying || gameOver || hasWon) return;
    
    if (e.button === 2) {
      if (grid[index].isRevealed) return;

      const newGrid = [...grid];
      const { mines } = DIFFICULTY_SETTINGS[difficulty!];

      if (!grid[index].isFlagged && flagCount >= mines) return;

      newGrid[index].isFlagged = !newGrid[index].isFlagged;
      setGrid(newGrid);
      setFlagCount(prev => newGrid[index].isFlagged ? prev + 1 : prev - 1);
    } 
    else if (e.button === 0) {
      if (grid[index].isRevealed && grid[index].neighborMines > 0) {
        handleMiddleClick(index);
      } else if (!grid[index].isFlagged) {
        revealCell(index);
      }
    }
    else if (e.button === 1) {
      handleMiddleClick(index);
    }
  };

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    if (isPlaying) {
      document.addEventListener('contextmenu', preventDefault);
      return () => document.removeEventListener('contextmenu', preventDefault);
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const highlightNeighbors = (index: number, highlight: boolean) => {
    if (!grid[index].isRevealed || grid[index].neighborMines === 0) return;

    const size = Math.sqrt(grid.length);
    const row = Math.floor(index / size);
    const col = index % size;
    const newGrid = [...grid];

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        const newRow = row + r;
        const newCol = col + c;
        const newIndex = newRow * size + newCol;

        if (
          newRow >= 0 && newRow < size &&
          newCol >= 0 && newCol < size &&
          !newGrid[newIndex].isRevealed &&
          !newGrid[newIndex].isFlagged
        ) {
          newGrid[newIndex].isHighlighted = highlight;
        }
      }
    }
    setGrid(newGrid);
  };

  const handleGameEnd = (newGrid: Cell[], hasWon: boolean) => {
    const finalGrid = newGrid.map(cell => ({
      ...cell,
      isRevealed: true
    }));
    setGrid(finalGrid);
    setGameOver(!hasWon);
    setHasWon(hasWon);
    setShowEndPopup(false);

    gameEndTimeoutRef.current = setTimeout(() => {
      // Animate mines disappearing one by one with explosion effect
      const mineIndices = newGrid.map((cell, i) => cell.isMine ? i : -1).filter(i => i !== -1);
      const interval = 4000 / mineIndices.length; // Spread over 4 seconds
      
      mineIndices.forEach((mineIndex, i) => {
        setTimeout(() => {
          // First add explosion class
          setGrid(prev => prev.map((cell, j) => 
            j === mineIndex ? {...cell, isExploding: true} : cell
          ));

          // Then remove mine after a short delay
          setTimeout(() => {
            setGrid(prev => prev.map((cell, j) => 
              j === mineIndex ? {...cell, isMine: false, isExploding: false} : cell
            ));
          }, 300);
        }, i * interval);
      });

      // Show end popup after all animations complete
      setTimeout(() => {
        setShowEndPopup(true);
      }, 4000 + 500); // Add extra time for last explosion
    }, 1000); // Start animations after 1 second
  };

  useEffect(() => {
    return () => {
      if (gameEndTimeoutRef.current) {
        clearTimeout(gameEndTimeoutRef.current);
      }
    };
  }, []);

  const handleTouchStart = (index: number) => {
    if (!isPlaying || gameOver || hasWon) return;

    setTouchStartTime(Date.now());
    const timer = setTimeout(() => {
      if (!grid[index].isRevealed) {
        const newGrid = [...grid];
        const { mines } = DIFFICULTY_SETTINGS[difficulty!];

        if (!grid[index].isFlagged && flagCount >= mines) return;

        newGrid[index].isFlagged = !newGrid[index].isFlagged;
        setGrid(newGrid);
        setFlagCount(prev => newGrid[index].isFlagged ? prev + 1 : prev - 1);
      }
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = (index: number) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (Date.now() - touchStartTime < 500) {
      if (grid[index].isRevealed && grid[index].neighborMines > 0) {
        handleMiddleClick(index);
      } else if (!grid[index].isFlagged) {
        revealCell(index);
      }
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col p-2 overflow-hidden">
      {isPlaying && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
            {/* Game Grid */}
            <div className={`grid gap-0.5 ${
              difficulty === 'Easy' 
                ? 'grid-cols-8' 
                : difficulty === 'Medium'
                  ? 'grid-cols-12'
                  : 'grid-cols-16'
            }`}>
              {grid.map((cell, index) => (
                <button
                  key={cell.id}
                  onMouseDown={(e) => handleCellClick(index, e)}
                  onMouseEnter={() => cell.isRevealed && cell.neighborMines > 0 && highlightNeighbors(index, true)}
                  onMouseLeave={() => cell.isRevealed && cell.neighborMines > 0 && highlightNeighbors(index, false)}
                  onTouchStart={() => handleTouchStart(index)}
                  onTouchEnd={() => handleTouchEnd(index)}
                  onTouchMove={handleTouchMove}
                  className={`aspect-square ${
                    difficulty === 'Easy' 
                      ? 'w-9 md:w-11' 
                      : difficulty === 'Medium'
                        ? 'w-7 md:w-8' 
                        : 'w-5 md:w-6'
                  }
                  transform hover:scale-105 active:scale-95 transition-all duration-200
                  relative overflow-hidden border border-white/20
                  ${cell.isRevealed 
                    ? cell.isMine 
                      ? hasWon 
                        ? 'bg-green-500' 
                        : cell.isExploding
                          ? 'bg-yellow-400 animate-[explode_0.3s_ease-out]'
                          : 'bg-red-500' 
                      : 'bg-white/50'
                    : cell.isHighlighted
                      ? 'bg-white/30'
                      : 'bg-white/5 hover:bg-white/10'}`}
                  disabled={gameOver || hasWon}
                >
                  <div className="relative z-10 h-full flex items-center justify-center text-lg md:text-xl font-bold">
                    {cell.isRevealed ? (
                      cell.isMine ? '💣' : cell.neighborMines > 0 ? (
                        <span className={`
                          ${cell.neighborMines === 1 ? 'text-black/40' :
                            cell.neighborMines === 2 ? 'text-black/50' :
                            cell.neighborMines === 3 ? 'text-black/60' :
                            cell.neighborMines === 4 ? 'text-black/70' :
                            cell.neighborMines === 5 ? 'text-black/80' :
                            cell.neighborMines === 6 ? 'text-black/85' :
                            cell.neighborMines === 7 ? 'text-black/90' :
                            'text-black/95'}
                        `}>
                          {cell.neighborMines}
                        </span>
                      ) : ''
                    ) : cell.isFlagged ? (
                      <span className="transform scale-125">🚩</span>
                    ) : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 w-full max-w-md">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                  <span className="text-xl">💣</span>
                  <span className="text-lg font-bold text-yellow-300">
                    {difficulty ? DIFFICULTY_SETTINGS[difficulty].mines - flagCount : 0}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                  <span className="text-xl">🚩</span>
                  <span className="text-lg font-bold text-yellow-300">{flagCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                <span className="text-xl">⏱️</span>
                <span className="text-lg font-bold text-yellow-300">{formatTime(time)}</span>
              </div>
            </div>

            {/* Controls Info */}
            <div className="mt-1.5 flex justify-center">
              <div className="bg-black/20 rounded-full px-3 py-0.5 text-white/70 text-xs flex gap-2">
                <span className="hidden md:flex items-center gap-1">
                  <span>🖱️</span> Click
                </span>
                <span className="hidden md:flex items-center gap-1">
                  <span>👆</span> Flag
                </span>
                <span className="hidden md:flex items-center gap-1">
                  <span>💨</span> Quick
                </span>
                <span className="md:hidden flex items-center gap-1">
                  <span>👆</span> Tap
                </span>
                <span className="md:hidden flex items-center gap-1">
                  <span>✋</span> Hold
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-4">Minesweeper</h1>
            <p className="text-white/80 mb-4">Select difficulty:</p>
            <div className="flex gap-3">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => initializeGame(diff)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg font-bold
                  hover:bg-yellow-400 hover:text-black transform hover:scale-105 active:scale-95 
                  transition-all duration-300 shadow-lg"
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(gameOver || hasWon) && showEndPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">
              {hasWon ? 'Congratulations! 🎉' : 'Game Over! 💣'}
            </h1>
            <p className="text-white/80 mb-4">Time: {formatTime(time)}</p>
            <button
              onClick={() => initializeGame(difficulty!)}
              className="px-6 py-2 bg-yellow-400 text-black rounded-full font-bold
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
