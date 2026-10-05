import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IncidentDocument = Incident & Document;

@Schema({ timestamps: true })
export class Incident {
  @Prop({ required: true, unique: true })
  incidentId: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  district: string;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  priority: string;

  @Prop({ required: true })
  peopleAffected: number;

  @Prop({ type: [String], required: true })
  requiredAssistance: string[];

  @Prop({ required: true, enum: ['ACTIVE', 'CLOSED', 'ARCHIVED'], default: 'ACTIVE' })
  status: string;

  @Prop({ default: Date.now })
  reportedAt: Date;

  @Prop({ required: true })
  createdBy: string;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
IncidentSchema.index({ location: '2dsphere' });
