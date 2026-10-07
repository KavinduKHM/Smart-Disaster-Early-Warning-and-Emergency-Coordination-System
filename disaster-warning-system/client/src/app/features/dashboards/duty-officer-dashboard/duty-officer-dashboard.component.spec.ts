import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DutyOfficerDashboardComponent } from './duty-officer-dashboard.component';
import { ReportService, GroundReport } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';

describe('DutyOfficerDashboardComponent (Member 2 - Operational Triage Desk)', () => {
  let component: DutyOfficerDashboardComponent;
  let fixture: ComponentFixture<DutyOfficerDashboardComponent>;
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
      description: 'Mudslide on Badulla-Ella road.',
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
      description: 'Flash flood near clocktower',
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
      getStats: jest.fn().mockReturnValue(of({ total: 2, pending: 1, verified: 1, rejected: 0, archived: 0 })),
      verifyReport: jest.fn().mockReturnValue(of({ ...mockReports[0], status: 'VERIFIED' })),
      rejectReport: jest.fn().mockReturnValue(of({ ...mockReports[0], status: 'REJECTED' })),
    };

    authServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue({ name: 'Duty Officer Ruwan', role: 'DUTY_OFFICER', district: 'Kandy' }),
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [DutyOfficerDashboardComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule],
      providers: [
        { provide: ReportService, useValue: reportServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DutyOfficerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('POSITIVE: should create component and load stats & reports on init', () => {
    expect(component).toBeTruthy();
    expect(reportServiceMock.getReports).toHaveBeenCalled();
    expect(reportServiceMock.getStats).toHaveBeenCalled();
    expect(component.reports.length).toBe(2);
  });

  describe('Filtered Reports & Helpers', () => {
    it('POSITIVE: should filter reports by tab filter state', () => {
      component.activeTabFilter = 'PENDING';
      expect(component.filteredReports.length).toBe(1);
      expect(component.filteredReports[0].status).toBe('PENDING');

      component.activeTabFilter = 'VERIFIED';
      expect(component.filteredReports.length).toBe(1);
      expect(component.filteredReports[0].status).toBe('VERIFIED');
    });

    it('POSITIVE: should filter reports by district selection', () => {
      component.activeTabFilter = 'ALL';
      component.selectedDistrictFilter = 'Badulla';
      expect(component.filteredReports.length).toBe(1);
      expect(component.filteredReports[0].district).toBe('Badulla');
    });

    it('EDGE & ERROR: getCoords() should correctly extract latitude & longitude from report object or return null', () => {
      const coords = component.getCoords(mockReports[0]);
      expect(coords).toEqual({ lat: 6.9934, lng: 81.055 });

      expect(component.getCoords(null as any)).toBeNull();
    });

    it('POSITIVE: getSeverityBadgeClass() should return correct CSS styling classes', () => {
      expect(component.getSeverityBadgeClass('CRITICAL')).toContain('rose');
      expect(component.getSeverityBadgeClass('HIGH')).toContain('orange');
      expect(component.getSeverityBadgeClass('MEDIUM')).toContain('amber');
      expect(component.getSeverityBadgeClass('LOW')).toContain('blue');
    });
  });

  describe('Verification & Rejection Modal Actions', () => {
    it('POSITIVE: openVerificationModal() should populate form and set map URL', () => {
      component.openVerificationModal(mockReports[0]);
      expect(component.selectedReportForVerification).toEqual(mockReports[0]);
      expect(component.verificationForm.severity).toBe('HIGH');
    });

    it('POSITIVE: confirmVerifyReport() should call reportService.verifyReport and update state', () => {
      component.openVerificationModal(mockReports[0]);
      component.confirmVerifyReport();

      expect(reportServiceMock.verifyReport).toHaveBeenCalled();
    });

    it('ERROR CASE: confirmVerifyReport() should display error message if API fails', () => {
      reportServiceMock.verifyReport.mockReturnValueOnce(throwError(() => ({ error: { message: 'Verification failed' } })));
      component.openVerificationModal(mockReports[0]);
      component.confirmVerifyReport();

      expect(component.actionErrorMessage).toBe('Verification failed');
    });
  });
});
