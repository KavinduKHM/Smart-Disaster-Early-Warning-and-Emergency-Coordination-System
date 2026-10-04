import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResourceDocument = HydratedDocument<Resource>;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  organization: string;

  @Prop({ required: true })
  storageLocation: string;

  @Prop({
    required: true,
    enum: [
      'AVAILABLE',
      'ALLOCATED',
      'DISTRIBUTED',
      'OUT_OF_STOCK',
    ],
    default: 'AVAILABLE',
  })
  status: string;

  @Prop({ default: '' })
  description: string;
}

export const ResourceSchema =
  SchemaFactory.createForClass(Resource);