import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../../core/services/auth.service';

@Component({
  selector: 'app-rescue-team-dashboard',
  templateUrl: './rescue-team-dashboard.component.html'
})
export class RescueTeamDashboardComponent implements OnInit {
  user: UserProfile | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
  }

  logout(): void {
    this.authService.logout();
  }
}
