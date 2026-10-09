import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { ReportService, GroundReport } from '../../../core/services/report.service';

@Component({
  selector: 'app-duty-officer-reports',
  templateUrl: './duty-officer-reports.component.html'
})
export class DutyOfficerReportsComponent implements OnInit {
  user: UserProfile | null = null;
  reports: GroundReport[] = [];
  isLoading: boolean = true;

  // Filter state
  activeTabFilter: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL' = 'ALL';
  selectedDistrictFilter: string = 'ALL';
  selectedHazardFilter: string = 'ALL';
  selectedSeverityFilter: string = 'ALL';
  searchQuery: string = '';

  districtsList = [
    'ALL', 'Kandy', 'Colombo', 'Badulla', 'Kegalle', 'Kalutara', 'Galle', 
    'Matara', 'Ratnapura', 'Kurunegala', 'Nuwara Eliya', 'Anuradhapura', 
    'Polonnaruwa', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Hambantota'
  ];

  hazardTypes = [
    { value: 'ALL', label: 'All Hazard Types' },
    { value: 'FLOOD', label: '🌊 Flood Inundation' },
    { value: 'LANDSLIDE', label: '⛰️ Landslide / Slope Slippage' },
    { value: 'ROAD_BLOCKAGE', label: '🚧 Road Debris Blockage' },
    { value: 'RISING_RIVER', label: '📈 Rising River Threshold' },
    { value: 'FALLEN_TREE', label: '🌳 Fallen Tree / Infrastructure' },
    { value: 'BUILDING_DAMAGE', label: '🏠 Building Damage' },
    { value: 'FIRE', label: '🔥 Fire Emergency' },
    { value: 'OTHER', label: '⚠️ Other Hazard' }
  ];

  severities = [
    { value: 'ALL', label: 'All Severities' },
    { value: 'CRITICAL', label: '🔴 CRITICAL' },
    { value: 'HIGH', label: '🟠 HIGH' },
    { value: 'MEDIUM', label: '🟡 MEDIUM' },
    { value: 'LOW', label: '🔵 LOW' }
  ];

  // PDF Modal state
  showPdfModal: boolean = false;
  pdfGeneratedDate: Date = new Date();

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
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.reportService.getReports().subscribe({
      next: (data) => {
        const res = data as any;
        this.reports = Array.isArray(res) ? res : (res && res.data && Array.isArray(res.data) ? res.data : []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredReports(): GroundReport[] {
    return this.reports.filter(r => {
      const matchesStatus = this.activeTabFilter === 'ALL' ? true : 
        (this.activeTabFilter === 'PENDING' 
          ? (r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION') 
          : r.status === this.activeTabFilter);
      const matchesDistrict = (this.selectedDistrictFilter === 'ALL' || !this.selectedDistrictFilter) ? true : (r.district && r.district.toLowerCase() === this.selectedDistrictFilter.toLowerCase());
      const matchesHazard = this.selectedHazardFilter === 'ALL' ? true : r.hazardType === this.selectedHazardFilter;
      const matchesSeverity = this.selectedSeverityFilter === 'ALL' ? true : r.severity === this.selectedSeverityFilter;

      let matchesSearch = true;
      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase();
        const repId = this.getReportNumber(r).toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const addr = (r.address || r.district || '').toLowerCase();
        matchesSearch = repId.includes(query) || desc.includes(query) || addr.includes(query);
      }

      return matchesStatus && matchesDistrict && matchesHazard && matchesSeverity && matchesSearch;
    });
  }

  get pendingCount(): number {
    return this.reports.filter(r => r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION').length;
  }

  get verifiedCount(): number {
    return this.reports.filter(r => r.status === 'VERIFIED').length;
  }

  get rejectedCount(): number {
    return this.reports.filter(r => r.status === 'REJECTED').length;
  }

  get criticalCount(): number {
    return this.filteredReports.filter(r => r.severity === 'CRITICAL').length;
  }

  // --- PDF REPORT GENERATION & PRINT ---
  openPdfModal(): void {
    this.pdfGeneratedDate = new Date();
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
  }

  downloadPrintPdf(): void {
    window.print();
  }

  // --- VERIFICATION MODAL LOGIC ---
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
          this.loadReports();
        }, 1200);
      },
      error: (err) => {
        this.isSubmittingVerification = false;
        this.actionErrorMessage = err.error?.message || 'Failed to verify report.';
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
          this.loadReports();
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

  getReportNumber(report: any): string {
    if (!report) return '';
    if (report.reportId) return report.reportId;
    if (report.reportNumber) return report.reportNumber;
    const id = report._id || report.id || '';
    if (typeof id === 'string' && id.length > 0) {
      return 'REP-' + (id.length >= 6 ? id.substring(id.length - 6) : id).toUpperCase();
    }
    return 'REP-SUBMITTED';
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

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    this.authService.logout();
  }
}
