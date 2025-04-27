import Link from 'next/link';
import { Poppins } from 'next/font/google';
import Image from 'next/image';
import { Metadata } from 'next';
import GamesSection from './components/GamesSection';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Home | Mental Mint - Fun Brain Training Games",
  description: "Discover a collection of engaging mini games designed to improve your cognitive skills, memory, and reaction time. Perfect for quick brain training sessions!",
};

export default function Home() {
  const games = [
    {
      slug: 'spirograph',
      title: 'Spirograph',
      description: 'Create beautiful geometric patterns and explore the fascinating world of mathematical art!',
      icon: '🌀',
      tags: ['art', 'math', 'creative', 'relaxing', 'educational']
    },
    {
      slug: 'tap-master',
      title: 'Tap Master',
      description: 'Enhance your reaction time and hand-eye coordination with this fast-paced tapping game!',
      icon: '🎯',
      tags: ['reflection', 'speed', 'coordination', 'reflex', 'action']
    },
    {
      slug: 'bubble-burst',
      title: 'Bubble Burst',
      description: 'Find calm and reduce anxiety by gently bursting floating bubbles in this soothing experience',
      icon: '🫧',
      tags: ['relax', 'meditation', 'stress-relief', 'casual', 'zen']
    },
    {
      slug: 'memory-flip',
      title: 'Memory Flip',
      description: 'Strengthen your working memory and pattern recognition by matching pairs of cards.',
      icon: '🧠',
      tags: ['kids', 'memory', 'concentration', 'matching', 'educational']
    },
    {
      slug: '15-puzzle',
      title: '15 Puzzle',
      description: 'Test your problem-solving skills by sliding numbered tiles to arrange them in order!',
      icon: '🧩',
      tags: ['logic', 'puzzle', 'sequence', 'spatial', 'classic']
    },
    {
      slug: '2048',
      title: '2048',
      description: 'Boost your strategic planning and spatial reasoning with this addictive number game!',
      icon: '🎲',
      tags: ['geek', 'maths', 'strategy', 'numbers', 'puzzle', 'addictive']
    },
    {
      slug: 'minesweeper',
      title: 'Minesweeper',
      description: 'Sharpen your logical thinking and problem-solving skills in this classic puzzle game!',
      icon: '💣',
      tags: ['focus', 'strategy', 'logic', 'classic', 'puzzle']
    },
    {
      slug: 'snake',
      title: 'Snake',
      description: 'Guide the snake to collect food and grow longer in this nostalgic arcade classic!',
      icon: '🐍',
      tags: ['arcade', 'classic', 'reflexes', 'strategy', 'nostalgic']
    },
    {
      slug: 'tetris',
      title: 'Tetris',
      description: 'Arrange falling blocks to create lines and test your spatial awareness in this iconic game!',
      icon: '🧱',
      tags: ['classic', 'puzzle', 'spatial', 'strategy', 'addictive'],
      status: 'beta',
      mobileStatus: 'coming-soon'
    }
  ];

  const benefits = [
    {
      title: 'Quick Brain Breaks',
      description: 'Perfect for short breaks - each game is designed for quick, effective brain training sessions',
      icon: '⏱️'
    },
    {
      title: 'Diverse Brain Training',
      description: 'Challenge different cognitive areas with our growing collection of brain games',
      icon: '🧩'
    },
    {
      title: 'Free & Accessible',
      description: 'Improve your mental fitness without any cost - quality brain training for everyone',
      icon: '🎁'
    }
  ];

  const healthTips = [
    {
      title: 'Physical Exercise',
      description: 'Regular physical activity boosts brain function and promotes neurogenesis',
      icon: '🏃‍♂️'
    },
    {
      title: 'Brain-Healthy Diet',
      description: 'Nourish your mind with foods rich in omega-3s, antioxidants, and essential nutrients',
      icon: '🥗'
    },
    {
      title: 'Quality Sleep',
      description: 'Prioritize sleep to enhance memory consolidation and cognitive performance',
      icon: '😴'
    },
    {
      title: 'Mental Fitness',
      description: 'Combine brain games with mindfulness and stress management for optimal results',
      icon: '🧘‍♂️'
    }
  ];

  return (
    <main className={`bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 ${poppins.className}`}>
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-indigo-500 to-transparent backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 relative">
                <Image
                  src="/images/logo.svg"
                  alt="Logo"
                  fill
                  className="object-contain -rotate-45 brightness-0 invert"
                />
              </div>
              <h1 className="text-2xl font-bold text-white">Mental Mint</h1>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#games" className="text-white/80 hover:text-white transition-colors">
                Games
              </Link>
              <Link href="#benefits" className="text-white/80 hover:text-white transition-colors">
                Benefits
              </Link>
              <Link href="#health-tips" className="text-white/80 hover:text-white transition-colors">
                Health Tips
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-black mb-6 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
          Refresh Your Mind with Mental Mint!
        </h1>
        <p className="text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Take a mental break that actually matters! Our brain-boosting games will keep your mind fresh and sharp! 🌿
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 mb-16 px-4 md:px-0">
          <Link
            href="#games"
            className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-yellow-400 text-black rounded-full font-bold hover:bg-yellow-300 
            transform hover:scale-105 transition duration-300 ease-in-out shadow-lg text-base md:text-lg text-center"
          >
            Start Training! 🧠
          </Link>
          <Link
            href="#benefits"
            className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-bold 
            hover:bg-white/20 transform hover:scale-105 transition duration-300 ease-in-out shadow-lg text-base md:text-lg 
            border-2 border-white/30 text-center"
          >
            Why Mental Mint? ✨
          </Link>
        </div>
      </div>

      {/* Benefits Section */}
      <section id="benefits" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-black text-center mb-12 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
          Why Choose Mental Mint?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl 
            shadow-lg hover:shadow-xl transition transform hover:-translate-y-2 duration-300 border border-white/20">
              <div className="text-5xl mb-4">{benefit.icon}</div>
              <h3 className="text-2xl font-bold mb-3 text-white">{benefit.title}</h3>
              <p className="text-white/80 text-lg">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Games Section */}
      <GamesSection games={games} />

      {/* Health Tips Section */}
      <section id="health-tips" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-black text-center mb-12 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
          Boost Your Brain Power
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {healthTips.map((tip, index) => (
            <div key={index} className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl 
            shadow-lg hover:shadow-xl transition transform hover:-translate-y-2 duration-300 border border-white/20">
              <div className="text-5xl mb-4">{tip.icon}</div>
              <h3 className="text-2xl font-bold mb-3 text-white">{tip.title}</h3>
              <p className="text-white/80 text-lg">{tip.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/20">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 relative">
            <Image
              src="/images/logo.svg"
              alt="Logo"
              fill
              className="object-contain -rotate-45"
            />
          </div>
          <p className="text-white/80 text-lg">
            Made By The Working Prototype
          </p>
        </div>
      </footer>
    </main>
  );
}
