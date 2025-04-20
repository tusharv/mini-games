import { Poppins } from 'next/font/google';
import Header from '@/components/Header';
import { Metadata } from 'next';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Mini Games',
    default: 'Games | Mini Games',
  },
  description: 'Play engaging brain training games to improve your cognitive skills, memory, and reaction time.',
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${poppins.className} min-h-screen bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500`}>
      <Header />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
} 
