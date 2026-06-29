import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { DateRequest } from '@/types';
import { resolvePhoneToChatId } from '@/lib/telegram-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, chatId, date, time, food, phone, status } = body;

    if (!date || !time || !food || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let resolvedChatId: number | null = null;
    if (chatId) {
      resolvedChatId = Number(chatId);
    } else if (phone) {
      try {
        resolvedChatId = await resolvePhoneToChatId(phone);
      } catch {
        resolvedChatId = null;
      }
    }

    const db = await getDatabase();
    const collection = db.collection<DateRequest>('dates');

    const dateRequest: DateRequest = {
      name: name || undefined,
      chatId: resolvedChatId || undefined,
      date: new Date(date),
      time,
      food,
      phone: phone || undefined,
      status,
      reminderMinutes: 30,
      reminderSent: false,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(dateRequest);

    return NextResponse.json({
      success: true,
      date: { ...dateRequest, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Error saving date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save date' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection<DateRequest>('dates');

    const dates = await collection.find({}).sort({ createdAt: -1 }).toArray();

    const outdated = dates.filter((d) => !d.chatId && d.phone);
    if (outdated.length > 0) {
      const batch = outdated.slice(0, 3);
      for (const doc of batch) {
        try {
          const id = await resolvePhoneToChatId(doc.phone!);
          if (id) {
            const filter = { _id: doc._id } as { _id: typeof doc._id };
            await collection.updateOne(filter, { $set: { chatId: id } });
            doc.chatId = id;
          }
        } catch {}
      }
    }

    return NextResponse.json({ success: true, dates });
  } catch (error) {
    console.error('Error fetching dates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dates' },
      { status: 500 }
    );
  }
}
