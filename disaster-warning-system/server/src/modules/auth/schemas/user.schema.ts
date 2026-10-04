import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({
    required: true,
    enum: ['CITIZEN', 'VOLUNTEER', 'DUTY_OFFICER', 'DMC_OFFICER', 'DISTRICT_OFFICER'],
    default: 'CITIZEN',
  })
  role!: string;

  @Prop({ default: 'Kandy' })
  district!: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  badgeId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
