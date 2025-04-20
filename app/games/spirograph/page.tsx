import Spirograph from '@/components/Spirograph';
import { Suspense } from 'react';

export default function SpirographPage() {
  return (
    <main className="h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 p-4 print:p-0 print:h-screen print:bg-none">
      <div className="h-full max-w-7xl mx-auto print:h-full print:max-w-full print:mx-0">
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white">Loading Spirograph...</div>}>
          <Spirograph width={800} height={600} />
        </Suspense>
      </div>
    </main>
  );
} 
