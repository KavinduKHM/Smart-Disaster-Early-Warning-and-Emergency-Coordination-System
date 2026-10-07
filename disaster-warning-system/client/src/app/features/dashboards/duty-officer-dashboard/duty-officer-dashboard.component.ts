import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { ReportService, GroundReport } from '../../../core/services/report.service';

interface DistrictAnalytics {
  district: string;
  total: number;
  verified: number;
  pending: number;
  percentage: number;
}

@Component({
  selector: 'app-duty-officer-dashboard',
  templateUrl: './duty-officer-dashboard.component.html'
})
export class DutyOfficerDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  reports: GroundReport[] = [];
  warnings: any[] = [];
  districtAnalytics: DistrictAnalytics[] = [];

  isLoading: boolean = true;

  stats = {
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    critical: 0
  };

  // Filter state
  activeTabFilter: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL' = 'PENDING';
  selectedDistrictFilter: string = 'ALL';

  districtsList = [
    'ALL', 'Kandy', 'Colombo', 'Badulla', 'Kegalle', 'Kalutara', 'Galle', 
    'Matara', 'Ratnapura', 'Kurunegala', 'Nuwara Eliya', 'Anuradhapura', 
    'Polonnaruwa', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Hambantota'
  ];

  // Map state
  selectedReportForMap: GroundReport | null = null;
  mapEmbedUrl: SafeResourceUrl | null = null;

  // Verification Modal state
  selectedReportForVerification: GroundReport | null = null;
  verificationMapUrl: SafeResourceUrl | null = null;
  verificationForm = {
    severity: 'HIGH',
    remarks: 'Verified after ground inspection & photo review.'
  };

  isSubmittingVerification: boolean = false;
  actionSuccessMessage: string = '';
  actionErrorMessage: string = '';

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // 1. Fetch all ground hazard reports
    this.reportService.getReports().subscribe({
      next: (data) => {
        this.reports = data || [];
        this.calculateStats();
        this.calculateDistrictAnalytics();
        this.updateOverallMapUrl();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching reports:', err);
        this.isLoading = false;
      }
    });

    // 2. Fetch warnings (if any)
    this.reportService.getWarnings().subscribe({
      next: (data) => {
        this.warnings = data || [];
      },
      error: (err) => console.warn('Error fetching warnings:', err)
    });
  }

  calculateStats(): void {
    const total = this.reports.length;
    const pending = this.reports.filter(r => r.status === 'PENDING').length;
    const verified = this.reports.filter(r => r.status === 'VERIFIED').length;
    const rejected = this.reports.filter(r => r.status === 'REJECTED').length;
    const critical = this.reports.filter(r => r.status === 'VERIFIED' && r.severity === 'CRITICAL').length;

    this.stats = { total, pending, verified, rejected, critical };
  }

  calculateDistrictAnalytics(): void {
    const map = new Map<string, { total: number; verified: number; pending: number }>();

    for (const r of this.reports) {
      const dist = r.district || 'Unassigned';
      if (!map.has(dist)) {
        map.set(dist, { total: 0, verified: 0, pending: 0 });
      }
      const entry = map.get(dist)!;
      entry.total += 1;
      if (r.status === 'VERIFIED') entry.verified += 1;
      if (r.status === 'PENDING') entry.pending += 1;
    }

    const totalVerified = this.stats.verified || 1;
    const analytics: DistrictAnalytics[] = [];

    map.forEach((val, key) => {
      const percentage = Math.min(100, Math.round((val.verified / totalVerified) * 100));
      analytics.push({
        district: key,
        total: val.total,
        verified: val.verified,
        pending: val.pending,
        percentage
      });
    });

    analytics.sort((a, b) => b.verified - a.verified);
    this.districtAnalytics = analytics;
  }

  get filteredReports(): GroundReport[] {
    return this.reports.filter(r => {
      const matchesTab = this.activeTabFilter === 'ALL' ? true : r.status === this.activeTabFilter;
      const matchesDistrict = this.selectedDistrictFilter === 'ALL' ? true : r.district === this.selectedDistrictFilter;
      return matchesTab && matchesDistrict;
    });
  }

  get verifiedReportsWithCoords(): GroundReport[] {
    return this.reports.filter(r => r.status === 'VERIFIED' && (r.latitude || r.location?.coordinates));
  }

  updateOverallMapUrl(): void {
    const verified = this.verifiedReportsWithCoords;
    let mapQuery = 'Sri Lanka';

    if (verified.length > 0) {
      const first = verified[0];
      const coords = this.getCoords(first);
      if (coords) {
        mapQuery = `${coords.lat},${coords.lng}`;
      } else {
        mapQuery = encodeURIComponent(`${first.district}, Sri Lanka`);
      }
    }

    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=9&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  selectReportForMap(report: GroundReport): void {
    this.selectedReportForMap = report;
    const coords = this.getCoords(report);
    let mapQuery = '';
    if (coords) {
      mapQuery = `${coords.lat},${coords.lng}`;
    } else {
      mapQuery = encodeURIComponent(`${report.address || report.district || 'Sri Lanka'}, Sri Lanka`);
    }

    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  openVerificationModal(report: GroundReport): void {
    this.selectedReportForVerification = report;
    this.verificationForm.severity = report.severity || 'HIGH';
    this.verificationForm.remarks = report.verificationRemarks || 'Verified after ground inspection & photo review.';
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const coords = this.getCoords(report);
    let mapQuery = '';
    if (coords) {
      mapQuery = `${coords.lat},${coords.lng}`;
    } else {
      mapQuery = encodeURIComponent(`${report.address || report.district || 'Kandy'}, Sri Lanka`);
    }
    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
    this.verificationMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  closeVerificationModal(): void {
    this.selectedReportForVerification = null;
    this.verificationMapUrl = null;
  }

  confirmVerifyReport(): void {
    if (!this.selectedReportForVerification) return;

    this.isSubmittingVerification = true;
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const payload = {
      severity: this.verificationForm.severity,
      remarks: this.verificationForm.remarks
    };

    this.reportService.verifyReport(this.selectedReportForVerification._id, payload).subscribe({
      next: (updated) => {
        this.isSubmittingVerification = false;
        this.actionSuccessMessage = `Report #${this.getReportNumber(updated)} verified successfully as ${updated.severity || payload.severity}!`;
        setTimeout(() => {
          this.closeVerificationModal();
          this.loadData();
        }, 1200);
      },
      error: (err) => {
        this.isSubmittingVerification = false;
        this.actionErrorMessage = err.error?.message || 'Failed to verify report. Please try again.';
      }
    });
  }

  confirmRejectReport(): void {
    if (!this.selectedReportForVerification) return;

    if (!this.verificationForm.remarks) {
      this.actionErrorMessage = 'Please provide rejection remarks/reason.';
      return;
    }

    this.isSubmittingVerification = true;
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const payload = {
      remarks: this.verificationForm.remarks
    };

    this.reportService.rejectReport(this.selectedReportForVerification._id, payload).subscribe({
      next: (updated) => {
        this.isSubmittingVerification = false;
        this.actionSuccessMessage = `Report #${this.getReportNumber(updated)} marked as REJECTED.`;
        setTimeout(() => {
          this.closeVerificationModal();
          this.loadData();
        }, 1200);
      },
      error: (err) => {
        this.isSubmittingVerification = false;
        this.actionErrorMessage = err.error?.message || 'Failed to reject report.';
      }
    });
  }

  getCoords(report: GroundReport): { lat: number; lng: number } | null {
    if (!report) return null;
    if (report.latitude && report.longitude) {
      return { lat: report.latitude, lng: report.longitude };
    }
    if (report.location?.coordinates && report.location.coordinates.length === 2) {
      return { lat: report.location.coordinates[1], lng: report.location.coordinates[0] };
    }
    return null;
  }

  getReportNumber(report: GroundReport): string {
    if (!report) return '';
    return report.reportId || report.reportNumber || ('REP-' + report._id.substring(report._id.length - 6).toUpperCase());
  }

  getSeverityBadgeClass(severity?: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'REJECTED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
