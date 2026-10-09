import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroundReport, GroundReportDocument } from './schemas/ground-report.schema';
import { ReportVerification, ReportVerificationDocument } from './schemas/report-verification.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { VerifyReportDto } from './dto/verify-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';

/**
 * ReportService
 * Handlers for Ground Hazard Reports (Member 2 - Ground Hazard Report & Duty Officer Module).
 * Implements clean architecture, dependency injection, and audit logging.
 */
@Injectable()
export class ReportService implements OnModuleInit {
  constructor(
    @InjectModel(GroundReport.name)
    private readonly reportModel: Model<GroundReportDocument>,
    @InjectModel(ReportVerification.name)
    private readonly verificationModel: Model<ReportVerificationDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    try {
      await this.seedReports();
    } catch (err) {
      console.warn('[ReportService] Auto-seed on init warning:', err);
    }
  }

  /**
   * Generates a unique, human-readable report ID in the format `REP-YYYY-XXXX`
   */
  private async generateReportId(): Promise<string> {
    const count = await this.reportModel.countDocuments();
    const nextNum = (count + 1).toString().padStart(4, '0');
    const year = new Date().getFullYear();
    return `REP-${year}-${nextNum}`;
  }

  /**
   * Automatically processes and uploads base64 image strings to Cloudinary CDN
   * @param photos Array of photo URLs or base64 image strings
   * @returns Array of secure Cloudinary CDN URLs
   */
  private async processPhotos(photos?: string[]): Promise<string[]> {
    if (!photos || photos.length === 0) return [];

    const processedPhotos: string[] = [];
    for (const photo of photos) {
      if (photo.startsWith('data:image/') || photo.length > 500) {
        try {
          const uploadRes = await this.cloudinaryService.uploadBase64(photo);
          processedPhotos.push((uploadRes as any).secure_url);
        } catch (err) {
          console.error('Failed to upload base64 image to Cloudinary, keeping original:', err);
          processedPhotos.push(photo);
        }
      } else {
        processedPhotos.push(photo);
      }
    }

    return processedPhotos;
  }

  /**
   * Creates a new Ground Hazard Report submitted by a citizen or officer.
   * @param dto Data transfer object containing hazard details and coordinates
   * @param user Authenticated user payload (optional)
   */
  async create(dto: CreateReportDto, user?: any): Promise<GroundReportDocument> {
    const reportId = await this.generateReportId();

    const reportedBy = user ? user.name || user.email : dto.reportedBy || 'CITIZEN-001';
    const reporterType = user ? user.role || 'CITIZEN' : dto.reporterType || 'CITIZEN';
    const district = dto.district || (user ? user.district : 'Kandy');

    // Automatically process photos: upload base64 images to Cloudinary CDN
    const finalPhotos = await this.processPhotos(dto.photos);

    const newReport = new this.reportModel({
      reportId,
      reportedBy,
      reporterType,
      hazardType: dto.hazardType,
      description: dto.description,
      district,
      address: dto.address || '',
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude], // GeoJSON: [lon, lat]
      },
      photos: finalPhotos,
      status: 'PENDING',
    });

    return await newReport.save();
  }

  async findAll(query: QueryReportDto): Promise<GroundReportDocument[]> {
    const filter: any = {};

    if (query.status) {
      const statusUpper = query.status.toUpperCase();
      if (statusUpper === 'PENDING_VERIFICATION') {
        filter.status = 'PENDING';
      } else {
        filter.status = statusUpper;
      }
    }

    if (query.district) {
      filter.district = { $regex: new RegExp(query.district, 'i') };
    }

    if (query.hazardType) {
      filter.hazardType = query.hazardType.toUpperCase();
    }

    if (query.reportedBy) {
      filter.reportedBy = { $regex: new RegExp(query.reportedBy, 'i') };
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { reportId: searchRegex },
        { description: searchRegex },
        { district: searchRegex },
        { address: searchRegex },
        { hazardType: searchRegex },
        { reportedBy: searchRegex },
      ];
    }

    return await this.reportModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getStats() {
    const total = await this.reportModel.countDocuments();
    const pending = await this.reportModel.countDocuments({ status: 'PENDING' });
    const verified = await this.reportModel.countDocuments({ status: 'VERIFIED' });
    const rejected = await this.reportModel.countDocuments({ status: 'REJECTED' });
    const archived = await this.reportModel.countDocuments({ status: 'ARCHIVED' });

    return { total, pending, verified, rejected, archived };
  }

  async findOne(id: string): Promise<GroundReportDocument> {
    const report = await this.reportModel
      .findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { reportId: id }],
      })
      .exec();

    if (!report) {
      throw new NotFoundException(`Hazard report with ID "${id}" not found`);
    }

    return report;
  }

  async findByReportedBy(reportedBy: string): Promise<GroundReportDocument[]> {
    return await this.reportModel
      .find({ reportedBy: { $regex: new RegExp(reportedBy, 'i') } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, dto: UpdateReportDto, user?: any): Promise<GroundReportDocument> {
    const report = await this.findOne(id);

    if (report.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot update report with status "${report.status}". Only PENDING reports can be edited.`,
      );
    }

    if (dto.hazardType) report.hazardType = dto.hazardType;
    if (dto.description) report.description = dto.description;
    if (dto.district) report.district = dto.district;
    if (dto.address !== undefined) report.address = dto.address;
    
    if (dto.photos) {
      report.photos = await this.processPhotos(dto.photos);
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      report.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      };
    }

    return await report.save();
  }

  async verify(id: string, dto: VerifyReportDto, user?: any): Promise<GroundReportDocument> {
    const report = await this.findOne(id);

    const verifiedBy = user ? `${user.name} (${user.role})` : dto.verifiedBy || 'DUTY-OFFICER-001';

    report.status = 'VERIFIED';
    report.verificationRemarks = dto.remarks || 'Verified based on field confirmation.';
    report.verifiedBy = verifiedBy;
    report.verifiedAt = new Date();
    if (dto.severity) {
      report.severity = dto.severity as any;
    }

    await report.save();

    // Audit Log
    await new this.verificationModel({
      reportId: report.reportId,
      verifiedBy,
      status: 'VERIFIED',
      remarks: report.verificationRemarks,
      verifiedAt: report.verifiedAt,
    }).save();

    // Cross-Functional Integration Event: Notify UC1 (Hazard Module)
    this.eventEmitter.emit('ground-report.verified', report);
    this.eventEmitter.emit('report.verified', report);

    return report;
  }

  async reject(id: string, dto: RejectReportDto, user?: any): Promise<GroundReportDocument> {
    const report = await this.findOne(id);

    const rejectedBy = user ? `${user.name} (${user.role})` : dto.rejectedBy || 'DUTY-OFFICER-001';

    report.status = 'REJECTED';
    report.verificationRemarks = dto.remarks || 'Rejected: Insufficient evidence or invalid report.';
    report.verifiedBy = rejectedBy;
    report.verifiedAt = new Date();

    await report.save();

    // Audit Log
    await new this.verificationModel({
      reportId: report.reportId,
      verifiedBy: rejectedBy,
      status: 'REJECTED',
      remarks: report.verificationRemarks,
      verifiedAt: report.verifiedAt,
    }).save();

    return report;
  }

  async archive(id: string, user?: any): Promise<GroundReportDocument> {
    const report = await this.findOne(id);

    const officerName = user ? `${user.name} (${user.role})` : 'DUTY-OFFICER-001';

    report.status = 'ARCHIVED';
    await report.save();

    await new this.verificationModel({
      reportId: report.reportId,
      verifiedBy: officerName,
      status: 'ARCHIVED',
      remarks: 'Archived by Duty Officer.',
      verifiedAt: new Date(),
    }).save();

    return report;
  }

  async remove(id: string, user?: any): Promise<{ message: string }> {
    const report = await this.findOne(id);

    if (report.status !== 'PENDING') {
      report.status = 'ARCHIVED';
      await report.save();
      return { message: `Report "${report.reportId}" has been archived.` };
    }

    await this.reportModel.deleteOne({ _id: report._id }).exec();
    return { message: `Report "${report.reportId}" deleted successfully.` };
  }

  async getVerificationHistory(): Promise<ReportVerificationDocument[]> {
    return await this.verificationModel.find().sort({ verifiedAt: -1 }).exec();
  }

  async seedReports(): Promise<{ message: string; seededCount: number }> {
    const count = await this.reportModel.countDocuments();
    if (count > 0) {
      return { message: 'Database already contains reports. Skipping seed.', seededCount: count };
    }

    const sampleReports = [
      {
        reportId: 'REP-2026-0001',
        reportedBy: 'Amara Perera (CITIZEN)',
        reporterType: 'CITIZEN',
        hazardType: 'FLOOD',
        description: 'Mahaweli River water level rising rapidly. Low-lying areas near Peradeniya bridge starting to submerge.',
        district: 'Kandy',
        address: 'Gannoruwa Road, Peradeniya, Kandy',
        location: { type: 'Point', coordinates: [80.598, 7.271] },
        photos: ['https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=600'],
        status: 'PENDING',
      },
      {
        reportId: 'REP-2026-0002',
        reportedBy: 'Kamal Silva (VOLUNTEER)',
        reporterType: 'VOLUNTEER',
        hazardType: 'LANDSLIDE',
        description: 'Earth slip on Badulla-Ella main road. Boulders and mud blocking two lanes.',
        district: 'Badulla',
        address: 'A16 Road near Ella Gap',
        location: { type: 'Point', coordinates: [81.046, 6.866] },
        photos: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600'],
        status: 'VERIFIED',
        verificationRemarks: 'Confirmed by Badulla District Secretariat field officer. Road cleared for single lane.',
        verifiedBy: 'Duty Officer Ruwan (DUTY_OFFICER)',
        verifiedAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        reportId: 'REP-2026-0003',
        reportedBy: 'Amara Perera (CITIZEN)',
        reporterType: 'CITIZEN',
        hazardType: 'ROAD_BLOCKAGE',
        description: 'Large banyan tree fallen across Colombo-Kandy road due to heavy wind.',
        district: 'Kegalle',
        address: 'Mawanella Town, A1 Road',
        location: { type: 'Point', coordinates: [80.447, 7.252] },
        photos: [],
        status: 'PENDING',
      },
      {
        reportId: 'REP-2026-0004',
        reportedBy: 'Amara Perera (CITIZEN)',
        reporterType: 'CITIZEN',
        hazardType: 'RISING_RIVER',
        description: 'Kelani River reaching amber warning level at Nagalagam Street gauge.',
        district: 'Colombo',
        address: 'Grandpass, Colombo 14',
        location: { type: 'Point', coordinates: [79.873, 6.953] },
        photos: ['https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=600'],
        status: 'VERIFIED',
        verificationRemarks: 'Verified against Irrigation Department gauge telemetry.',
        verifiedBy: 'DMC Director Jayasinghe (DMC_OFFICER)',
        verifiedAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        reportId: 'REP-2026-0005',
        reportedBy: 'Amara Perera (CITIZEN)',
        reporterType: 'CITIZEN',
        hazardType: 'DAM_RIVER_ISSUE',
        description: 'Sluice gates opened at Kukuleganga dam. Downstream residents advised to move to higher ground.',
        district: 'Kalutara',
        address: 'Bulathsinhala, Kalutara',
        location: { type: 'Point', coordinates: [80.183, 6.645] },
        photos: [],
        status: 'REJECTED',
        verificationRemarks: 'Duplicate report. Official DMC alert already broadcast for this area.',
        verifiedBy: 'Duty Officer Ruwan (DUTY_OFFICER)',
        verifiedAt: new Date(Date.now() - 3600000 * 10),
      },
    ];

    await this.reportModel.insertMany(sampleReports);
    return { message: 'Sample Sri Lanka ground hazard reports seeded successfully!', seededCount: sampleReports.length };
  }
}
