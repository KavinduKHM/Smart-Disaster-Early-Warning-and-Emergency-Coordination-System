import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdateReportDto {
  @IsString()
  @IsOptional()
  hazardType?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}
