import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  selectedRole: string = 'CITIZEN';
  email: string = 'asheni@gmail.com';
  password: string = 'Asheni123';
  showPassword: boolean = false;
  rememberMe: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';

  roleDescriptions: { [key: string]: string } = {
    CITIZEN: 'Citizens can lodge incidents, monitor live evacuation routes & find nearest relief shelters.',
    RESCUE_TEAM: 'Rescue Teams manage deployment status, receive emergency dispatches & report field operations.',
    DUTY_OFFICER: 'Duty Officers review incoming hazard reports, conduct field verifications & authorize alerts.',
    DMC_OFFICER: 'DMC Officers monitor national situation alerts, manage disaster warnings & emergency operations.',
    DISTRICT_OFFICER: 'District Officers manage district relief resources, allocate shelters & coordinate rescue teams.'
  };

  testAccounts = [
    { name: 'Asheni (Citizen)', email: 'asheni@gmail.com', pass: 'Asheni123', role: 'CITIZEN' },
    { name: 'Amara (Citizen)', email: 'citizen@disaster.lk', pass: 'password123', role: 'CITIZEN' },
    { name: 'Navy Water Team 1', email: 'navy.water.team1@disaster.lk', pass: 'NavyPassword123', role: 'RESCUE_TEAM' },
    { name: 'Air Force Rescue Unit', email: 'airforce.rescue@disaster.lk', pass: 'TeamPassword123', role: 'RESCUE_TEAM' },
    { name: 'Duty Officer Ruwan', email: 'officer@dmc.gov.lk', pass: 'password123', role: 'DUTY_OFFICER' },
    { name: 'DMC Director Jayasinghe', email: 'dmc@disaster.gov.lk', pass: 'password123', role: 'DMC_OFFICER' },
    { name: 'District Officer Nimal', email: 'district@kandy.gov.lk', pass: 'password123', role: 'DISTRICT_OFFICER' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  selectQuickAccount(acc: any): void {
    this.email = acc.email;
    this.password = acc.pass;
    this.selectedRole = acc.role;
    this.errorMessage = '';
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter your email/identity and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Role-based navigation is handled inside authService.login()
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Invalid credentials for selected portal.';
      }
    });
  }
}
