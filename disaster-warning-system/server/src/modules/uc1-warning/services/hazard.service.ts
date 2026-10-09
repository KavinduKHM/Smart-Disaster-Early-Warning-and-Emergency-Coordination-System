import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
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
   * Cross-Functional Integration Event:
   * Listens to Duty-Officer-verified ground reports from UC2 and populates UC1 Hazard Registry
   */
  /**
   * Cross-Functional Integration Event:
   * Listens to Duty-Officer-verified ground reports from UC2 and populates/updates UC1 Hazard Registry
   */
  @OnEvent('report.verified')
  @OnEvent('ground-report.verified')
  async handleGroundReportVerified(report: any) {
    console.log(`[EventEmitter] Emitting: report.verified`);
    console.log(`[WarningService] @OnEvent('report.verified') triggered`);
    try {
      const reportIdStr = report.reportId || report._id?.toString() || 'RPT-VERIFIED';
      const hazardTypeStr = report.hazardType || 'FLOOD';
      const districtStr = report.district || 'Colombo';

      // Find matching active hazard in district by type or linked report
      const existing = await this.hazardModel.findOne({
        isDeleted: false,
        $or: [
          { linkedReportId: reportIdStr },
          { district: { $regex: new RegExp(`^${districtStr}$`, 'i') }, type: hazardTypeStr },
          { title: { $regex: new RegExp(reportIdStr, 'i') } },
        ],
      });

      if (existing) {
        existing.severity = report.severity || 'HIGH';
        existing.linkedReportId = reportIdStr;
        existing.status = HazardStatus.ACTIVE;
        existing.description += ` | [Updated by verified report ${reportIdStr} at ${new Date().toISOString()}]`;
        await existing.save();
        console.log(`[WarningService] Hazard updated: severity ${existing.severity} (linked report ${reportIdStr})`);
      } else {
        const coords = report.location?.coordinates || [79.8612, 6.9271]; // Default Colombo

        const newHazard = await this.hazardModel.create({
          type: hazardTypeStr,
          title: `[VERIFIED REPORT]: ${reportIdStr} - ${hazardTypeStr}`,
          description: `Automatically created from verified Ground Report ${reportIdStr}. Remarks: ${report.verificationRemarks || 'Verified by Duty Officer.'}`,
          status: HazardStatus.ACTIVE,
          severity: report.severity || 'HIGH',
          district: districtStr,
          linkedReportId: reportIdStr,
          riverBasin: 'Kelani River Basin',
          location: {
            type: 'Point',
            coordinates: coords,
          },
          isDeleted: false,
        });
        console.log(`[WarningService] Hazard created: severity ${newHazard.severity} (linked report ${reportIdStr})`);
      }
    } catch (err) {
      console.error('[UC1 HazardService] Error handling report.verified event:', err);
    }
  }

  /**
   * Create a new Hazard record with GeoJSON location
   */
  async create(dto: CreateHazardDto, userId?: string): Promise<HazardDocument> {
    const rawDto = dto as any;
    const lat = dto.latitude ?? rawDto.location?.coordinates?.[1] ?? 7.2906;
    const lng = dto.longitude ?? rawDto.location?.coordinates?.[0] ?? 80.6337;

    const newHazard = new this.hazardModel({
      type: dto.type,
      title: dto.title,
      description: dto.description,
      status: dto.status || HazardStatus.ACTIVE,
      severity: dto.severity || 'MEDIUM',
      district: dto.district || 'Colombo',
      riverBasin: dto.riverBasin || '',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
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
