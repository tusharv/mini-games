'use client';

import { useState, useEffect } from 'react';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const emojis = {
  Fruits: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍑', '🍍', '🥭'],
  Animals: ['🐶', '🐱', '🐭', '🐰', '🦁', '🐯', '🐸', '🐵'],
  Places: ['🏝️', '🏜️', '🏞️', '🏰', '🏕️', '🏟️', '🗽', '🗼'],
  People: ['👮‍♂️', '🧑‍🍳', '🧑‍🏫', '🧑‍🚀', '🧑‍⚕️', '🧑‍🎨', '🧑‍🚒', '🧑‍✈️'],
  Flags: ['🇺🇸', '🇬🇧', '🇫🇷', '🇯🇵', '🇨🇳', '🇮🇳', '🇧🇷', '🇨🇦'],
  Sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏'],
  Weather: ['☀️', '🌧️', '⛈️', '🌩️', '❄️', '🌪️', '🌈', '🌫️'],
  Nature: ['🌲', '🌳', '🌴', '🌵', '🌻', '🌼', '🌸', '🌺'],
  Faces: ['😀', '😂', '😍', '😎', '😭', '😡', '😱', '😴'],
  Food: ['🍕', '🍔', '🌮', '🍣', '🍜', '🍩', '🍦', '🍪'],
  Space: ['🚀', '🛸', '🌍', '🌙', '⭐', '☄️', '🌠', '👾'],
  Music: ['🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '🎼'],
  Fantasy: ['🧙‍♂️', '🧚‍♀️', '🦄', '🐉', '🧜‍♀️', '🧝‍♂️', '🔮', '🗡️'],
  Ocean: ['🐋', '🐬', '🦈', '🐙', '🦀', '🐠', '🐡', '🦞'],
  Tech: ['💻', '📱', '🖥️', '⌚', '🎮', '🕹️', '🤖', '📷']
} as const;

type ThemeKey = keyof typeof emojis;

type Difficulty = 'easy' | 'medium' | 'hard';

export default function MemoryFlip() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [time, setTime] = useState(0);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('Fruits');
  const [showThemeSelect, setShowThemeSelect] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      const totalPairs = currentDifficulty === 'easy' ? 8 : currentDifficulty === 'medium' ? 18 : 32;
      if (pairsFound < totalPairs) {
        timer = setInterval(() => {
          setTime(prev => prev + 1);
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [isPlaying, pairsFound, currentDifficulty]);

  const initializeGame = (theme?: ThemeKey) => {
    if (theme) {
      setCurrentTheme(theme);
    }
    const themeEmojis = emojis[theme || currentTheme];
    
    // Get all emojis needed by repeating the theme emojis
    const repeatedEmojis = Array(Math.ceil(32 / themeEmojis.length))
      .fill(themeEmojis)
      .flat();

    // Take the number of pairs we need based on difficulty
    const totalPairs = currentDifficulty === 'easy' ? 8 : // 4x4 = 16 cards
                      currentDifficulty === 'medium' ? 18 : // 6x6 = 36 cards
                      32; // 8x8 = 64 cards
    
    const selectedEmojis = repeatedEmojis.slice(0, totalPairs);
    
    // Double the emojis to create pairs and shuffle
    const shuffledEmojis = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));

    setCards(shuffledEmojis);
    setIsPlaying(true);
    setShowThemeSelect(false);
    setMoves(0);
    setPairsFound(0);
    setTime(0);
    setFlippedCards([]);
  };

  const getGridCols = () => {
    switch (currentDifficulty) {
      case 'easy': return 'grid-cols-4';
      case 'medium': return 'grid-cols-6';
      case 'hard': return 'grid-cols-8';
    }
  };

  const handleCardClick = (cardId: number) => {
    if (!isPlaying) return;
    if (flippedCards.length === 2) return;
    if (cards[cardId].isMatched) return;
    if (flippedCards.includes(cardId)) return;

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      const [firstCard, secondCard] = newFlippedCards;
      
      if (cards[firstCard].emoji === cards[secondCard].emoji) {
        // Match found
        newCards[firstCard].isMatched = true;
        newCards[secondCard].isMatched = true;
        setCards(newCards);
        setPairsFound(prev => prev + 1);
        setFlippedCards([]);

        // Check if all pairs are found
        const totalPairs = currentDifficulty === 'easy' ? 8 : currentDifficulty === 'medium' ? 18 : 32;
        if (pairsFound + 1 === totalPairs) {
          setIsCelebrating(true);
          setTimeout(() => {
            setShowWinMessage(true);
            setIsCelebrating(false);
          }, 5000);
        }
      } else {
        // No match
        setTimeout(() => {
          newCards[firstCard].isFlipped = false;
          newCards[secondCard].isFlipped = false;
          setCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col p-2">
      <div className="flex-1 bg-white/10 backdrop-blur-md rounded-lg p-4 min-h-0 flex items-center justify-center">
        <div className={`grid ${getGridCols()} gap-2 w-full aspect-square ${
          currentDifficulty === 'easy' ? 'max-w-[500px]' :
          currentDifficulty === 'medium' ? 'max-w-[600px]' :
          'max-w-[700px]'
        }`}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square bg-gradient-to-br rounded-md 
              transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg
              hover:shadow-xl group relative overflow-hidden
              ${card.isFlipped || card.isMatched 
                ? 'from-yellow-400 to-yellow-500' 
                : 'from-purple-600 to-indigo-600'}
              ${isCelebrating && card.isMatched ? 'animate-[bounce_1s_ease-in-out_infinite]' : ''}`}
              disabled={card.isMatched || flippedCards.length === 2}
            >
              <div className="relative z-10 h-full flex items-center justify-center">
                <span className={`transition-opacity duration-300 ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'} drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] ${
                  currentDifficulty === 'easy' ? 'text-3xl' :
                  currentDifficulty === 'medium' ? 'text-2xl' :
                  'text-xl'
                } ${isCelebrating && card.isMatched ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''}`}>
                  {card.emoji}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300 
              transform rotate-45 translate-x-full group-hover:translate-x-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-lg mt-2">
        <div className="flex justify-between items-center px-3 py-1.5">
          <div className="text-white flex items-center gap-3 text-xs">
            <div>
              <span className="font-bold">Moves:</span> <span className="text-yellow-300">{moves}</span>
            </div>
            <div>
              <span className="font-bold">Theme:</span> <span className="text-yellow-300">{currentTheme}</span>
            </div>
            <div>
              <span className="font-bold">Difficulty:</span> <span className="text-yellow-300">{currentDifficulty}</span>
            </div>
            <div>
              <span className="font-bold">Pairs:</span> <span className="text-yellow-300">{pairsFound}/{currentDifficulty === 'easy' ? 8 : currentDifficulty === 'medium' ? 18 : 32}</span>
            </div>
            <div>
              <span className="font-bold">Time:</span> <span className="text-yellow-300">{formatTime(time)}</span>
            </div>
          </div>
          {isPlaying && (
            <button
              onClick={() => setShowThemeSelect(true)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs
              transform hover:scale-105 transition-all duration-300"
            >
              Change Theme
            </button>
          )}
        </div>
      </div>

      {/* Start Game Overlay */}
      {!isPlaying && !showThemeSelect && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl 
          transform hover:scale-105 transition-all duration-300">
            <h1 className="text-4xl font-bold text-white mb-4">Memory Flip</h1>
            <p className="text-white/80 mb-6">Match pairs of cards to win!</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowThemeSelect(true)}
                className="px-8 py-4 bg-yellow-400 text-black rounded-full font-bold text-xl
                hover:bg-yellow-300 transform hover:scale-105 active:scale-95 
                transition-all duration-300 shadow-lg group relative overflow-hidden"
              >
                <span className="relative z-10">Start Game</span>
                <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-300/0 via-white/20 to-yellow-300/0 
                group-hover:w-full transition-all duration-500"></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme and Difficulty Select Overlay */}
      {showThemeSelect && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-8 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">Game Settings</h2>
            
            {/* Difficulty Selection */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Choose Difficulty</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setCurrentDifficulty('easy')}
                  className={`p-6 rounded-lg hover:bg-yellow-400 hover:text-black
                  active:scale-95 transform transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50
                  ${currentDifficulty === 'easy' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
                >
                  <div className="text-xl font-bold mb-2">Easy</div>
                  <div className="text-sm">4x4 Grid (8 Pairs)</div>
                </button>
                <button
                  onClick={() => setCurrentDifficulty('medium')}
                  className={`p-6 rounded-lg hover:bg-yellow-400 hover:text-black
                  active:scale-95 transform transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50
                  ${currentDifficulty === 'medium' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
                >
                  <div className="text-xl font-bold mb-2">Medium</div>
                  <div className="text-sm">6x6 Grid (18 Pairs)</div>
                </button>
                <button
                  onClick={() => setCurrentDifficulty('hard')}
                  className={`p-6 rounded-lg hover:bg-yellow-400 hover:text-black
                  active:scale-95 transform transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50
                  ${currentDifficulty === 'hard' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
                >
                  <div className="text-xl font-bold mb-2">Hard</div>
                  <div className="text-sm">8x8 Grid (32 Pairs)</div>
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Choose Theme</h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {(Object.keys(emojis) as ThemeKey[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setCurrentTheme(theme);
                      initializeGame(theme);
                    }}
                    className="p-3 sm:p-4 bg-white/10 rounded-lg hover:bg-yellow-400 hover:text-black
                    active:scale-95 transform transition-all duration-300 text-white
                    focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
                  >
                    <div className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{theme}</div>
                    <div className="flex gap-1 sm:gap-2 justify-center text-xl sm:text-2xl">
                      {emojis[theme].slice(0, 3).map((emoji, i) => (
                        <span key={i}>{emoji}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Win Overlay */}
      {showWinMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl 
          transform scale-105 transition-all duration-300">
            <h1 className="text-4xl font-bold text-white mb-4">Congratulations! 🎉</h1>
            <p className="text-white/80 mb-2">You won in {moves} moves</p>
            <p className="text-white/80 mb-6">Time: {formatTime(time)}</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setShowThemeSelect(true);
                  setShowWinMessage(false);
                }}
                className="px-8 py-4 bg-yellow-400 text-black rounded-full font-bold text-xl
                hover:bg-yellow-300 transform hover:scale-105 active:scale-95 
                transition-all duration-300 shadow-lg group relative overflow-hidden"
              >
                <span className="relative z-10">Try Another Theme</span>
                <span className="absolute inset-0 w-0 bg-gradient-to-r from-yellow-300/0 via-white/20 to-yellow-300/0 
                group-hover:w-full transition-all duration-500"></span>
              </button>
              <button
                onClick={() => {
                  initializeGame();
                  setShowWinMessage(false);
                }}
                className="px-8 py-4 bg-white/20 text-white rounded-full font-bold text-xl
                hover:bg-white/30 transform hover:scale-105 active:scale-95 
                transition-all duration-300 shadow-lg"
              >
                Play Again ({currentTheme})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
