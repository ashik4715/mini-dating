export interface DateRequest {
  _id?: string;
  name?: string;
  date: Date;
  time: string;
  food: string;
  status: 'accepted' | 'rejected';
  createdAt?: Date;
}

export interface FormData {
  name?: string;
  date: Date | null;
  time: string;
  food: string;
  status: 'accepted' | 'rejected';
}

export type Screen = 'welcome' | 'datetime' | 'food' | 'confirmation' | 'rejection';
