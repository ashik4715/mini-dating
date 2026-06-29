import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram-client';

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
    const { phone, date, time, food, type } = body;

    if (!phone || !date || !time || !food) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    let message = '';

    if (type === 'confirmation') {
      message = `🎉 Date Confirmed!\n\n📅 Day: ${formatDate(dateObj)}\n⏰ Time: ${time}\n${getFoodEmoji(food)} Food: ${food}\n\nSee you there! 💕`;
    } else if (type === 'reminder') {
      const diffMs = dateObj.getTime() - Date.now();
      const diffMins = Math.round(diffMs / 60000);

      message = `⏰ Reminder: ${diffMins} Minutes Remaining!\n\nYour date is in ${diffMins} minutes:\n📅 ${formatDate(dateObj)}\n⏰ ${time}\n${getFoodEmoji(food)} ${food}\n\nDon't be late! 💕`;
    }

    try {
      await sendTelegramMessage(phone.replace('+', ''), message);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Could not send message. User might have privacy settings blocking non-contacts.',
      });
    }
  } catch (error) {
    console.error('Telegram error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
