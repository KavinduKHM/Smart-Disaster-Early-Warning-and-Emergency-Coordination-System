import { Component, OnInit } from '@angular/core';
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

  constructor(
    private authService: AuthService,
    private reportService: ReportService
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

  openReportModal(report: GroundReport): void {
    this.selectedReport = report;
  }

  closeReportModal(): void {
    this.selectedReport = null;
  }

  toggleSafeBeacon(): void {
    this.isSafeBeaconActive = !this.isSafeBeaconActive;
  }

  logout(): void {
    this.authService.logout();
  }
}
