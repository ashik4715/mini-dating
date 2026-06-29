export interface DateRequest {
  _id?: string;
  name?: string;
  chatId?: number;
  date: Date;
  time: string;
  food: string;
  phone?: string;
  status: 'accepted' | 'rejected';
  reminderMinutes: number;
  reminderSent: boolean;
  createdAt?: Date;
}

export interface FormData {
  name?: string;
  date: Date | null;
  time: string;
  food: string;
  phone?: string;
  status: 'accepted' | 'rejected';
}

export type Screen = 'welcome' | 'datetime' | 'food' | 'phone' | 'confirmation' | 'rejection';
