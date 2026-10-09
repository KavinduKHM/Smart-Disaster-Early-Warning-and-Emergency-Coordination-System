import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { CitizenHomeComponent } from './features/dashboards/citizen-home/citizen-home.component';
import { RescueTeamDashboardComponent } from './features/dashboards/rescue-team-dashboard/rescue-team-dashboard.component';
import { DutyOfficerDashboardComponent } from './features/dashboards/duty-officer-dashboard/duty-officer-dashboard.component';
import { DmcOfficerDashboardComponent } from './features/dashboards/dmc-officer-dashboard/dmc-officer-dashboard.component';
import { DistrictOfficerDashboardComponent } from './features/dashboards/district-officer-dashboard/district-officer-dashboard.component';
import { UserSettingsComponent } from './features/settings/user-settings.component';
import { DutyOfficerReportsComponent } from './features/dashboards/duty-officer-dashboard/duty-officer-reports.component';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HazardListComponent } from './features/uc1-warning/hazard-list/hazard-list.component';
import { CreateWarningComponent } from './features/uc1-warning/create-warning/create-warning.component';
import { ActiveWarningsComponent } from './features/uc1-warning/active-warnings/active-warnings.component';

import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Dashboards
  { path: 'citizen/home', component: CitizenHomeComponent, canActivate: [AuthGuard] },
  { path: 'rescue-team/dashboard', component: RescueTeamDashboardComponent, canActivate: [AuthGuard] },
  { path: 'duty-officer/dashboard', component: DistrictOfficerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'dmc-officer/dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'district-officer/dashboard', component: DistrictOfficerDashboardComponent, canActivate: [AuthGuard] },

  // Settings & Core Features
  { path: 'settings', component: UserSettingsComponent, canActivate: [AuthGuard] },
  { path: 'duty-officer/reports', component: DutyOfficerReportsComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },

  // UC1 Warnings
  { path: 'warnings/hazards', component: HazardListComponent, canActivate: [AuthGuard] },
  { path: 'warnings/create', component: CreateWarningComponent, canActivate: [AuthGuard] },
  { path: 'warnings/active', component: ActiveWarningsComponent, canActivate: [AuthGuard] },

  // UC Workflow URL Aliases
  { path: 'citizen/report', component: CitizenHomeComponent, canActivate: [AuthGuard] },
  { path: 'citizen/dashboard', component: CitizenHomeComponent, canActivate: [AuthGuard] },
  { path: 'officer/verification-queue', component: DistrictOfficerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'uc1/hazards', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'uc3/rescue-dashboard', component: RescueTeamDashboardComponent, canActivate: [AuthGuard] },
  { path: 'uc4/relief-dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'uc4/resources', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'relief/shelters', component: DistrictOfficerDashboardComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
