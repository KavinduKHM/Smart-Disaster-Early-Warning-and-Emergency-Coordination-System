import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';
import { CreateReportDto } from './dto/create-report.dto';

describe('ReportController (Member 2 - Ground Hazard Reports API)', () => {
  let controller: ReportController;
  let mockReportService: any;
  let mockCloudinaryService: any;

  const mockReport = {
    _id: '60d5ec49f1b2c81184a83421',
    reportId: 'REP-2026-0001',
    reportedBy: 'John Citizen',
    reporterType: 'CITIZEN',
    hazardType: 'FLOOD',
    description: 'Flash flood near town clocktower',
    district: 'Kandy',
    address: 'Clocktower Road',
    location: { type: 'Point', coordinates: [80.6337, 7.2906] },
    photos: ['https://res.cloudinary.com/test/sample.jpg'],
    status: 'PENDING',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockReportService = {
      create: jest.fn().mockResolvedValue(mockReport),
      findAll: jest.fn().mockResolvedValue([mockReport]),
      getStats: jest.fn().mockResolvedValue({ total: 10, pending: 4, verified: 4, rejected: 2, archived: 0 }),
      findByReportedBy: jest.fn().mockResolvedValue([mockReport]),
      getVerificationHistory: jest.fn().mockResolvedValue([]),
      seedReports: jest.fn().mockResolvedValue({ message: 'Seeded successfully' }),
      findOne: jest.fn().mockResolvedValue(mockReport),
      update: jest.fn().mockResolvedValue(mockReport),
      verify: jest.fn().mockResolvedValue({ ...mockReport, status: 'VERIFIED' }),
      reject: jest.fn().mockResolvedValue({ ...mockReport, status: 'REJECTED' }),
      archive: jest.fn().mockResolvedValue({ ...mockReport, status: 'ARCHIVED' }),
      remove: jest.fn().mockResolvedValue({ message: 'Report removed' }),
    };

    mockCloudinaryService = {
      uploadFile: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/photo.jpg', public_id: 'photo_123' }),
      uploadBase64: jest.fn().mockResolvedValue({ secure_url: 'https://cloudinary.com/base64.jpg', public_id: 'base64_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadPhoto()', () => {
    it('POSITIVE: should handle Multer file upload to Cloudinary', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const res = await controller.uploadPhoto(mockFile);

      expect(res.url).toBe('https://cloudinary.com/photo.jpg');
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(mockFile);
    });

    it('POSITIVE: should handle base64 image data upload to Cloudinary', async () => {
      const res = await controller.uploadPhoto(undefined, 'data:image/png;base64,sample');

      expect(res.url).toBe('https://cloudinary.com/base64.jpg');
      expect(mockCloudinaryService.uploadBase64).toHaveBeenCalled();
    });

    it('NEGATIVE & ERROR: should throw BadRequestException if neither file nor base64 is provided', async () => {
      await expect(controller.uploadPhoto()).rejects.toThrow(BadRequestException);
    });
  });

  describe('create()', () => {
    it('POSITIVE: should delegate creation to ReportService', async () => {
      const dto: CreateReportDto = {
        hazardType: 'FLOOD',
        description: 'Rising river level',
        district: 'Kandy',
        latitude: 7.2906,
        longitude: 80.6337,
      };
      const user = { name: 'Officer', role: 'DUTY_OFFICER' };

      const result = await controller.create(dto, user);

      expect(result).toBeDefined();
      expect(mockReportService.create).toHaveBeenCalledWith(dto, user);
    });
  });

  describe('findAll() & getStats()', () => {
    it('POSITIVE: should return list of hazard reports', async () => {
      const res = await controller.findAll({ district: 'Kandy' });
      expect(res).toBeDefined();
      expect(mockReportService.findAll).toHaveBeenCalledWith({ district: 'Kandy' });
    });

    it('POSITIVE: should return aggregated stats', async () => {
      const res = await controller.getStats();
      expect(res.total).toBe(10);
      expect(mockReportService.getStats).toHaveBeenCalled();
    });
  });

  describe('findOne(), update(), verify(), reject(), archive(), remove()', () => {
    it('POSITIVE: findOne() returns single report', async () => {
      const res = await controller.findOne('REP-2026-0001');
      expect(res.reportId).toBe('REP-2026-0001');
    });

    it('POSITIVE: update() updates pending report', async () => {
      const res = await controller.update('REP-2026-0001', { description: 'Updated' });
      expect(res).toBeDefined();
    });

    it('POSITIVE: verify() verifies report severity and status', async () => {
      const res = await controller.verify('REP-2026-0001', { severity: 'HIGH', remarks: 'Verified' });
      expect(res.status).toBe('VERIFIED');
    });

    it('POSITIVE: reject() rejects invalid report', async () => {
      const res = await controller.reject('REP-2026-0001', { remarks: 'Invalid' });
      expect(res.status).toBe('REJECTED');
    });

    it('POSITIVE: archive() archives report', async () => {
      const res = await controller.archive('REP-2026-0001');
      expect(res.status).toBe('ARCHIVED');
    });

    it('POSITIVE: remove() deletes report', async () => {
      const res = await controller.remove('REP-2026-0001');
      expect(res.message).toBe('Report removed');
    });
  });
});
