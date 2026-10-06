import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { WarningLevel } from '../enums/warning-level.enum';

export class EscalateWarningDto {
  @IsNotEmpty({ message: 'New warning level is required for escalation' })
  @IsEnum(WarningLevel, { message: 'Invalid warning level' })
  newWarningLevel!: WarningLevel;

  @IsOptional()
  @IsString()
  updatedMessage?: string;

  @IsOptional()
  @IsString()
  updatedInstructions?: string;

  @IsOptional()
  @IsString()
  escalationReason?: string;
}
