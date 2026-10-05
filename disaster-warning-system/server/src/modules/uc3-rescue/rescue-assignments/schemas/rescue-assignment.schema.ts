import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RescueAssignmentDocument = RescueAssignment & Document;

@Schema({ timestamps: true })
export class RescueAssignment {
  @Prop({ required: true, unique: true })
  assignmentId: string;

  @Prop({ required: true })
  incidentId: string;

  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  assignedBy: string;

  @Prop({ required: true, enum: ['ASSIGNED', 'DISPATCHED', 'ACCEPTED', 'REJECTED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'], default: 'ASSIGNED' })
  status: string;

  @Prop({ default: Date.now })
  assignedAt: Date;

  @Prop()
  acceptedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop()
  notes: string;
}

export const RescueAssignmentSchema = SchemaFactory.createForClass(RescueAssignment);
