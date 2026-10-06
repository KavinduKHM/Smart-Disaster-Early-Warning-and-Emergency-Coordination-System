import { PartialType } from '@nestjs/mapped-types';
import { CreateHazardDto } from './create-hazard.dto';

export class UpdateHazardDto extends PartialType(CreateHazardDto) {}
