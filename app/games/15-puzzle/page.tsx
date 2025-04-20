'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Difficulty = 'easy' | 'medium' | 'hard';
type Direction = 'up' | 'down' | 'left' | 'right';

export default function Puzzle15() {
  const [gridSize, setGridSize] = useState(4);
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [touchStart, setTouchStart] = useState<[number, number] | null>(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(true);

  const totalTiles = gridSize * gridSize;

  const selectDifficulty = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy':
        setGridSize(3);
        break;
      case 'medium':
        setGridSize(4);
        break;
      case 'hard':
        setGridSize(5);
        break;
    }
    setShowDifficultyModal(false);
    setShowWinAnimation(false);
    initializeGame();
  };

  useEffect(() => {
    if (!showDifficultyModal) {
      initializeGame();
    }
  }, [gridSize]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isComplete]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const initializeGame = () => {
    const numbers = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    const shuffled = shuffleArray([...numbers, 0]);
    setTiles(shuffled);
    setMoves(0);
    setTime(0);
    setIsComplete(false);
    setShowWinAnimation(false);
    setIsRunning(true);
  };

  const shuffleArray = (array: number[]) => {
    const newArray = [...array];
    let inversions = 0;
    
    do {
      // Fisher-Yates shuffle
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      
      // Count inversions (excluding the empty tile)
      inversions = 0;
      for (let i = 0; i < newArray.length; i++) {
        if (newArray[i] === 0) continue;
        for (let j = i + 1; j < newArray.length; j++) {
          if (newArray[j] === 0) continue;
          if (newArray[j] < newArray[i]) {
            inversions++;
          }
        }
      }
      
      // Get the row number of the empty tile (0) from bottom
      const emptyIndex = newArray.indexOf(0);
      const emptyRowFromBottom = gridSize - Math.floor(emptyIndex / gridSize);
      
      // For a 4x4 puzzle, the puzzle is solvable if:
      // - The number of inversions is even when the empty tile is on an odd row from bottom
      // - The number of inversions is odd when the empty tile is on an even row from bottom
      const isSolvable = (inversions % 2 === 0) === (emptyRowFromBottom % 2 === 1);
      
      if (isSolvable) {
        return newArray;
      }
    } while (true);
  };

  const handleTileClick = (index: number) => {
    if (isComplete) return;

    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    if (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    ) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(moves + 1);
      checkCompletion(newTiles);
    }
  };

  const checkCompletion = (currentTiles: number[]) => {
    const isSolved = currentTiles.every((tile, index) => {
      if (index === totalTiles - 1) return tile === 0;
      return tile === index + 1;
    });

    if (isSolved) {
      setShowWinAnimation(true);
      setTimeout(() => {
        setShowWinAnimation(false);
        setIsComplete(true);
      }, 5000);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart([e.touches[0].clientX, e.touches[0].clientY]);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || isComplete) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart[0];
    const deltaY = touch.clientY - touchStart[1];
    const minSwipeDistance = 50;

    const emptyIndex = tiles.indexOf(0);
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        // Horizontal swipe
        const targetCol = deltaX > 0 ? emptyCol - 1 : emptyCol + 1;
        if (targetCol >= 0 && targetCol < gridSize) {
          const targetIndex = emptyRow * gridSize + targetCol;
          handleTileClick(targetIndex);
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        // Vertical swipe
        const targetRow = deltaY > 0 ? emptyRow - 1 : emptyRow + 1;
        if (targetRow >= 0 && targetRow < gridSize) {
          const targetIndex = targetRow * gridSize + emptyCol;
          handleTileClick(targetIndex);
        }
      }
    }

    setTouchStart(null);
  };

  const moveTile = (direction: Direction) => {
    if (isComplete) return;

    const emptyIndex = tiles.indexOf(0);
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    let targetIndex = -1;

    switch (direction) {
      case 'up':
        if (emptyRow < gridSize - 1) {
          targetIndex = emptyIndex + gridSize;
        }
        break;
      case 'down':
        if (emptyRow > 0) {
          targetIndex = emptyIndex - gridSize;
        }
        break;
      case 'left':
        if (emptyCol < gridSize - 1) {
          targetIndex = emptyIndex + 1;
        }
        break;
      case 'right':
        if (emptyCol > 0) {
          targetIndex = emptyIndex - 1;
        }
        break;
    }

    if (targetIndex !== -1) {
      handleTileClick(targetIndex);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isComplete) return;
      
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
        moveTile(direction);
      }
    };

    const handleScroll = (event: Event) => {
      if (!isComplete && !showDifficultyModal) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('touchmove', handleScroll, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [tiles, isComplete, showDifficultyModal]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <AnimatePresence>
        {showDifficultyModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-xl p-8 max-w-md w-full"
            >
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                Select Difficulty
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => selectDifficulty('easy')}
                  className="w-full py-4 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-colors"
                >
                  Easy (3x3)
                </button>
                <button
                  onClick={() => selectDifficulty('medium')}
                  className="w-full py-4 bg-yellow-500 text-white rounded-lg text-xl font-bold hover:bg-yellow-600 transition-colors"
                >
                  Medium (4x4)
                </button>
                <button
                  onClick={() => selectDifficulty('hard')}
                  className="w-full py-4 bg-red-500 text-white rounded-lg text-xl font-bold hover:bg-red-600 transition-colors"
                >
                  Hard (5x5)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-xl p-8 max-w-md w-full"
            >
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                Congratulations!
              </h2>
              <div className="space-y-4 text-center">
                <p className="text-xl text-gray-700">
                  You completed the puzzle in {moves} moves!
                </p>
                <p className="text-xl text-gray-700">
                  Time: {formatTime(time)}
                </p>
                <button
                  onClick={() => {
                    setShowWinAnimation(false);
                    setIsComplete(false);
                    setShowDifficultyModal(true);
                    setTiles([]);
                  }}
                  className="w-full py-4 bg-purple-600 text-white rounded-lg text-xl font-bold hover:bg-purple-500 transition-colors"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-4xl font-bold text-white mb-8">15 Puzzle</h1>

      <div 
        className={`grid gap-2 bg-white/10 p-4 rounded-lg mb-8 relative`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 4rem)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tiles.map((tile, index) => (
          <motion.button
            key={index}
            className={`w-16 h-16 flex items-center justify-center text-xl font-bold rounded-lg ${
              tile === 0
                ? 'bg-transparent'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
            onClick={() => handleTileClick(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={showWinAnimation ? {
              scale: [1, 1.08, 1],
              y: [0, -5, 0],
              transition: {
                duration: 1.2,
                repeat: 4,
                ease: "easeInOut"
              }
            } : {}}
          >
            {tile !== 0 && tile}
          </motion.button>
        ))}
        {showWinAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: 2,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 rounded-lg"
          />
        )}
      </div>

      <div className="flex justify-center gap-8 text-xl text-purple-200 mb-8">
        <p>Moves: {moves}</p>
        <p>Time: {formatTime(time)}</p>
      </div>
    </div>
  );
} 
