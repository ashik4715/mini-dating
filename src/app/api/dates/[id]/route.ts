import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('dates');

    const updateData: Record<string, unknown> = {};
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.food !== undefined) updateData.food = body.food;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.time !== undefined) updateData.time = body.time;
    if (body.reminderMinutes !== undefined) updateData.reminderMinutes = body.reminderMinutes;
    if (body.chatId !== undefined) updateData.chatId = body.chatId ? Number(body.chatId) : null;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Date not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update date' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('dates');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Date not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete date' },
      { status: 500 }
    );
  }
}
