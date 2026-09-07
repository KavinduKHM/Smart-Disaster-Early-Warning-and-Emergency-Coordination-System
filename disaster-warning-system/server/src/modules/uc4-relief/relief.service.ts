import { Injectable } from '@nestjs/common';
import { CreateShelterDto } from './dto/create-shelter.dto';
import { AllocateResourceDto } from './dto/allocate-resource.dto';

@Injectable()
export class ReliefService {
  private shelters: any[] = [];
  private allocations: any[] = [];

  getShelters() {
    return this.shelters;
  }

  createShelter(dto: CreateShelterDto) {
    const shelter = { id: Date.now().toString(), ...dto, currentOccupancy: 0 };
    this.shelters.push(shelter);
    return shelter;
  }

  allocateResource(dto: AllocateResourceDto) {
    const alloc = { id: Date.now().toString(), ...dto, allocatedAt: new Date() };
    this.allocations.push(alloc);
    return alloc;
  }
}
