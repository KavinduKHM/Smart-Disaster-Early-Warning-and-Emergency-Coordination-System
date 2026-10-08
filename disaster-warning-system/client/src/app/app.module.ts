import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Auth & Member 2 Components
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { CitizenHomeComponent } from './features/dashboards/citizen-home/citizen-home.component';
import { RescueTeamDashboardComponent } from './features/dashboards/rescue-team-dashboard/rescue-team-dashboard.component';
import { DutyOfficerDashboardComponent } from './features/dashboards/duty-officer-dashboard/duty-officer-dashboard.component';
import { DmcOfficerDashboardComponent } from './features/dashboards/dmc-officer-dashboard/dmc-officer-dashboard.component';
import { DistrictOfficerDashboardComponent } from './features/dashboards/district-officer-dashboard/district-officer-dashboard.component';
import { UserSettingsComponent } from './features/settings/user-settings.component';
import { DutyOfficerReportsComponent } from './features/dashboards/duty-officer-dashboard/duty-officer-reports.component';

// Additional Feature Components (UC1)
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HazardListComponent } from './features/uc1-warning/hazard-list/hazard-list.component';
import { CreateWarningComponent } from './features/uc1-warning/create-warning/create-warning.component';
import { ActiveWarningsComponent } from './features/uc1-warning/active-warnings/active-warnings.component';

// UC3
import { IncidentsComponent } from './features/uc3-rescue/components/incidents.component';
// Core Interceptors
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    CitizenHomeComponent,
    RescueTeamDashboardComponent,
    DutyOfficerDashboardComponent,
    DmcOfficerDashboardComponent,
    DistrictOfficerDashboardComponent,
    UserSettingsComponent,
    DutyOfficerReportsComponent,
    DashboardComponent,
    HazardListComponent,
    CreateWarningComponent,
    ActiveWarningsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    IncidentsComponent
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
