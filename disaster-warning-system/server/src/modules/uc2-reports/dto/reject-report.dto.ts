import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RejectReportDto {
  @IsString()
  @IsOptional()
  rejectedBy?: string;

  @IsString()
  @IsNotEmpty()
  remarks!: string;
}
