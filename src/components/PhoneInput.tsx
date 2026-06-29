'use client';

import React, { useState } from 'react';

interface PhoneInputProps {
  onConfirm: (phone: string | null) => void;
  onBack: () => void;
}

const countryCodes = [
  { code: '+1', country: 'US', name: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+880', country: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+7', country: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', country: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: '+84', country: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+92', country: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', country: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'NP', name: 'Nepal', flag: '🇳🇵' },
];

function detectCountry(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880')) return '+880';
  if (cleaned.startsWith('1')) return '+1';
  if (cleaned.startsWith('44')) return '+44';
  if (cleaned.startsWith('91')) return '+91';
  if (cleaned.startsWith('86')) return '+86';
  if (cleaned.startsWith('81')) return '+81';
  if (cleaned.startsWith('82')) return '+82';
  if (cleaned.startsWith('61')) return '+61';
  if (cleaned.startsWith('49')) return '+49';
  if (cleaned.startsWith('33')) return '+33';
  if (cleaned.startsWith('39')) return '+39';
  if (cleaned.startsWith('34')) return '+34';
  if (cleaned.startsWith('55')) return '+55';
  if (cleaned.startsWith('52')) return '+52';
  if (cleaned.startsWith('7')) return '+7';
  if (cleaned.startsWith('966')) return '+966';
  if (cleaned.startsWith('971')) return '+971';
  if (cleaned.startsWith('65')) return '+65';
  if (cleaned.startsWith('60')) return '+60';
  if (cleaned.startsWith('66')) return '+66';
  if (cleaned.startsWith('62')) return '+62';
  if (cleaned.startsWith('63')) return '+63';
  if (cleaned.startsWith('84')) return '+84';
  if (cleaned.startsWith('92')) return '+92';
  if (cleaned.startsWith('94')) return '+94';
  if (cleaned.startsWith('977')) return '+977';
  return null;
}

function validatePhone(phone: string, code: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  const codeDigits = code.replace('+', '');
  
  if (!cleaned.startsWith(codeDigits)) return false;
  
  const localNumber = cleaned.substring(codeDigits.length);
  
  if (code === '+880') return localNumber.length === 10;
  if (code === '+1') return localNumber.length === 10;
  if (code === '+44') return localNumber.length >= 10;
  if (code === '+91') return localNumber.length === 10;
  
  return localNumber.length >= 6 && localNumber.length <= 12;
}

export default function PhoneInput({ onConfirm, onBack }: PhoneInputProps) {
  const [selectedCode, setSelectedCode] = useState('+880');
  const [phone, setPhone] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    setPhone(cleaned);

    const detected = detectCountry(cleaned);
    if (detected) {
      setSelectedCode(detected);
    }

    if (cleaned.length > 3) {
      setShowWarning(!validatePhone(cleaned, selectedCode));
    } else {
      setShowWarning(false);
    }
  };

  const handleSubmit = () => {
    if (!phone) {
      onConfirm(null);
      return;
    }

    const fullNumber = `${selectedCode}${phone}`;
    onConfirm(fullNumber);
  };

  const selectedCountry = countryCodes.find(c => c.code === selectedCode);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full fade-in">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl md:text-3xl text-gray-800 mb-2">
            Want Telegram reminders? 📱
          </h1>
          <p className="text-gray-500 text-sm">Optional - we&apos;ll remind you 30 min before your date</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-pink-300 transition-colors"
              >
                <span className="text-xl">{selectedCountry?.flag}</span>
                <span className="font-medium">{selectedCode}</span>
                <span className="text-gray-400">▼</span>
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                  {countryCodes.map((country) => (
                    <button
                      key={`${country.code}-${country.country}`}
                      onClick={() => {
                        setSelectedCode(country.code);
                        setIsOpen(false);
                        if (phone) {
                          setShowWarning(!validatePhone(phone, country.code));
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-pink-50 transition-colors"
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="font-medium">{country.code}</span>
                      <span className="text-gray-600">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="123 456 7890"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none transition-colors"
            />
          </div>

          {showWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
              <p className="text-yellow-700 text-sm">
                ⚠️ This number may not have Telegram. You might not receive reminders.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            className="w-full btn-pink text-white font-semibold py-4 px-8 rounded-full text-lg"
          >
            {phone ? 'Send Confirmation 💬' : 'Skip - No Telegram ⏭️'}
          </button>

          <button
            onClick={onBack}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
