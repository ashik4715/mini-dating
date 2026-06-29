'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

interface DateRequest {
  _id: string;
  name?: string;
  chatId?: number;
  date: string;
  time: string;
  food: string;
  phone?: string;
  status: 'accepted' | 'rejected';
  reminderMinutes: number;
  reminderSent: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dates, setDates] = useState<DateRequest[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DateRequest>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [setupPhone, setSetupPhone] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [step, setStep] = useState<'idle' | 'sent' | '2fa' | 'done'>('idle');
  const [tgLoading, setTgLoading] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [twoFAPassword, setTwoFAPassword] = useState('');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!codeExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((codeExpiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setCodeExpiry(null);
        setStep('idle');
        setSetupCode('');
        setMessage('Code expired. Click "Send Code" to get a new one.');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiry]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@minidate.com' && password === 'Jholok2026date!') {
      setIsLoggedIn(true);
      fetchDates();
    } else {
      setMessage('Invalid credentials');
    }
  };

  const fetchDates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dates');
      const data = await res.json();
      if (data.success) {
        setDates(data.dates);
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
    setLoading(false);
  };

  const checkTelegramStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      if (data.success && data.connected) {
        setTelegramConnected(true);
        setStep('done');
      }
    } catch {
      setTelegramConnected(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDates();
      checkTelegramStatus();
    }
  }, [isLoggedIn]);

  const handleSendCode = async () => {
    setTgLoading(true);
    setSetupCode('');
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: setupPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('sent');
        setCodeExpiry(data.expiresAt || Date.now() + 120000);
        setTimeLeft(120);
        setMessage('Code sent to Telegram!');
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage('Failed to send code');
    }
    setTgLoading(false);
  };

  const handleVerifyCode = async () => {
    setTgLoading(true);
    try {
      const res = await fetch('/api/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: setupCode }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramConnected(true);
        setStep('done');
        setCodeExpiry(null);
        setMessage('Telegram connected!');
      } else {
        if (data.error === '2FA_ENABLED') {
          setStep('2fa');
          setCodeExpiry(null);
          setMessage('2FA required. Enter your Telegram cloud password.');
        } else {
          setMessage(data.error);
          if (data.error?.toLowerCase().includes('expired')) {
            setSetupCode('');
            setCodeExpiry(null);
            setStep('idle');
          }
        }
      }
    } catch {
      setMessage('Verification failed');
    }
    setTgLoading(false);
  };

  const handle2FA = async () => {
    setTgLoading(true);
    try {
      const res = await fetch('/api/telegram/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: twoFAPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramConnected(true);
        setStep('done');
        setMessage('Telegram connected!');
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage('2FA verification failed');
    }
    setTgLoading(false);
  };

  const handleEdit = (date: DateRequest) => {
    setEditingId(date._id);
    setEditForm({
      phone: date.phone || '',
      food: date.food,
      date: date.date,
      time: date.time,
      reminderMinutes: date.reminderMinutes,
      chatId: date.chatId || undefined,
    });
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/dates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Updated successfully!');
        setEditingId(null);
        fetchDates();
      }
    } catch (error) {
      console.error('Error updating:', error);
      setMessage('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      const res = await fetch(`/api/dates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage('Deleted successfully!');
        fetchDates();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const sendMessageNow = async (date: DateRequest) => {
    if (!date.chatId) {
      setMessage('No Telegram chat ID for this user. They must open the app via t.me/mini_dating_bot first.');
      return;
    }
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: date.chatId,
          date: date.date,
          time: date.time,
          food: date.food,
          type: 'confirmation',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Message sent! ✅');
      } else {
        setMessage(data.error || 'Failed');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage('Network error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full dark:bg-gray-800/80">
          <h1 className="font-serif text-3xl text-gray-800 dark:text-gray-100 text-center mb-6">
            🔒 Admin Login
          </h1>

          {message && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-pink-500"
                placeholder="admin@minidate.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-pink-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-pink text-white font-semibold py-3 px-6 rounded-full"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-pink-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-serif text-3xl text-gray-800 dark:text-gray-100">
            📊 Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsLoggedIn(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-green-600 text-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
            {message}
            <button onClick={() => setMessage('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        <div className="glass-card rounded-3xl p-6 mb-6 dark:bg-gray-800/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold dark:text-gray-100">
              🤖 Telegram Bot {telegramConnected ? '✅ Connected' : '⚡ Bot API Active'}
            </h2>
          </div>

          {step === 'done' ? (
            <div className="space-y-2">
              <p className="text-green-600 dark:text-green-400">Telegram userbot is active and connected!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Messages are sent via Bot API (no userbot needed for messaging).</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={setupPhone}
                  onChange={(e) => setSetupPhone(e.target.value)}
                  placeholder="Your phone: +8801677280569"
                  disabled={step === 'sent'}
                  className={`flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-pink-500 ${step === 'sent' ? 'bg-gray-50 text-gray-500 dark:bg-gray-600' : ''}`}
                />
                <button
                  onClick={handleSendCode}
                  disabled={tgLoading || !setupPhone}
                  className="btn-pink text-white font-semibold px-6 py-2 rounded-xl disabled:opacity-50 whitespace-nowrap"
                >
                  {tgLoading ? '...' : step === 'sent' ? 'Resend' : 'Send Code'}
                </button>
              </div>
              {step === '2fa' && (
                <div className="space-y-2 animate-[fadeIn_0.3s_ease-in]">
                  <p className="text-sm text-amber-600 font-medium">
                    Your Telegram account has 2FA enabled. Enter your cloud password to complete login.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={twoFAPassword}
                      onChange={(e) => setTwoFAPassword(e.target.value)}
                      placeholder="Telegram cloud password"
                      className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-xl focus:border-amber-400 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && twoFAPassword && handle2FA()}
                    />
                    <button
                      onClick={handle2FA}
                      disabled={tgLoading || !twoFAPassword}
                      className="btn-pink text-white font-semibold px-6 py-2 rounded-xl disabled:opacity-50 whitespace-nowrap"
                    >
                      {tgLoading ? '...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
              {step === 'sent' && (
                <div className="space-y-2 animate-[fadeIn_0.3s_ease-in]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      placeholder="Enter code from Telegram"
                      className="flex-1 px-4 py-2 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:border-pink-500"
                      autoFocus
                    />
                    <button
                      onClick={handleVerifyCode}
                      disabled={tgLoading || !setupCode}
                      className="btn-pink text-white font-semibold px-6 py-2 rounded-xl disabled:opacity-50 whitespace-nowrap"
                    >
                      {tgLoading ? '...' : 'Verify'}
                    </button>
                  </div>
                  {timeLeft > 0 && (
                    <p className={`text-sm font-medium ${timeLeft <= 30 ? 'text-red-500' : 'text-gray-500'}`}>
                      Code expires in {formatTime(timeLeft)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-6 dark:bg-gray-800/80">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-gray-100">Date Requests ({dates.length})</h2>
            <button
              onClick={fetchDates}
              className="px-4 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p>
          ) : dates.length === 0 ? (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">No date requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 dark:text-gray-300">Date</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Time</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Food</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Phone</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Chat ID</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Reminder</th>
                    <th className="text-left py-3 px-2 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((date) => (
                    <tr key={date._id} className="border-b border-gray-100 hover:bg-pink-50 dark:border-gray-700 dark:hover:bg-gray-800">
                      {editingId === date._id ? (
                        <>
                          <td className="py-3 px-2">
                            <input
                              type="date"
                              value={editForm.date?.toString().split('T')[0] || ''}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={editForm.time || ''}
                              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <select
                              value={editForm.food || ''}
                              onChange={(e) => setEditForm({ ...editForm, food: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                            >
                              <option value="Pizza">🍕 Pizza</option>
                              <option value="Sushi">🍣 Sushi</option>
                              <option value="Burgers">🍔 Burgers</option>
                              <option value="Pasta">🍝 Pasta</option>
                              <option value="Tacos">🌮 Tacos</option>
                              <option value="Ramen">🍜 Ramen</option>
                            </select>
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                              placeholder="+880..."
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={editForm.chatId || ''}
                              onChange={(e) => setEditForm({ ...editForm, chatId: e.target.value ? Number(e.target.value) : undefined })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                              placeholder="Telegram chat ID"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              value={editForm.reminderMinutes || 30}
                              onChange={(e) => setEditForm({ ...editForm, reminderMinutes: parseInt(e.target.value) })}
                              className="w-20 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-gray-500 dark:text-gray-400">min</span>
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => handleSave(date._id)}
                              className="text-green-600 hover:text-green-800 mr-2 dark:text-green-400 dark:hover:text-green-300"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              ✕
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-2">
                            {new Date(date.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">{date.time}</td>
                          <td className="py-3 px-2">{date.food}</td>
                          <td className="py-3 px-2">{date.phone || '-'}</td>
                          <td className="py-3 px-2">
                            {date.chatId ? (
                              <span className="text-xs text-green-600 font-mono">{date.chatId}</span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              date.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {date.status}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {date.reminderMinutes} min
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => handleEdit(date)}
                              className="text-blue-600 hover:text-blue-800 mr-2 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => date.chatId && sendMessageNow(date)}
                              className={`mr-2 ${date.chatId ? 'text-[#0088cc] hover:text-[#0077b5]' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
                              title={date.chatId ? 'Message via Telegram Bot' : 'No chat ID - user must open app via t.me/mini_dating_bot'}
                              disabled={!date.chatId}
                            >
                              <i className="fab fa-telegram-plane text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(date._id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              🗑️
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
