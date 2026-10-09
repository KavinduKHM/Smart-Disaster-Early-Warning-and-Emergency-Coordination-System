import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { VerifyReportDto } from './dto/verify-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';

@Controller(['uc2-reports/reports', 'reports'])
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @UploadedFile() file?: Express.Multer.File,
    @Body('base64') base64Data?: string,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadFile(file);
      return { url: (result as any).secure_url, public_id: (result as any).public_id };
    } else if (base64Data) {
      const result = await this.cloudinaryService.uploadBase64(base64Data);
      return { url: (result as any).secure_url, public_id: (result as any).public_id };
    } else {
      throw new BadRequestException('Please provide an image file or base64 data string');
    }
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateReportDto, @CurrentUser() user?: any) {
    return this.reportService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: QueryReportDto) {
    return this.reportService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.reportService.getStats();
  }

  @Get('my-reports')
  @UseGuards(OptionalJwtAuthGuard)
  getMyReports(@Query('reportedBy') reportedByQuery?: string, @CurrentUser() user?: any) {
    const reportedBy = reportedByQuery || (user ? user.name || user.email : 'CITIZEN-001');
    return this.reportService.findByReportedBy(reportedBy);
  }

  @Get('verifications/history')
  getVerificationHistory() {
    return this.reportService.getVerificationHistory();
  }

  @Post('seed')
  seedReports() {
    return this.reportService.seedReports();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateReportDto, @CurrentUser() user?: any) {
    return this.reportService.update(id, dto, user);
  }

  @Patch(':id/verify')
  @UseGuards(OptionalJwtAuthGuard)
  verify(@Param('id') id: string, @Body() dto: VerifyReportDto, @CurrentUser() user?: any) {
    return this.reportService.verify(id, dto, user);
  }

  @Patch(':id/reject')
  @UseGuards(OptionalJwtAuthGuard)
  reject(@Param('id') id: string, @Body() dto: RejectReportDto, @CurrentUser() user?: any) {
    return this.reportService.reject(id, dto, user);
  }

  @Patch(':id/archive')
  @UseGuards(OptionalJwtAuthGuard)
  archive(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.reportService.archive(id, user);
  }

  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.reportService.remove(id, user);
  }
}
