import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { VerifyReportDto } from './dto/verify-report.dto';

@Injectable()
export class ReportService {
  private reports: any[] = [];

  findAll() {
    return this.reports;
  }

  create(dto: CreateReportDto) {
    const report = { id: Date.now().toString(), ...dto, verified: false };
    this.reports.push(report);
    return report;
  }

  verify(id: string, dto: VerifyReportDto) {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.verified = dto.verified;
      report.notes = dto.notes;
    }
    return report;
  }
}
