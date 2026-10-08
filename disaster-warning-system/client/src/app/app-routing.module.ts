import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'relief',
    loadChildren: () =>
      import('./features/uc4-relief/relief.module')
        .then(m => m.ReliefModule)
  },

  {
    path: 'uc4-relief',
    redirectTo: 'relief',
    pathMatch: 'full'
  },

  {
    path: '',
    redirectTo: 'relief',
    pathMatch: 'full'
  }
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
  exports: [RouterModule],
})
export class AppRoutingModule {}
