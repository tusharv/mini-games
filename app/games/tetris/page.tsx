'use client';

import React, { useState, useEffect } from 'react';
// Remove Link import if no longer needed
// import Link from 'next/link'; 
import { Poppins } from 'next/font/google';
import Head from 'next/head';
// Placeholder for the actual game component
import TetrisGame from './components/TetrisGame';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

// We can't export Metadata directly in a 'use client' component.
// Metadata needs to be handled differently, typically in a parent layout or using Head component.
/*
export const metadata: Metadata = {
  title: "Tetris | Mental Mint",
  description: "Play Tetris - Arrange falling blocks, test spatial awareness, and challenge your strategy.",
};
*/

type Difficulty = 'easy' | 'medium' | 'hard';

export default function TetrisPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleStartGame = (level: Difficulty) => {
    setDifficulty(level);
    setGameStarted(true);
    setIsGameOver(false);
    setFinalScore(null);
    // Add logic to initialize or reset the game based on difficulty
  };

  const handleGameOver = (score: number) => {
    setIsGameOver(true);
    setFinalScore(score);
    setGameStarted(false);
  };

  // Effect to control body overflow
  useEffect(() => {
      // Prevent scrolling when the game page is mounted
      document.body.style.overflow = 'hidden';
      // Cleanup function to restore scrolling when component unmounts
      return () => {
          document.body.style.overflow = 'auto';
      };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <>
      <Head>
        <title>Tetris | Mental Mint</title>
        <meta name="description" content="Play Tetris - Arrange falling blocks, test spatial awareness, and challenge your strategy." />
      </Head>
      {/* Apply height and overflow styles to the main container */}
      <main className={`flex flex-col items-center justify-center min-h-screen h-screen overflow-hidden bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-600 text-white ${poppins.className} p-4`}>
        {/* Keep the game selection/display section */}
        <section className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 flex items-center justify-center">
          {!gameStarted && !isGameOver ? (
            // Display difficulty selection only if game hasn't started and isn't over
            <div className="flex flex-col items-center gap-6 max-w-xs w-full">
              <h2 className="text-3xl font-semibold mb-4">Choose Difficulty</h2>
              <button
                onClick={() => handleStartGame('easy')}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-400 transform hover:scale-105 transition duration-300 ease-in-out shadow-md text-lg"
              >
                Easy
              </button>
              <button
                onClick={() => handleStartGame('medium')}
                className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-400 transform hover:scale-105 transition duration-300 ease-in-out shadow-md text-lg"
              >
                Medium
              </button>
              <button
                onClick={() => handleStartGame('hard')}
                className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-400 transform hover:scale-105 transition duration-300 ease-in-out shadow-md text-lg"
              >
                Hard
              </button>
            </div>
          ) : (
              // Display game or game over message
              <> 
                {/* Conditionally render Restart button OR game over message */} 
                {isGameOver && finalScore !== null ? (
                    <div className="text-center">
                        <h3 className="text-4xl font-bold text-red-500 mb-4 animate-pulse">Game Over!</h3>
                        <p className="text-2xl text-white mb-6">Final Score: {finalScore}</p>
                        <button
                            onClick={() => {
                                setGameStarted(false);
                                setIsGameOver(false);
                                setFinalScore(null);
                            }}
                            className="px-8 py-3 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-400 transform hover:scale-105 transition duration-300 ease-in-out shadow-md text-lg"
                        >
                            Play Again?
                        </button>
                    </div>
                 ) : (
                    // Render the game component if game is active
                     <TetrisGame 
                        key={difficulty} // Re-mount component on difficulty change to reset
                        difficulty={difficulty} 
                        onGameOver={handleGameOver} 
                     />
                 )}
                 {/* Removed the old restart button logic from here */}
               </>
          )}
        </section>

        {/* Remove the footer or adjust if needed 
        <footer className="w-full max-w-4xl mt-12 text-center text-white/80 text-sm">
          <p>&copy; {new Date().getFullYear()} Mental Mint. Built by The Working Prototype.</p>
        </footer>
        */}
      </main>
    </>
  );
}
