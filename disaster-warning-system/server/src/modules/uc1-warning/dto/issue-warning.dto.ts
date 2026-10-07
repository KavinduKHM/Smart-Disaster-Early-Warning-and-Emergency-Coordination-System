import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { WarningLevel } from '../enums/warning-level.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

export class IssueWarningDto {
  @IsNotEmpty({ message: 'Hazard ID is required' })
  @IsString()
  hazardId!: string;

  @IsNotEmpty({ message: 'Warning level is required' })
  @IsEnum(WarningLevel, { message: 'Invalid warning level' })
  warningLevel!: WarningLevel;

  @IsNotEmpty({ message: 'Message content is required' })
  @IsString()
  message!: string;

  @IsNotEmpty({ message: 'Emergency instructions are required' })
  @IsString()
  emergencyInstructions!: string;

  @IsArray({ message: 'Affected districts must be an array of strings' })
  @IsString({ each: true })
  affectedDistricts!: string[];

  @IsArray({ message: 'Affected river basins must be an array of strings' })
  @IsString({ each: true })
  @IsOptional()
  affectedRiverBasins?: string[];

  @IsArray({ message: 'Notification channels must be an array' })
  @ArrayMinSize(1, { message: 'Select at least one notification channel' })
  @IsEnum(NotificationChannel, { each: true, message: 'Invalid notification channel' })
  notificationChannels!: NotificationChannel[];
}
