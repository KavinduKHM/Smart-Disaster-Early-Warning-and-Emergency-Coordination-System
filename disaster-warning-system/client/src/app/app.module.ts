import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { CitizenHomeComponent } from './features/dashboards/citizen-home/citizen-home.component';
import { RescueTeamDashboardComponent } from './features/dashboards/rescue-team-dashboard/rescue-team-dashboard.component';
import { DutyOfficerDashboardComponent } from './features/dashboards/duty-officer-dashboard/duty-officer-dashboard.component';
import { DmcOfficerDashboardComponent } from './features/dashboards/dmc-officer-dashboard/dmc-officer-dashboard.component';
import { DistrictOfficerDashboardComponent } from './features/dashboards/district-officer-dashboard/district-officer-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    CitizenHomeComponent,
    RescueTeamDashboardComponent,
    DutyOfficerDashboardComponent,
    DmcOfficerDashboardComponent,
    DistrictOfficerDashboardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
