import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  incidentId: string;

  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsNotEmpty()
  assignedBy: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
