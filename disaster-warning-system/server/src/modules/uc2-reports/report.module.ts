import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { GroundReport, GroundReportSchema } from './schemas/ground-report.schema';
import { ReportVerification, ReportVerificationSchema } from './schemas/report-verification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GroundReport.name, schema: GroundReportSchema },
      { name: ReportVerification.name, schema: ReportVerificationSchema },
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
