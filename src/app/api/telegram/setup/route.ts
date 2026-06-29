import { NextResponse } from 'next/server';
import { sendCode } from '@/lib/telegram-client';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number required' },
        { status: 400 }
      );
    }

    if (!process.env.TELEGRAM_API_ID || !process.env.TELEGRAM_API_HASH) {
      return NextResponse.json(
        { success: false, error: 'Telegram API credentials not configured' },
        { status: 400 }
      );
    }

    const phoneCodeHash = await sendCode(phone);

    return NextResponse.json({
      success: true,
      phoneCodeHash,
      message: 'Code sent to your Telegram!',
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Setup error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to send code' },
      { status: 500 }
    );
  }
}
