import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamService, RescueTeam } from '../services/team.service';

@Component({
  selector: 'app-rescue-teams',
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
      
      <!-- Top Action Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-[#0B192C]">Rescue Teams Directory</h3>
          <p class="text-sm text-[#64748B] mt-1">Manage registered rescue teams, monitor readiness, deploy capabilities, and personnel rosters.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadTeams()" class="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#CBD5E1] text-[#0B192C] text-sm font-semibold rounded-lg hover:bg-[#F8FAFC] transition-colors shadow-sm">
            <svg class="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
          <button (click)="openCreateModal()" class="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Register Rescue Team
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Registered Teams</div>
            <div class="text-2xl font-bold text-[#0B192C] mt-1">{{ teams.length }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-bold">🛡️</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Available Ready</div>
            <div class="text-2xl font-bold text-emerald-600 mt-1">{{ countByStatus('AVAILABLE') }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Active in Field</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">{{ countActiveField() }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">⚡</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Responders</div>
            <div class="text-2xl font-bold text-[#0B192C] mt-1">{{ totalPersonnel }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-slate-50 text-[#64748B] flex items-center justify-center font-bold">👥</div>
        </div>
      </div>

      <!-- Feedback Alert -->
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

      <!-- Search & Filters -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex-shrink-0">
        <div class="relative md:col-span-2">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search team ID, name, organization, district..." 
            class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[#1D4ED8] focus:bg-white"
          />
          <svg class="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div>
          <select [(ngModel)]="filterDistrict" class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8]">
            <option value="">District: All</option>
            <option *ngFor="let dist of uniqueDistricts" [value]="dist">{{ dist }}</option>
          </select>
        </div>
        <div>
          <select [(ngModel)]="filterType" class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8]">
            <option value="">Capability: All</option>
            <option value="WATER_RESCUE">Water Rescue</option>
            <option value="SEARCH_AND_RESCUE">Search & Rescue</option>
            <option value="MEDICAL">Medical Emergency</option>
            <option value="FIRE">Fire & Hazmat</option>
            <option value="EVACUATION">Evacuation</option>
            <option value="GENERAL">General Support</option>
          </select>
        </div>
        <div>
          <select [(ngModel)]="filterStatus" class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8]">
            <option value="">Status: All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="EN_ROUTE">EN_ROUTE</option>
            <option value="ON_SITE">ON_SITE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>


      <!-- Main Data Table Card (Fills Full Height) -->
      <div class="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm min-h-0">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <svg class="w-9 h-9 animate-spin text-[#1D4ED8] mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span class="text-sm font-medium">Fetching registered rescue units...</span>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredTeams.length === 0" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <div class="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center text-3xl mb-4 border border-[#E2E8F0] shadow-inner">🛡️</div>
          <h4 class="text-base font-bold text-[#0B192C]">No Rescue Teams Found</h4>
          <p class="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            {{ searchQuery || filterType || filterStatus ? 'Try refining your search query or clear filters.' : 'No rescue units registered in the directory.' }}
          </p>
          <button (click)="openCreateModal()" class="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Register First Team
          </button>
        </div>

        <!-- Data Table -->
        <div *ngIf="!loading && filteredTeams.length > 0" class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 overflow-x-auto overflow-y-auto min-h-0">
            <table class="w-full text-sm">
              <thead class="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
                <tr class="text-[11px] uppercase tracking-wider text-[#64748B]">
                  <th class="px-6 py-4 text-left font-bold">Team ID</th>
                  <th class="px-6 py-4 text-left font-bold">Unit Name & Org</th>
                  <th class="px-6 py-4 text-left font-bold">Capability</th>
                  <th class="px-6 py-4 text-left font-bold">Base District & GPS</th>
                  <th class="px-6 py-4 text-left font-bold">Personnel</th>
                  <th class="px-6 py-4 text-left font-bold">Status</th>
                  <th class="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F1F5F9]">
                <tr *ngFor="let team of filteredTeams" class="hover:bg-[#F8FAFC] transition-colors">
                  
                  <td class="px-6 py-4 font-mono text-xs font-bold text-[#1D4ED8] whitespace-nowrap">
                    {{ team.teamId }}
                  </td>

                  <td class="px-6 py-4 max-w-xs">
                    <div class="text-sm font-bold text-[#0B192C]">{{ team.name }}</div>
                    <div class="text-xs text-[#64748B] mt-0.5">{{ team.organization }}</div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-md border font-mono"
                      [ngClass]="{
                        'bg-blue-50 text-[#1D4ED8] border-blue-200': team.type === 'WATER_RESCUE',
                        'bg-amber-50 text-amber-700 border-amber-200': team.type === 'SEARCH_AND_RESCUE',
                        'bg-emerald-50 text-emerald-700 border-emerald-200': team.type === 'MEDICAL',
                        'bg-red-50 text-[#DC2626] border-red-200': team.type === 'FIRE',
                        'bg-purple-50 text-purple-700 border-purple-200': team.type === 'EVACUATION',
                        'bg-slate-50 text-slate-700 border-slate-200': team.type === 'GENERAL'
                      }">
                      {{ team.type.replace('_', ' ') }}
                    </span>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-[#1D4ED8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                      {{ team.district }}
                    </div>
                    <div class="text-[10px] font-mono text-[#64748B] mt-0.5" *ngIf="team.location?.coordinates">
                      {{ getTeamCoords(team) }}
                    </div>

                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-xs font-semibold text-[#0B192C]">
                      {{ team.members }} members
                    </div>
                  </td>

                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-xs font-bold flex items-center gap-1.5"
                      [ngClass]="{
                        'text-emerald-600': team.status === 'AVAILABLE',
                        'text-[#1D4ED8]': team.status === 'ASSIGNED' || team.status === 'DISPATCHED' || team.status === 'EN_ROUTE',
                        'text-amber-600': team.status === 'ON_SITE' || team.status === 'IN_PROGRESS',
                        'text-rose-600': team.status === 'INACTIVE'
                      }">
                      <span class="w-2 h-2 rounded-full"
                        [ngClass]="{
                          'bg-emerald-500': team.status === 'AVAILABLE',
                          'bg-[#1D4ED8] animate-pulse': team.status === 'ASSIGNED' || team.status === 'DISPATCHED' || team.status === 'EN_ROUTE',
                          'bg-amber-500 animate-pulse': team.status === 'ON_SITE' || team.status === 'IN_PROGRESS',
                          'bg-rose-500': team.status === 'INACTIVE'
                        }"></span>
                      {{ team.status === 'INACTIVE' ? 'UNAVAILABLE (A1)' : team.status }}
                    </span>
                  </td>

                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="openEditModal(team)" class="px-3 py-1.5 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0B192C] rounded-lg hover:bg-[#F8FAFC] shadow-sm">
                        Edit
                      </button>
                      <button *ngIf="team.status !== 'INACTIVE'" (click)="deactivateTeam(team.teamId)" class="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 hover:text-[#DC2626] rounded-lg hover:bg-red-50 transition-colors">
                        Deactivate
                      </button>
                    </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <div class="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B] flex-shrink-0">
            <span>Showing <strong class="text-[#0B192C]">{{ filteredTeams.length }}</strong> team records</span>
            <span class="font-mono text-[11px] text-[#1D4ED8]">● Roster Active</span>
          </div>
        </div>

      </div>

      <!-- Register / Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-[#0B192C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
          
          <div class="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div>
              <h3 class="text-lg font-bold text-[#0B192C]">
                {{ isEditMode ? 'Update Team: ' + activeTeam?.teamId : 'Register New Rescue Unit' }}
              </h3>
              <p class="text-xs text-[#64748B] mt-0.5">
                {{ isEditMode ? 'Modify unit operational status or district assignment.' : 'Enlist a disaster emergency response unit into the system.' }}
              </p>
            </div>
            <button (click)="closeModal()" class="text-[#64748B] hover:text-[#DC2626] transition-colors p-2 rounded-full hover:bg-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-8 overflow-y-auto flex-1 bg-white">
            <form [formGroup]="teamForm" class="space-y-4">
              
              <div>
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Team Name <span class="text-[#DC2626]">*</span></label>
                <input formControlName="name" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white" placeholder="e.g. Navy Water Rescue Unit 2">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Organization <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="organization" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white" placeholder="e.g. Sri Lanka Navy / Army / Red Cross">
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Specialization <span class="text-[#DC2626]">*</span></label>
                  <select formControlName="type" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white">
                    <option value="WATER_RESCUE">WATER_RESCUE</option>
                    <option value="SEARCH_AND_RESCUE">SEARCH_AND_RESCUE</option>
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="FIRE">FIRE</option>
                    <option value="EVACUATION">EVACUATION</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Members Count <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="members" type="number" min="1" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white">
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Station District <span class="text-[#DC2626]">*</span></label>
                  <input formControlName="district" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white" placeholder="e.g. Kandy">
                </div>
              </div>

              <div *ngIf="isEditMode">
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Operational Status</label>
                <select formControlName="status" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white">
                  <option value="AVAILABLE">AVAILABLE (Ready for Dispatch)</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="EN_ROUTE">EN_ROUTE</option>
                  <option value="ON_SITE">ON_SITE</option>
                  <option value="INACTIVE">INACTIVE (UNAVAILABLE - Scenario A1)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div class="col-span-2">
                  <h5 class="text-xs font-bold text-[#0B192C] uppercase tracking-wider">Base Coordinates (Lng, Lat)</h5>
                </div>
                <div>
                  <label class="block text-xs text-[#64748B] mb-1">Longitude</label>
                  <input formControlName="longitude" type="number" step="0.0001" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] bg-white">
                </div>
                <div>
                  <label class="block text-xs text-[#64748B] mb-1">Latitude</label>
                  <input formControlName="latitude" type="number" step="0.0001" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8] bg-white">
                </div>
              </div>

            </form>
          </div>

          <div class="px-8 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="px-5 py-2.5 text-sm font-bold text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9]">Cancel</button>
            <button type="button" (click)="onSubmit()" [disabled]="teamForm.invalid || submitting" class="px-5 py-2.5 text-sm font-bold text-white bg-[#1D4ED8] rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-60 flex items-center gap-2">
              <svg *ngIf="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ submitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Register Team') }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class RescueTeamsComponent implements OnInit {
  teams: RescueTeam[] = [];
  loading = true;
  showModal = false;
  isEditMode = false;
  submitting = false;
  activeTeam: RescueTeam | null = null;

  searchQuery = '';
  filterDistrict = '';
  filterType = '';
  filterStatus = '';

  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' = 'success';

  teamForm: FormGroup;

  constructor(private teamService: TeamService, private fb: FormBuilder) {
    this.teamForm = this.fb.group({
      name: ['', Validators.required],
      organization: ['', Validators.required],
      type: ['WATER_RESCUE', Validators.required],
      members: [6, [Validators.required, Validators.min(1)]],
      district: ['', Validators.required],
      longitude: [80.63, Validators.required],
      latitude: [7.29, Validators.required],
      status: ['AVAILABLE']
    });
  }

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading = true;
    this.teamService.getTeams().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.teams = data;
        } else {
          this.teams = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load rescue teams', err);
        this.showFeedback('Failed to load rescue teams from backend.', 'error');
        this.loading = false;
      }
    });
  }

  getTeamCoords(team: RescueTeam): string {
    if (team.location?.coordinates && team.location.coordinates.length >= 2) {
      return `[${team.location.coordinates[1].toFixed(3)}, ${team.location.coordinates[0].toFixed(3)}]`;
    }
    return '';
  }

  get uniqueDistricts(): string[] {
    const districts = this.teams.map(t => t.district).filter(Boolean);
    return Array.from(new Set(districts)).sort();
  }

  get filteredTeams(): RescueTeam[] {
    return this.teams.filter(tm => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        tm.teamId?.toLowerCase().includes(q) ||
        tm.name?.toLowerCase().includes(q) ||
        tm.organization?.toLowerCase().includes(q) ||
        tm.district?.toLowerCase().includes(q);

      const matchesDistrict = !this.filterDistrict || tm.district?.toLowerCase() === this.filterDistrict.toLowerCase();
      const matchesType = !this.filterType || tm.type === this.filterType;
      const matchesStatus = !this.filterStatus || tm.status === this.filterStatus;

      return matchesSearch && matchesDistrict && matchesType && matchesStatus;
    });
  }


  get totalPersonnel(): number {
    return this.teams.reduce((acc, tm) => acc + (tm.members || 0), 0);
  }

  countByStatus(status: string): number {
    return this.teams.filter(t => t.status === status).length;
  }

  countActiveField(): number {
    return this.teams.filter(t => ['ASSIGNED', 'DISPATCHED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(t.status)).length;
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.activeTeam = null;
    this.teamForm.reset({
      name: '',
      organization: 'Sri Lanka Disaster Management Center',
      type: 'WATER_RESCUE',
      members: 8,
      district: 'Kandy',
      longitude: 80.6337,
      latitude: 7.2906,
      status: 'AVAILABLE'
    });
    this.showModal = true;
  }

  openEditModal(team: RescueTeam): void {
    this.isEditMode = true;
    this.activeTeam = team;
    this.teamForm.patchValue({
      name: team.name,
      organization: team.organization,
      type: team.type,
      members: team.members,
      district: team.district,
      longitude: team.location?.coordinates ? team.location.coordinates[0] : 80.6337,
      latitude: team.location?.coordinates ? team.location.coordinates[1] : 7.2906,
      status: team.status
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.activeTeam = null;
  }

  onSubmit(): void {
    if (this.teamForm.invalid) return;

    this.submitting = true;
    const formValue = this.teamForm.value;

    if (this.isEditMode && this.activeTeam) {
      const updatePayload = {
        name: formValue.name,
        organization: formValue.organization,
        type: formValue.type,
        members: Number(formValue.members),
        district: formValue.district,
        status: formValue.status,
        location: {
          type: 'Point',
          coordinates: [Number(formValue.longitude), Number(formValue.latitude)]
        }
      };

      this.teamService.updateTeam(this.activeTeam.teamId, updatePayload).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.showFeedback(`Rescue team ${this.activeTeam?.teamId} updated successfully.`, 'success');
          this.loadTeams();
        },
        error: (err) => {
          console.error('Failed to update team', err);
          this.submitting = false;
          this.showFeedback('Failed to update team details.', 'error');
        }
      });
    } else {
      const createPayload = {
        name: formValue.name,
        organization: formValue.organization,
        type: formValue.type,
        members: Number(formValue.members),
        district: formValue.district,
        location: {
          type: 'Point',
          coordinates: [Number(formValue.longitude), Number(formValue.latitude)]
        }
      };

      this.teamService.createTeam(createPayload).subscribe({
        next: (created) => {
          this.submitting = false;
          this.closeModal();
          this.showFeedback(`New rescue team ${created.teamId || ''} registered successfully.`, 'success');
          this.loadTeams();
        },
        error: (err) => {
          console.error('Failed to create team', err);
          this.submitting = false;
          this.showFeedback('Failed to register rescue team.', 'error');
        }
      });
    }
  }

  deactivateTeam(teamId: string): void {
    if (confirm(`Are you sure you want to set team ${teamId} to INACTIVE?`)) {
      this.teamService.deactivateTeam(teamId).subscribe({
        next: () => {
          this.showFeedback(`Team ${teamId} has been set to INACTIVE.`, 'success');
          this.loadTeams();
        },
        error: (err) => {
          console.error('Failed to deactivate team', err);
          this.showFeedback('Failed to deactivate team.', 'error');
        }
      });
    }
  }

  private showFeedback(message: string, type: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => {
      if (this.feedbackMessage === message) {
        this.feedbackMessage = null;
      }
    }, 4500);
  }
}
