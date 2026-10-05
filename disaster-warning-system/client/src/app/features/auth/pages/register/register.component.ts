import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  selectedRole: string = 'CITIZEN';
  
  // General Fields
  name: string = '';
  email: string = '';
  password: string = '';
  district: string = 'Kandy';
  phone: string = '';

  // Officer Badge ID
  badgeId: string = '';

  // Rescue Team Fields
  organization: string = 'Sri Lanka Navy';
  teamType: string = 'WATER_RESCUE';
  membersCount: number = 10;
  latitude: number = 7.2906;
  longitude: number = 80.6337;

  isLoading: boolean = false;
  errorMessage: string = '';

  districts = [
    'Kandy', 'Colombo', 'Badulla', 'Kegalle', 'Kalutara', 'Galle', 
    'Matara', 'Ratnapura', 'Kurunegala', 'Nuwara Eliya', 'Anuradhapura', 
    'Polonnaruwa', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Hambantota'
  ];

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: any = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.selectedRole,
      district: this.district,
      phone: this.phone
    };

    if (this.selectedRole === 'RESCUE_TEAM') {
      payload.organization = this.organization;
      payload.teamType = this.teamType;
      payload.membersCount = this.membersCount;
      payload.latitude = this.latitude;
      payload.longitude = this.longitude;
    } else if (['DUTY_OFFICER', 'DMC_OFFICER', 'DISTRICT_OFFICER'].includes(this.selectedRole)) {
      payload.badgeId = this.badgeId || `OFF-${Math.floor(100 + Math.random() * 900)}`;
    }

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Role-based navigation is handled inside authService.register()
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
