import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { GroundReport } from './schemas/ground-report.schema';
import { ReportVerification } from './schemas/report-verification.schema';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';
import { CreateReportDto } from './dto/create-report.dto';
import { VerifyReportDto } from './dto/verify-report.dto';
import { RejectReportDto } from './dto/reject-report.dto';

describe('ReportService (Member 2 - Ground Hazard Reports)', () => {
  let service: ReportService;
  let mockReportModel: any;
  let mockVerificationModel: any;
  let mockCloudinaryService: any;

  const mockReport = {
    _id: '60d5ec49f1b2c81184a83421',
    reportId: 'REP-2026-0001',
    reportedBy: 'John Doe',
    reporterType: 'CITIZEN',
    hazardType: 'LANDSLIDE',
    description: 'Mudslide on main road blocking two lanes',
    district: 'Kandy',
    address: 'A16 Road, Kandy',
    location: { type: 'Point', coordinates: [80.6337, 7.2906] },
    photos: ['https://res.cloudinary.com/test/image/upload/v1/sample.jpg'],
    status: 'PENDING',
    createdAt: new Date(),
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockVerification = {
    reportId: 'REP-2026-0001',
    verifiedBy: 'Duty Officer Ruwan (DUTY_OFFICER)',
    status: 'VERIFIED',
    remarks: 'Verified after field check',
    verifiedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    // Mock Mongoose Model Constructor & Methods
    mockReportModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: '60d5ec49f1b2c81184a83421', ...dto }),
    }));

    mockReportModel.countDocuments = jest.fn().mockResolvedValue(5);
    mockReportModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockReport]),
      }),
    });
    mockReportModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...mockReport }),
    });
    mockReportModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });
    mockReportModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockReport);

    mockVerificationModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue(mockVerification),
    }));
    mockVerificationModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockVerification]),
      }),
    });

    mockCloudinaryService = {
      uploadBase64: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/test.jpg' }),
      uploadFile: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/file.jpg' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: getModelToken(GroundReport.name),
          useValue: mockReportModel,
        },
        {
          provide: getModelToken(ReportVerification.name),
          useValue: mockVerificationModel,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('POSITIVE: should successfully create a ground hazard report for citizen', async () => {
      const dto: CreateReportDto = {
        hazardType: 'FLOOD',
        description: 'Rising water level near bridge',
        district: 'Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
      };

      const user = { name: 'Jane Citizen', role: 'CITIZEN', district: 'Colombo' };
      const result = await service.create(dto, user);

      expect(result).toBeDefined();
      expect(result.hazardType).toBe('FLOOD');
      expect(result.status).toBe('PENDING');
      expect(result.reportedBy).toBe('Jane Citizen');
      expect(mockReportModel.prototype.save || mockReportModel).toHaveBeenCalled();
    });

    it('POSITIVE & EDGE: should process base64 photo strings and upload to Cloudinary', async () => {
      const dto: CreateReportDto = {
        hazardType: 'ROAD_BLOCKAGE',
        description: 'Fallen tree blocking road',
        district: 'Kandy',
        latitude: 7.2906,
        longitude: 80.6337,
        photos: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
      };

      await service.create(dto);

      expect(mockCloudinaryService.uploadBase64).toHaveBeenCalled();
    });

    it('EDGE & ERROR FALLBACK: should fallback gracefully if Cloudinary upload fails', async () => {
      mockCloudinaryService.uploadBase64.mockRejectedValueOnce(new Error('Cloudinary Network Timeout'));

      const dto: CreateReportDto = {
        hazardType: 'FIRE',
        description: 'Transformer fire',
        district: 'Badulla',
        latitude: 6.9934,
        longitude: 81.055,
        photos: ['data:image/png;base64,invalid_base64_string'],
      };

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(result.photos).toBeDefined();
    });
  });

  describe('findAll()', () => {
    it('POSITIVE: should return filtered hazard reports', async () => {
      const query = { status: 'PENDING', district: 'Kandy', hazardType: 'LANDSLIDE', search: 'road' };
      const reports = await service.findAll(query);

      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
      expect(mockReportModel.find).toHaveBeenCalled();
    });

    it('EDGE: should return all reports when query parameters are empty', async () => {
      const reports = await service.findAll({});
      expect(reports).toBeDefined();
      expect(mockReportModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('getStats()', () => {
    it('POSITIVE: should aggregate statistics for pending, verified, rejected, and archived reports', async () => {
      const stats = await service.getStats();

      expect(stats).toEqual({
        total: 5,
        pending: 5,
        verified: 5,
        rejected: 5,
        archived: 5,
      });
      expect(mockReportModel.countDocuments).toHaveBeenCalledTimes(5);
    });
  });

  describe('findOne()', () => {
    it('POSITIVE: should return a single report by Mongo ID or reportId', async () => {
      const report = await service.findOne('REP-2026-0001');

      expect(report).toBeDefined();
      expect(report.reportId).toBe('REP-2026-0001');
    });

    it('NEGATIVE & ERROR: should throw NotFoundException when report is not found', async () => {
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('INVALID-ID')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('POSITIVE: should update a PENDING report successfully', async () => {
      const updateDto = { description: 'Updated mudslide description' };
      const reportInstance = {
        ...mockReport,
        status: 'PENDING',
        save: jest.fn().mockResolvedValue({ ...mockReport, description: 'Updated mudslide description' }),
      };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(reportInstance),
      });

      const updated = await service.update('REP-2026-0001', updateDto);

      expect(updated).toBeDefined();
      expect(reportInstance.save).toHaveBeenCalled();
    });

    it('NEGATIVE & ERROR: should throw BadRequestException when trying to edit non-PENDING report', async () => {
      const verifiedReport = { ...mockReport, status: 'VERIFIED' };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(verifiedReport),
      });

      await expect(service.update('REP-2026-0001', { description: 'Edit' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('verify()', () => {
    it('POSITIVE: should update report status to VERIFIED and log audit verification entry', async () => {
      const verifyDto: VerifyReportDto = {
        severity: 'HIGH',
        remarks: 'Ground inspection confirmed by police unit.',
      };
      const user = { name: 'Officer Ruwan', role: 'DUTY_OFFICER' };
      const reportInstance = {
        ...mockReport,
        status: 'PENDING',
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(reportInstance),
      });

      const verified = await service.verify('REP-2026-0001', verifyDto, user);

      expect(verified.status).toBe('VERIFIED');
      expect(verified.severity).toBe('HIGH');
      expect(verified.verifiedBy).toBe('Officer Ruwan (DUTY_OFFICER)');
      expect(mockVerificationModel).toHaveBeenCalled();
    });
  });

  describe('reject()', () => {
    it('POSITIVE: should update report status to REJECTED and save rejection audit log', async () => {
      const rejectDto: RejectReportDto = {
        remarks: 'False alarm reported by prank caller.',
      };
      const reportInstance = {
        ...mockReport,
        status: 'PENDING',
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(reportInstance),
      });

      const rejected = await service.reject('REP-2026-0001', rejectDto);

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.verificationRemarks).toBe('False alarm reported by prank caller.');
    });
  });

  describe('archive()', () => {
    it('POSITIVE: should archive report and create verification audit entry', async () => {
      const reportInstance = {
        ...mockReport,
        status: 'VERIFIED',
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(reportInstance),
      });

      const archived = await service.archive('REP-2026-0001');

      expect(archived.status).toBe('ARCHIVED');
      expect(mockVerificationModel).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('POSITIVE: should delete PENDING report from database', async () => {
      const pendingReport = {
        ...mockReport,
        status: 'PENDING',
      };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(pendingReport),
      });

      const result = await service.remove('REP-2026-0001');

      expect(result).toBeDefined();
      expect(mockReportModel.deleteOne).toHaveBeenCalled();
    });

    it('EDGE: should soft-archive report if report is already VERIFIED or REJECTED', async () => {
      const verifiedReport = {
        ...mockReport,
        status: 'VERIFIED',
        save: jest.fn().mockResolvedValue(true),
      };
      mockReportModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(verifiedReport),
      });

      const result = await service.remove('REP-2026-0001');

      expect(result.message).toContain('archived');
      expect(verifiedReport.status).toBe('ARCHIVED');
    });
  });
});
