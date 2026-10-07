import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from '../enums/notification-channel.enum';

export class BroadcastWarningDto {
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true, message: 'Invalid notification channel' })
  channels?: NotificationChannel[];

  @IsOptional()
  @IsString()
  broadcastNotes?: string;
}
