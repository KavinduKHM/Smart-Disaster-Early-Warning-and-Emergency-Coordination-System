import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HazardType } from '../enums/hazard-type.enum';
import { HazardStatus } from '../enums/hazard-status.enum';

export class CreateHazardDto {
  @IsNotEmpty({ message: 'Hazard type is required' })
  @IsEnum(HazardType, { message: 'Invalid hazard type' })
  type!: HazardType;

  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title!: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description!: string;

  @IsNotEmpty({ message: 'Latitude is required' })
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Type(() => Number)
  latitude!: number;

  @IsNotEmpty({ message: 'Longitude is required' })
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  riverBasin?: string;

  @IsOptional()
  @IsString()
  severity?: string; // LOW, MEDIUM, HIGH, CRITICAL

  @IsOptional()
  @IsEnum(HazardStatus)
  status?: HazardStatus;
}
