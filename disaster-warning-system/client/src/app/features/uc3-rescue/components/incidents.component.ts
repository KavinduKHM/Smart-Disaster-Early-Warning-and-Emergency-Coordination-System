import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidentService, Incident } from '../services/incident.service';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      min-height: 0;
    }
  `],
  template: `
    <div class="flex-1 flex flex-col space-y-5 w-full h-full min-h-0 relative">
      <!-- Header with Action -->
      <div class="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-[#0B192C]">Emergency Incidents</h3>
          <p class="text-sm text-[#64748B] mt-1">Real-time incident tracking, dispatch management, and operational logging.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadIncidents()" class="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#CBD5E1] text-[#0B192C] text-sm font-semibold rounded-lg hover:bg-[#F8FAFC] transition-colors shadow-sm">
            <svg class="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
          <button (click)="openCreateModal()" class="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Log New Incident
          </button>
        </div>
      </div>

      <!-- Notification Toast -->
      <div *ngIf="feedbackMessage" class="p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all flex-shrink-0"
        [ngClass]="{
          'bg-emerald-50 border-emerald-200 text-emerald-800': feedbackType === 'success',
          'bg-red-50 border-red-200 text-[#DC2626]': feedbackType === 'error'
        }">
        <div class="flex items-center gap-2 text-sm font-medium">
          <span>{{ feedbackType === 'success' ? '✓' : '⚠' }}</span>
          <span>{{ feedbackMessage }}</span>
        </div>
        <button (click)="feedbackMessage = null" class="text-xs opacity-60 hover:opacity-100 font-bold ml-4">Dismiss</button>
      </div>

      <!-- Filters & Search Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex-shrink-0">
        <div class="relative md:col-span-1">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search ID, district, type..." 
            class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[#1D4ED8] focus:bg-white"
          />
          <svg class="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div>
          <select [(ngModel)]="filterPriority" class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8]">
            <option value="">Priority: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <select [(ngModel)]="filterStatus" class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8]">
            <option value="">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div class="flex items-center justify-end text-xs text-[#64748B] font-medium px-2">
          Total: <span class="font-bold text-[#0B192C] ml-1">{{ filteredIncidents.length }}</span> of {{ incidents.length }}
        </div>
      </div>

      <!-- Incidents Table Container -->
      <div class="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm min-h-0">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <svg class="w-9 h-9 animate-spin text-[#1D4ED8] mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span class="text-sm font-medium">Fetching real-time incidents from backend...</span>
        </div>
        
        <!-- Empty State -->
        <div *ngIf="!loading && filteredIncidents.length === 0" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <div class="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center text-3xl mb-4 border border-[#E2E8F0] shadow-inner">📋</div>
          <h4 class="text-base font-bold text-[#0B192C]">No Incidents Found</h4>
          <p class="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            {{ searchQuery || filterPriority || filterStatus ? 'Try adjusting your search filters to find what you are looking for.' : 'No emergency incidents currently reported in the system.' }}
          </p>
          <button (click)="openCreateModal()" class="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Log New Incident
          </button>
        </div>

        <!-- Data Table Area -->
        <div *ngIf="!loading && filteredIncidents.length > 0" class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 overflow-x-auto overflow-y-auto min-h-0">
            <table class="w-full text-sm">
              <thead class="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
                <tr class="text-[11px] uppercase tracking-wider text-[#64748B]">
                  <th class="px-6 py-4 text-left font-bold">Incident Code</th>
                  <th class="px-6 py-4 text-left font-bold">Type & Description</th>
                  <th class="px-6 py-4 text-left font-bold">District / GPS</th>
                  <th class="px-6 py-4 text-left font-bold">Severity</th>
                  <th class="px-6 py-4 text-left font-bold">Affected</th>
                  <th class="px-6 py-4 text-left font-bold">Status</th>
                  <th class="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F1F5F9]">
                <tr *ngFor="let incident of filteredIncidents" class="hover:bg-[#F8FAFC] transition-colors">

                
                <!-- Code -->
                <td class="px-6 py-4 font-mono text-xs font-bold text-[#1D4ED8] whitespace-nowrap">
                  {{ incident.incidentId }}
                  <div class="text-[10px] text-[#64748B] font-sans font-normal mt-0.5">
                    {{ incident.createdAt | date:'short' }}
                  </div>
                </td>

                <!-- Type & Description -->
                <td class="px-6 py-4 max-w-xs">
                  <div class="text-sm font-bold text-[#0B192C] flex items-center gap-2">
                    {{ incident.type }}
                  </div>
                  <div class="text-xs text-[#64748B] mt-1 line-clamp-2" [title]="incident.description">
                    {{ incident.description }}
                  </div>
                  <div *ngIf="incident.requiredAssistance && incident.requiredAssistance.length > 0" class="flex flex-wrap gap-1 mt-2">
                    <span *ngFor="let req of incident.requiredAssistance" class="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {{ req }}
                    </span>
                  </div>
                </td>

                <!-- District & GPS -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-[#0B192C] flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-[#1D4ED8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {{ incident.district }}
                  </div>
                  <div class="text-xs text-[#64748B] font-mono mt-1" *ngIf="incident.location?.coordinates">
                    [{{ incident.location.coordinates[1] | number:'1.2-4' }}, {{ incident.location.coordinates[0] | number:'1.2-4' }}]
                  </div>
                </td>

                <!-- Severity Badge -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1"
                    [ngClass]="{
                      'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]': incident.priority === 'CRITICAL',
                      'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]': incident.priority === 'HIGH',
                      'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]': incident.priority === 'MEDIUM',
                      'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]': incident.priority === 'LOW'
                    }">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                      'bg-[#DC2626] animate-ping': incident.priority === 'CRITICAL',
                      'bg-[#EA580C]': incident.priority === 'HIGH',
                      'bg-[#D97706]': incident.priority === 'MEDIUM',
                      'bg-[#64748B]': incident.priority === 'LOW'
                    }"></span>
                    {{ incident.priority }}
                  </span>
                </td>

                <!-- People Affected -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-xs font-semibold text-[#0B192C]">
                    {{ incident.peopleAffected || 0 }} persons
                  </div>
                </td>

                <!-- Status Badge -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-xs font-bold flex items-center gap-1.5" [ngClass]="{
                    'text-[#1D4ED8]': incident.status === 'ACTIVE' || incident.status === 'IN_PROGRESS',
                    'text-[#D97706]': incident.status === 'OPEN',
                    'text-[#16A34A]': incident.status === 'RESOLVED',
                    'text-[#64748B]': incident.status === 'CLOSED' || incident.status === 'ARCHIVED'
                  }">
                    <span class="w-2 h-2 rounded-full" [ngClass]="{
                      'bg-[#1D4ED8] animate-pulse': incident.status === 'ACTIVE' || incident.status === 'IN_PROGRESS',
                      'bg-[#D97706] animate-pulse': incident.status === 'OPEN',
                      'bg-[#16A34A]': incident.status === 'RESOLVED',
                      'bg-[#94A3B8]': incident.status === 'CLOSED' || incident.status === 'ARCHIVED'
                    }"></span>
                    {{ incident.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="openEditModal(incident)" class="px-3 py-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0B192C] rounded-lg hover:bg-[#F1F5F9] transition-colors shadow-sm">
                      Edit
                    </button>
                    <button *ngIf="incident.status === 'ACTIVE' || incident.status === 'OPEN' || incident.status === 'IN_PROGRESS'" 
                      (click)="closeIncident(incident.incidentId)" 
                      class="px-3 py-1.5 text-xs font-semibold bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg hover:bg-red-100 transition-colors shadow-sm">
                      Close
                    </button>
                  </div>
                </td>
            </tbody>
          </table>
        </div>
        
        <!-- Table Footer / Count Info -->
        <div class="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B] flex-shrink-0">
          <span>Showing <strong class="text-[#0B192C]">{{ filteredIncidents.length }}</strong> active records</span>
          <span class="font-mono text-[11px] text-[#1D4ED8]">● Real-time sync</span>
        </div>
      </div>
    </div>

      <!-- Create / Edit Incident Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-[#0B192C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
          
          <!-- Modal Header -->
          <div class="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div>
              <h3 class="text-lg font-bold text-[#0B192C]">
                {{ isEditMode ? 'Update Incident: ' + activeIncident?.incidentId : 'Log New Emergency Incident' }}
              </h3>
              <p class="text-xs text-[#64748B] mt-0.5">
                {{ isEditMode ? 'Modify incident details or update its operational status.' : 'Register an emergency incident to trigger coordinator rescue workflows.' }}
              </p>
            </div>
            <button (click)="closeModal()" class="text-[#64748B] hover:text-[#DC2626] transition-colors p-2 rounded-full hover:bg-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <!-- Modal Body Form -->
          <div class="p-8 overflow-y-auto flex-1 bg-white">
            <form [formGroup]="incidentForm" class="space-y-5">
              
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Incident Type <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="type" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C] placeholder-[#94A3B8]" placeholder="e.g. FLOOD, Landslide, Medical">
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">District <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="district" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C] placeholder-[#94A3B8]" placeholder="e.g. Kandy, Badulla, Ratnapura">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Description <span class="text-[#DC2626]">*</span></label>
                <textarea formControlName="description" rows="3" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-3 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C] placeholder-[#94A3B8]" placeholder="Detailed report of the situation..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Priority Level <span class="text-[#DC2626]">*</span></label>
                  <select formControlName="priority" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C]">
                    <option value="CRITICAL" class="text-[#0B192C] bg-white">CRITICAL</option>
                    <option value="HIGH" class="text-[#0B192C] bg-white">HIGH</option>
                    <option value="MEDIUM" class="text-[#0B192C] bg-white">MEDIUM</option>
                    <option value="LOW" class="text-[#0B192C] bg-white">LOW</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">People Affected <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="peopleAffected" type="number" min="0" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C] placeholder-[#94A3B8]">
                </div>
              </div>

              <!-- Status (Visible during edit mode) -->
              <div *ngIf="isEditMode">
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Status</label>
                <select formControlName="status" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C]">
                  <option value="ACTIVE" class="text-[#0B192C] bg-white">ACTIVE</option>
                  <option value="CLOSED" class="text-[#0B192C] bg-white">CLOSED</option>
                  <option value="ARCHIVED" class="text-[#0B192C] bg-white">ARCHIVED</option>
                </select>
              </div>

              <!-- Coordinates Group -->
              <div class="grid grid-cols-2 gap-5 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div class="col-span-2 flex items-center justify-between">
                  <h4 class="text-xs font-bold text-[#0B192C] uppercase tracking-wider">Geo-Coordinates (WGS84)</h4>
                  <span class="text-[11px] text-[#64748B]">Lng, Lat format for geospatial indexing</span>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#64748B] mb-1">Longitude <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="longitude" type="number" step="0.0001" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] bg-white text-[#0B192C] placeholder-[#94A3B8]" placeholder="e.g. 80.6337">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#64748B] mb-1">Latitude <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="latitude" type="number" step="0.0001" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] bg-white text-[#0B192C] placeholder-[#94A3B8]" placeholder="e.g. 7.2906">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Required Assistance (comma-separated)</label>
                <input formControlName="requiredAssistance" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] transition-all bg-[#F8FAFC] focus:bg-white text-[#0B192C] placeholder-[#94A3B8]" placeholder="BOAT_RESCUE, MEDICAL, EVACUATION">
              </div>

            </form>
          </div>
          
          <!-- Modal Footer Actions -->
          <div class="px-8 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="px-5 py-2.5 text-sm font-bold text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] transition-colors">
              Cancel
            </button>
            <button type="button" (click)="onSubmit()" [disabled]="incidentForm.invalid || submitting" class="px-5 py-2.5 text-sm font-bold text-white bg-[#1D4ED8] rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              <svg *ngIf="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Incident') }}
            </button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class IncidentsComponent implements OnInit {
  incidents: Incident[] = [];
  loading = true;
  showModal = false;
  isEditMode = false;
  submitting = false;
  activeIncident: Incident | null = null;

  searchQuery = '';
  filterPriority = '';
  filterStatus = '';

  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' = 'success';

  incidentForm: FormGroup;

  constructor(private incidentService: IncidentService, private fb: FormBuilder) {
    this.incidentForm = this.fb.group({
      type: ['', Validators.required],
      description: ['', Validators.required],
      district: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      peopleAffected: [0, [Validators.required, Validators.min(0)]],
      longitude: [80.6337, Validators.required],
      latitude: [7.2906, Validators.required],
      requiredAssistance: [''],
      status: ['ACTIVE']
    });
  }

  ngOnInit() {
    this.loadIncidents();
  }

  get filteredIncidents(): Incident[] {
    return this.incidents.filter(incident => {
      // Search text match
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        incident.incidentId?.toLowerCase().includes(query) ||
        incident.type?.toLowerCase().includes(query) ||
        incident.district?.toLowerCase().includes(query) ||
        incident.description?.toLowerCase().includes(query);

      // Priority match
      const matchesPriority = !this.filterPriority || incident.priority === this.filterPriority;

      // Status match
      const matchesStatus = !this.filterStatus || incident.status === this.filterStatus;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }

  loadIncidents() {
    this.loading = true;
    this.incidentService.getIncidents().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.incidents = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
          this.incidents = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load incidents', err);
        this.showFeedback('Failed to connect to backend server. Make sure backend is running.', 'error');
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.isEditMode = false;
    this.activeIncident = null;
    this.incidentForm.reset({
      type: '',
      description: '',
      district: '',
      priority: 'HIGH',
      peopleAffected: 10,
      longitude: 80.6337,
      latitude: 7.2906,
      requiredAssistance: 'WATER_RESCUE, MEDICAL',
      status: 'ACTIVE'
    });
    this.showModal = true;
  }

  openEditModal(incident: Incident) {
    this.isEditMode = true;
    this.activeIncident = incident;
    this.incidentForm.patchValue({
      type: incident.type,
      description: incident.description,
      district: incident.district,
      priority: incident.priority,
      peopleAffected: incident.peopleAffected,
      longitude: incident.location?.coordinates ? incident.location.coordinates[0] : 80.6337,
      latitude: incident.location?.coordinates ? incident.location.coordinates[1] : 7.2906,
      requiredAssistance: incident.requiredAssistance ? incident.requiredAssistance.join(', ') : '',
      status: incident.status
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.activeIncident = null;
  }

  onSubmit() {
    if (this.incidentForm.invalid) return;

    this.submitting = true;
    const formValue = this.incidentForm.value;
    
    const requiredAssistanceArr = formValue.requiredAssistance
      ? formValue.requiredAssistance.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
      : [];

    if (this.isEditMode && this.activeIncident) {
      const updatePayload: any = {
        type: formValue.type,
        description: formValue.description,
        district: formValue.district,
        priority: formValue.priority,
        peopleAffected: Number(formValue.peopleAffected),
        requiredAssistance: requiredAssistanceArr,
        status: formValue.status,
        location: {
          type: 'Point',
          coordinates: [Number(formValue.longitude), Number(formValue.latitude)]
        }
      };

      this.incidentService.updateIncident(this.activeIncident.incidentId, updatePayload).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.showFeedback(`Incident ${this.activeIncident?.incidentId} updated successfully.`, 'success');
          this.loadIncidents();
        },
        error: (err) => {
          console.error('Failed to update incident', err);
          this.submitting = false;
          this.showFeedback('Failed to update incident. Please check server validation.', 'error');
        }
      });
    } else {
      const createPayload = {
        type: formValue.type,
        description: formValue.description,
        district: formValue.district,
        priority: formValue.priority,
        peopleAffected: Number(formValue.peopleAffected),
        requiredAssistance: requiredAssistanceArr,
        location: {
          type: 'Point',
          coordinates: [Number(formValue.longitude), Number(formValue.latitude)]
        },
        createdBy: 'District Officer'
      };

      this.incidentService.createIncident(createPayload).subscribe({
        next: (created) => {
          this.submitting = false;
          this.closeModal();
          this.showFeedback(`New incident logged successfully (${created.incidentId || 'Created'}).`, 'success');
          this.loadIncidents();
        },
        error: (err) => {
          console.error('Failed to create incident', err);
          this.submitting = false;
          this.showFeedback('Failed to create incident. Check form inputs.', 'error');
        }
      });
    }
  }

  closeIncident(id: string) {
    if (confirm(`Are you sure you want to officially close incident ${id}?`)) {
      this.incidentService.closeIncident(id).subscribe({
        next: () => {
          this.showFeedback(`Incident ${id} has been marked as CLOSED.`, 'success');
          this.loadIncidents();
        },
        error: (err) => {
          console.error('Failed to close incident', err);
          this.showFeedback(`Failed to close incident ${id}.`, 'error');
        }
      });
    }
  }

  private showFeedback(message: string, type: 'success' | 'error') {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => {
      if (this.feedbackMessage === message) {
        this.feedbackMessage = null;
      }
    }, 4500);
  }
}
