import { IsString, IsNumber, IsArray, IsEnum, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsEnum(['Point'])
  type: string = 'Point';

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority: string;

  @IsNumber()
  peopleAffected: number;

  @IsArray()
  @IsString({ each: true })
  requiredAssistance: string[];

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
