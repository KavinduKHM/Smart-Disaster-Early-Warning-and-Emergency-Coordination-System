import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportVerificationDocument = ReportVerification & Document;

@Schema({ timestamps: true })
export class ReportVerification {
  @Prop({ required: true })
  reportId!: string;

  @Prop({ required: true, default: 'OFFICER-001' })
  verifiedBy!: string;

  @Prop({ required: true, enum: ['VERIFIED', 'REJECTED', 'ARCHIVED'] })
  status!: string;

  @Prop({ required: true })
  remarks!: string;

  @Prop({ default: Date.now })
  verifiedAt!: Date;
}

export const ReportVerificationSchema = SchemaFactory.createForClass(ReportVerification);
