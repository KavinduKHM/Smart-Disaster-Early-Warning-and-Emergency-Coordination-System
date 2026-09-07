import { Controller, Get, Post, Body } from '@nestjs/common';
import { ReliefService } from './relief.service';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { AllocateResourceDto } from './dto/allocate-resource.dto';

@Controller('relief')
export class ReliefController {
  constructor(private readonly reliefService: ReliefService) {}

  @Get('shelters')
  getShelters() {
    return this.reliefService.getShelters();
  }

  @Post('shelters')
  createShelter(@Body() dto: CreateShelterDto) {
    return this.reliefService.createShelter(dto);
  }

  @Post('resources/allocate')
  allocateResource(@Body() dto: AllocateResourceDto) {
    return this.reliefService.allocateResource(dto);
  }
}
