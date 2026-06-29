import { NextResponse } from 'next/server';
import { verify2FA } from '@/lib/telegram-client';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: '2FA password required' },
        { status: 400 }
      );
    }

    await verify2FA(password);

    return NextResponse.json({
      success: true,
      message: 'Telegram connected successfully!',
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('2FA verify error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || '2FA verification failed' },
      { status: 500 }
    );
  }
}
