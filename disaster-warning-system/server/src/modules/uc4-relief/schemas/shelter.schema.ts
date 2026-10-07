import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ShelterDocument = HydratedDocument<Shelter>;

@Schema({ timestamps: true })
export class Shelter {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ default: 0, min: 0 })
  currentOccupancy: number;

  @Prop({
    default: 'AVAILABLE',
    enum: ['AVAILABLE', 'FULL', 'CLOSED'],
  })
  status: string;

  @Prop()
  managerName: string;

  @Prop()
  managerContact: string;

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
    },
  })
  location: {
    latitude: number;
    longitude: number;
  };
}

export const ShelterSchema = SchemaFactory.createForClass(Shelter);