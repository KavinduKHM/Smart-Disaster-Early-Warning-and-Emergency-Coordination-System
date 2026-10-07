import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShelterManagementComponent } from './pages/shelter-management/shelter-management.component';
import { EvacueeRegistrationComponent } from './pages/evacuee-registration/evacuee-registration.component';
import { ResourceInventoryComponent } from './pages/resource-inventory/resource-inventory-component';
import { ResourceAllocationComponent } from './pages/resource-allocation/resource-allocation-component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'shelters',
    pathMatch: 'full'
  },

  {
    path: 'shelters',
    component: ShelterManagementComponent
  },

  {
    path: 'shelter-management',
    redirectTo: 'shelters',
    pathMatch: 'full'
  },

  {
    path: 'evacuees',
    component: EvacueeRegistrationComponent
  },

  {
    path: 'evacuee-registration',
    redirectTo: 'evacuees',
    pathMatch: 'full'
  },

  {
    path: 'resources',
    component: ResourceInventoryComponent
  },

  {
    path: 'resource-inventory',
    redirectTo: 'resources',
    pathMatch: 'full'
  },

  {
    path: 'allocation',
    component: ResourceAllocationComponent
  },

  {
    path: 'resource-allocation',
    redirectTo: 'allocation',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReliefRoutingModule {}