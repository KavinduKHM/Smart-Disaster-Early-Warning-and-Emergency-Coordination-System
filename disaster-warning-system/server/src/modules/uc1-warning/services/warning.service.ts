import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HazardWarning, HazardWarningDocument } from '../schemas/hazard-warning.schema';
import { Hazard, HazardDocument } from '../schemas/hazard.schema';
import { NotificationService } from './notification.service';
import { IssueWarningDto } from '../dto/issue-warning.dto';
import { EscalateWarningDto } from '../dto/escalate-warning.dto';
import { BroadcastWarningDto } from '../dto/broadcast-warning.dto';
import { GeoQueryDto } from '../dto/geo-query.dto';
import { WarningStatus } from '../enums/warning-status.enum';
import { WarningLevel } from '../enums/warning-level.enum';

@Injectable()
export class WarningService {
  private readonly logger = new Logger(WarningService.name);

  constructor(
    @InjectModel(HazardWarning.name)
    private readonly warningModel: Model<HazardWarningDocument>,
    @InjectModel(Hazard.name)
    private readonly hazardModel: Model<HazardDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  private async generateWarningId(): Promise<string> {
    const count = await this.warningModel.countDocuments();
    const year = new Date().getFullYear();
    return `WARN-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Workflow 1: Issue Disaster Warning linked to a Hazard with District/River-Basin targeting
   */
  async issueWarning(dto: IssueWarningDto, userId: string): Promise<any> {
    const hazard = await this.hazardModel.findById(dto.hazardId).exec();
    if (!hazard || hazard.isDeleted) {
      throw new NotFoundException(`Linked Hazard with ID "${dto.hazardId}" does not exist.`);
    }

    const warningId = await this.generateWarningId();

    const newWarning = new this.warningModel({
      warningId,
      hazardId: hazard._id,
      warningLevel: dto.warningLevel,
      message: dto.message,
      emergencyInstructions: dto.emergencyInstructions,
      affectedDistricts: dto.affectedDistricts || [hazard.district],
      affectedRiverBasins: dto.affectedRiverBasins || (hazard.riverBasin ? [hazard.riverBasin] : []),
      notificationChannels: dto.notificationChannels,
      issuedBy: userId,
      issuedAt: new Date(),
      status: WarningStatus.ISSUED,
      deliveryStatus: [],
    });

    const savedWarning = await newWarning.save();

    // Automatically trigger multi-channel alert broadcast upon warning issuance
    const broadcastResult = await this.notificationService.broadcastWarning(savedWarning._id.toString());

    return {
      message: 'Disaster warning issued and broadcast initiated successfully.',
      warning: savedWarning,
      broadcastSummary: broadcastResult,
    };
  }

  /**
   * Workflow 2: Trigger / Re-broadcast Disaster Warning to Multi-Channels (Push, SMS, Audible)
   */
  async broadcastWarning(id: string, dto?: BroadcastWarningDto): Promise<any> {
    const warning = await this.warningModel.findById(id).exec();
    if (!warning) {
      throw new NotFoundException(`Hazard warning with ID "${id}" not found.`);
    }

    const result = await this.notificationService.broadcastWarning(id, dto?.channels);

    return {
      message: 'Multi-channel broadcast completed successfully.',
      details: result,
    };
  }

  /**
   * Workflow 3: Escalate Disaster Warning severity/level and trigger escalated notification
   */
  async escalateWarning(id: string, dto: EscalateWarningDto): Promise<any> {
    const warning = await this.warningModel.findById(id).exec();
    if (!warning) {
      throw new NotFoundException(`Hazard warning with ID "${id}" not found.`);
    }

    const oldLevel = warning.warningLevel;
    warning.warningLevel = dto.newWarningLevel;
    warning.status = WarningStatus.ESCALATED;

    if (dto.updatedMessage) {
      warning.message = dto.updatedMessage;
    }
    if (dto.updatedInstructions) {
      warning.emergencyInstructions = dto.updatedInstructions;
    }

    const savedWarning = await warning.save();

    // Immediately dispatch re-broadcast for escalated warning
    const broadcastResult = await this.notificationService.broadcastWarning(savedWarning._id.toString());

    return {
      message: `Warning ${warning.warningId} successfully escalated from '${oldLevel}' to '${dto.newWarningLevel}'.`,
      previousLevel: oldLevel,
      newLevel: dto.newWarningLevel,
      escalationReason: dto.escalationReason || 'Emergency situation severity escalated by DMC officer.',
      warning: savedWarning,
      broadcastSummary: broadcastResult,
    };
  }

  /**
   * Geospatial Query: Find active disaster warnings near GPS coordinate (latitude, longitude, radiusKm)
   */
  async findActiveWarningsNearLocation(query: GeoQueryDto): Promise<any> {
    const radiusInMeters = (query.radiusKm || 50) * 1000;

    // Find hazards within radius using MongoDB $near spherical query
    const nearbyHazards = await this.hazardModel
      .find({
        isDeleted: false,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [query.longitude, query.latitude], // [longitude, latitude]
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
      .exec();

    const hazardIds = nearbyHazards.map((h) => h._id);

    // Find active warnings associated with these nearby hazards
    const activeWarnings = await this.warningModel
      .find({
        hazardId: { $in: hazardIds },
        status: { $in: [WarningStatus.ISSUED, WarningStatus.BROADCASTING, WarningStatus.ESCALATED, WarningStatus.BROADCAST_COMPLETE] },
      })
      .populate('hazardId')
      .populate('issuedBy', 'name email role district')
      .sort({ issuedAt: -1 })
      .exec();

    return {
      searchCoordinates: { latitude: query.latitude, longitude: query.longitude },
      radiusKm: query.radiusKm || 50,
      totalActiveWarnings: activeWarnings.length,
      warnings: activeWarnings,
    };
  }

  /**
   * Fetch all warnings with optional status filter
   */
  async findAll(status?: string): Promise<HazardWarningDocument[]> {
    const filter = status ? { status } : {};
    return this.warningModel
      .find(filter)
      .populate('hazardId')
      .populate('issuedBy', 'name email role district')
      .sort({ issuedAt: -1 })
      .exec();
  }

  /**
   * Fetch single warning by mongo ID or custom warningId
   */
  async findOne(id: string): Promise<HazardWarningDocument> {
    let warning: HazardWarningDocument | null = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      warning = await this.warningModel.findById(id).populate('hazardId').populate('issuedBy', 'name email role district').exec();
    }
    if (!warning) {
      warning = await this.warningModel.findOne({ warningId: id }).populate('hazardId').populate('issuedBy', 'name email role district').exec();
    }

    if (!warning) {
      throw new NotFoundException(`Disaster warning "${id}" not found.`);
    }

    return warning;
  }

  /**
   * Cancel an active disaster warning
   */
  async cancelWarning(id: string, reason?: string): Promise<HazardWarningDocument> {
    const warning = await this.findOne(id);
    warning.status = WarningStatus.CANCELLED;
    return warning.save();
  }
}
