'use client';

import { useState, useEffect, useCallback } from 'react';

interface Bubble {
  id: number | string;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  wobble: number;
  wobbleOffset: number;
  scale: number;
  opacity: number;
  angle?: number;
  rotation?: number;
  rotationSpeed?: number;
  fadeSpeed?: number;
}

export default function BubbleBurst() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const [breathingProgress, setBreathingProgress] = useState(0);
  const [countdown, setCountdown] = useState(6);
  const [showConfig, setShowConfig] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [timings, setTimings] = useState({
    inhale: 6,
    hold: 4,
    exhale: 4,
    hold2: 2
  });

  // Load timings from localStorage on mount
  useEffect(() => {
    const savedTimings = localStorage.getItem('bubbleBurstTimings');
    if (savedTimings) {
      setTimings(JSON.parse(savedTimings));
    }
  }, []);

  // Save timings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bubbleBurstTimings', JSON.stringify(timings));
  }, [timings]);

  const validateTiming = (value: number) => {
    return Math.min(20, Math.max(2, value));
  };

  const handleTimingChange = (phase: keyof typeof timings, value: string) => {
    const numValue = validateTiming(parseInt(value) || 2);
    setTimings(prev => ({
      ...prev,
      [phase]: numValue
    }));
  };

  const colors = [
    'bg-blue-400/20',
    'bg-purple-400/20',
    'bg-pink-400/20',
    'bg-indigo-400/20',
  ];

  const createBubble = useCallback(() => {
    const size = Math.random() * 40 + 20; // 20-60px
    const speed = Math.random() * 0.3 + 0.1; // 0.1-0.4 speed
    const color = colors[Math.floor(Math.random() * colors.length)];
    const wobble = Math.random() * 0.2 - 0.1; // Random wobble effect
    const scale = 0.1; // Start small for growth effect
    
    return {
      id: Date.now(),
      x: Math.random() * 80 + 10, // 10-90% of container
      y: 100, // Start from bottom
      size,
      speed,
      color,
      wobble,
      wobbleOffset: Math.random() * 360, // Random starting point for wobble
      scale, // Add scale for growth animation
      opacity: 0, // Start transparent for fade-in effect
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setBubbles(prevBubbles => {
          // Move existing bubbles up with wobble effect and handle animations
          const movedBubbles = prevBubbles
            .map(bubble => {
              if (typeof bubble.id === 'string' && bubble.id.includes('-')) {
                // Handle burst particles with more complex movement
                const opacity = bubble.opacity - (bubble.fadeSpeed || 0.05);
                if (opacity <= 0) return null;
                
                // Add gravity effect
                const gravity = 0.15;
                const newSpeed = bubble.speed * 0.98; // Gradually slow down
                
                return {
                  ...bubble,
                  x: bubble.x + Math.cos(bubble.angle!) * newSpeed,
                  y: bubble.y + Math.sin(bubble.angle!) * newSpeed + gravity,
                  speed: newSpeed,
                  opacity,
                  rotation: (bubble.rotation || 0) + (bubble.rotationSpeed || 0),
                  scale: bubble.scale * 0.98, // Gradually shrink
                };
              } else {
                // Handle regular bubbles
                const scale = Math.min(1, bubble.scale + 0.02);
                const opacity = Math.min(1, bubble.opacity + 0.05);
                
                return {
                  ...bubble,
                  y: bubble.y - bubble.speed,
                  wobbleOffset: bubble.wobbleOffset + 2,
                  scale,
                  opacity,
                };
              }
            })
            .filter((bubble): bubble is Bubble => bubble !== null && bubble.y > -20);

          // Add new bubble only if we have less than 50 bubbles and with reduced frequency
          if (movedBubbles.length < 50 && Math.random() < 0.1) {
            return [...movedBubbles, createBubble()];
          }
          return movedBubbles;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isPlaying, createBubble]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) {
        setLastUpdateTime(Date.now());
        return;
      }

      const now = Date.now();
      const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
      setLastUpdateTime(now);

      if (breathingPhase === 'inhale') {
        setBreathingProgress(prev => {
          const newProgress = prev + (100 / (timings.inhale * 10)); // Smooth progress
          if (newProgress >= 100) {
            setBreathingPhase('hold');
            setCountdown(timings.hold);
            return 100;
          }
          return newProgress;
        });
        setCountdown(prev => {
          if (prev <= 0) {
            setBreathingPhase('hold');
            setCountdown(timings.hold);
            return timings.hold;
          }
          return prev - deltaTime;
        });
      } else if (breathingPhase === 'hold') {
        setCountdown(prev => {
          if (prev <= 0) {
            setBreathingPhase('exhale');
            setCountdown(timings.exhale);
            return timings.exhale;
          }
          return prev - deltaTime;
        });
      } else if (breathingPhase === 'exhale') {
        setBreathingProgress(prev => {
          const newProgress = prev - (100 / (timings.exhale * 10)); // Smooth progress
          if (newProgress <= 0) {
            setBreathingPhase('hold2');
            setCountdown(timings.hold2);
            return 0;
          }
          return newProgress;
        });
        setCountdown(prev => {
          if (prev <= 0) {
            setBreathingPhase('hold2');
            setCountdown(timings.hold2);
            return timings.hold2;
          }
          return prev - deltaTime;
        });
      } else if (breathingPhase === 'hold2') {
        setCountdown(prev => {
          if (prev <= 0) {
            setBreathingPhase('inhale');
            setCountdown(timings.inhale);
            return timings.inhale;
          }
          return prev - deltaTime;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [breathingPhase, timings, isPaused, lastUpdateTime]);

  const handleBubbleClick = (id: number | string) => {
    setBubbles(prevBubbles => {
      const bubble = prevBubbles.find(b => b.id === id);
      if (bubble && typeof id === 'number') {
        // Create burst particles with tighter animation
        const particleCount = Math.floor(Math.random() * 3) + 4; // 4-6 particles
        const burstParticles: Bubble[] = Array.from({ length: particleCount }, (_, i) => {
          const angle = ((i * 360) / particleCount + Math.random() * 20 - 10) * (Math.PI / 180); // Less angle variation
          const speed = Math.random() * 3 + 2; // Faster speed between 2-5
          const size = (Math.random() * 0.3 + 0.1) * bubble.size; // Smaller size between 10% and 40% of original
          
          return {
            id: `${id}-${i}`,
            x: bubble.x,
            y: bubble.y,
            angle,
            speed,
            size,
            color: bubble.color,
            opacity: 1,
            wobble: Math.random() * 0.1 - 0.05, // Less wobble
            wobbleOffset: Math.random() * 360,
            scale: Math.random() * 0.3 + 0.3, // Smaller scale
            rotationSpeed: Math.random() * 15 - 7.5, // Faster rotation
            rotation: Math.random() * 360,
            fadeSpeed: Math.random() * 0.08 + 0.12, // Much faster fade
          };
        });

        // Add burst particles to the bubbles array
        return [...prevBubbles.filter(b => b.id !== id), ...burstParticles];
      }
      return prevBubbles;
    });
    if (typeof id === 'number') {
      setScore(prev => prev + 1);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setBubbles([]);
    setBreathingPhase('inhale');
    setBreathingProgress(0);
    setCountdown(timings.inhale);
  };

  const toggleSettings = () => {
    setShowConfig(prev => {
      const newState = !prev;
      setIsPaused(newState);
      if (!newState) {
        setLastUpdateTime(Date.now()); // Reset timer when resuming
      }
      return newState;
    });
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-gradient-to-b from-indigo-900 to-purple-900">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Bubble Burst</h1>
        <div className="text-white">
          <span className="font-bold">Score:</span> <span className="text-pink-300">{score}</span>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isPaused && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="text-white text-2xl font-bold">Game Paused</div>
            <div className="text-white/80 text-center max-w-md px-4">
              You are paused, but life is still going on.<br />
              Let go of things, take a pause.<br />
              Breathe deeply and be present in this moment.
            </div>
          </div>
        )}
        {bubbles.map(bubble => (
          <button
            key={bubble.id}
            onClick={() => handleBubbleClick(bubble.id)}
            style={{
              position: 'absolute',
              left: `${bubble.x + Math.sin(bubble.wobbleOffset * Math.PI / 180) * bubble.wobble}%`,
              top: `${bubble.y}%`,
              transform: `translate(-50%, -50%) scale(${bubble.scale}) rotate(${bubble.rotation || 0}deg)`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity,
            }}
            className={`${bubble.color} rounded-full transition-all duration-100 
            hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl
            before:content-[''] before:absolute before:inset-0 before:rounded-full
            before:bg-gradient-to-br before:from-white/30 before:to-transparent
            before:transform before:rotate-45
            after:content-[''] after:absolute after:inset-0 after:rounded-full
            after:bg-gradient-to-br after:from-white/10 after:to-transparent
            after:transform after:rotate-[-45deg]`}
          />
        ))}
      </div>

      {/* Breathing Guide with Settings */}
      <div className="bg-white/10 backdrop-blur-md p-4 rounded-t-2xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSettings}
                className="p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                title="Breathing Settings"
              >
                ⚙️
              </button>
              <div className="text-xl text-white">
                {breathingPhase === 'inhale' && '🌬️ Inhale...'}
                {breathingPhase === 'hold' && '⏳ Hold...'}
                {breathingPhase === 'exhale' && '💨 Exhale...'}
                {breathingPhase === 'hold2' && '⏳ Hold...'}
              </div>
            </div>
            <div className="text-white font-bold">
              {Math.floor(countdown / 60).toString().padStart(2, '0')}:{(Math.floor(countdown) % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {showConfig && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/80 text-xs">Inhale</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={timings.inhale}
                    onChange={(e) => handleTimingChange('inhale', e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-white/10 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-xs">Hold</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={timings.hold}
                    onChange={(e) => handleTimingChange('hold', e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-white/10 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-xs">Exhale</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={timings.exhale}
                    onChange={(e) => handleTimingChange('exhale', e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-white/10 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-xs">Final Hold</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={timings.hold2}
                    onChange={(e) => handleTimingChange('hold2', e.target.value)}
                    className="w-full mt-1 px-2 py-1 bg-white/10 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-100"
              style={{ width: `${breathingProgress}%` }}
            />
          </div>
          <div className="text-white/80 text-sm mt-2">
            {breathingPhase === 'inhale' && 'Breathe in slowly...'}
            {breathingPhase === 'hold' && 'Hold your breath...'}
            {breathingPhase === 'exhale' && 'Breathe out slowly...'}
            {breathingPhase === 'hold2' && 'Hold...'}
          </div>
        </div>
      </div>

      <div className="p-4 flex justify-center gap-4">
        {!isPlaying ? (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-pink-400 text-white rounded-full font-bold
            hover:bg-pink-300 transform hover:scale-105 transition-all duration-300"
          >
            Start Game
          </button>
        ) : null}
      </div>
    </div>
  );
} 
