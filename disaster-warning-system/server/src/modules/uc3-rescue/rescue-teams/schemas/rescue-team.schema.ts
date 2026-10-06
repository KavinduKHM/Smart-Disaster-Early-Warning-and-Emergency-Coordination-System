import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RescueTeamDocument = RescueTeam & Document;

@Schema({ timestamps: true })
export class RescueTeam {
  @Prop({ required: true, unique: true })
  teamId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  organization: string;

  @Prop({ required: true, enum: ['WATER_RESCUE', 'SEARCH_AND_RESCUE', 'MEDICAL', 'FIRE', 'EVACUATION', 'GENERAL'] })
  type: string;

  @Prop({ required: true })
  members: number;

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

  @Prop({ required: true, enum: ['AVAILABLE', 'ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'INACTIVE'], default: 'AVAILABLE' })
  status: string;
}

export const RescueTeamSchema = SchemaFactory.createForClass(RescueTeam);
RescueTeamSchema.index({ location: '2dsphere' });
