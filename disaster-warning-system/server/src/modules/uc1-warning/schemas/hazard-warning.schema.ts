import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { WarningLevel } from '../enums/warning-level.enum';
import { WarningStatus } from '../enums/warning-status.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

export type HazardWarningDocument = HazardWarning & Document;

@Schema({ _id: false })
export class ChannelDeliveryMetric {
  @Prop({ required: true, enum: Object.values(NotificationChannel) })
  channel!: NotificationChannel;

  @Prop({ type: Date, default: null })
  sentAt?: Date | null;

  @Prop({ default: 0 })
  targetRecipientCount!: number;

  @Prop({ default: 0 })
  deliveredCount!: number;

  @Prop({ default: 0 })
  acknowledgedCount!: number;

  @Prop({ default: 0 })
  failedCount!: number;

  @Prop({ default: 'PENDING' })
  status!: string;
}

const ChannelDeliveryMetricSchema = SchemaFactory.createForClass(ChannelDeliveryMetric);

@Schema({ timestamps: true })
export class HazardWarning {
  @Prop({ required: true, unique: true, index: true })
  warningId!: string; // e.g. WARN-2026-001

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hazard', required: true })
  hazardId!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(WarningLevel), default: WarningLevel.WARNING })
  warningLevel!: WarningLevel;

  @Prop({ required: true })
  message!: string;

  @Prop({ required: true })
  emergencyInstructions!: string;

  @Prop({ type: [String], default: [] })
  affectedDistricts!: string[];

  @Prop({ type: [String], default: [] })
  affectedRiverBasins!: string[];

  @Prop({
    type: [String],
    enum: Object.values(NotificationChannel),
    default: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.AUDIBLE],
  })
  notificationChannels!: NotificationChannel[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  issuedBy!: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  issuedAt!: Date;

  @Prop({ required: true, enum: Object.values(WarningStatus), default: WarningStatus.DRAFT })
  status!: WarningStatus;

  @Prop({ type: [ChannelDeliveryMetricSchema], default: [] })
  deliveryStatus!: ChannelDeliveryMetric[];
}

export const HazardWarningSchema = SchemaFactory.createForClass(HazardWarning);
