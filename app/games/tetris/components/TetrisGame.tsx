'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINOES,
  createEmptyBoard,
  getRandomTetrominoKey,
  INITIAL_DROP_SPEED,
  SCORE_PER_LINE,
  LEVEL_UP_LINES,
  SPEED_INCREASE_FACTOR,
  GHOST_PIECE_OPACITY,
  TetrominoKey,
  Board,
  PlayerPiece,
  CellValue,
} from '../lib/constants';
import { checkCollision, rotateMatrix } from '../lib/utils'; // We'll create this file next
import NextPiecePreview from './NextPiecePreview'; // Import the new component
import HoldPiecePreview from './HoldPiecePreview'; // Import Hold component

// --- Tailwind Color Mapping ---
// Add this explicit mapping to ensure Tailwind generates the classes
const colorMap: Record<string, { bg: string; border: string }> = {
    orange: { bg: 'bg-orange-500', border: 'border-orange-400' },
    fuchsia: { bg: 'bg-fuchsia-500', border: 'border-fuchsia-400' },
    indigo: { bg: 'bg-indigo-500', border: 'border-indigo-400' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-400' },
    lime: { bg: 'bg-lime-500', border: 'border-lime-400' },
    green: { bg: 'bg-green-500', border: 'border-green-400' },
    teal: { bg: 'bg-teal-500', border: 'border-teal-400' },
    // Add a default/fallback if needed, though pieceInfo check should handle it
    default: { bg: 'bg-gray-500', border: 'border-gray-600' },
};

interface TetrisGameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onGameOver: (score: number) => void; // Callback when game ends
}

// Define soft drop speed
const SOFT_DROP_SPEED = 50; // Milliseconds for soft drop interval
// Define DAS constants
const DAS_DELAY = 160; // Milliseconds before auto-repeat starts
const DAS_INTERVAL = 50; // Milliseconds between auto-repeat movements

const TetrisGame: React.FC<TetrisGameProps> = ({ difficulty, onGameOver }) => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [player, setPlayer] = useState<PlayerPiece>(() => {
    const initialKey = getRandomTetrominoKey();
    return {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 }, // Start slightly left
      tetromino: TETROMINOES[initialKey].shape,
      key: initialKey,
      collided: false,
    };
  });
  const [nextPieceKey, setNextPieceKey] = useState<TetrominoKey>(getRandomTetrominoKey());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0); // Track total lines for level up
  const [gameOver, setGameOver] = useState(false);
  const [dropSpeed, setDropSpeed] = useState(INITIAL_DROP_SPEED[difficulty]);
  const [isSoftDropping, setIsSoftDropping] = useState(false);
  const [heldPieceKey, setHeldPieceKey] = useState<TetrominoKey | null>(null);
  const [canHold, setCanHold] = useState(true);

  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  // Refs for DAS (Delayed Auto Shift)
  const heldDirectionRef = useRef<'left' | 'right' | null>(null);
  const dasDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dasIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Game Logic Helpers ---

  // Helper to find which lines are full
  const findClearedLines = (targetBoard: Board): { clearedRowIndices: number[]; linesRemoved: number } => {
      const clearedRowIndices: number[] = [];
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
          // Check if the row contains any empty cells (0)
          if (!targetBoard[y].some(cell => cell === 0)) {
              // Full line found!
              clearedRowIndices.push(y);
          }
      }
      return { clearedRowIndices, linesRemoved: clearedRowIndices.length };
  };

   // Helper to create a new board with specified rows removed and empty rows added at top
  const removeRowsAndAddEmpty = (targetBoard: Board, indicesToRemove: number[]): Board => {
      const boardWithoutClearedLines: Board = targetBoard.filter((_, y) => !indicesToRemove.includes(y));

      const clearedBoard: Board = [];
      // Add empty rows at the top for each line cleared
      for (let i = 0; i < indicesToRemove.length; i++) {
          clearedBoard.push(Array(BOARD_WIDTH).fill(0));
      }
      // Add the remaining rows below the new empty rows
      clearedBoard.push(...boardWithoutClearedLines);
      return clearedBoard;
  };

  // --- Game Logic Functions ---

  const resetPlayer = useCallback((keyToUse?: TetrominoKey) => {
    const newKey = keyToUse || nextPieceKey;
    const newPieceShape = TETROMINOES[newKey].shape;
    const newPiece = {
      pos: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newPieceShape[0].length / 2), y: 0 },
      tetromino: newPieceShape,
      key: newKey,
      collided: false,
    };

    if (checkCollision(newPiece, board, { x: 0, y: 0 })) {
      setGameOver(true);
      console.log("GAME OVER");
    } else {
      setPlayer(newPiece);
      // Only advance next piece if we didn't explicitly use a key (i.e., from hold)
      if (!keyToUse) {
          setNextPieceKey(getRandomTetrominoKey());
      }
    }
  }, [nextPieceKey, board]);

  const mergePieceToBoard = useCallback((playerPiece: PlayerPiece) => {
    const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy
    playerPiece.tetromino.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          const boardY = playerPiece.pos.y + y;
          const boardX = playerPiece.pos.x + x;
          // Ensure we don't write outside bounds (shouldn't happen if collision works)
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
             newBoard[boardY][boardX] = playerPiece.key;
          }
        }
      });
    });
    return newBoard;
  }, [board]);

  // --- Player Action Functions ---

  const movePlayer = (dx: number) => {
    if (gameOver) return;
    if (!checkCollision(player, board, { x: dx, y: 0 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { x: prev.pos.x + dx, y: prev.pos.y },
      }));
    }
  };

  const rotatePlayer = () => {
    if (gameOver) return;
    const rotatedTetromino = rotateMatrix(player.tetromino);
    const currentPos = player.pos;
    let offset = 1; // Offset for wall kick checks

    const testPiece: PlayerPiece = {
        ...player,
        tetromino: rotatedTetromino,
    };

    // Check collision at current position and try wall kicks
    const collisionCheckPos = { x: 0, y: 0 };
    while (checkCollision(testPiece, board, collisionCheckPos)) {
        testPiece.pos.x = currentPos.x + offset;
        // Alternate offset direction (-1, 2, -2, etc.)
        offset = -(offset + (offset > 0 ? 1 : -1));
        // If offset becomes too large, rotation is impossible
        // Basic check: if offset magnitude exceeds piece width/height (approx)
        if (Math.abs(offset) > Math.max(rotatedTetromino[0].length, rotatedTetromino.length)) {
            console.log("Rotation failed after wall kicks");
            return; // Cannot rotate
        }
         // No need to update testPiece.pos here, checkCollision uses testPiece's internal pos
         // collisionCheckPos remains {x: 0, y: 0} relative to the testPiece.pos
    }

    // If we are here, a valid position (original or after kick) was found
    setPlayer(testPiece); // Update player with rotated piece and potentially new position
  };

  const dropPlayer = () => {
    if (gameOver) return;
    // Move down one step if no collision, otherwise trigger landing logic
    if (!checkCollision(player, board, { x: 0, y: 1 })) {
      setPlayer(prev => ({
        ...prev,
        pos: { ...prev.pos, y: prev.pos.y + 1 },
      }));
      // Return true if moved, false if collided (useful for immediate drop feedback)
      return true;
    } else {
      // Piece landed - trigger the landing sequence immediately
      handlePieceLanding();
      return false;
    }
  };

  const hardDrop = () => {
      if (gameOver) return;
      let lowestY = player.pos.y;
      // Calculate the lowest possible position directly
      while (!checkCollision(player, board, { x: 0, y: lowestY - player.pos.y + 1 })) {
          lowestY++;
      }
      const finalY = lowestY; // Capture the final Y before setState

      // Set player to the lowest position and trigger landing via callback
       setPlayer(prev => ({
         ...prev,
         pos: { ...prev.pos, y: finalY }, // Use finalY captured before async setState
       }));
       // Trigger landing immediately after setting state conceptually.
       // The visual update might lag slightly, but logic proceeds.
       handlePieceLanding(); 
  };

  // Function to handle holding a piece
  const handleHold = () => {
    if (gameOver || !canHold) return;

    const currentPieceKey = player.key;

    if (heldPieceKey === null) {
        // Holding for the first time or after using held piece
        setHeldPieceKey(currentPieceKey);
        resetPlayer(); // Resets with the next piece from queue
    } else {
        // Swapping current piece with held piece
        const previouslyHeldKey = heldPieceKey;
        setHeldPieceKey(currentPieceKey);
        resetPlayer(previouslyHeldKey); // Resets player with the previously held piece
    }

    setCanHold(false); // Can only hold once per piece placement
  };

  // Extracted landing logic into its own function for reuse (e.g., in hardDrop)
  const handlePieceLanding = useCallback(() => {
    // Check again for safety
    if (gameOver) return;

    // 1. Merge the landed piece onto the board temporarily
    const boardAfterMerge = mergePieceToBoard(player);

    // 2. Find cleared lines
    const { clearedRowIndices, linesRemoved } = findClearedLines(boardAfterMerge);

    let finalBoard = boardAfterMerge;

    // Pause the game loop BEFORE state updates that might restart it too soon
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);

    if (linesRemoved > 0) {
        // --- Calculate new state directly --- 
        finalBoard = removeRowsAndAddEmpty(boardAfterMerge, clearedRowIndices);

        // Update score/level immediately
        setScore(prev => prev + SCORE_PER_LINE[linesRemoved] * level);
        const newTotalLines = linesClearedTotal + linesRemoved;
        setLinesClearedTotal(newTotalLines);
        const newLevel = Math.floor(newTotalLines / LEVEL_UP_LINES) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
            const newSpeed = Math.max(100, dropSpeed * SPEED_INCREASE_FACTOR);
            setDropSpeed(newSpeed); // This state change will trigger useEffect to restart interval with new speed
        }
    }
    // Else (no lines cleared), finalBoard remains boardAfterMerge

    // 3. Update the board state
    setBoard(finalBoard);

    // 4. Reset player for the next piece & allow holding
    resetPlayer();
    setCanHold(true);

    // 5. Restart game interval AFTER state updates, if not game over
    // Use timeout 0 to queue restart after current execution context
    setTimeout(() => {
         // Check gameOver *after* resetPlayer potentially sets it
         if (!gameOver) {
            const currentIntervalSpeed = isSoftDropping ? SOFT_DROP_SPEED : dropSpeed;
            gameIntervalRef.current = setInterval(dropPlayer, currentIntervalSpeed);
        }
    }, 0);

  }, [
    // Dependencies
    player, board, gameOver, mergePieceToBoard, resetPlayer, level, linesClearedTotal,
    dropSpeed, setDropSpeed, isSoftDropping, dropPlayer, canHold
  ]);

  // --- Game Loop Callback ---
  const drop = useCallback(() => {
    dropPlayer();
  }, [dropPlayer]);

  // --- Effects ---

  // Game loop timer
  useEffect(() => {
    if (gameOver) {
        if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
        onGameOver(score); // Notify parent component
        return;
    }

    boardRef.current?.focus();

    // Determine the interval speed
    const currentIntervalSpeed = isSoftDropping ? SOFT_DROP_SPEED : dropSpeed;

    // Clear any existing interval before starting a new one
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    gameIntervalRef.current = setInterval(drop, currentIntervalSpeed);
    // console.log(`Interval set with speed: ${currentIntervalSpeed}`);

    // Cleanup function
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      // console.log("Interval cleared");
    };
  // Re-run when drop speed changes, game starts/ends, OR when soft drop state changes
  }, [drop, dropSpeed, gameOver, onGameOver, score, isSoftDropping]);

  // Effect for Keyboard Input
  useEffect(() => {
    // Function to clear DAS timers
    const clearDasTimers = () => {
        if (dasDelayTimeoutRef.current) clearTimeout(dasDelayTimeoutRef.current);
        if (dasIntervalRef.current) clearInterval(dasIntervalRef.current);
        dasDelayTimeoutRef.current = null;
        dasIntervalRef.current = null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver) return;

      // Handle DAS for Left/Right keys
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        if (heldDirectionRef.current !== 'left') { // Only trigger on initial press
            heldDirectionRef.current = 'left';
            clearDasTimers();
            movePlayer(-1); // Initial move
            // Start delay timer
            dasDelayTimeoutRef.current = setTimeout(() => {
                movePlayer(-1); // Move again when interval starts
                // Start repeat interval
                dasIntervalRef.current = setInterval(() => {
                    movePlayer(-1);
                }, DAS_INTERVAL);
            }, DAS_DELAY);
        }
        event.preventDefault();
        return; // Don't process other cases if DAS handled
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
         if (heldDirectionRef.current !== 'right') {
            heldDirectionRef.current = 'right';
            clearDasTimers();
            movePlayer(1);
            dasDelayTimeoutRef.current = setTimeout(() => {
                 movePlayer(1);
                 dasIntervalRef.current = setInterval(() => {
                    movePlayer(1);
                }, DAS_INTERVAL);
            }, DAS_DELAY);
         }
         event.preventDefault();
         return;
      }

      // Handle other keys (only if not repeating)
      if (event.repeat) return;

      switch (event.key) {
        // Left/Right handled above by DAS logic
        case 'ArrowDown':
        case 's':
          if (!isSoftDropping) {
            setIsSoftDropping(true);
          }
          event.preventDefault();
          break;
        case 'ArrowUp':
        case 'w':
        case 'x':
        case 'z':
          rotatePlayer();
          event.preventDefault();
          break;
        case ' ':
          rotatePlayer();
          event.preventDefault();
          break;
        case 'c': // Hold key
        case 'Shift': // Hold key (alternative)
            handleHold();
            event.preventDefault();
            break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (gameOver) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
             if (heldDirectionRef.current === 'left') {
                heldDirectionRef.current = null;
                clearDasTimers();
             }
             break;
        case 'ArrowRight':
        case 'd':
            if (heldDirectionRef.current === 'right') {
                heldDirectionRef.current = null;
                clearDasTimers();
            }
            break;
        case 'ArrowDown':
        case 's':
          setIsSoftDropping(false);
          break;
        default:
          break;
      }
    };

    const gameElement = boardRef.current;
    if (gameElement) {
      gameElement.addEventListener('keydown', handleKeyDown);
      gameElement.addEventListener('keyup', handleKeyUp);
    }

    // Cleanup: Ensure timers are cleared on unmount
    return () => {
      clearDasTimers();
      if (gameElement) {
        gameElement.removeEventListener('keydown', handleKeyDown);
        gameElement.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [gameOver, movePlayer, rotatePlayer, dropPlayer, hardDrop, isSoftDropping, handleHold]); // Add handleHold to dependencies

  // --- Touch Event Handlers ---
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (gameOver || event.touches.length !== 1) return; // Ignore multi-touch
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
    touchStartTime.current = Date.now();
    event.preventDefault(); // Prevent default browser behaviors like scrolling
  }, [gameOver]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
     // Prevent scrolling while dragging on the game board
     event.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (gameOver || touchStartX.current === null || touchStartY.current === null || touchStartTime.current === null || event.changedTouches.length !== 1) {
        // Reset touch tracking if invalid state
        touchStartX.current = null;
        touchStartY.current = null;
        touchStartTime.current = null;
        return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    const deltaTime = touchEndTime - touchStartTime.current;

    const thresholdTime = 300; // ms - max time for a swipe/tap gesture
    const thresholdDist = 30; // Reduced for better mobile responsiveness (was 50)
    const thresholdTapDist = 15; // Reduced for better mobile responsiveness (was 20)
    const hardDropThreshold = 150; // ms - fast swipe down for hard drop

    if (deltaTime < thresholdTime) {
        // Check for dominant axis movement
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Primarily Horizontal Movement
            if (Math.abs(deltaX) > thresholdDist) {
                if (deltaX > 0) {
                    console.log("Swipe Right");
                    movePlayer(1);
                } else {
                    console.log("Swipe Left");
                    movePlayer(-1);
                }
            }
        } else {
            // Primarily Vertical Movement
            if (Math.abs(deltaY) > thresholdDist) {
                if (deltaY > 0) {
                    // Downward Swipe
                    if (deltaTime < hardDropThreshold && Math.abs(deltaY) > thresholdDist * 2) {
                        console.log("Hard Drop");
                        hardDrop(); // Fast/long swipe down triggers hard drop
                    } else {
                        console.log("Soft Drop");
                        dropPlayer(); // Normal swipe for soft drop
                    }
                } else {
                    // Upward Swipe (rotate)
                    console.log("Swipe Up (Rotate)");
                    rotatePlayer();
                }
            } else if (Math.abs(deltaX) < thresholdTapDist && Math.abs(deltaY) < thresholdTapDist) {
                // Tap (consider it a rotation)
                console.log("Tap (Rotate)");
                rotatePlayer();
            }
        }
    }
    // Double tap for hold piece (mobile-friendly gesture)
    else if (deltaTime < 500 && Math.abs(deltaX) < thresholdTapDist && Math.abs(deltaY) < thresholdTapDist) {
        console.log("Double Tap (Hold Piece)");
        handleHold();
    }

    // Reset touch tracking
    touchStartX.current = null;
    touchStartY.current = null;
    touchStartTime.current = null;

  }, [gameOver, movePlayer, dropPlayer, rotatePlayer, hardDrop, handleHold]);

  // --- Rendering ---
  const renderBoard = () => {
    // Combine static board and current player piece for rendering
    const displayBoard = JSON.parse(JSON.stringify(board)); // Deep copy

    // Calculate Ghost Piece position
    let ghostY = player.pos.y;
    while (!checkCollision(player, board, { x: 0, y: ghostY - player.pos.y + 1 })) {
      ghostY++;
    }
    // Define ghostPos type if Position is not imported or defined
    const ghostPos: { x: number; y: number } = { x: player.pos.x, y: ghostY };

    // Draw Ghost Piece first (so player piece draws over it)
    player.tetromino.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          const boardY = ghostPos.y + y;
          const boardX = ghostPos.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            // Make sure ghost doesn't overwrite existing pieces or current player piece pos
            if (displayBoard[boardY][boardX] === 0) {
               // Use a special key or modifier to indicate ghost
               displayBoard[boardY][boardX] = `GHOST_${player.key}`;
            }
          }
        }
      });
    });

    // Draw player piece (overwrites ghost cells at its current position)
    player.tetromino.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          const boardY = player.pos.y + y;
          const boardX = player.pos.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            // Ensure we don't overwrite already landed pieces visually before merge,
            // but DO overwrite ghost pieces
            if (displayBoard[boardY][boardX] === 0 || (displayBoard[boardY][boardX] as string).startsWith('GHOST_')) {
                 displayBoard[boardY][boardX] = player.key;
            }
          }
        }
      });
    });

    return displayBoard.map((row: CellValue[] | string[], y: number) =>
      row.map((cell, x) => {
        let colorKey = cell as TetrominoKey;
        let isGhost = false;

        if (typeof cell === 'string' && cell.startsWith('GHOST_')) {
            isGhost = true;
            colorKey = cell.substring(6) as TetrominoKey;
        }

        // --- Styling Logic ---
        let classNames = 'w-full h-full border rounded-sm ';
        let styles = {};

        if (cell === 0) {
            // Empty cell style
            classNames += 'bg-black border-gray-900 ';
        } else {
            // Filled cell style (normal or ghost)
            const pieceInfo = TETROMINOES[colorKey];
            // Use the color map to get the full class names
            const colorClasses = pieceInfo ? colorMap[pieceInfo.color] : colorMap.default;
            const color = colorClasses.bg;
            const borderColor = colorClasses.border;
            // console.log(colorKey, " ",pieceInfo, " ", color, " ", borderColor); // Keep for debugging if needed
            classNames += `${color} ${borderColor} `;
            if (isGhost) {
                styles = { opacity: GHOST_PIECE_OPACITY };
            }
        }

        return (
          <div
            key={`${y}-${x}`}
            className={classNames.trim()}
            style={styles}
          />
        );
      })
    );
  };

  // --- Component Return (JSX) ---
  return (
    <>
      {/* Desktop-optimized container with top margin for header */}
      <div
        ref={boardRef}
        className="relative flex flex-row items-start justify-center p-2 sm:p-4 rounded-lg outline-none gap-4 sm:gap-8 w-full max-w-max mx-auto select-none hidden md:flex mt-16"
        tabIndex={0}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Left Side Panel */}
        <div className="flex flex-col gap-3 sm:gap-4 text-white w-24 sm:w-32 text-center">
          {/* Hold Piece Preview */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 sm:p-2 border border-white/20">
            <h4 className="text-xs sm:text-sm font-semibold mb-1 text-white/80 text-center">HOLD</h4>
          </div>
          <HoldPiecePreview pieceKey={heldPieceKey} />
          
          {/* Apply Minesweeper HUD style */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/20">
            <h4 className="text-xs sm:text-sm font-semibold mb-1 text-white/80">SCORE</h4>
            <p className="text-base sm:text-xl font-bold break-words">{score}</p>
          </div>
          
          {/* Apply Minesweeper HUD style */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/20">
            <h4 className="text-xs sm:text-sm font-semibold mb-1 text-white/80">LEVEL</h4>
            <p className="text-base sm:text-xl font-bold">{level}</p>
          </div>
          
          {/* Apply Minesweeper HUD style */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/20">
            <h4 className="text-xs sm:text-sm font-semibold mb-1 text-white/80">LINES</h4>
            <p className="text-base sm:text-xl font-bold">{linesClearedTotal}</p>
          </div>
        </div>

        {/* Center: Game Board Container */}
        <div className="relative flex flex-col items-center" style={{ height: 'calc(100vh - 144px)', maxHeight: '800px' }}>
          <div className="grid gap-px border-4 border-gray-600 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
              aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
              width: 'auto',
              height: '100%',
              maxHeight: 'calc(100vh - 164px)',
              maxWidth: `calc((100vh - 164px) * (${BOARD_WIDTH} / ${BOARD_HEIGHT}))`,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}
          >
            {renderBoard()}
          </div>
        </div>

        {/* Right Side Panel */}
        <div className="flex flex-col gap-3 sm:gap-4 w-24 sm:w-32 items-center">
          {/* Apply Minesweeper HUD style */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 sm:p-2 border border-white/20">
            <h4 className="text-xs sm:text-sm font-semibold mb-1 text-white/80 text-center">NEXT</h4>
          </div>
          <NextPiecePreview pieceKey={nextPieceKey} />
          
          {/* Game Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-white/20 mt-4">
            <h4 className="text-xs sm:text-sm font-semibold mb-1 text-white/80 text-center">CONTROLS</h4>
            <div className="text-xs text-left">
              <p>←/→: Move</p>
              <p>↑/Space: Rotate</p>
              <p>↓: Soft Drop</p>
              <p>C/Shift: Hold</p>
            </div>
          </div>
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-red-500 mb-4 animate-pulse">Game Over!</h2>
            <p className="text-2xl text-white mb-6">Final Score: {score}</p>
          </div>
        )}
      </div>

      {/* Mobile Warning Message */}
      <div className="flex md:hidden flex-col items-center justify-center h-screen p-6 text-center bg-black/80 text-white mt-16">
        <h2 className="text-2xl font-bold mb-4">Desktop Only Game</h2>
        <p className="mb-6">Tetris is currently optimized for desktop play with keyboard controls.</p>
        <p className="text-sm">Please switch to a desktop device for the best experience.</p>
      </div>
    </>
  );
};

export default TetrisGame;
