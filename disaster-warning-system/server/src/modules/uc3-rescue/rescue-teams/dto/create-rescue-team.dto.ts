import { IsString, IsNumber, IsEnum, ValidateNested, IsNotEmpty, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsEnum(['Point'])
  type: string = 'Point';

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export class CreateRescueTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  organization: string;

  @IsEnum(['WATER_RESCUE', 'SEARCH_AND_RESCUE', 'MEDICAL', 'FIRE', 'EVACUATION', 'GENERAL'])
  type: string;

  @IsNumber()
  members: number;

  @IsString()
  @IsNotEmpty()
  district: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
