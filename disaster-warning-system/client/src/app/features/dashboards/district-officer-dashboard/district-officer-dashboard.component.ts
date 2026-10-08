import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../../core/services/auth.service';

@Component({
  selector: 'app-district-officer-dashboard',
  templateUrl: './district-officer-dashboard.component.html'
})
export class DistrictOfficerDashboardComponent implements OnInit {
  user: UserProfile | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
  }

  logout(): void {
    this.authService.logout();
  }
}
