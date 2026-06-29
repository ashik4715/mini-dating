'use client';

import React from 'react';

interface ConfirmationScreenProps {
  date: Date;
  time: string;
  food: string;
  onRestart: () => void;
}

export default function ConfirmationScreen({ date, time, food, onRestart }: ConfirmationScreenProps) {
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFoodEmoji = (foodName: string) => {
    const emojis: Record<string, string> = {
      Pizza: '🍕',
      Sushi: '🍣',
      Burgers: '🍔',
      Pasta: '🍝',
      Tacos: '🌮',
      Ramen: '🍜',
    };
    return emojis[foodName] || '🍽️';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center fade-in">
        <h1 className="font-serif text-4xl text-gray-800 mb-6">
          YAY!! <span className="text-3xl">💕</span>
        </h1>

        <div className="bg-white/50 rounded-2xl p-6 mb-6 text-left">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl">📅</span>
            <span className="text-lg text-gray-700">{formatDate(date)}</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl">⏰</span>
            <span className="text-lg text-gray-700">{time}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-2xl">{getFoodEmoji(food)}</span>
            <span className="text-lg text-gray-700">{food}</span>
          </div>
        </div>

        <p className="font-serif text-xl text-gray-700 mb-6">
          I can&apos;t wait to see you! 🌸✨
        </p>

        <p className="text-sm text-gray-500 italic">
          (normal guys send texts, i made a website on Replit. i&apos;m not like other guys xx)
        </p>

        <button
          onClick={onRestart}
          className="mt-6 text-pink-500 hover:text-pink-600 font-medium transition-colors"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
