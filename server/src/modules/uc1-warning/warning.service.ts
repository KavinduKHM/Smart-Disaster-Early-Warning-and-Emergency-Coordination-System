import { Injectable } from '@nestjs/common';
import { CreateWarningDto } from './dto/create-warning.dto';

@Injectable()
export class WarningService {
  private warnings: any[] = [];

  findAll() {
    return this.warnings;
  }

  create(dto: CreateWarningDto) {
    const warning = { id: Date.now().toString(), ...dto, createdAt: new Date() };
    this.warnings.push(warning);
    return warning;
  }
}
