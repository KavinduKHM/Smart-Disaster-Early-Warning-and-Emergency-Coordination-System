import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../../core/services/auth.service';

import { ActivatedRoute } from '@angular/router';

export type DashboardPage = 
  | 'verification-queue'
  | 'hazard-reports'
  | 'incidents' 
  | 'rescue-teams' 
  | 'live-operations' 
  | 'assignments' 
  | 'emergency-map' 
  | 'reports';

@Component({
  selector: 'app-district-officer-dashboard',
  templateUrl: './district-officer-dashboard.component.html',
  styleUrls: ['./district-officer-dashboard.component.css']
})
export class DistrictOfficerDashboardComponent implements OnInit {
  user: UserProfile | null = null;
  activePage: DashboardPage = 'verification-queue';

  readonly navItems: { id: DashboardPage; label: string; icon: string; }[] = [
    { 
      id: 'verification-queue', 
      label: 'Report Dashboard', 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      id: 'hazard-reports', 
      label: 'Hazard Reports', 
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
    },
    { 
      id: 'incidents', 
      label: 'Incidents', 
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' 
    },
    { 
      id: 'rescue-teams', 
      label: 'Rescue Teams', 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
    },
    { 
      id: 'live-operations', 
      label: 'Live Operations', 
      icon: 'M13 10V3L4 14h7v7l9-11h-7z' 
    },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' 
    },
    { 
      id: 'emergency-map', 
      label: 'Emergency Map', 
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' 
    },
    { 
      id: 'reports', 
      label: 'Reports & Analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' 
    },
  ];


  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activePage = params['tab'] as DashboardPage;
      }
    });
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

  handleNotificationAction(notif: any): void {
    if (notif.category === 'A2_REJECTED' || notif.actionLabel?.includes('Replacement') || notif.assignmentId) {
      this.navigate('assignments');
    } else if (notif.incidentId) {
      this.navigate('incidents');
    }
  }
}
