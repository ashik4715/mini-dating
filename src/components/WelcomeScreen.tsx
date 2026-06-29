'use client';

import React from 'react';

interface WelcomeScreenProps {
  onYes: () => void;
  onNo: () => void;
}

export default function WelcomeScreen({ onYes, onNo }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center fade-in">
        <div className="mb-8">
          <span className="text-2xl">🌸</span>
          <h1 className="font-serif text-3xl md:text-4xl text-gray-800 my-4 inline">
            Will you go on a date with me?
          </h1>
          <span className="text-2xl">🌸</span>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={onYes}
            className="btn-pink text-white font-semibold py-4 px-8 rounded-full text-lg flex items-center justify-center gap-2"
          >
            YES <span>❤️</span>
          </button>

          <button
            onClick={onNo}
            className="btn-white font-semibold py-4 px-8 rounded-full text-lg flex items-center justify-center gap-2"
          >
            NO <span>😔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
