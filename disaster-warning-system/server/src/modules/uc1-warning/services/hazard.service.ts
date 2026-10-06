import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hazard, HazardDocument } from '../schemas/hazard.schema';
import { CreateHazardDto } from '../dto/create-hazard.dto';
import { UpdateHazardDto } from '../dto/update-hazard.dto';
import { HazardStatus } from '../enums/hazard-status.enum';

@Injectable()
export class HazardService {
  constructor(
    @InjectModel(Hazard.name)
    private readonly hazardModel: Model<HazardDocument>,
  ) {}

  /**
   * Create a new Hazard record with GeoJSON location
   */
  async create(dto: CreateHazardDto, userId?: string): Promise<HazardDocument> {
    const newHazard = new this.hazardModel({
      type: dto.type,
      title: dto.title,
      description: dto.description,
      status: dto.status || HazardStatus.ACTIVE,
      severity: dto.severity || 'MEDIUM',
      district: dto.district || '',
      riverBasin: dto.riverBasin || '',
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude], // GeoJSON order: [longitude, latitude]
      },
      reportedBy: userId,
      isDeleted: false,
      deletedAt: null,
    });

    return newHazard.save();
  }

  /**
   * Get all hazards (excluding soft-deleted ones by default)
   */
  async findAll(includeDeleted = false): Promise<HazardDocument[]> {
    const filter = includeDeleted ? {} : { isDeleted: false };
    return this.hazardModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find a single hazard by ID
   */
  async findOne(id: string): Promise<HazardDocument> {
    const hazard = await this.hazardModel.findById(id).exec();
    if (!hazard || hazard.isDeleted) {
      throw new NotFoundException(`Hazard with ID ${id} not found or has been deleted.`);
    }
    return hazard;
  }

  /**
   * Update an existing hazard
   */
  async update(id: string, dto: UpdateHazardDto): Promise<HazardDocument> {
    const hazard = await this.findOne(id);

    if (dto.type) hazard.type = dto.type;
    if (dto.title) hazard.title = dto.title;
    if (dto.description) hazard.description = dto.description;
    if (dto.status) hazard.status = dto.status;
    if (dto.severity) hazard.severity = dto.severity;
    if (dto.district !== undefined) hazard.district = dto.district;
    if (dto.riverBasin !== undefined) hazard.riverBasin = dto.riverBasin;

    if (dto.longitude !== undefined && dto.latitude !== undefined) {
      hazard.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    return hazard.save();
  }

  /**
   * Soft Delete a hazard record (sets isDeleted=true and deletedAt=now)
   */
  async softDelete(id: string): Promise<{ message: string; hazardId: string }> {
    const hazard = await this.findOne(id);
    hazard.isDeleted = true;
    hazard.deletedAt = new Date();
    hazard.status = HazardStatus.RESOLVED;
    await hazard.save();

    return {
      message: `Hazard ${id} deleted successfully (soft delete).`,
      hazardId: id,
    };
  }
}
