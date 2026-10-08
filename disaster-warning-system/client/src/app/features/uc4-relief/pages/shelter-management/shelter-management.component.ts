import { Component, OnInit } from '@angular/core';
import { ReliefService } from '../../services/relief.service';

@Component({
  selector: 'app-shelter-management',
  templateUrl: './shelter-management.component.html',
  styleUrls: ['./shelter-management.component.scss'],
})
export class ShelterManagementComponent
  implements OnInit {

  shelters: any[] = [];

  newShelter = {
    name: '',
    district: '',
    address: '',
    capacity: 0,
    managerName: '',
    managerContact: '',
  };

  constructor(
    private reliefService: ReliefService,
  ) {}

  ngOnInit(): void {
    this.loadShelters();
  }

  loadShelters(): void {
    this.reliefService
      .getShelters()
      .subscribe({
        next: (data) => {
          this.shelters = data;
        },

        error: (error) => {
          console.error(error);
        },
      });
  }

  createShelter(): void {
    this.reliefService
      .createShelter(this.newShelter)
      .subscribe({
        next: () => {
          alert('Shelter created successfully');

          this.newShelter = {
            name: '',
            district: '',
            address: '',
            capacity: 0,
            managerName: '',
            managerContact: '',
          };

          this.loadShelters();
        },

        error: (error) => {
          alert(
            error.error?.message ||
            'Failed to create shelter',
          );
        },
      });
  }

  closeShelter(id: string): void {
    this.reliefService
      .updateShelterStatus(
        id,
        'CLOSED',
      )
      .subscribe(() => {
        this.loadShelters();
      });
  }
}