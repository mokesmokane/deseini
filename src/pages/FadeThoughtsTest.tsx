import React, { useState } from 'react';
import { FadeThoughts } from '@/components/landing/IdeationChat/StreamingPlanSummary/FadeThoughts';

const mockThoughts = [
  { summary: 'Generating project structure...', thoughts: 'Generating project structure...' },
  { summary: 'Analyzing dependencies and constraints.', thoughts: 'Analyzing dependencies and constraints.' },
  { summary: 'Optimizing for tactile, modern UI.', thoughts: 'Optimizing for tactile, modern UI.' },
  { summary: 'Finalizing component layout.', thoughts: 'Finalizing component layout.' },
];

export function FadeThoughtsTest() {
  const [thoughts, setThoughts] = useState(mockThoughts);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-10">
      <h1 className="text-white text-2xl mb-8 font-semibold">FadeThoughts Component Test</h1>
      <div className="w-full max-w-2xl">
        <FadeThoughts thoughts={thoughts} />
      </div>
      {/* Optionally, controls to add/remove thoughts for testing */}
      <div className="mt-8 flex gap-2">
        <button
          className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition"
          onClick={() => setThoughts([...thoughts, { summary: `New thought New thought New thought New thought New thought New thought New thought New thought New thought ${thoughts.length + 1}`, thoughts: `New thought ${thoughts.length + 1}` }])}
        >
          Add Thought
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition"
          onClick={() => setThoughts(thoughts.slice(0, -1))}
          disabled={thoughts.length === 0}
        >
          Remove Thought
        </button>
      </div>
    </div>
  );
}
