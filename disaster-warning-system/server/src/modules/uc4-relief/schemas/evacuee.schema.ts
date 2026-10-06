import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EvacueeDocument = HydratedDocument<Evacuee>;

@Schema({ timestamps: true })
export class Evacuee {
  @Prop({ type: Types.ObjectId, ref: 'Shelter', required: true })
  shelterId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  nationalId: string;

  @Prop()
  age: number;

  @Prop()
  gender: string;

  @Prop()
  phone: string;

  @Prop()
  specialNeeds: string;

  @Prop({ default: 'ACTIVE' })
  status: string;
}

export const EvacueeSchema = SchemaFactory.createForClass(Evacuee);