import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroundReportDocument = GroundReport & Document;

@Schema({ timestamps: true })
export class GroundReport {
  @Prop({ required: true, unique: true })
  reportId!: string;

  @Prop({ required: true, default: 'CITIZEN-001' })
  reportedBy!: string;

  @Prop({ required: true, enum: ['CITIZEN', 'VOLUNTEER', 'DUTY_OFFICER'], default: 'CITIZEN' })
  reporterType!: string;

  @Prop({
    required: true,
    enum: [
      'FLOOD',
      'LANDSLIDE',
      'ROAD_BLOCKAGE',
      'RISING_RIVER',
      'FALLEN_TREE',
      'DAM_RIVER_ISSUE',
      'BUILDING_DAMAGE',
      'FIRE',
      'OTHER',
    ],
    default: 'FLOOD',
  })
  hazardType!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, default: 'Kandy' })
  district!: string;

  @Prop()
  address?: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location!: {
    type: string;
    coordinates: number[];
  };

  @Prop({ type: [String], default: [] })
  photos!: string[];

  @Prop({
    required: true,
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'ARCHIVED'],
    default: 'PENDING',
  })
  status!: string;

  @Prop()
  verificationRemarks?: string;

  @Prop()
  verifiedBy?: string;

  @Prop()
  verifiedAt?: Date;
}

export const GroundReportSchema = SchemaFactory.createForClass(GroundReport);

// Add 2dsphere index for location queries
GroundReportSchema.index({ location: '2dsphere' });
