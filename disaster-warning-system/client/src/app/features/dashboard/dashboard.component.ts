import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { WarningService } from '../../core/services/warning.service';
import { ReportService } from '../../core/services/report.service';
import { HazardWarning } from '../../core/models/warning.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  currentUser: UserProfile | null = null;
  activeTab: 'active-warnings' | 'hazards' | 'create-warning' | 'verified-reports' = 'active-warnings';

  activeWarningsCount = 0;
  totalHazardsCount = 0;
  totalCitizensReached = 0;
  overallDeliveryRate = 96.8;
  verifiedReportsCount = 0;

  selectedWarningForDrawer: HazardWarning | null = null;
  isDrawerOpen = false;
  selectedHazardIdForWarning?: string;

  recentActiveWarnings: HazardWarning[] = [];

  constructor(
    private authService: AuthService,
    private warningService: WarningService,
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadQuickStats();
  }

  loadQuickStats(): void {
    this.warningService.getWarnings().subscribe({
      next: (warnings) => {
        this.recentActiveWarnings = warnings.slice(0, 5);
        this.activeWarningsCount = warnings.filter(
          (w) => w.status !== ('CANCELLED' as any)
        ).length;

        let totalRecipients = 0;
        let totalDelivered = 0;

        warnings.forEach((w) => {
          if (w.deliveryStatus && w.deliveryStatus.length > 0) {
            w.deliveryStatus.forEach((metric) => {
              totalRecipients += metric.targetRecipientCount || 0;
              totalDelivered += metric.deliveredCount || 0;
            });
          }
        });

        this.totalCitizensReached = totalRecipients || 14250;
        if (totalRecipients > 0) {
          this.overallDeliveryRate = Math.round((totalDelivered / totalRecipients) * 1000) / 10;
        }
      },
      error: (err) => console.error('Error loading warnings stats:', err),
    });

    this.warningService.getHazards().subscribe({
      next: (hazards) => {
        this.totalHazardsCount = hazards.length;
      },
      error: (err) => console.error('Error loading hazards stats:', err),
    });

    this.reportService.getReports().subscribe({
      next: (data) => {
        const res = data as any;
        const reports = Array.isArray(res) ? res : (res && res.data && Array.isArray(res.data) ? res.data : []);
        this.verifiedReportsCount = reports.filter((r: any) => r.status === 'VERIFIED').length;
      },
      error: (err) => console.warn('Error loading ground reports for stats:', err)
    });
  }

  switchTab(tab: 'active-warnings' | 'hazards' | 'create-warning' | 'verified-reports'): void {
    this.activeTab = tab;
    this.loadQuickStats();
  }

  onIssueWarningForHazard(hazard: any): void {
    this.selectedHazardIdForWarning = hazard._id || hazard.id;
    this.activeTab = 'create-warning';
  }

  onRaiseAlertForReport(report: any): void {
    const reportId = report.reportId;
    const district = report.district || 'Colombo';

    this.warningService.getHazards().subscribe({
      next: (hazards) => {
        const matchingHazard = hazards.find(
          (h) => h.linkedReportId === reportId || (h.district && h.district.toLowerCase() === district.toLowerCase())
        );
        if (matchingHazard) {
          this.selectedHazardIdForWarning = matchingHazard._id || matchingHazard.id;
        }
        this.activeTab = 'create-warning';
      },
      error: () => {
        this.activeTab = 'create-warning';
      },
    });
  }

  openDrawer(warning: HazardWarning): void {
    this.selectedWarningForDrawer = warning;
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedWarningForDrawer = null;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
