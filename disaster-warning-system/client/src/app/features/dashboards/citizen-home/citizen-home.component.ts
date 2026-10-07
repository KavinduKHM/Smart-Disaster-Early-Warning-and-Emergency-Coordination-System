import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { ReportService, GroundReport, ReliefShelter } from '../../../core/services/report.service';

@Component({
  selector: 'app-citizen-home',
  templateUrl: './citizen-home.component.html'
})
export class CitizenHomeComponent implements OnInit {
  user: UserProfile | null = null;
  myReports: GroundReport[] = [];
  districtReports: GroundReport[] = [];
  shelters: ReliefShelter[] = [];
  
  stats = {
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  };

  isLoading: boolean = true;
  isSafeBeaconActive: boolean = false;
  selectedReport: GroundReport | null = null;
  selectedReportMapUrl: SafeResourceUrl | null = null;
  activeCardFilter: 'VERIFIED' | 'PENDING' | 'MY_REPORTS' | 'SHELTERS' | null = null;

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
    const district = this.user?.district || 'Kandy';

    // 1. Fetch citizen's own reports from DB
    this.reportService.getMyReports().subscribe({
      next: (res) => {
        this.myReports = res || [];
      },
      error: (err) => console.error('Error loading my reports:', err)
    });

    // 2. Fetch district hazard reports from DB
    this.reportService.getReports(district).subscribe({
      next: (res) => {
        this.districtReports = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading district reports:', err);
        this.isLoading = false;
      }
    });

    // 3. Fetch report stats for district from DB
    this.reportService.getReportStats(district).subscribe({
      next: (res) => {
        if (res) {
          this.stats = {
            total: res.total || 0,
            pending: res.pending || 0,
            verified: res.verified || 0,
            rejected: res.rejected || 0
          };
        }
      },
      error: (err) => console.error('Error loading report stats:', err)
    });

    // 4. Fetch relief shelters from DB
    this.reportService.getShelters(district).subscribe({
      next: (res) => {
        this.shelters = res || [];
      },
      error: (err) => console.error('Error loading shelters:', err)
    });
  }

  get verifiedIncidentsList(): GroundReport[] {
    return this.districtReports.filter(r => r.status === 'VERIFIED');
  }

  get myPendingReportsList(): GroundReport[] {
    return this.myReports.filter(r => r.status === 'PENDING');
  }

  getReportNumber(report: GroundReport): string {
    if (!report) return '';
    return report.reportId || report.reportNumber || ('REP-' + report._id.substring(report._id.length - 6).toUpperCase());
  }

  getReportLocation(report: GroundReport): string {
    if (!report) return '';
    return report.address || report.locationName || (report.district + ' District');
  }

  getReportCoords(report: GroundReport): { lat: number; lng: number } | null {
    if (!report) return null;
    if (report.latitude && report.longitude) {
      return { lat: report.latitude, lng: report.longitude };
    }
    if (report.location?.coordinates && report.location.coordinates.length === 2) {
      // GeoJSON [longitude, latitude]
      return { lat: report.location.coordinates[1], lng: report.location.coordinates[0] };
    }
    return null;
  }

  openReportModal(report: GroundReport): void {
    this.selectedReport = report;
    
    // Generate Google Maps Embed URL for exact incident coordinates/location
    const coords = this.getReportCoords(report);
    let mapQuery = '';
    if (coords) {
      mapQuery = `${coords.lat},${coords.lng}`;
    } else {
      const locName = this.getReportLocation(report);
      mapQuery = encodeURIComponent(`${locName}, ${report.district || 'Kandy'}, Sri Lanka`);
    }
    
    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
    this.selectedReportMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  closeReportModal(): void {
    this.selectedReport = null;
    this.selectedReportMapUrl = null;
  }

  openCardFilterModal(type: 'VERIFIED' | 'PENDING' | 'MY_REPORTS' | 'SHELTERS'): void {
    this.activeCardFilter = type;
  }

  closeCardFilterModal(): void {
    this.activeCardFilter = null;
  }

  toggleSafeBeacon(): void {
    this.isSafeBeaconActive = !this.isSafeBeaconActive;
  }

  logout(): void {
    this.authService.logout();
  }
}
