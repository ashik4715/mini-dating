import { NextResponse } from 'next/server';
import { verifyCode } from '@/lib/telegram-client';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Verification code required' },
        { status: 400 }
      );
    }

    await verifyCode('', code);

    return NextResponse.json({
      success: true,
      message: 'Telegram connected successfully!',
    });
  } catch (e: unknown) {
    const err = e as Error;
    console.error('Verify error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
