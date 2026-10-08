import {
  Component,
  OnInit,
} from '@angular/core';

import { ReliefService } from '../../services/relief.service';

@Component({
  selector: 'app-resource-allocation',
  templateUrl:
    './resource-allocation-component.html',
  styleUrls: ['./resource-allocation-component.scss'],
})
export class ResourceAllocationComponent
  implements OnInit {

  resources: any[] = [];
  shelters: any[] = [];
  allocations: any[] = [];

  allocation = {
    resourceId: '',
    shelterId: '',
    quantity: 0,
    distributedBy: 'DMC Officer',
    notes: '',
  };

  constructor(
    private reliefService: ReliefService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reliefService
      .getResources()
      .subscribe((data) => {
        this.resources = data;
      });

    this.reliefService
      .getShelters()
      .subscribe((data) => {
        this.shelters = data;
      });

    this.reliefService
      .getAllocations()
      .subscribe((data) => {
        this.allocations = data;
      });
  }

  allocateResource(): void {
    this.reliefService
      .allocateResource(this.allocation)
      .subscribe({
        next: () => {
          alert(
            'Resource allocated successfully',
          );

          this.allocation = {
            resourceId: '',
            shelterId: '',
            quantity: 0,
            distributedBy: 'DMC Officer',
            notes: '',
          };

          this.loadData();
        },

        error: (error) => {
          alert(
            error.error?.message ||
            'Resource allocation failed',
          );
        },
      });
  }
}