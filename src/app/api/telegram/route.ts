import { NextResponse } from 'next/server';
import { sendBotMessage } from '@/lib/bot-api';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getFoodEmoji(food: string): string {
  const emojis: Record<string, string> = {
    Pizza: '🍕',
    Sushi: '🍣',
    Burgers: '🍔',
    Pasta: '🍝',
    Tacos: '🌮',
    Ramen: '🍜',
  };
  return emojis[food] || '🍽️';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId, date, time, food, type } = body;

    if (!chatId || !date || !time || !food) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (chatId, date, time, food)' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    let message = '';

    if (type === 'confirmation') {
      message = `🎉 <b>Date Confirmed!</b>\n\n📅 Day: ${formatDate(dateObj)}\n⏰ Time: ${time}\n${getFoodEmoji(food)} Food: ${food}\n\nSee you there! 💕`;
    } else if (type === 'reminder') {
      const diffMs = dateObj.getTime() - Date.now();
      const diffMins = Math.round(diffMs / 60000);

      message = `⏰ <b>Reminder: ${diffMins} Minutes Remaining!</b>\n\nYour date is in ${diffMins} minutes:\n📅 ${formatDate(dateObj)}\n⏰ ${time}\n${getFoodEmoji(food)} ${food}\n\nDon't be late! 💕`;
    }

    try {
      await sendBotMessage(Number(chatId), message);
      return NextResponse.json({ success: true });
    } catch (e: unknown) {
      const err = e as Error;
      return NextResponse.json({ success: false, error: err.message || 'Failed to send message' });
    }
  } catch (error) {
    console.error('Telegram error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
