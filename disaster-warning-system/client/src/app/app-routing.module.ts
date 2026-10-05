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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}