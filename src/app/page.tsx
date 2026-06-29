'use client';

import React, { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import DateTimePicker from '@/components/DateTimePicker';
import FoodPicker from '@/components/FoodPicker';
import PhoneInput from '@/components/PhoneInput';
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

  const handleFoodConfirm = (food: string) => {
    setFormData((prev) => ({ ...prev, food }));
    setScreen('phone');
  };

  const handlePhoneConfirm = async (phone: string | null) => {
    const updatedFormData = { ...formData, phone: phone || undefined };
    setFormData(updatedFormData);
    setScreen('confirmation');

    await saveDate({
      date: updatedFormData.date!,
      time: updatedFormData.time,
      food: updatedFormData.food,
      phone: phone || undefined,
      status: 'accepted',
    });

    if (phone) {
      sendTelegramConfirmation(phone, updatedFormData);
    }
  };

  const sendTelegramConfirmation = async (phone: string, data: FormData) => {
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          date: data.date,
          time: data.time,
          food: data.food,
          type: 'confirmation',
        }),
      });
    } catch (error) {
      console.error('Error sending Telegram:', error);
    }
  };

  const saveDate = async (data: Partial<FormData>) => {
    try {
      await fetch('/api/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      {screen === 'phone' && (
        <PhoneInput
          onConfirm={handlePhoneConfirm}
          onBack={() => setScreen('food')}
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
