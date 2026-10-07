import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GeoQueryDto {
  @IsNotEmpty({ message: 'Latitude is required' })
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Type(() => Number)
  latitude!: number;

  @IsNotEmpty({ message: 'Longitude is required' })
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Radius in kilometers must be a number' })
  @Type(() => Number)
  radiusKm?: number = 50; // Default search radius: 50km
}
