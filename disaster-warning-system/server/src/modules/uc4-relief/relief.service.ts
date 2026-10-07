import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Shelter,
  ShelterDocument,
} from './schemas/shelter.schema';

import {
  Evacuee,
  EvacueeDocument,
} from './schemas/evacuee.schema';

import {
  Resource,
  ResourceDocument,
} from './schemas/resource.schema';

import {
  ResourceAllocation,
  ResourceAllocationDocument,
} from './schemas/resource-allocation.schema';

import {
  ReliefNeed,
  ReliefNeedDocument,
} from './schemas/relief-need.schema';

import { CreateShelterDto } from './dto/create-shelter.dto';
import { RegisterEvacueeDto } from './dto/register-evacuee.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { AllocateResourceDto } from './dto/allocate-resource.dto';
import { CreateReliefNeedDto } from './dto/create-relief-need.dto';

@Injectable()
export class ReliefService {
  constructor(
    @InjectModel(Shelter.name)
    private readonly shelterModel: Model<ShelterDocument>,

    @InjectModel(Evacuee.name)
    private readonly evacueeModel: Model<EvacueeDocument>,

    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,

    @InjectModel(ResourceAllocation.name)
    private readonly allocationModel: Model<ResourceAllocationDocument>,

    @InjectModel(ReliefNeed.name)
    private readonly reliefNeedModel: Model<ReliefNeedDocument>,
  ) {}

  // ================================
  // DASHBOARD
  // ================================

  async getDashboard() {
    const shelters = await this.shelterModel.find();

    const totalShelters = shelters.length;

    const availableShelters = shelters.filter(
      (s) => s.status === 'AVAILABLE',
    ).length;

    const fullShelters = shelters.filter(
      (s) => s.status === 'FULL',
    ).length;

    const totalCapacity = shelters.reduce(
      (sum, shelter) => sum + shelter.capacity,
      0,
    );

    const totalOccupancy = shelters.reduce(
      (sum, shelter) => sum + shelter.currentOccupancy,
      0,
    );

    const occupancyPercentage =
      totalCapacity > 0
        ? Math.round((totalOccupancy / totalCapacity) * 100)
        : 0;

    const resources = await this.resourceModel.find();

    const lowStockResources = resources.filter(
      (resource) => resource.quantity <= 10,
    ).length;

    const openReliefNeeds =
      await this.reliefNeedModel.countDocuments({
        status: 'OPEN',
      });

    const pendingAllocations =
      await this.allocationModel.countDocuments({
        status: 'ALLOCATED',
      });

    return {
      totalShelters,
      availableShelters,
      fullShelters,
      totalCapacity,
      totalOccupancy,
      occupancyPercentage,
      totalResources: resources.length,
      lowStockResources,
      openReliefNeeds,
      pendingAllocations,
    };
  }

  // ================================
  // RELIEF NEEDS
  // ================================

  async createReliefNeed(dto: CreateReliefNeedDto) {
    return this.reliefNeedModel.create(dto);
  }

  async getReliefNeeds() {
    return this.reliefNeedModel
      .find()
      .sort({ createdAt: -1 });
  }

  // ================================
  // SHELTERS
  // ================================

  async createShelter(dto: CreateShelterDto) {
    return this.shelterModel.create(dto);
  }

  async getShelters() {
    return this.shelterModel.find().sort({ createdAt: -1 });
  }

  async getShelter(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid shelter ID');
    }

    const shelter = await this.shelterModel.findById(id);

    if (!shelter) {
      throw new NotFoundException('Shelter not found');
    }

    return shelter;
  }

  async updateShelterStatus(
    id: string,
    status: string,
  ) {
    const shelter = await this.getShelter(id);

    shelter.status = status;

    return shelter.save();
  }

  // ================================
  // EVACUEES
  // ================================

  async registerEvacuee(
    dto: RegisterEvacueeDto,
  ) {
    const shelter = await this.getShelter(dto.shelterId);

    if (
      shelter.currentOccupancy >= shelter.capacity
    ) {
      throw new BadRequestException(
        'Shelter is full',
      );
    }

    const existing = await this.evacueeModel.findOne({
      nationalId: dto.nationalId,
      status: 'ACTIVE',
    });

    if (existing) {
      throw new BadRequestException(
        'Evacuee is already registered',
      );
    }

    const evacuee =
      await this.evacueeModel.create(dto);

    shelter.currentOccupancy += 1;

    if (
      shelter.currentOccupancy >=
      shelter.capacity
    ) {
      shelter.status = 'FULL';
    }

    await shelter.save();

    return evacuee;
  }

  async getEvacuees(shelterId?: string) {
    const filter = shelterId
      ? { shelterId }
      : {};

    return this.evacueeModel
      .find(filter)
      .sort({ createdAt: -1 });
  }

  // ================================
  // RESOURCES
  // ================================

  async createResource(
    dto: CreateResourceDto,
  ) {
    const payload = {
      ...dto,
      organization:
        dto.organization ??
        (dto as any).ownerOrganization ??
        '',
      storageLocation:
        dto.storageLocation ??
        (dto as any).location ??
        '',
    };

    delete (payload as any).ownerOrganization;
    delete (payload as any).location;

    return this.resourceModel.create(payload);
  }

  async getResources() {
    return this.resourceModel
      .find()
      .sort({ createdAt: -1 });
  }

  // ================================
  // RESOURCE ALLOCATION
  // ================================

  async allocateResource(
    dto: AllocateResourceDto,
  ) {
    const resource =
      await this.resourceModel.findById(
        dto.resourceId,
      );

    if (!resource) {
      throw new NotFoundException(
        'Resource not found',
      );
    }

    const shelter =
      await this.shelterModel.findById(
        dto.shelterId,
      );

    if (!shelter) {
      throw new NotFoundException(
        'Shelter not found',
      );
    }

    if (resource.quantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient ${resource.name} stock`,
      );
    }

    // Reduce inventory
    resource.quantity -= dto.quantity;

    await resource.save();

    try {
      const allocation =
        await this.allocationModel.create({
          resourceId: dto.resourceId,
          shelterId: dto.shelterId,
          quantity: dto.quantity,
          distributedBy: dto.distributedBy,
          notes: dto.notes,
        });

      return allocation;
    } catch (error) {
      // Roll back inventory if allocation creation fails
      resource.quantity += dto.quantity;

      await resource.save();

      throw error;
    }
  }

  async getAllocations() {
    return this.allocationModel
      .find()
      .populate('resourceId')
      .populate('shelterId')
      .sort({ createdAt: -1 });
  }
}