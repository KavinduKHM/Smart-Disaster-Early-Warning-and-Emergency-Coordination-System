import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  name!: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role specified' })
  role?: UserRole;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  riverBasin?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  pushToken?: string;

  @IsOptional()
  @IsString()
  badgeId?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  teamType?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  membersCount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}
