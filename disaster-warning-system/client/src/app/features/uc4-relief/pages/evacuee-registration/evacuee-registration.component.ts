import {
  Component,
  OnInit,
} from '@angular/core';

import { ReliefService } from '../../services/relief.service';

@Component({
  selector: 'app-evacuee-registration',
  templateUrl:
    './evacuee-registration.component.html',
})
export class EvacueeRegistrationComponent
  implements OnInit {

  shelters: any[] = [];
  evacuees: any[] = [];

  selectedShelterId = '';

  evacuee = {
    shelterId: '',
    fullName: '',
    nationalId: '',
    age: null,
    gender: '',
    phone: '',
    specialNeeds: '',
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
      .subscribe((data) => {
        this.shelters = data;
      });
  }

  loadEvacuees(): void {
    if (!this.selectedShelterId) {
      return;
    }

    this.reliefService
      .getEvacuees(
        this.selectedShelterId,
      )
      .subscribe((data) => {
        this.evacuees = data;
      });
  }

  registerEvacuee(): void {
    this.evacuee.shelterId =
      this.selectedShelterId;

    this.reliefService
      .registerEvacuee(this.evacuee)
      .subscribe({
        next: () => {
          alert(
            'Evacuee registered successfully',
          );

          this.evacuee = {
            shelterId:
              this.selectedShelterId,
            fullName: '',
            nationalId: '',
            age: null,
            gender: '',
            phone: '',
            specialNeeds: '',
          };

          this.loadEvacuees();
          this.loadShelters();
        },

        error: (error) => {
          alert(
            error.error?.message ||
            'Registration failed',
          );
        },
      });
  }
}