'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 5;
const HEADER_HEIGHT = 88; // Height of the main site header

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Difficulty = 'EASY' | 'HARD' | null;

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(20);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPaused, setIsPaused] = useState(false);
  const [isTouchStart, setIsTouchStart] = useState<Position | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const router = useRouter();

  // Check if desktop on mount and window resize
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth > 640);
    };
    
    // Initial check
    checkIsDesktop();
    
    // Add resize listener
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Calculate cell size based on viewport
  useEffect(() => {
    const updateCellSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight - HEADER_HEIGHT;
      
      const containerWidth = Math.min(screenWidth * 0.95, screenHeight * 0.75);
      const gameAreaSize = containerWidth * 0.85;
      
      const newCellSize = Math.floor(gameAreaSize / GRID_SIZE);
      setCellSize(newCellSize);
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    generateFood();
    setIsPaused(false);
    setDifficulty(null);
  }, [generateFood]);

  const handleWallCollision = useCallback((head: Position): Position => {
    if (difficulty === 'EASY') {
      // Wrap around on walls
      return {
        x: (head.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + GRID_SIZE) % GRID_SIZE
      };
    }
    return head;
  }, [difficulty]);

  const checkCollision = useCallback((head: Position) => {
    if (difficulty === 'HARD') {
      // Wall collision only in hard mode
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        return true;
      }
    }

    // Self collision in both modes
    for (let i = 0; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }

    return false;
  }, [snake, difficulty]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !difficulty) return;

    const head = { ...snake[0] };
    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    // Handle wall wrapping or collision
    const adjustedHead = handleWallCollision(head);

    if (checkCollision(adjustedHead)) {
      setGameOver(true);
      return;
    }

    const newSnake = [adjustedHead, ...snake];

    if (adjustedHead.x === food.x && adjustedHead.y === food.y) {
      setScore(prev => prev + 1);
      setSpeed(prev => Math.max(prev - SPEED_INCREASE, 50));
      generateFood();
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food, gameOver, isPaused, difficulty, checkCollision, handleWallCollision, generateFood]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'p' || e.key === 'P') {
      setIsPaused(prev => !prev);
      return;
    }

    if (gameOver) {
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
    }
  }, [direction, gameOver, resetGame]);

  // Handle game touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only prevent default for the game canvas
    if (e.target instanceof HTMLCanvasElement) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    setIsTouchStart({
      x: touch.clientX,
      y: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Only prevent default for the game canvas
    if (e.target instanceof HTMLCanvasElement) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Only prevent default for the game canvas
    if (e.target instanceof HTMLCanvasElement) {
      e.preventDefault();
    }
    if (!isTouchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - isTouchStart.x;
    const deltaY = touch.clientY - isTouchStart.y;

    // Minimum swipe distance to trigger direction change
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0 && direction !== 'LEFT') {
          setDirection('RIGHT');
        } else if (deltaX < 0 && direction !== 'RIGHT') {
          setDirection('LEFT');
        }
      } else {
        if (deltaY > 0 && direction !== 'UP') {
          setDirection('DOWN');
        } else if (deltaY < 0 && direction !== 'DOWN') {
          setDirection('UP');
        }
      }
    }

    setIsTouchStart(null);
  }, [isTouchStart, direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with Nokia screen background
    ctx.fillStyle = '#c7f0d8';
    ctx.fillRect(0, 0, GRID_SIZE * cellSize, GRID_SIZE * cellSize);

    // Add LCD screen effect
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.fillStyle = '#d7f5e3';
        ctx.fillRect(
          i * cellSize + 1,
          j * cellSize + 1,
          1,
          1
        );
      }
    }

    // Draw snake with Nokia style
    snake.forEach((segment) => {
      ctx.fillStyle = '#243b21';
      ctx.fillRect(
        segment.x * cellSize,
        segment.y * cellSize,
        cellSize - 1,
        cellSize - 1
      );
    });

    // Draw food with Nokia style
    ctx.fillStyle = '#243b21';
    ctx.fillRect(
      food.x * cellSize,
      food.y * cellSize,
      cellSize - 1,
      cellSize - 1
    );

  }, [snake, food, direction, cellSize]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [moveSnake, speed]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="h-[calc(100dvh-88px)] w-screen bg-[#234323] flex flex-col items-center justify-center overflow-hidden">
      <div className="w-[95vw] max-w-[75vh] aspect-[3/4] relative">
        <div className="absolute inset-0 bg-[#30482f] rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] border-2 sm:border-4 border-[#2c422b]">
          <div className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-0.5 sm:h-1 bg-[#2c422b] rounded-full" />
          
          <div className="h-full flex flex-col bg-[#c7f0d8] rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] p-2">
            {/* Top Display */}
            <div className="flex flex-col font-['Nokia_Cellphone_FC'] text-[#243b21]">
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <div>SNAKE II</div>
                <div>{difficulty || 'SELECT MODE'}</div>
              </div>
              <div className="flex justify-center items-center text-xs sm:text-sm font-bold mt-1">
                SCORE: {score.toString().padStart(4, '0')}
              </div>
            </div>

            <div className="relative flex-grow flex items-center justify-center mt-2">
              <div 
                className="relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <canvas
                  ref={canvasRef}
                  width={GRID_SIZE * cellSize}
                  height={GRID_SIZE * cellSize}
                  className="border border-[#243b21] sm:border-2 rounded touch-none"
                />
              </div>

              {(!difficulty || gameOver) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[#c7f0d8] p-3 rounded border-2 border-[#243b21] text-center font-['Nokia_Cellphone_FC']">
                    {gameOver ? (
                      <>
                        <p className="text-[#243b21] text-sm mb-2">GAME OVER</p>
                        <p className="text-[#243b21] text-xs mb-3">FINAL SCORE</p>
                        <p className="text-[#243b21] text-lg mb-3">{score.toString().padStart(4, '0')}</p>
                        <button
                          onClick={resetGame}
                          className="px-4 py-1.5 bg-[#2c422b] text-[#c7f0d8] text-xs rounded-full hover:bg-[#243b21] transition"
                        >
                          NEW GAME
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-[#243b21] text-sm mb-3">SELECT MODE</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setDifficulty('EASY')}
                            className="px-4 py-1.5 bg-[#2c422b] text-[#c7f0d8] text-xs rounded-full hover:bg-[#243b21] transition"
                          >
                            EASY MODE
                          </button>
                          <button
                            onClick={() => setDifficulty('HARD')}
                            className="px-4 py-1.5 bg-[#2c422b] text-[#c7f0d8] text-xs rounded-full hover:bg-[#243b21] transition"
                          >
                            HARD MODE
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-center items-center font-['Nokia_Cellphone_FC'] text-[#243b21] text-[10px] sm:text-xs mt-1">
              <div>{isDesktop ? 'ARROWS:MOVE' : 'SWIPE:MOVE'}</div>
            </div>
          </div>

          {/* Nokia-style buttons */}
          <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-1.5 bg-[#2c422b] text-[#c7f0d8] text-[10px] sm:text-xs rounded-full hover:bg-[#243b21] transition shadow active:translate-y-[1px] font-['Nokia_Cellphone_FC']"
            >
              MENU
            </button>
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="px-4 py-1.5 bg-[#2c422b] text-[#c7f0d8] text-[10px] sm:text-xs rounded-full hover:bg-[#243b21] transition shadow active:translate-y-[1px] font-['Nokia_Cellphone_FC']"
            >
              {isPaused ? 'PLAY' : 'PAUSE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
