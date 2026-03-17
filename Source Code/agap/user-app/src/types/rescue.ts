export type RescueStatus = 'waiting' | 'rescued' | 'critical';

export interface RescueRequest {
  id: string;
  lat: number;
  lng: number;
  message: string;
  status: RescueStatus;
  priority: number; // 0-5
  peopleCount: number;
  distressKeywords: string[];
  createdAt: string; // ISO string
  rescuedAt?: string; // ISO string
  area?: string;
}

export interface StatsSnapshot {
  total: number;
  waiting: number;
  rescued: number;
  critical: number;
}

export type StoreMessage =
  | { type: 'NEW_REQUEST'; payload: RescueRequest }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: RescueStatus } };
