import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string; // Citizen Name or Rescue Team Name

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(['CITIZEN', 'RESCUE_TEAM', 'DUTY_OFFICER', 'DMC_OFFICER', 'DISTRICT_OFFICER'])
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  badgeId?: string;

  // Fields required when registering as RESCUE_TEAM
  @IsString()
  @IsOptional()
  organization?: string;

  @IsEnum(['WATER_RESCUE', 'SEARCH_AND_RESCUE', 'MEDICAL', 'FIRE', 'EVACUATION', 'GENERAL'])
  @IsOptional()
  teamType?: string;

  @IsNumber()
  @IsOptional()
  membersCount?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
