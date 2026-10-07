import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService, GroundReport } from './report.service';

describe('ReportService (Angular Client - Member 2)', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  const mockReport: GroundReport = {
    _id: '60d5ec49f1b2c81184a83421',
    reportId: 'REP-2026-0001',
    reportedBy: 'John Citizen',
    reporterType: 'CITIZEN',
    hazardType: 'LANDSLIDE',
    description: 'Road slip on Badulla-Ella road.',
    district: 'Badulla',
    latitude: 6.9934,
    longitude: 81.055,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService],
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReports()', () => {
    it('POSITIVE: should fetch list of ground hazard reports with query params', () => {
      service.getReports({ district: 'Badulla', status: 'PENDING' }).subscribe((reports) => {
        expect(reports.length).toBe(1);
        expect(reports[0].district).toBe('Badulla');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/api/reports'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('district')).toBe('Badulla');
      expect(req.request.params.get('status')).toBe('PENDING');

      req.flush([mockReport]);
    });
  });

  describe('getReportById()', () => {
    it('POSITIVE: should fetch a single hazard report by ID', () => {
      service.getReportById('REP-2026-0001').subscribe((report) => {
        expect(report).toEqual(mockReport);
      });

      const req = httpMock.expectOne('/api/reports/REP-2026-0001');
      expect(req.request.method).toBe('GET');

      req.flush(mockReport);
    });
  });

  describe('getStats()', () => {
    it('POSITIVE: should fetch system statistics for triage dashboard', () => {
      const mockStats = { total: 10, pending: 5, verified: 3, rejected: 2, archived: 0 };

      service.getStats().subscribe((stats) => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne('/api/reports/stats');
      expect(req.request.method).toBe('GET');

      req.flush(mockStats);
    });
  });

  describe('createReport()', () => {
    it('POSITIVE: should post a new hazard report to backend API', () => {
      const payload = {
        hazardType: 'FLOOD',
        description: 'Rising water',
        district: 'Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
      };

      service.createReport(payload).subscribe((res) => {
        expect(res).toEqual(mockReport);
      });

      const req = httpMock.expectOne('/api/reports');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      req.flush(mockReport);
    });
  });

  describe('verifyReport() & rejectReport()', () => {
    it('POSITIVE: verifyReport should send PATCH request with severity & remarks', () => {
      const payload = { severity: 'HIGH', remarks: 'Field verified' };

      service.verifyReport('REP-2026-0001', payload).subscribe((res) => {
        expect(res.status).toBe('VERIFIED');
      });

      const req = httpMock.expectOne('/api/reports/REP-2026-0001/verify');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);

      req.flush({ ...mockReport, status: 'VERIFIED' });
    });

    it('POSITIVE: rejectReport should send PATCH request with rejection remarks', () => {
      const payload = { remarks: 'Invalid location' };

      service.rejectReport('REP-2026-0001', payload).subscribe((res) => {
        expect(res.status).toBe('REJECTED');
      });

      const req = httpMock.expectOne('/api/reports/REP-2026-0001/reject');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);

      req.flush({ ...mockReport, status: 'REJECTED' });
    });
  });
});
