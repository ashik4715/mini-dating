'use client';

import React, { useState } from 'react';

interface FoodPickerProps {
  onConfirm: (food: string) => void;
  onBack: () => void;
}

const foodOptions = [
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Sushi', emoji: '🍣' },
  { name: 'Burgers', emoji: '🍔' },
  { name: 'Pasta', emoji: '🍝' },
  { name: 'Tacos', emoji: '🌮' },
  { name: 'Ramen', emoji: '🍜' },
];

export default function FoodPicker({ onConfirm, onBack }: FoodPickerProps) {
  const [selectedFood, setSelectedFood] = useState<string>('');

  const handleConfirm = () => {
    if (selectedFood) {
      onConfirm(selectedFood);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full fade-in">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-gray-800 mb-2">
            What are we feeling?
          </h1>
          <span className="text-xl">🍽️✨</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {foodOptions.map((food) => (
            <button
              key={food.name}
              onClick={() => setSelectedFood(food.name)}
              className={`food-item bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3
                border-2 transition-all
                ${selectedFood === food.name ? 'selected border-pink-500' : 'border-gray-100'}
              `}
            >
              <span className="text-4xl">{food.emoji}</span>
              <span className="font-medium text-gray-700">{food.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedFood}
          className="w-full btn-pink text-white font-semibold py-4 px-8 rounded-full text-lg
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Next ✨
        </button>
      </div>
    </div>
  );
}
