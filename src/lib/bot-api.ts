const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function sendBotMessage(chatId: number, message: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const res = await fetch(
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

  const data = await res.json();

  if (!data.ok) {
    const desc = data.description || 'Unknown error';
    if (desc.includes('bot was blocked by the user')) {
      throw new Error('User has blocked the bot.');
    }
    if (desc.includes('chat not found')) {
      throw new Error('Chat not found. User needs to start the bot first at t.me/mini_dating_bot');
    }
    if (desc.includes('USER_DEACTIVATED')) {
      throw new Error('User account is deactivated.');
    }
    if (desc.includes('FLOOD_WAIT')) {
      throw new Error('Too many messages. Wait a moment and try again.');
    }
    throw new Error(desc);
  }

  return true;
}
