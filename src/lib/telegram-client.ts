import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { getDatabase } from './mongodb';

const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';

let clientInstance: TelegramClient | null = null;

export async function getClient(): Promise<TelegramClient> {
  const db = await getDatabase();
  const sessions = db.collection('telegram_sessions');
  const sessionDoc = await sessions.findOne({ key: 'userbot' });
  const sessionString = sessionDoc?.session || '';

  if (clientInstance?.connected) {
    return clientInstance;
  }

  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();

  if (sessionString) {
    try {
      await client.getMe();
    } catch {
      throw new Error('Session expired. Re-login required.');
    }
  }

  clientInstance = client;
  return client;
}

export async function sendCode(phone: string): Promise<string> {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {});
  await client.connect();

  const result = await client.invoke(
    new Api.auth.SendCode({
      phoneNumber: phone,
      apiId,
      apiHash,
      settings: new Api.CodeSettings({}),
    })
  ) as { phoneCodeHash: string };

  return result.phoneCodeHash;
}

export async function verifyCode(phone: string, code: string, phoneCodeHash: string): Promise<string> {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {});
  await client.connect();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code,
      })
    );
    return client.session.save() as unknown as string;
  } catch (e: unknown) {
    const err = e as Error & { errorMessage?: string };
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      throw new Error('2FA enabled. Password required.');
    }
    if (err.errorMessage?.includes('PHONE_CODE_INVALID')) {
      throw new Error('Invalid code. Please try again.');
    }
    if (err.errorMessage?.includes('FLOOD_WAIT')) {
      const match = err.errorMessage.match(/FLOOD_WAIT_(\d+)/);
      const secs = match ? parseInt(match[1]) : 60;
      throw new Error(`Too many attempts. Wait ${secs} seconds.`);
    }
    throw err;
  }
}

export async function saveSession(session: string): Promise<void> {
  const db = await getDatabase();
  const sessions = db.collection('telegram_sessions');
  await sessions.updateOne(
    { key: 'userbot' as string },
    { $set: { key: 'userbot', session, createdAt: new Date() } },
    { upsert: true }
  );
  clientInstance = null;
}

export async function getUserbotStatus(): Promise<{ connected: boolean; phone?: string }> {
  try {
    const client = await getClient();
    const me = await client.getMe() as { phone?: string };
    return { connected: true, phone: me?.phone };
  } catch {
    return { connected: false };
  }
}

export async function sendTelegramMessage(phone: string, message: string): Promise<boolean> {
  const client = await getClient();
  const result = await client.sendMessage(phone, { message });
  return !!result;
}
