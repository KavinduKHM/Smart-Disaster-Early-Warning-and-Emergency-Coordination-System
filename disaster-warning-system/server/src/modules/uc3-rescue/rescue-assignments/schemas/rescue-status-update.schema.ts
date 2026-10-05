import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RescueStatusUpdateDocument = RescueStatusUpdate & Document;

@Schema({ timestamps: true })
export class RescueStatusUpdate {
  @Prop({ required: true })
  assignmentId: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  updatedBy: string;

  @Prop()
  notes: string;
}

export const RescueStatusUpdateSchema = SchemaFactory.createForClass(RescueStatusUpdate);
