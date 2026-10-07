import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ResourceAllocationDocument =
  HydratedDocument<ResourceAllocation>;

@Schema({ timestamps: true })
export class ResourceAllocation {
  @Prop({
    type: Types.ObjectId,
    ref: 'Resource',
    required: true,
  })
  resourceId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Shelter',
    required: true,
  })
  shelterId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop()
  distributedBy: string;

  @Prop()
  notes: string;

  @Prop({ default: 'ALLOCATED' })
  status: string;
}

export const ResourceAllocationSchema =
  SchemaFactory.createForClass(ResourceAllocation);