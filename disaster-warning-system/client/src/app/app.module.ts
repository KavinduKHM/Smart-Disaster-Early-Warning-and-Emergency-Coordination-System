import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Feature Components
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HazardListComponent } from './features/uc1-warning/hazard-list/hazard-list.component';
import { CreateWarningComponent } from './features/uc1-warning/create-warning/create-warning.component';
import { ActiveWarningsComponent } from './features/uc1-warning/active-warnings/active-warnings.component';

// Core Interceptors
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    HazardListComponent,
    CreateWarningComponent,
    ActiveWarningsComponent,
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],

  providers: [],

  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
