import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { HazardType } from '../enums/hazard-type.enum';
import { HazardStatus } from '../enums/hazard-status.enum';

export type HazardDocument = Hazard & Document;

@Schema({ timestamps: true })
export class LocationPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type!: string;

  @Prop({ type: [Number], required: true }) // [longitude, latitude]
  coordinates!: number[];
}

const LocationPointSchema = SchemaFactory.createForClass(LocationPoint);

@Schema({ timestamps: true })
export class Hazard {
  @Prop({ required: true, enum: Object.values(HazardType) })
  type!: HazardType;

  @Prop({ required: true, enum: Object.values(HazardStatus), default: HazardStatus.ACTIVE })
  status!: HazardStatus;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, type: LocationPointSchema, index: '2dsphere' })
  location!: LocationPoint;

  @Prop({ default: '' })
  district!: string;

  @Prop({ default: '' })
  riverBasin?: string;

  @Prop({ required: true, default: 'MEDIUM' }) // LOW, MEDIUM, HIGH, CRITICAL
  severity!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  reportedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const HazardSchema = SchemaFactory.createForClass(Hazard);
HazardSchema.index({ location: '2dsphere' });
