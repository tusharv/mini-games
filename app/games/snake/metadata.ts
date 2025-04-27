import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snake | Mental Mint - Classic Snake Game',
  description: 'Play the classic Snake game! Guide your snake to collect food and grow longer while avoiding walls and your own tail. Perfect for quick brain training sessions!',
  openGraph: {
    title: 'Snake Game | Mental Mint',
    description: 'Play the classic Snake game! Guide your snake to collect food and grow longer while avoiding walls and your own tail.',
    images: ['/images/snake.png'],
  },
  twitter: {
    card: "summary_large_image",
    images: ['/images/snake.png'],
  },
}; 
