import {
  Component,
  OnInit,
} from '@angular/core';

import { ReliefService } from '../../services/relief.service';

@Component({
  selector: 'app-resource-inventory',
  templateUrl:
    './resource-inventory-component.html',
  styleUrls: ['./resource-inventory-component.scss'],
})
export class ResourceInventoryComponent
  implements OnInit {

  resources: any[] = [];

  resource = {
    name: '',
    category: 'FOOD',
    quantity: 0,
    unit: '',
    organization: '',
    storageLocation: '',
  };

  constructor(
    private reliefService: ReliefService,
  ) {}

  ngOnInit(): void {
    this.loadResources();
  }

  loadResources(): void {
    this.reliefService
      .getResources()
      .subscribe((data) => {
        this.resources = data;
      });
  }

  createResource(): void {
    this.reliefService
      .createResource(this.resource)
      .subscribe({
        next: () => {
          alert(
            'Resource added successfully',
          );

          this.resource = {
            name: '',
            category: 'FOOD',
            quantity: 0,
            unit: '',
            organization: '',
            storageLocation: '',
          };

          this.loadResources();
        },

        error: (error) => {
          alert(
            error.error?.message ||
            'Failed to add resource',
          );
        },
      });
  }
}   