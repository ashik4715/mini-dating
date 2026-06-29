import { NextResponse } from 'next/server';
import { verifyCode, saveSession } from '@/lib/telegram-client';

export async function POST(request: Request) {
  try {
    const { phone, code, phoneCodeHash } = await request.json();

    if (!phone || !code || !phoneCodeHash) {
      return NextResponse.json(
        { success: false, error: 'Phone, code, and hash required' },
        { status: 400 }
      );
    }

    const session = await verifyCode(phone, code, phoneCodeHash);
    await saveSession(session);

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
