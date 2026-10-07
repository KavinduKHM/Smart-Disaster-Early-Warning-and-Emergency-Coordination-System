import { NotificationChannel } from './warning.model';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export interface NotificationLog {
  _id: string;
  warningId: string;
  citizenId: any;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
  recipientAddress?: string;
  details?: string;
}
