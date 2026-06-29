import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
}

async function getChatId(phone: string): Promise<string | null> {
  if (!BOT_TOKEN) return null;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`
    );
    const data = await response.json();

    if (data.ok && data.result) {
      for (const update of data.result) {
        if (update.message?.contact?.phone_number) {
          const contactPhone = update.message.contact.phone_number.replace('+', '');
          const cleanPhone = phone.replace('+', '').replace(/\D/g, '');
          
          if (contactPhone === cleanPhone || contactPhone.endsWith(cleanPhone) || cleanPhone.endsWith(contactPhone)) {
            return update.message.chat.id.toString();
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting chat ID:', error);
    return null;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string): string {
  return time;
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

    const chatId = await getChatId(phone);
    
    if (!chatId) {
      return NextResponse.json({
        success: false,
        error: 'Could not find Telegram chat. User may need to start the bot first.',
        needsBotStart: true,
      });
    }

    const dateObj = new Date(date);
    let message = '';

    if (type === 'confirmation') {
      message = `🎉 <b>Date Confirmed!</b>\n\n📅 <b>Day:</b> ${formatDate(dateObj)}\n⏰ <b>Time:</b> ${formatTime(time)}\n${getFoodEmoji(food)} <b>Food:</b> ${food}\n\nSee you there! 💕`;
    } else if (type === 'reminder') {
      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      message = `⏰ <b>Reminder: ${diffMins} Minutes Remaining!</b>\n\nYour date is in ${diffMins} minutes:\n📅 ${formatDate(dateObj)}\n⏰ ${formatTime(time)}\n${getFoodEmoji(food)} ${food}\n\nDon't be late! 💕`;
    }

    const sent = await sendTelegramMessage(chatId, message);

    if (!sent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send Telegram message',
      });
    }

    return NextResponse.json({ success: true, chatId });
  } catch (error) {
    console.error('Telegram API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
