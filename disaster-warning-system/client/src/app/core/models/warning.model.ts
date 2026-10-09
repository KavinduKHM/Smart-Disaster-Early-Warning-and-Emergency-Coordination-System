import { Hazard } from './hazard.model';
import { User } from './user.model';

export enum WarningLevel {
  ADVISORY = 'Advisory',
  WATCH = 'Watch',
  WARNING = 'Warning',
  EMERGENCY = 'Emergency',
}

export enum WarningStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  BROADCASTING = 'BROADCASTING',
  BROADCAST_COMPLETE = 'BROADCAST_COMPLETE',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  SMS = 'SMS',
  AUDIBLE = 'AUDIBLE',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export interface ChannelDeliveryMetric {
  channel: NotificationChannel;
  sentAt?: string;
  targetRecipientCount: number;
  deliveredCount: number;
  acknowledgedCount: number;
  failedCount: number;
  status: string;
}

export interface HazardWarning {
  _id?: string;
  warningId: string;
  hazardId: string | Hazard;
  warningLevel: WarningLevel;
  message: string;
  emergencyInstructions: string;
  affectedDistricts: string[];
  affectedRiverBasins: string[];
  notificationChannels: NotificationChannel[];
  issuedBy: string | User;
  issuedAt: string;
  status: WarningStatus;
  deliveryStatus: ChannelDeliveryMetric[];
}
