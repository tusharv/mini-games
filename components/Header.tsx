'use client';

import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/30 shadow-sm">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="flex items-center gap-4"
          >
            <div className="w-8 h-8 relative">
              <Image
                src="/images/logo.svg"
                alt="Logo"
                fill
                className="object-contain -rotate-45 brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold text-white">
              Mental Mint
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-white/80 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/#games" 
              className="text-white/80 hover:text-white transition-colors"
            >
              Games
            </Link>
            <Link 
              href="/#benefits" 
              className="text-white/80 hover:text-white transition-colors"
            >
              Benefits
            </Link>
            <Link 
              href="/#health-tips" 
              className="text-white/80 hover:text-white transition-colors"
            >
              Health Tips
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header; 
