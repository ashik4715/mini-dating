'use client';

import React from 'react';

interface RejectionScreenProps {
  onRestart: () => void;
}

export default function RejectionScreen({ onRestart }: RejectionScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center fade-in">
        <h1 className="font-serif text-3xl text-gray-800 mb-4">
          That&apos;s okay! 😔
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Maybe next time?
        </p>

        <button
          onClick={onRestart}
          className="btn-pink text-white font-semibold py-4 px-8 rounded-full text-lg"
        >
          Go back 💕
        </button>
      </div>
    </div>
  );
}
