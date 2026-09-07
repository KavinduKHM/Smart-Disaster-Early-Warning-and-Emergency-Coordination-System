import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { RescueService } from './rescue.service';
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { UpdateRescueStatusDto } from './dto/update-rescue-status.dto';

@Controller('rescue')
export class RescueController {
  constructor(private readonly rescueService: RescueService) {}

  @Get()
  findAll() {
    return this.rescueService.findAll();
  }

  @Post('request')
  createRequest(@Body() dto: CreateRescueRequestDto) {
    return this.rescueService.createRequest(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRescueStatusDto) {
    return this.rescueService.updateStatus(id, dto);
  }
}
