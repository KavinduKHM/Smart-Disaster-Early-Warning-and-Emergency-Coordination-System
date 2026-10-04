import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReliefController } from './relief.controller';
import { ReliefService } from './relief.service';

import {
  Shelter,
  ShelterSchema,
} from './schemas/shelter.schema';

import {
  Evacuee,
  EvacueeSchema,
} from './schemas/evacuee.schema';

import {
  Resource,
  ResourceSchema,
} from './schemas/resource.schema';

import {
  ResourceAllocation,
  ResourceAllocationSchema,
} from './schemas/resource-allocation.schema';

import {
  ReliefNeed,
  ReliefNeedSchema,
} from './schemas/relief-need.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Shelter.name,
        schema: ShelterSchema,
      },
      {
        name: Evacuee.name,
        schema: EvacueeSchema,
      },
      {
        name: Resource.name,
        schema: ResourceSchema,
      },
      {
        name: ResourceAllocation.name,
        schema: ResourceAllocationSchema,
      },
      {
        name: ReliefNeed.name,
        schema: ReliefNeedSchema,
      },
    ]),
  ],

  controllers: [ReliefController],

  providers: [ReliefService],

  exports: [ReliefService],
})
export class ReliefModule {}