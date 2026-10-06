import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  hazardType!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsNotEmpty()
  latitude!: number;

  @IsNumber()
  @IsNotEmpty()
  longitude!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  reportedBy?: string;

  @IsEnum(['CITIZEN', 'DUTY_OFFICER'])
  @IsOptional()
  reporterType?: string;
}
