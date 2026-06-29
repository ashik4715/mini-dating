import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { computeCheck } from 'telegram/Password';
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

export async function sendCode(phone: string): Promise<{ phoneCodeHash: string; expiresAt: number }> {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {});
  await client.connect();

  const { phoneCodeHash } = await client.invoke(
    new Api.auth.SendCode({
      phoneNumber: phone,
      apiId,
      apiHash,
      settings: new Api.CodeSettings({}),
    })
  ) as { phoneCodeHash: string };

  const sessionString = client.session.save() as unknown as string;

  const db = await getDatabase();
  const expiresAt = Date.now() + 2 * 60 * 1000;
  await db.collection('telegram_sessions').updateOne(
    { key: 'setup_pending' },
    {
      $set: {
        key: 'setup_pending',
        phone,
        phoneCodeHash,
        sessionString,
        expiresAt,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  client.disconnect();

  return { phoneCodeHash, expiresAt };
}

export async function verifyCode(phone: string, code: string, phoneCodeHash?: string): Promise<string> {
  const db = await getDatabase();
  const pending = await db.collection('telegram_sessions').findOne({ key: 'setup_pending' });

  if (!pending) {
    throw new Error('No pending setup. Click "Send Code" first.');
  }

  if (pending.expiresAt && Date.now() > pending.expiresAt) {
    await db.collection('telegram_sessions').deleteOne({ key: 'setup_pending' });
    throw new Error('Code expired. Click "Resend" to get a new one.');
  }

  const resolvedPhone = phone || pending.phone;
  const resolvedHash = phoneCodeHash || pending.phoneCodeHash;
  const sessionString = pending.sessionString || '';

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {});
  await client.connect();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: resolvedPhone,
        phoneCodeHash: resolvedHash,
        phoneCode: code,
      })
    );

    const finalSession = client.session.save() as unknown as string;

    await db.collection('telegram_sessions').deleteOne({ key: 'setup_pending' });
    await db.collection('telegram_sessions').updateOne(
      { key: 'userbot' },
      { $set: { key: 'userbot', session: finalSession, createdAt: new Date() } },
      { upsert: true }
    );

    clientInstance = null;
    client.disconnect();

    return finalSession;
  } catch (e: unknown) {
    const err = e as Error & { errorMessage?: string };

    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      const partialSession = client.session.save() as unknown as string;
      await db.collection('telegram_sessions').updateOne(
        { key: 'setup_pending' },
        {
          $set: {
            key: 'setup_pending',
            sessionString: partialSession,
            phone: resolvedPhone,
            phoneCodeHash: resolvedHash,
            needs2FA: true,
          },
        },
        { upsert: true }
      );
      client.disconnect();
      throw new Error('2FA_ENABLED');
    }

    client.disconnect();

    if (err.errorMessage?.includes('PHONE_CODE_INVALID')) {
      throw new Error('Invalid code. Please try again.');
    }
    if (err.errorMessage?.includes('PHONE_CODE_EXPIRED')) {
      await db.collection('telegram_sessions').deleteOne({ key: 'setup_pending' });
      throw new Error('Code expired. Click "Resend" to get a new one.');
    }
    if (err.errorMessage?.includes('FLOOD_WAIT')) {
      const match = err.errorMessage?.match(/FLOOD_WAIT_(\d+)/);
      const secs = match ? parseInt(match[1]) : 60;
      throw new Error(`Too many attempts. Wait ${secs} seconds.`);
    }
    throw new Error(err.message || 'Verification failed');
  }
}

export async function verify2FA(password: string): Promise<string> {
  const db = await getDatabase();
  const pending = await db.collection('telegram_sessions').findOne({ key: 'setup_pending' });

  if (!pending || !pending.needs2FA) {
    throw new Error('No pending 2FA verification. Start over with Send Code.');
  }

  const sessionString = pending.sessionString || '';
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {});
  await client.connect();

  try {
    const pwdInfo = await client.invoke(new Api.account.GetPassword());

    const passwordSrp = await computeCheck(pwdInfo, password);

    await client.invoke(
      new Api.auth.CheckPassword({
        password: passwordSrp,
      })
    );

    const finalSession = client.session.save() as unknown as string;

    await db.collection('telegram_sessions').deleteOne({ key: 'setup_pending' });
    await db.collection('telegram_sessions').updateOne(
      { key: 'userbot' },
      { $set: { key: 'userbot', session: finalSession, createdAt: new Date() } },
      { upsert: true }
    );

    clientInstance = null;
    client.disconnect();

    return finalSession;
  } catch (e: unknown) {
    const err = e as Error & { errorMessage?: string };
    client.disconnect();

    if (err.errorMessage?.includes('PASSWORD_HASH_INVALID')) {
      throw new Error('Wrong 2FA password. Please try again.');
    }
    throw new Error(err.message || '2FA verification failed');
  }
}

export async function getStoredSetupData(): Promise<{ phone: string; phoneCodeHash: string; expiresAt?: number } | null> {
  try {
    const db = await getDatabase();
    const doc = await db.collection('telegram_sessions').findOne({ key: 'setup_pending' });
    if (doc) {
      return { phone: doc.phone, phoneCodeHash: doc.phoneCodeHash, expiresAt: doc.expiresAt };
    }
  } catch {}
  return null;
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

export async function resolvePhoneToChatId(phone: string): Promise<number | null> {
  try {
    const db = await getDatabase();
    const sessionDoc = await db.collection('telegram_sessions').findOne({ key: 'userbot' });
    if (!sessionDoc?.session) return null;

    const client = new TelegramClient(new StringSession(sessionDoc.session), apiId, apiHash, {});
    await client.connect();

    try {
      const cleanPhone = phone.replace(/^\+/, '');
      const resolved = await client.invoke(
        new Api.contacts.ResolvePhone({ phone: cleanPhone })
      );
      const user = resolved.users[0] as { id?: { toJSNumber?: () => number } | number; accessHash?: unknown };
      if (!user || !user.id) return null;

      const chatId = typeof user.id === 'number'
        ? user.id
        : (user.id.toJSNumber ? user.id.toJSNumber() : Number(user.id));
      return chatId;
    } finally {
      client.disconnect();
    }
  } catch {
    return null;
  }
}

export async function sendTelegramMessage(phone: string, message: string): Promise<boolean> {
  const client = await getClient();

  try {
    const resolved = await client.invoke(
      new Api.contacts.ResolvePhone({ phone })
    );

    const user = resolved.users[0];
    if (!user || !('id' in user)) {
      throw new Error('Could not resolve phone number on Telegram.');
    }

    const inputPeer = new Api.InputPeerUser({
      userId: (user as any).id,
      accessHash: (user as any).accessHash,
    });

    await client.sendMessage(inputPeer, { message });
    return true;
  } catch (e: unknown) {
    const err = e as Error & { errorMessage?: string };
    if (err.errorMessage === 'PHONE_NOT_OCCUPIED') {
      throw new Error('This phone number is not registered on Telegram.');
    }
    if (err.errorMessage === 'USER_PRIVACY_RESTRICTED') {
      throw new Error('Recipient has privacy settings blocking non-contacts. Ask them to change: Telegram → Settings → Privacy → Messages → Allow from Everybody.');
    }
    if (err.errorMessage === 'USER_IS_BLOCKED') {
      throw new Error('User has blocked this account.');
    }
    if (err.errorMessage?.includes('FLOOD_WAIT')) {
      const match = err.errorMessage.match(/FLOOD_WAIT_(\d+)/);
      const secs = match ? parseInt(match[1]) : 60;
      throw new Error(`Too many messages. Wait ${secs} seconds.`);
    }
    throw new Error(err.message || 'Failed to send message');
  }
}
