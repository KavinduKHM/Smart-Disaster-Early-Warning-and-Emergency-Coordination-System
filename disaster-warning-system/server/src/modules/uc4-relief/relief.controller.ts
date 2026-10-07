import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ReliefService } from './relief.service';

import { CreateShelterDto } from './dto/create-shelter.dto';
import { RegisterEvacueeDto } from './dto/register-evacuee.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { AllocateResourceDto } from './dto/allocate-resource.dto';
import { CreateReliefNeedDto } from './dto/create-relief-need.dto';

@Controller('uc4-relief')
export class ReliefController {
  constructor(
    private readonly reliefService: ReliefService,
  ) {}

  // ==========================
  // DASHBOARD
  // ==========================

  @Get('dashboard')
  getDashboard() {
    return this.reliefService.getDashboard();
  }

  // ==========================
  // RELIEF NEEDS
  // ==========================

  @Post('needs')
  createReliefNeed(
    @Body() dto: CreateReliefNeedDto,
  ) {
    return this.reliefService.createReliefNeed(dto);
  }

  @Get('needs')
  getReliefNeeds() {
    return this.reliefService.getReliefNeeds();
  }

  // ==========================
  // SHELTERS
  // ==========================

  @Post('shelters')
  createShelter(
    @Body() dto: CreateShelterDto,
  ) {
    return this.reliefService.createShelter(dto);
  }

  @Get('shelters')
  getShelters() {
    return this.reliefService.getShelters();
  }

  @Get('shelters/:id')
  getShelter(
    @Param('id') id: string,
  ) {
    return this.reliefService.getShelter(id);
  }

  @Patch('shelters/:id/status')
  updateShelterStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.reliefService.updateShelterStatus(
      id,
      status,
    );
  }

  // ==========================
  // EVACUEES
  // ==========================

  @Post('evacuees')
  registerEvacuee(
    @Body() dto: RegisterEvacueeDto,
  ) {
    return this.reliefService.registerEvacuee(
      dto,
    );
  }

  @Get('evacuees')
  getEvacuees(
    @Query('shelterId') shelterId?: string,
  ) {
    return this.reliefService.getEvacuees(
      shelterId,
    );
  }

  // ==========================
  // RESOURCES
  // ==========================

  @Post('resources')
  createResource(
    @Body() dto: CreateResourceDto,
  ) {
    return this.reliefService.createResource(dto);
  }

  @Get('resources')
  getResources() {
    return this.reliefService.getResources();
  }

  // ==========================
  // ALLOCATIONS
  // ==========================

  @Post('allocations')
  allocateResource(
    @Body() dto: AllocateResourceDto,
  ) {
    return this.reliefService.allocateResource(
      dto,
    );
  }

  @Get('allocations')
  getAllocations() {
    return this.reliefService.getAllocations();
  }
}