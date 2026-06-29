import { NextResponse } from 'next/server';
import { verifyCode, saveSession, getStoredSetupData } from '@/lib/telegram-client';

export async function POST(request: Request) {
  try {
    const { phone, code, phoneCodeHash } = await request.json();

    let resolvedPhone = phone;
    let resolvedHash = phoneCodeHash;

    if (!resolvedHash) {
      const stored = await getStoredSetupData();
      if (stored) {
        resolvedPhone = resolvedPhone || stored.phone;
        resolvedHash = stored.phoneCodeHash;
      }
    }

    if (!resolvedPhone || !code || !resolvedHash) {
      return NextResponse.json(
        { success: false, error: 'Phone, code, and hash required' },
        { status: 400 }
      );
    }

    const session = await verifyCode(resolvedPhone, code, resolvedHash);
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
