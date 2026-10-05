import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShelterManagementComponent } from '../pages/shelter-management/shelter-management.component';
import { ResourceInventoryComponent } from '../pages/resource-inventory/resource-inventory-component';
import { ResourceAllocationComponent } from '../pages/resource-allocation/resource-allocation-component';
import { EvacueeRegistrationComponent } from '../pages/evacuee-registration/evacuee-registration.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'shelter-management',
    pathMatch: 'full',
  },

  {
    path: 'shelter-management',
    component: ShelterManagementComponent,
  },

  {
    path: 'evacuee-registration',
    component: EvacueeRegistrationComponent,
  },

  {
    path: 'resource-inventory',
    component: ResourceInventoryComponent,
  },

  {
    path: 'resource-allocation',
    component: ResourceAllocationComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],

  exports: [
    RouterModule,
  ],
})
export class ReliefRoutingModule {}