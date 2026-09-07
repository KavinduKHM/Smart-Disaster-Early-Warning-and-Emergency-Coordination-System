import { Injectable } from '@nestjs/common';
import { CreateRescueRequestDto } from './dto/create-rescue-request.dto';
import { UpdateRescueStatusDto } from './dto/update-rescue-status.dto';

@Injectable()
export class RescueService {
  private requests: any[] = [];

  findAll() {
    return this.requests;
  }

  createRequest(dto: CreateRescueRequestDto) {
    const req = { id: Date.now().toString(), ...dto, status: 'PENDING' };
    this.requests.push(req);
    return req;
  }

  updateStatus(id: string, dto: UpdateRescueStatusDto) {
    const req = this.requests.find(r => r.id === id);
    if (req) {
      req.status = dto.status;
    }
    return req;
  }
}
