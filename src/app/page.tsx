'use client';

import React, { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import DateTimePicker from '@/components/DateTimePicker';
import FoodPicker from '@/components/FoodPicker';
import ConfirmationScreen from '@/components/ConfirmationScreen';
import RejectionScreen from '@/components/RejectionScreen';
import { Screen, FormData } from '@/types';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [formData, setFormData] = useState<FormData>({
    date: null,
    time: '',
    food: '',
    status: 'accepted',
  });

  const handleYes = () => {
    setFormData((prev) => ({ ...prev, status: 'accepted' }));
    setScreen('datetime');
  };

  const handleNo = () => {
    setFormData((prev) => ({ ...prev, status: 'rejected' }));
    setScreen('rejection');

    // Save rejected date to MongoDB
    saveDate({
      date: new Date(),
      time: '',
      food: '',
      status: 'rejected',
    });
  };

  const handleDateTimeConfirm = (date: Date, time: string) => {
    setFormData((prev) => ({ ...prev, date, time }));
    setScreen('food');
  };

  const handleFoodConfirm = async (food: string) => {
    const updatedFormData = { ...formData, food };
    setFormData(updatedFormData);
    setScreen('confirmation');

    // Save accepted date to MongoDB
    await saveDate({
      date: updatedFormData.date!,
      time: updatedFormData.time,
      food,
      status: 'accepted',
    });
  };

  const saveDate = async (data: Partial<FormData>) => {
    try {
      await fetch('/api/dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error saving date:', error);
    }
  };

  const handleRestart = () => {
    setFormData({
      date: null,
      time: '',
      food: '',
      status: 'accepted',
    });
    setScreen('welcome');
  };

  return (
    <main>
      {screen === 'welcome' && (
        <WelcomeScreen onYes={handleYes} onNo={handleNo} />
      )}

      {screen === 'datetime' && (
        <DateTimePicker
          onConfirm={handleDateTimeConfirm}
          onBack={() => setScreen('welcome')}
        />
      )}

      {screen === 'food' && (
        <FoodPicker
          onConfirm={handleFoodConfirm}
          onBack={() => setScreen('datetime')}
        />
      )}

      {screen === 'confirmation' && formData.date && (
        <ConfirmationScreen
          date={formData.date}
          time={formData.time}
          food={formData.food}
          onRestart={handleRestart}
        />
      )}

      {screen === 'rejection' && (
        <RejectionScreen onRestart={handleRestart} />
      )}
    </main>
  );
}
