import { PartialType } from '@nestjs/mapped-types';
import { CreateRescueTeamDto } from './create-rescue-team.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateRescueTeamDto extends PartialType(CreateRescueTeamDto) {
  @IsOptional()
  @IsEnum(['AVAILABLE', 'ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'INACTIVE'])
  status?: string;
}
