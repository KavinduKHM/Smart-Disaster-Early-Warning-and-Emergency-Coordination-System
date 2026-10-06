import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WarningService } from '../../core/services/warning.service';
import { User } from '../../core/models/user.model';
import { HazardWarning } from '../../core/models/warning.model';
import { Hazard } from '../../core/models/hazard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styles: [],
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: 'active-warnings' | 'hazards' | 'create-warning' = 'active-warnings';

  activeWarningsCount = 0;
  totalHazardsCount = 0;
  totalCitizensReached = 0;
  overallDeliveryRate = 96.8;

  selectedWarningForDrawer: HazardWarning | null = null;
  isDrawerOpen = false;

  recentActiveWarnings: HazardWarning[] = [];

  constructor(
    private authService: AuthService,
    private warningService: WarningService,
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
  }

  switchTab(tab: 'active-warnings' | 'hazards' | 'create-warning'): void {
    this.activeTab = tab;
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
