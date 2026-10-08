import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.CITIZEN,
  })
  role!: UserRole;

  @Prop({ default: 'Colombo' })
  district!: string;

  @Prop({ default: '' })
  riverBasin?: string;

  @Prop({ default: '' })
  phone!: string;

  @Prop({ default: '' })
  address?: string;

  @Prop({ type: Number, default: 7.2906 })
  latitude?: number;

  @Prop({ type: Number, default: 80.6337 })
  longitude?: number;
  pushToken?: string;

  @Prop({ default: '' })
  badgeId?: string;

  // Additional fields for specialized accounts
  @Prop()
  teamId?: string;

  @Prop()
  organization?: string;

  @Prop()
  teamType?: string;

  @Prop()
  membersCount?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
