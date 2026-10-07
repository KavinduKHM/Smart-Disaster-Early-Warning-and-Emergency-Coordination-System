import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReliefNeedDocument = HydratedDocument<ReliefNeed>;

@Schema({ timestamps: true })
export class ReliefNeed {
  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    enum: ['FOOD', 'WATER', 'MEDICINE', 'SHELTER', 'OTHER'],
  })
  category: string;

  @Prop({ required: true, min: 1 })
  quantityRequired: number;

  @Prop({ default: 'OPEN' })
  status: string;

  @Prop()
  priority: string;

  @Prop()
  createdBy: string;
}

export const ReliefNeedSchema = SchemaFactory.createForClass(ReliefNeed);