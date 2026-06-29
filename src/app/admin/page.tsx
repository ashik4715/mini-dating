'use client';

import React, { useState, useEffect } from 'react';

interface DateRequest {
  _id: string;
  name?: string;
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
  const [codeHash, setCodeHash] = useState('');
  const [step, setStep] = useState<'idle' | 'sent' | 'done'>('idle');
  const [tgLoading, setTgLoading] = useState(false);

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
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: setupPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeHash(data.phoneCodeHash);
        setStep('sent');
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
        body: JSON.stringify({ phone: setupPhone, code: setupCode, phoneCodeHash: codeHash }),
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
      setMessage('Verification failed');
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
    if (!date.phone) {
      setMessage('No phone number for this user');
      return;
    }
    try {
      const statusRes = await fetch('/api/telegram/status');
      const statusData = await statusRes.json();
      if (!statusData.connected) {
        setMessage('Userbot not connected! Please connect Telegram in the section above first.');
        return;
      }
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: date.phone,
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-white">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full">
          <h1 className="font-serif text-3xl text-gray-800 text-center mb-6">
            🔒 Admin Login
          </h1>

          {message && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none"
                placeholder="admin@minidate.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none"
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
    <div className="min-h-screen p-4 bg-gradient-to-br from-pink-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-serif text-3xl text-gray-800">
            📊 Admin Dashboard
          </h1>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-green-600 text-sm">
            {message}
            <button onClick={() => setMessage('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              🤖 Telegram Bot {telegramConnected ? '✅ Connected' : '❌ Not Connected'}
            </h2>
          </div>

          {step === 'done' ? (
            <p className="text-green-600">Telegram userbot is active and connected!</p>
          ) : step === 'sent' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value)}
                placeholder="Enter code from Telegram"
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none"
              />
              <button
                onClick={handleVerifyCode}
                disabled={tgLoading || !setupCode}
                className="btn-pink text-white font-semibold px-6 py-2 rounded-xl disabled:opacity-50"
              >
                {tgLoading ? '...' : 'Verify'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="tel"
                value={setupPhone}
                onChange={(e) => setSetupPhone(e.target.value)}
                placeholder="Your phone: +8801677280569"
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none"
              />
              <button
                onClick={handleSendCode}
                disabled={tgLoading || !setupPhone}
                className="btn-pink text-white font-semibold px-6 py-2 rounded-xl disabled:opacity-50"
              >
                {tgLoading ? '...' : 'Send Code'}
              </button>
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Date Requests ({dates.length})</h2>
            <button
              onClick={fetchDates}
              className="px-4 py-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : dates.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No date requests yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Time</th>
                    <th className="text-left py-3 px-2">Food</th>
                    <th className="text-left py-3 px-2">Phone</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Reminder</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((date) => (
                    <tr key={date._id} className="border-b border-gray-100 hover:bg-pink-50">
                      {editingId === date._id ? (
                        <>
                          <td className="py-3 px-2">
                            <input
                              type="date"
                              value={editForm.date?.toString().split('T')[0] || ''}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="text"
                              value={editForm.time || ''}
                              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <select
                              value={editForm.food || ''}
                              onChange={(e) => setEditForm({ ...editForm, food: e.target.value })}
                              className="w-full px-2 py-1 border rounded"
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
                              className="w-full px-2 py-1 border rounded"
                              placeholder="+880..."
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              value={editForm.reminderMinutes || 30}
                              onChange={(e) => setEditForm({ ...editForm, reminderMinutes: parseInt(e.target.value) })}
                              className="w-20 px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-gray-500">min</span>
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => handleSave(date._id)}
                              className="text-green-600 hover:text-green-800 mr-2"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500 hover:text-gray-700"
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
                              className="text-blue-600 hover:text-blue-800 mr-2"
                            >
                              ✏️
                            </button>
                            {date.phone && (
                              <button
                                onClick={() => sendMessageNow(date)}
                                className="text-green-600 hover:text-green-800 mr-2"
                                title="Message Now"
                              >
                                💬
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(date._id)}
                              className="text-red-600 hover:text-red-800"
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
