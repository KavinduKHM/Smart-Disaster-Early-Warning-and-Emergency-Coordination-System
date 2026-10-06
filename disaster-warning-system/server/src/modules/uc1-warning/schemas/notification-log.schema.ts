import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

export type NotificationLogDocument = NotificationLog & Document;

@Schema({ timestamps: true })
export class NotificationLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'HazardWarning', required: true, index: true })
  warningId!: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  citizenId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NotificationChannel) })
  channel!: NotificationChannel;

  @Prop({ required: true, enum: Object.values(NotificationStatus), default: NotificationStatus.PENDING })
  status!: NotificationStatus;

  @Prop({ type: Date, default: null })
  sentAt?: Date | null;

  @Prop({ type: Date, default: null })
  deliveredAt?: Date | null;

  @Prop({ type: Date, default: null })
  acknowledgedAt?: Date | null;

  @Prop({ default: '' })
  recipientAddress?: string; // Phone number, Push Token, or GPS Audible Device ID

  @Prop({ default: '' })
  details?: string;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);
NotificationLogSchema.index({ warningId: 1, citizenId: 1, channel: 1 });
