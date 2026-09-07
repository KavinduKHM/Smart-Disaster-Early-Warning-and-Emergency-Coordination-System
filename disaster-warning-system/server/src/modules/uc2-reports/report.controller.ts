import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { VerifyReportDto } from './dto/verify-report.dto';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  findAll() {
    return this.reportService.findAll();
  }

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportService.create(dto);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyReportDto) {
    return this.reportService.verify(id, dto);
  }
}
