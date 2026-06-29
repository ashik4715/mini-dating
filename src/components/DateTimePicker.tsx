'use client';

import { useState } from 'react';

interface DateTimePickerProps {
  onConfirm: (date: Date, time: string) => void;
  onBack: () => void;
}

const timeSlots = [
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '6:30 PM',
  '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
];

const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DateTimePicker({ onConfirm, onBack }: DateTimePickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const selectDate = (day: number) => {
    if (isPast(day)) return;
    setSelectedDate(new Date(year, month, day));
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm(selectedDate, selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full fade-in">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-gray-800 mb-2">
            So... when are you free?
          </h1>
          <span className="text-xl">📅🐾</span>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">Pick a day</p>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                &lt;
              </button>
              <h3 className="font-serif text-lg">{formatDate(currentDate)}</h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                &gt;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-sm text-gray-500 font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const past = isPast(day);
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    onClick={() => selectDate(day)}
                    disabled={past}
                    className={`calendar-day w-10 h-10 rounded-full flex items-center justify-center text-sm
                      ${past ? 'disabled text-gray-600' : 'hover:bg-pink-50'}
                      ${selected ? 'selected bg-pink-500 text-white' : ''}
                      ${today && !selected ? 'font-bold' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">What time?</p>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`time-slot py-3 px-2 rounded-xl border-2 text-sm font-medium
                  ${selectedTime === time ? 'selected border-pink-500 bg-pink-50' : 'border-gray-200'}
                `}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime}
          className="w-full btn-pink text-white font-semibold py-4 px-8 rounded-full text-lg
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Set the date ❤️
        </button>
      </div>
    </div>
  );
}
