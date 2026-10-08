import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../../core/services/auth.service';

export type DashboardPage = 'incidents';

@Component({
  selector: 'app-district-officer-dashboard',
  templateUrl: './district-officer-dashboard.component.html',
  styleUrls: ['./district-officer-dashboard.component.css']
})
export class DistrictOfficerDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  activePage: DashboardPage = 'incidents';

  readonly navItems: { id: DashboardPage; label: string; icon: string; }[] = [
    { id: 'incidents', label: 'Incidents', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    // Only one page for now as requested
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
  }

  navigate(page: DashboardPage): void {
    this.activePage = page;
  }

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    const name = this.user?.name || 'DO';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
