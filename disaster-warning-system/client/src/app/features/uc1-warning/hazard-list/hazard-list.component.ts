import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { WarningService } from '../../../core/services/warning.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Hazard, HazardType, HazardStatus } from '../../../core/models/hazard.model';

@Component({
  selector: 'app-hazard-list',
  templateUrl: './hazard-list.component.html',
  styles: [],
})
export class HazardListComponent implements OnInit {
  @Output() issueWarningForHazard = new EventEmitter<Hazard>();

  hazards: Hazard[] = [];
  filteredHazards: Hazard[] = [];
  loading = false;

  // Filters
  searchQuery = '';
  selectedDistrict = '';
  selectedSeverity = '';
  selectedType = '';

  districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  hazardTypes = Object.values(HazardType);
  severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // Add Hazard Modal State
  isAddModalOpen = false;
  newHazard: Partial<Hazard> = {
    type: HazardType.FLOOD,
    title: '',
    description: '',
    severity: 'MEDIUM',
    district: 'Colombo',
    riverBasin: 'Kelani River Basin',
    status: HazardStatus.ACTIVE,
    location: { type: 'Point', coordinates: [80.6337, 7.2906] },
  };

  constructor(
    private warningService: WarningService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadHazards();
  }

  loadHazards(): void {
    this.loading = true;
    this.warningService.getHazards().subscribe({
      next: (data) => {
        this.hazards = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showError('Error Loading Hazards', err.message || 'Failed to fetch hazards');
      },
    });
  }

  applyFilters(): void {
    this.filteredHazards = this.hazards.filter((h) => {
      const matchesQuery =
        !this.searchQuery ||
        h.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesDistrict = !this.selectedDistrict || h.district === this.selectedDistrict;
      const matchesSeverity = !this.selectedSeverity || h.severity === this.selectedSeverity;
      const matchesType = !this.selectedType || h.type === this.selectedType;

      return matchesQuery && matchesDistrict && matchesSeverity && matchesType;
    });
  }

  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  saveHazard(): void {
    if (!this.newHazard.title || !this.newHazard.description) {
      this.notificationService.showWarning('Validation Error', 'Title and Description are required.');
      return;
    }

    this.warningService.createHazard(this.newHazard).subscribe({
      next: (saved) => {
        this.notificationService.showSuccess('Hazard Registered', `New hazard "${saved.title}" created.`);
        this.closeAddModal();
        this.loadHazards();
      },
      error: (err) => {
        this.notificationService.showError('Failed to Create Hazard', err.message || 'Server error');
      },
    });
  }

  onIssueWarning(hazard: Hazard): void {
    this.issueWarningForHazard.emit(hazard);
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }
}
