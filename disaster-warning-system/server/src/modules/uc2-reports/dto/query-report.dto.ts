import { IsString, IsOptional } from 'class-validator';

export class QueryReportDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  hazardType?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  reportedBy?: string;
}
