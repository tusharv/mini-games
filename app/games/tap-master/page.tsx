'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export default function TapMaster() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [highScore, setHighScore] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [targetSize, setTargetSize] = useState(100);
  const [combo, setCombo] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; size: number }>>([]);
  const [showMissFeedback, setShowMissFeedback] = useState(false);
  const [showHitFeedback, setShowHitFeedback] = useState(false);
  const [showTargetArea, setShowTargetArea] = useState(false);
  const [targetColor, setTargetColor] = useState('yellow');
  const [gameMode, setGameMode] = useState<'follow' | 'blink'>('follow');
  const [isTargetVisible, setIsTargetVisible] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const timeLeftRef = useRef(timeLeft);

  const hitMessages = [
    "Great!",
    "Awesome!",
    "Perfect!",
    "Excellent!",
    "Amazing!",
    "Incredible!",
    "Fantastic!",
    "Superb!",
    "Outstanding!",
    "Brilliant!",
    "Go, go, go!",
    "You're on fire!",
    "Keep it up!",
    "Unstoppable!",
    "Legendary!"
  ];

  const missMessages = [
    "Oh!",
    "Snap!",
    "Just missed!",
    "Almost!",
    "Close!",
    "Try again!",
    "Next time!",
    "Keep trying!",
    "Don't give up!",
    "You got this!"
  ];

  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomColor = () => {
    const colors = ['yellow', 'blue', 'green', 'purple', 'pink'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400';
      case 'green':
        return 'from-green-400 to-green-500 hover:from-green-300 hover:to-green-400';
      case 'purple':
        return 'from-purple-400 to-purple-500 hover:from-purple-300 hover:to-purple-400';
      case 'pink':
        return 'from-pink-400 to-pink-500 hover:from-pink-300 hover:to-pink-400';
      default:
        return 'from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400';
    }
  };

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsPlaying(false);
            if (score > highScore) {
              setHighScore(score);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, score, highScore]);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getComboTimeWindow = () => {
    return isMobile ? 1000 : 1500;
  };

  const moveTarget = useCallback(() => {
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;
    const baseSize = Math.max(30, 100 - combo * 5);
    const sizeVariation = Math.random() * 20 - 10;
    
    setTrail(prevTrail => [
      { x: targetPosition.x, y: targetPosition.y, size: targetSize },
      ...prevTrail.slice(0, 4)
    ]);
    setTargetPosition({ x, y });
    setTargetSize(baseSize + sizeVariation);
    setTargetColor(getRandomColor());
    
    if (gameMode === 'blink') {
      setIsTargetVisible(true);
      setTimeout(() => {
        if (isPlaying) {
          setIsTargetVisible(false);
          setTimeout(() => {
            if (isPlaying && !isTargetVisible) {
              moveTarget();
            }
          }, 3000);
        }
      }, 1000);
    }
  }, [combo, targetPosition, targetSize, gameMode, isPlaying]);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(20);
    setCombo(0);
    setTrail([]);
    setTargetColor('yellow');
    setIsTargetVisible(true);
    setShowTargetArea(false);
    setShowHitFeedback(false);
    setShowMissFeedback(false);
    moveTarget();
  };

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlaying) return;

    const now = Date.now();
    const timeDiff = now - lastClickTime;
    const comboTimeWindow = getComboTimeWindow();
    
    if (timeDiff < comboTimeWindow) {
      setCombo(prev => Math.min(prev + 1, 10));
    } else {
      setCombo(0);
    }

    setLastClickTime(now);
    setScore(prev => prev + (1 + combo));
    setFeedbackMessage(getRandomMessage(hitMessages));
    setShowHitFeedback(true);
    
    if (gameMode === 'blink') {
      setShowTargetArea(true);
      setTimeout(() => {
        setShowHitFeedback(false);
        setShowTargetArea(false);
        moveTarget();
      }, 500);
    } else {
      setTimeout(() => {
        setShowHitFeedback(false);
        moveTarget();
      }, 500);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isPlaying) return;
    
    if (gameMode === 'blink' && !isTargetVisible) {
      const clickX = (e.nativeEvent.offsetX / e.currentTarget.clientWidth) * 100;
      const clickY = (e.nativeEvent.offsetY / e.currentTarget.clientHeight) * 100;
      
      const distance = Math.sqrt(
        Math.pow(clickX - targetPosition.x, 2) + 
        Math.pow(clickY - targetPosition.y, 2)
      );
      
      setShowTargetArea(true);
      setTimeout(() => setShowTargetArea(false), 500);
      
      if (distance < 25) {
        handleTargetClick(e);
      } else {
        setCombo(0);
        setShowMissFeedback(true);
        setFeedbackMessage(getRandomMessage(missMessages));
        setTimeout(() => {
          setShowMissFeedback(false);
          moveTarget();
        }, 500);
      }
    } else if (gameMode === 'follow' && e.target === e.currentTarget) {
      setCombo(0);
      setShowMissFeedback(true);
      setFeedbackMessage(getRandomMessage(missMessages));
      setTimeout(() => setShowMissFeedback(false), 500);
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-black">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white text-center">Tap Master</h1>
      </div>

      <div 
        className="flex-1 bg-white/10 backdrop-blur-md rounded-lg relative overflow-hidden"
        onClick={handleContainerClick}
      >
        {isPlaying && (
          <>
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 
            bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white">
              <span className="font-bold">Combo:</span> <span className="text-yellow-300">x{combo + 1}</span>
            </div>

            {showMissFeedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-red-500 text-4xl font-bold animate-ping">
                  {feedbackMessage}
                </div>
              </div>
            )}

            {showHitFeedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-green-500 text-4xl font-bold animate-ping">
                  {feedbackMessage}
                </div>
              </div>
            )}

            {showTargetArea && (
              <div
                style={{
                  position: 'absolute',
                  left: `${targetPosition.x}%`,
                  top: `${targetPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${targetSize + 50}px`,
                  height: `${targetSize + 50}px`,
                }}
                className="rounded-full bg-yellow-400/20 animate-pulse pointer-events-none"
              />
            )}

            {trail.map((pos, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${pos.size}px`,
                  height: `${pos.size}px`,
                  opacity: (5 - index) * 0.15,
                }}
                className="rounded-full bg-yellow-400/30 pointer-events-none"
              />
            ))}

            <button
              onClick={handleTargetClick}
              onKeyDown={(e) => e.preventDefault()}
              tabIndex={-1}
              style={{
                position: 'absolute',
                left: `${targetPosition.x}%`,
                top: `${targetPosition.y}%`,
                transform: 'translate(-50%, -50%)',
                width: `${targetSize}px`,
                height: `${targetSize}px`,
                opacity: isTargetVisible ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                pointerEvents: isTargetVisible ? 'auto' : 'none',
              }}
              className={`rounded-full bg-gradient-to-br ${getColorClasses(targetColor)}
              transform hover:scale-105 active:scale-95 transition-all duration-200 
              shadow-lg hover:shadow-xl group overflow-hidden focus:outline-none focus:ring-0`}
            >
              <div className="absolute inset-0 bg-white/20 transform rotate-45 translate-x-full 
              group-hover:translate-x-0 transition-transform duration-300" />
              <div className="relative z-10 h-full flex items-center justify-center text-2xl">
                🎯
              </div>
            </button>
          </>
        )}
      </div>

      {/* Game Stats Bar at bottom */}
      <div className="bg-white/10 backdrop-blur-md p-4 mt-4 rounded-lg flex justify-between items-center">
        <div className="text-white">
          <span className="font-bold">Score:</span> <span className="text-yellow-300">{score}</span>
        </div>
        <div className="text-white">
          <span className="font-bold">Time:</span> <span className="text-yellow-300">{timeLeft}s</span>
        </div>
        <div className="text-white">
          <span className="font-bold">High Score:</span> <span className="text-yellow-300">{highScore}</span>
        </div>
      </div>

      {/* Start Game Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl 
          transform hover:scale-105 transition-all duration-300">
            <h1 className="text-4xl font-bold text-white mb-4">Tap Master</h1>
            <p className="text-white/80 mb-2">Choose your game mode:</p>
            <div className="flex gap-4 justify-center mb-6">
              <button
                onClick={() => setGameMode('follow')}
                className={`px-6 py-3 rounded-full font-bold transition-all duration-300
                  ${gameMode === 'follow' 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                Follow Mode
              </button>
              <button
                onClick={() => setGameMode('blink')}
                className={`px-6 py-3 rounded-full font-bold transition-all duration-300
                  ${gameMode === 'blink' 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                Blink Mode
              </button>
            </div>
            <p className="text-white/80 mb-2">
              {gameMode === 'follow' 
                ? 'Click targets as fast as you can!' 
                : 'Remember where the target was and click that spot!'}
            </p>
            <p className="text-white/80 mb-6">Build combos for bonus points!</p>
            {timeLeft === 0 && (
              <div className="mb-6">
                <p className="text-2xl font-bold text-white">Final Score: <span className="text-yellow-300">{score}</span></p>
                {score === highScore && score > 0 && (
                  <p className="text-yellow-300 mt-2">New High Score! 🏆</p>
                )}
              </div>
            )}
            <button
              onClick={startGame}
              className="px-8 py-4 bg-yellow-400 text-black rounded-full font-bold text-xl
              hover:bg-yellow-300 transform hover:scale-105 active:scale-95 
              transition-all duration-300 shadow-lg group relative overflow-hidden"
            >
              <span className="relative z-10">{timeLeft === 0 ? 'Play Again' : 'Start Game'}</span>
              <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-300/0 via-white/20 to-yellow-300/0 
              group-hover:w-full transition-all duration-500"></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
