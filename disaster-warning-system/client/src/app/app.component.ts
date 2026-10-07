import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IncidentService } from './core/services/incident.service';
import { RescueService, RescueTeam, RescueAssignment } from './core/services/rescue.service';
import { Incident, CreateIncidentPayload } from './core/models/incident.model';
import { Observable } from 'rxjs';
import { NotificationService, ToastMessage } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Disaster Management Centre - District Officer Command';

  // Toast Notifications
  toasts$: Observable<ToastMessage[]>;

  // Incidents Data
  incidents: Incident[] = [];
  filteredIncidents: Incident[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // UC3 Rescue Data
  rescueTeams: RescueTeam[] = [];
  activeAssignments: RescueAssignment[] = [];
  isRescueLoading = false;

  // Rescue Operations Modals/Drawers
  isDispatchModalOpen = false;
  selectedRescueIncident: Incident | null = null;
  selectedTeamIdToDispatch: string = '';

  // Selected Incident for Detail Drawer
  selectedIncident: Incident | null = null;
  isDrawerOpen = false;
  safeMapUrl: SafeResourceUrl | null = null;
  locationName: string = 'Resolving location...';

  // Navigation State
  currentRoute: string = 'rescue-operations'; // Set default for UC3 Demo

  // Modal State
  isIssueModalOpen = false;
  isSubmitting = false;

  // Search & Filters
  searchQuery = '';
  filterType = 'ALL';
  filterPriority = 'ALL';
  filterDistrict = 'ALL';
  filterStatus = 'ALL';

  // Predefined Districts & Types
  districts: string[] = [
    'Kandy', 'Kegalle', 'Ratnapura', 'Badulla', 'Colombo',
    'Galle', 'Batticaloa', 'Nuwara Eliya', 'Matale', 'Kalutara',
    'Hambantota', 'Matara', 'Jaffna', 'Kurunegala', 'Anuradhapura',
    'Polonnaruwa', 'Trincomalee', 'Puttalam', 'Monaragala', 'Ampara',
    'Gampaha', 'Vavuniya', 'Mannar', 'Mullaitivu', 'Kilinochchi'
  ];

  hazardTypes: string[] = [
    'Flood', 'Landslide', 'Heavy Rain', 'Cyclone Alert', 'Drought', 'Tsunami Watch', 'Structural Collapse'
  ];

  assistanceOptions: string[] = [
    'Evacuation', 'Boat Rescue', 'Search and Rescue', 'Medical Aid',
    'Emergency Shelter', 'Food Rations', 'Heavy Machinery', 'Siren Network'
  ];

  // New Incident Form Model
  newIncident = {
    type: 'Flood',
    description: '',
    district: 'Kandy',
    priority: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    peopleAffected: 50,
    requiredAssistance: ['Evacuation', 'Boat Rescue'] as string[],
    createdBy: 'Maj. D. Silva (District Officer)',
    longitude: 80.6337,
    latitude: 7.2906
  };

  // Clock
  currentTime = '';
  private timerInterval: any;

  constructor(
    private incidentService: IncidentService,
    private rescueService: RescueService,
    private sanitizer: DomSanitizer,
    public notificationService: NotificationService
  ) {
    this.toasts$ = this.notificationService.toasts$;
  }

  ngOnInit(): void {
    this.updateClock();
    this.timerInterval = setInterval(() => this.updateClock(), 1000);
    this.loadIncidents();
    this.loadRescueData();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour12: false });
  }

  loadRescueData(): void {
    this.isRescueLoading = true;
    this.rescueService.getTeams().subscribe({
      next: (teams) => {
        this.rescueTeams = Array.isArray(teams) ? teams : [];
        this.isRescueLoading = false;
      },
      error: (err) => console.error('Failed to load rescue teams', err)
    });

    this.rescueService.getAssignments().subscribe({
      next: (assignments) => {
        this.activeAssignments = Array.isArray(assignments) ? assignments : [];
      },
      error: (err) => console.error('Failed to load assignments', err)
    });
  }

  loadIncidents(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.incidentService.getIncidents().subscribe({
      next: (data) => {
        this.incidents = Array.isArray(data) ? data : [];
        this.applyFilters();
        this.isLoading = false;

        // If an incident was selected, update its reference
        if (this.selectedIncident) {
          const updated = this.incidents.find(i => i.incidentId === this.selectedIncident?.incidentId);
          if (updated) {
            this.selectedIncident = updated;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load incidents from backend:', err);
        this.errorMessage = 'Could not connect to backend server. Make sure NestJS is running on port 3000.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredIncidents = this.incidents.filter(incident => {
      // Search Query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchesId = incident.incidentId?.toLowerCase().includes(q);
        const matchesType = incident.type?.toLowerCase().includes(q);
        const matchesDistrict = incident.district?.toLowerCase().includes(q);
        const matchesDesc = incident.description?.toLowerCase().includes(q);
        if (!matchesId && !matchesType && !matchesDistrict && !matchesDesc) {
          return false;
        }
      }

      // Filter Type
      if (this.filterType !== 'ALL') {
        if (incident.type?.toLowerCase() !== this.filterType.toLowerCase()) {
          return false;
        }
      }

      // Filter Priority / Warning Level
      if (this.filterPriority !== 'ALL') {
        if (incident.priority?.toUpperCase() !== this.filterPriority.toUpperCase()) {
          return false;
        }
      }

      // Filter District
      if (this.filterDistrict !== 'ALL') {
        if (incident.district?.toLowerCase() !== this.filterDistrict.toLowerCase()) {
          return false;
        }
      }

      // Filter Status
      if (this.filterStatus !== 'ALL') {
        if (incident.status?.toUpperCase() !== this.filterStatus.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }

  // Dynamic Statistics
  get activeCount(): number {
    return this.incidents.filter(i => i.status === 'ACTIVE').length;
  }

  get criticalCount(): number {
    return this.incidents.filter(i => i.priority === 'CRITICAL' && i.status === 'ACTIVE').length;
  }

  get highCount(): number {
    return this.incidents.filter(i => i.priority === 'HIGH' && i.status === 'ACTIVE').length;
  }

  get mediumCount(): number {
    return this.incidents.filter(i => i.priority === 'MEDIUM' && i.status === 'ACTIVE').length;
  }

  get totalPeopleAffected(): number {
    return this.incidents.reduce((sum, i) => sum + (Number(i.peopleAffected) || 0), 0);
  }

  // Drawer Interactions
  selectIncident(incident: Incident): void {
    this.selectedIncident = incident;
    this.isDrawerOpen = true;
    this.locationName = 'Resolving location...';
    
    if (incident.location?.coordinates?.length === 2) {
      const lng = incident.location.coordinates[0];
      const lat = incident.location.coordinates[1];
      const url = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`;
      this.safeMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

      // Free reverse geocoding via Nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          this.locationName = data.display_name || 'Location resolved';
        })
        .catch(() => {
          this.locationName = 'Location resolving failed';
        });
    } else {
      this.safeMapUrl = null;
      this.locationName = 'Unknown Location';
    }
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedIncident = null;
  }

  closeSelectedIncidentModal(): void {
    this.selectedIncident = null;
  }

  toggleDrawer(open: boolean): void {
    this.isDrawerOpen = open;
    if (!open) {
      this.selectedIncident = null;
    }
  }

  navigateTo(route: string): void {
    this.currentRoute = route;
  }

  // Modal Interactions
  openModal(): void {
    this.isIssueModalOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeModal(): void {
    this.isIssueModalOpen = false;
  }

  removeToast(id: string): void {
    this.notificationService.removeToast(id);
  }

  toggleAssistanceSelection(item: string): void {
    const idx = this.newIncident.requiredAssistance.indexOf(item);
    if (idx > -1) {
      this.newIncident.requiredAssistance.splice(idx, 1);
    } else {
      this.newIncident.requiredAssistance.push(item);
    }
  }

  isAssistanceSelected(item: string): boolean {
    return this.newIncident.requiredAssistance.includes(item);
  }

  // Submit New Incident to Backend
  submitIncident(): void {
    if (!this.newIncident.type || !this.newIncident.district || !this.newIncident.description) {
      alert('Please fill out all required fields.');
      return;
    }

    this.isSubmitting = true;
    const payload: CreateIncidentPayload = {
      type: this.newIncident.type,
      description: this.newIncident.description,
      district: this.newIncident.district,
      location: {
        type: 'Point',
        coordinates: [Number(this.newIncident.longitude) || 80.6337, Number(this.newIncident.latitude) || 7.2906]
      },
      priority: this.newIncident.priority,
      peopleAffected: Number(this.newIncident.peopleAffected) || 0,
      requiredAssistance: this.newIncident.requiredAssistance.length > 0 ? this.newIncident.requiredAssistance : ['Evacuation'],
      createdBy: this.newIncident.createdBy || 'District Officer'
    };

    this.incidentService.createIncident(payload).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.closeModal();
        this.successMessage = `Incident ${created.incidentId} successfully logged and broadcasted!`;
        this.loadIncidents();
        
        // Reset form
        this.newIncident.description = '';
        this.newIncident.peopleAffected = 20;

        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
      error: (err) => {
        console.error('Error creating incident:', err);
        alert('Failed to log incident to backend. Check console for details.');
        this.isSubmitting = false;
      }
    });
  }

  // Resolve / Close Incident in Backend
  closeSelectedIncident(): void {
    if (!this.selectedIncident) return;
    const id = this.selectedIncident.incidentId;
    if (!confirm(`Are you sure you want to mark incident ${id} as CLOSED/RESOLVED?`)) {
      return;
    }

    this.incidentService.closeIncident(id).subscribe({
      next: (updated) => {
        this.selectedIncident = updated;
        this.loadIncidents();
        this.successMessage = `Incident ${id} marked as CLOSED.`;
        setTimeout(() => this.successMessage = null, 4000);
      },
      error: (err) => {
        console.error('Failed to close incident:', err);
        alert('Failed to update incident status.');
      }
    });
  }

  // --- UC3 Rescue Operations Logic ---
  openDispatchModal(incident: Incident): void {
    this.selectedRescueIncident = incident;
    this.selectedTeamIdToDispatch = '';
    this.isDispatchModalOpen = true;
  }

  closeDispatchModal(): void {
    this.isDispatchModalOpen = false;
    this.selectedRescueIncident = null;
    this.selectedTeamIdToDispatch = '';
  }

  dispatchRescueTeam(): void {
    if (!this.selectedRescueIncident || !this.selectedTeamIdToDispatch) {
      alert('Please select a rescue team to dispatch.');
      return;
    }
    this.isSubmitting = true;
    this.rescueService.createAssignment(
      this.selectedRescueIncident.incidentId, 
      this.selectedTeamIdToDispatch, 
      'District Officer Console'
    ).subscribe({
      next: (assignment) => {
        this.isSubmitting = false;
        this.closeDispatchModal();
        this.loadRescueData(); // Refresh assignments
        this.loadIncidents(); // Refresh incident status
        this.notificationService.showSuccess('Team Dispatched', `Successfully dispatched to Incident ${this.selectedRescueIncident?.incidentId}`);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        alert('Failed to dispatch team. Check console.');
      }
    });
  }

  updateAssignmentStatus(assignmentId: string, statusEndpoint: string, notes?: string): void {
    this.rescueService.updateAssignmentStatus(assignmentId, statusEndpoint, 'Field Command Node', notes).subscribe({
      next: (res) => {
        this.loadRescueData();
        if (statusEndpoint === 'complete') {
          this.loadIncidents(); // Incident will be auto-resolved by backend!
          this.notificationService.showSuccess('Mission Accomplished', 'Rescue operation completed and incident resolved.');
        } else {
          this.notificationService.showInfo('Status Updated', `Assignment status updated to: ${statusEndpoint.toUpperCase()}`);
        }
      },
      error: (err) => {
        console.error(err);
        alert(`Failed to update assignment status to ${statusEndpoint}`);
      }
    });
  }

  // Visual Helpers
  getHazardIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('flood')) return 'flood';
    if (t.includes('landslide')) return 'landslide';
    if (t.includes('rain')) return 'rainy';
    if (t.includes('cyclone') || t.includes('wind')) return 'cyclone';
    if (t.includes('drought')) return 'water_drop';
    if (t.includes('tsunami')) return 'tsunami';
    return 'warning';
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-error text-on-error';
      case 'HIGH':
        return 'bg-secondary text-on-secondary';
      case 'MEDIUM':
        return 'bg-surface-container-highest text-on-surface';
      case 'LOW':
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Recently';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
