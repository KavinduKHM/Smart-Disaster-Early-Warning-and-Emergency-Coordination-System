import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DutyOfficerReportsComponent } from './duty-officer-reports.component';
import { ReportService, GroundReport } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';

describe('DutyOfficerReportsComponent (Member 2 - Hazard Report Management & PDF Export)', () => {
  let component: DutyOfficerReportsComponent;
  let fixture: ComponentFixture<DutyOfficerReportsComponent>;
  let reportServiceMock: any;
  let authServiceMock: any;

  const mockReports: GroundReport[] = [
    {
      _id: '60d5ec49f1b2c81184a83421',
      reportId: 'REP-2026-0001',
      reportedBy: 'John Citizen',
      reporterType: 'CITIZEN',
      hazardType: 'LANDSLIDE',
      severity: 'HIGH',
      description: 'Mudslide on Ella gap.',
      district: 'Badulla',
      latitude: 6.9934,
      longitude: 81.055,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
    {
      _id: '60d5ec49f1b2c81184a83422',
      reportId: 'REP-2026-0002',
      reportedBy: 'Jane Officer',
      reporterType: 'DUTY_OFFICER',
      hazardType: 'FLOOD',
      severity: 'CRITICAL',
      description: 'Flash flood in Kandy town',
      district: 'Kandy',
      latitude: 7.2906,
      longitude: 80.6337,
      status: 'VERIFIED',
      verifiedBy: 'Duty Officer Ruwan',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    reportServiceMock = {
      getReports: jest.fn().mockReturnValue(of(mockReports)),
      verifyReport: jest.fn().mockReturnValue(of({ ...mockReports[0], status: 'VERIFIED' })),
      rejectReport: jest.fn().mockReturnValue(of({ ...mockReports[0], status: 'REJECTED' })),
    };

    authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue({ name: 'Duty Officer Ruwan', role: 'DUTY_OFFICER', district: 'Kandy' }),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [DutyOfficerReportsComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      providers: [
        { provide: ReportService, useValue: reportServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DutyOfficerReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('POSITIVE: should create component and load reports', () => {
    expect(component).toBeTruthy();
    expect(reportServiceMock.getReports).toHaveBeenCalled();
    expect(component.reports.length).toBe(2);
  });

  describe('Filtering & PDF Modal logic', () => {
    it('POSITIVE: filteredReports should search across hazardType, description, district, and reportId', () => {
      component.searchQuery = 'Ella';
      expect(component.filteredReports.length).toBe(1);
      expect(component.filteredReports[0].reportId).toBe('REP-2026-0001');

      component.searchQuery = 'Kandy';
      expect(component.filteredReports.length).toBe(1);
      expect(component.filteredReports[0].district).toBe('Kandy');
    });

    it('POSITIVE: openPdfModal() and closePdfModal() should toggle modal display flag', () => {
      component.openPdfModal();
      expect(component.showPdfModal).toBe(true);

      component.closePdfModal();
      expect(component.showPdfModal).toBe(false);
    });
  });

  describe('Rejection Error Case', () => {
    it('NEGATIVE & ERROR: confirmRejectReport() should validate remarks before rejection', () => {
      component.openVerificationModal(mockReports[0]);
      component.verificationForm.remarks = '';
      component.confirmRejectReport();

      expect(component.actionErrorMessage).toContain('Please provide rejection remarks');
      expect(reportServiceMock.rejectReport).not.toHaveBeenCalled();
    });
  });
});
