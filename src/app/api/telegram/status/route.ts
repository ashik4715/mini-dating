import { NextResponse } from 'next/server';
import { getUserbotStatus } from '@/lib/telegram-client';

export async function GET() {
  try {
    const status = await getUserbotStatus();
    return NextResponse.json({
      success: true,
      connected: status.connected,
      phone: status.phone,
      configured: !!(process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH),
    });
  } catch {
    return NextResponse.json({
      success: true,
      connected: false,
      configured: !!(process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH),
    });
  }
}
