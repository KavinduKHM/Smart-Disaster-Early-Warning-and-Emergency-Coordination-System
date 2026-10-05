import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { CitizenHomeComponent } from './features/dashboards/citizen-home/citizen-home.component';
import { RescueTeamDashboardComponent } from './features/dashboards/rescue-team-dashboard/rescue-team-dashboard.component';
import { DutyOfficerDashboardComponent } from './features/dashboards/duty-officer-dashboard/duty-officer-dashboard.component';
import { DmcOfficerDashboardComponent } from './features/dashboards/dmc-officer-dashboard/dmc-officer-dashboard.component';
import { DistrictOfficerDashboardComponent } from './features/dashboards/district-officer-dashboard/district-officer-dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'citizen/home', 
    component: CitizenHomeComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['CITIZEN'] } 
  },
  { 
    path: 'rescue-team/dashboard', 
    component: RescueTeamDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['RESCUE_TEAM'] } 
  },
  { 
    path: 'duty-officer/dashboard', 
    component: DutyOfficerDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['DUTY_OFFICER'] } 
  },
  { 
    path: 'dmc-officer/dashboard', 
    component: DmcOfficerDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['DMC_OFFICER'] } 
  },
  { 
    path: 'district-officer/dashboard', 
    component: DistrictOfficerDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['DISTRICT_OFFICER'] } 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
