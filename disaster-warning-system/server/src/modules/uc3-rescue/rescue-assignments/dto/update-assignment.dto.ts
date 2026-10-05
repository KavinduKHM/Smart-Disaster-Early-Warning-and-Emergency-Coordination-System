import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create-assignment.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
  @IsOptional()
  @IsEnum(['ASSIGNED', 'DISPATCHED', 'ACCEPTED', 'REJECTED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'])
  status?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
