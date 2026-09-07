import { Controller, Get, Post, Body } from '@nestjs/common';
import { WarningService } from './warning.service';
import { CreateWarningDto } from './dto/create-warning.dto';

@Controller('warnings')
export class WarningController {
  constructor(private readonly warningService: WarningService) {}

  @Get()
  findAll() {
    return this.warningService.findAll();
  }

  @Post()
  create(@Body() createWarningDto: CreateWarningDto) {
    return this.warningService.create(createWarningDto);
  }
}
