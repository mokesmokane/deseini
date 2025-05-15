import React from 'react';
import { FadeThoughtsTest } from './FadeThoughtsTest';

export default function TestGallery() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-start p-10">
      <h1 className="text-white text-3xl mb-10 font-bold tracking-tight">Component Test Gallery</h1>
      <div className="w-full max-w-3xl space-y-16">
        <section>
          <FadeThoughtsTest />
        </section>
        {/* Add more test/demo components here as needed */}
      </div>
    </div>
  );
}
