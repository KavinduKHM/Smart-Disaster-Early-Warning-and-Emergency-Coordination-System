import { IsString, IsOptional } from 'class-validator';

export class VerifyReportDto {
  @IsString()
  @IsOptional()
  verifiedBy?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  severity?: string;
}
