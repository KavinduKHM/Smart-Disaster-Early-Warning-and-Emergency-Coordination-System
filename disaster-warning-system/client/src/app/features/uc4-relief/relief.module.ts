import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReliefRoutingModule } from './relief-routing.module';
import { ShelterManagementComponent } from './pages/shelter-management/shelter-management.component';
import { EvacueeRegistrationComponent } from './pages/evacuee-registration/evacuee-registration.component';
import { ResourceInventoryComponent } from './pages/resource-inventory/resource-inventory-component';
import { ResourceAllocationComponent } from './pages/resource-allocation/resource-allocation-component';

@NgModule({
  declarations: [
    ShelterManagementComponent,
    EvacueeRegistrationComponent,
    ResourceInventoryComponent,
    ResourceAllocationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReliefRoutingModule
  ]
})
export class ReliefModule { }
