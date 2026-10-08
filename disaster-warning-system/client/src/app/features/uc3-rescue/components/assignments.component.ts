import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { AssignmentService, RescueAssignment, RescueStatusUpdate, AssignmentStatus } from '../services/assignment.service';
import { IncidentService, Incident } from '../services/incident.service';
import { TeamService, RescueTeam } from '../services/team.service';
import { NotificationService } from '../../../core/services/notification.service';

declare const L: any;

@Component({
  selector: 'app-assignments',
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
    ::ng-deep .custom-div-icon {
      background: transparent !important;
      border: none !important;
    }
  `],
  template: `
    <div class="flex-1 flex flex-col space-y-5 w-full h-full min-h-0 relative">
      
      <!-- Top Action Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-[#0B192C]">Rescue Team Assignments</h3>
          <p class="text-sm text-[#64748B] mt-1">
            Dispatch rescue teams and track live field telemetry. 
            <span class="text-[#1D4ED8] font-semibold">Status progression is updated by rescue teams.</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadAllData()" class="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#CBD5E1] text-[#0B192C] text-sm font-semibold rounded-lg hover:bg-[#F8FAFC] transition-colors shadow-sm">
            <svg class="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
          <button (click)="openCreateModal()" class="flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Dispatch Assignment
          </button>
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

      <!-- Filters & Lifecycle Overview Bar -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex-shrink-0">
        <div class="relative md:col-span-2">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search assignment ID, incident, team, notes..." 
            class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[#1D4ED8] focus:bg-white"
          />
          <svg class="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div>
          <select [(ngModel)]="filterStatus" class="w-full text-sm border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B192C] rounded-lg px-3 py-2 outline-none focus:border-[#1D4ED8]">
            <option value="">Status: All Statuses</option>
            <option value="ASSIGNED">ASSIGNED (Awaiting Team)</option>
            <option value="ACCEPTED">ACCEPTED (Team Confirmed)</option>
            <option value="EN_ROUTE">EN_ROUTE (Traveling)</option>
            <option value="ON_SITE">ON_SITE (At Disaster Zone)</option>
            <option value="COMPLETED">COMPLETED (Concluded)</option>
            <option value="CANCELLED">CANCELLED (Declined - A2)</option>
            <option value="REJECTED">REJECTED (Declined)</option>
          </select>
        </div>
        <div class="flex items-center justify-end text-xs text-[#64748B] font-medium px-2">
          Assignments: <span class="font-bold text-[#0B192C] ml-1">{{ filteredAssignments.length }}</span> of {{ assignments.length }}
        </div>
      </div>

      <!-- Main Assignments Card Container (Fills Full Height) -->
      <div class="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm min-h-0">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <svg class="w-9 h-9 animate-spin text-[#1D4ED8] mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span class="text-sm font-medium">Loading rescue team assignments...</span>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredAssignments.length === 0" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <div class="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center text-3xl mb-4 border border-[#E2E8F0] shadow-inner">🚑</div>
          <h4 class="text-base font-bold text-[#0B192C]">No Rescue Assignments Found</h4>
          <p class="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            {{ searchQuery || filterStatus ? 'No assignments match your search or status filter.' : 'No rescue teams are currently dispatched. Create an assignment to link a rescue team with an incident.' }}
          </p>
          <button (click)="openCreateModal()" class="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Dispatch First Assignment
          </button>
        </div>

        <!-- Data Table with Full Status Pipeline & Live ETA -->
        <div *ngIf="!loading && filteredAssignments.length > 0" class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 overflow-x-auto overflow-y-auto min-h-0">
            <table class="w-full text-sm">
              <thead class="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
                <tr class="text-[11px] uppercase tracking-wider text-[#64748B]">
                  <th class="px-6 py-4 text-left font-bold">Assignment Code</th>
                  <th class="px-6 py-4 text-left font-bold">Incident</th>
                  <th class="px-6 py-4 text-left font-bold">Rescue Team</th>
                  <th class="px-6 py-4 text-left font-bold">Status Pipeline</th>
                  <th class="px-6 py-4 text-left font-bold">Live Telemetry & ETA</th>
                  <th class="px-6 py-4 text-left font-bold">Dispatch Notes</th>
                  <th class="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F1F5F9]">
                <tr *ngFor="let item of filteredAssignments" 
                  (click)="openTrackingModal(item)"
                  class="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                  
                  <!-- Assignment ID & Date -->
                  <td class="px-6 py-4 font-mono text-xs font-bold text-[#1D4ED8] whitespace-nowrap">
                    {{ item.assignmentId }}
                    <div class="text-[10px] text-[#64748B] font-sans font-normal mt-0.5">
                      {{ item.assignedAt | date:'short' }}
                    </div>
                  </td>

                  <!-- Incident Details -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-xs font-bold text-[#0B192C] flex items-center gap-1.5 font-mono">
                      <span class="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                      {{ item.incidentId }}
                    </div>
                    <div class="text-[11px] text-[#64748B] mt-0.5">
                      {{ getIncidentDescription(item.incidentId) }}
                    </div>
                    <!-- Scenario A3 Multi-Unit Operation Badge -->
                    <div *ngIf="isMultiUnitIncident(item.incidentId)" class="mt-1">
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <span>👥 Multi-Unit ({{ getAssignmentsCountForIncident(item.incidentId) }} Teams)</span>
                      </span>
                    </div>
                  </td>

                  <!-- Team Details -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-[#1D4ED8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                      {{ getTeamName(item.teamId) }}
                    </div>
                    <div class="text-[10px] font-mono text-[#64748B] mt-0.5">
                      ID: {{ item.teamId }}
                    </div>
                  </td>

                  <!-- Status Pipeline Graphic (Read-Only) -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [ngClass]="getStepClass(item.status, 'ASSIGNED')">ASSIGNED</span>
                      <span class="text-slate-300 text-xs">→</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [ngClass]="getStepClass(item.status, 'ACCEPTED')">ACCEPTED</span>
                      <span class="text-slate-300 text-xs">→</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [ngClass]="getStepClass(item.status, 'EN_ROUTE')">EN_ROUTE</span>
                      <span class="text-slate-300 text-xs">→</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [ngClass]="getStepClass(item.status, 'ON_SITE')">ON_SITE</span>
                      <span class="text-slate-300 text-xs">→</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [ngClass]="getStepClass(item.status, 'COMPLETED')">COMPLETED</span>
                    </div>

                    <!-- Scenario A2: Cancelled / Declined Status Notice & Reassign Action -->
                    <div *ngIf="item.status === 'CANCELLED' || item.status === 'REJECTED'" class="mt-1.5 flex flex-wrap items-center gap-2">
                      <span class="px-2 py-0.5 bg-red-100 text-[#DC2626] border border-red-300 rounded text-[10px] font-bold flex items-center gap-1">
                        <span>🚨</span>
                        <span>{{ item.status === 'CANCELLED' ? 'CANCELLED (Team Unable to Accept)' : 'REJECTED BY TEAM' }}</span>
                      </span>
                      
                      <!-- Scenario A2: Replacement Button -->
                      <button (click)="openReplacementModal(item); $event.stopPropagation()" 
                        title="Rescue team unable to accept. Select another team (Scenario A2)" 
                        class="px-2 py-0.5 text-[10px] font-bold bg-[#DC2626] text-white hover:bg-rose-700 rounded shadow-sm transition-all flex items-center gap-1">
                        <span>🔄 Select Replacement Team (A2)</span>
                      </button>
                    </div>
                  </td>

                  <!-- Live Telemetry & ETA -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5"
                        [ngClass]="getEtaBadgeClass(item.status)">
                        <span>{{ getEtaIcon(item.status) }}</span>
                        <span>{{ getAssignmentETA(item) }}</span>
                      </span>
                    </div>
                    <div class="text-[10px] font-mono text-[#64748B] mt-1 flex items-center gap-1">
                      <span>📍 Team GPS:</span>
                      <span>{{ getTeamCoordsText(item.teamId) }}</span>
                    </div>
                  </td>

                  <!-- Dispatch Notes -->
                  <td class="px-6 py-4 max-w-xs">
                    <div class="text-xs text-[#0B192C] line-clamp-1" [title]="item.notes || 'No instructions provided.'">
                      {{ item.notes || 'No instructions provided.' }}
                    </div>
                    <div class="text-[10px] text-[#64748B] mt-0.5">
                      By: {{ item.assignedBy }}
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 text-right whitespace-nowrap" (click)="$event.stopPropagation()">
                    <div class="flex items-center justify-end gap-1.5">
                      
                      <!-- Scenario A3: Reinforce Incident Button -->
                      <button (click)="openReinforceModal(item.incidentId)" title="Dispatch Additional Unit to this Incident (Scenario A3)" class="px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm flex items-center gap-1">
                        <span>👥 + Team (A3)</span>
                      </button>

                      <!-- Track Live Location & ETA Modal Trigger -->
                      <button (click)="openTrackingModal(item)" title="Track Live Location & ETA" class="px-2.5 py-1 text-xs font-semibold bg-[#1D4ED8] text-white hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1">
                        <span>📡 Track</span>
                      </button>

                      <!-- Timeline Audit Button -->
                      <button (click)="openHistoryModal(item)" title="View Audit Trail" class="px-2 py-1 text-xs font-semibold bg-[#F1F5F9] text-[#64748B] hover:text-[#0B192C] hover:bg-[#E2E8F0] rounded-lg shadow-sm">
                        📜 Log
                      </button>

                      <!-- Edit Notes Button -->
                      <button (click)="openEditModal(item)" title="Edit Instructions" class="px-2 py-1 text-xs font-semibold bg-white border border-[#CBD5E1] text-[#0B192C] hover:bg-[#F8FAFC] rounded-lg shadow-sm">
                        Edit
                      </button>

                      <!-- Delete Button -->
                      <button (click)="deleteAssignment(item.assignmentId)" title="Withdraw Assignment" class="p-1 text-[#64748B] hover:text-[#DC2626] rounded-md hover:bg-red-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>

                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Footer Bar -->
          <div class="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B] flex-shrink-0">
            <span>Showing <strong class="text-[#0B192C]">{{ filteredAssignments.length }}</strong> assignment records</span>
            <span class="font-mono text-[11px] text-[#1D4ED8]">● Live Rescue Telemetry Active</span>
          </div>

        </div>
      </div>

      <!-- Live Route Tracking & Telemetry Modal -->
      <div *ngIf="showTrackingModal && selectedTrackingAssignment" class="fixed inset-0 bg-[#0B192C]/75 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center text-xl font-bold shadow-sm border border-blue-100">
                🛰️
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] animate-ping"></span>
                  <h3 class="text-base font-bold text-[#0B192C]">
                    Tactical Route Tracking: {{ selectedTrackingAssignment.assignmentId }}
                  </h3>
                  <span class="px-2.5 py-0.5 text-[11px] font-bold rounded-full border"
                    [ngClass]="{
                      'bg-blue-50 text-[#1D4ED8] border-blue-200': selectedTrackingAssignment.status === 'ASSIGNED',
                      'bg-sky-50 text-sky-700 border-sky-200': selectedTrackingAssignment.status === 'ACCEPTED',
                      'bg-amber-50 text-amber-700 border-amber-200': selectedTrackingAssignment.status === 'EN_ROUTE',
                      'bg-indigo-50 text-indigo-700 border-indigo-200': selectedTrackingAssignment.status === 'ON_SITE',
                      'bg-emerald-50 text-emerald-700 border-emerald-200': selectedTrackingAssignment.status === 'COMPLETED'
                    }">
                    {{ selectedTrackingAssignment.status.replace('_', ' ') }}
                  </span>
                </div>
                <p class="text-xs text-[#64748B] mt-0.5">
                  Live satellite telemetry, active road transit corridor, and real-time arrival estimation.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- Google Maps View Mode Switcher -->
              <div class="inline-flex rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-0.5 shadow-sm">
                <button (click)="setMapMode('tactical')" 
                  class="px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1"
                  [ngClass]="mapMode === 'tactical' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0B192C]'">
                  <span>🗺️ Google Tactical</span>
                </button>
                <button (click)="setMapMode('satellite')" 
                  class="px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1"
                  [ngClass]="mapMode === 'satellite' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0B192C]'">
                  <span>🛰️ Satellite</span>
                </button>
                <button (click)="setMapMode('google_embed')" 
                  class="px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1"
                  [ngClass]="mapMode === 'google_embed' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0B192C]'">
                  <span>🚗 Google Directions</span>
                </button>
              </div>

              <!-- Open Directly in Google Maps External Tab -->
              <a [href]="getGoogleMapsExternalUrl()" target="_blank" rel="noopener noreferrer" 
                title="Open live driving route in Google Maps"
                class="px-3 py-1 text-xs font-bold text-[#1D4ED8] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1 shadow-sm transition-colors">
                <span>Google Maps ↗</span>
              </a>

              <button (click)="initTrackingMap()" title="Recenter Route" class="px-2.5 py-1 text-xs font-semibold text-[#0B192C] bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] shadow-sm transition-colors">
                <span>🔄 Recenter</span>
              </button>

              <button (click)="closeTrackingModal()" class="text-[#64748B] hover:text-[#DC2626] p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Telemetry Ribbon Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            
            <div class="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="text-[10px] uppercase font-bold text-[#64748B] flex items-center justify-between">
                <span>Assigned Unit</span>
                <span class="text-xs">{{ getTeamEmoji(getSelectedTeam()) }}</span>
              </div>
              <div class="text-sm font-bold text-[#0B192C] mt-1 truncate">{{ getTeamName(selectedTrackingAssignment.teamId) }}</div>
              <div class="text-[10px] text-[#1D4ED8] mt-0.5 font-medium">{{ getSelectedTeam()?.district || 'Sector Base' }} • {{ getSelectedTeam()?.type || 'Rescue Unit' }}</div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="text-[10px] uppercase font-bold text-[#64748B] flex items-center justify-between">
                <span>Target Incident</span>
                <span class="text-xs">{{ getIncidentEmoji(getSelectedIncident()) }}</span>
              </div>
              <div class="text-sm font-bold text-[#DC2626] mt-1 truncate">{{ getSelectedIncident()?.type || 'Emergency' }}</div>
              <div class="text-[10px] text-[#64748B] mt-0.5">{{ getSelectedIncident()?.district || 'District' }} • Priority: {{ getSelectedIncident()?.priority || 'CRITICAL' }}</div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="text-[10px] uppercase font-bold text-[#64748B] flex items-center justify-between">
                <span>Transit Distance</span>
                <span class="text-xs">📏</span>
              </div>
              <div class="text-sm font-bold text-[#0B192C] mt-1">
                {{ getTrackingDistance() !== null ? getTrackingDistance() + ' km' : 'Calculating...' }}
              </div>
              <div class="text-[10px] text-emerald-600 mt-0.5 font-medium">Direct road corridor vector</div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="text-[10px] uppercase font-bold text-[#64748B] flex items-center justify-between">
                <span>Estimated Arrival</span>
                <span class="text-xs">⏱️</span>
              </div>
              <div class="text-sm font-bold text-emerald-600 mt-1">
                {{ getAssignmentETA(selectedTrackingAssignment) }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">
                {{ isAccepted(selectedTrackingAssignment.status) ? 'Speed ~45 km/h • Priority transit' : 'Awaiting team acceptance' }}
              </div>
            </div>

          </div>

          <!-- Map Container with Explicit Fixed Height (Never 0px!) -->
          <div class="relative w-full h-[480px] bg-slate-100 overflow-hidden">
            
            <!-- 1. Google Maps Direct Route Iframe Embed -->
            <iframe *ngIf="mapMode === 'google_embed'" 
              [src]="getGoogleMapsEmbedUrl()" 
              class="w-full h-full border-0" 
              allowfullscreen 
              loading="lazy">
            </iframe>

            <!-- 2. Google Maps Tile Layer for Tactical and Satellite Modes -->
            <div *ngIf="mapMode !== 'google_embed'" 
              id="assignmentTrackingMap" 
              class="w-full h-full z-0" 
              style="height: 480px; width: 100%;">
            </div>

            <!-- Overlays (Only in Tactical / Satellite modes) -->
            <ng-container *ngIf="mapMode !== 'google_embed'">
              <!-- Top-Left Tactical HUD Overlay -->
              <div class="absolute top-3 left-3 z-[400] bg-[#0B192C]/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl max-w-xs pointer-events-auto space-y-2">
                <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Google Route Telemetry
                  </span>
                  <span class="text-[10px] font-mono text-slate-400">SRI LANKA</span>
                </div>
                <div class="text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Departure:</span>
                    <span class="font-semibold text-white truncate max-w-[150px]">{{ getSelectedTeam()?.district || 'Base' }} Station</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-400">Destination:</span>
                    <span class="font-semibold text-red-400 truncate max-w-[150px]">{{ getSelectedIncident()?.type }} ({{ getSelectedIncident()?.district }})</span>
                  </div>
                  <div class="flex items-center justify-between pt-1 border-t border-slate-700/60 font-mono text-[11px]">
                    <span class="text-slate-300">Corridor Vector:</span>
                    <span class="text-emerald-400 font-bold">{{ getTrackingDistance() }} km</span>
                  </div>
                </div>
              </div>

              <!-- Top-Right Tactical Camera Controls -->
              <div class="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
                <button (click)="fitTrackingRoute()" title="Fit Entire Route Corridor" class="px-3 py-1.5 bg-white/95 backdrop-blur-md text-[#0B192C] hover:bg-white text-xs font-bold rounded-lg border border-slate-200 shadow-md flex items-center gap-1.5 transition-all">
                  <span>🎯 Fit Route</span>
                </button>
                <button (click)="focusTrackingUnit()" title="Zoom to Rescue Team" class="px-3 py-1.5 bg-white/95 backdrop-blur-md text-[#1D4ED8] hover:bg-white text-xs font-bold rounded-lg border border-slate-200 shadow-md flex items-center gap-1.5 transition-all">
                  <span>🚒 Focus Unit</span>
                </button>
                <button (click)="focusTrackingIncident()" title="Zoom to Incident Epicenter" class="px-3 py-1.5 bg-white/95 backdrop-blur-md text-[#DC2626] hover:bg-white text-xs font-bold rounded-lg border border-slate-200 shadow-md flex items-center gap-1.5 transition-all">
                  <span>🚨 Focus Incident</span>
                </button>
              </div>

              <!-- Bottom-Left Legend -->
              <div class="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#E2E8F0] text-xs shadow-lg space-y-1.5 pointer-events-auto">
                <div class="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Google Map View</div>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-[#1D4ED8] border border-white shadow-sm flex items-center justify-center text-[8px] text-white">●</span>
                  <span class="font-medium text-[#0B192C]">Rescue Team Position</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-[#DC2626] border border-white shadow-sm flex items-center justify-center text-[8px] text-white">●</span>
                  <span class="font-medium text-[#0B192C]">Emergency Incident</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-4 h-1 rounded bg-[#1D4ED8] border-b border-blue-300"></span>
                  <span class="text-[#64748B]">Active Transit Corridor</span>
                </div>
              </div>
            </ng-container>

          </div>

          <!-- Route Checkpoint Timeline Stepper -->
          <div class="px-6 py-3.5 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-xs">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-blue-100 text-[#1D4ED8] font-bold flex items-center justify-center text-[10px]">1</div>
                <div>
                  <div class="font-bold text-[#0B192C]">Base Departure</div>
                  <div class="text-[10px] text-[#64748B]">{{ getSelectedTeam()?.district || 'Sector' }} Station</div>
                </div>
              </div>
              <div class="w-8 h-0.5 bg-blue-300"></div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px]"
                  [ngClass]="selectedTrackingAssignment.status === 'EN_ROUTE' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-600'">2</div>
                <div>
                  <div class="font-bold text-[#0B192C]">Road Corridor</div>
                  <div class="text-[10px] text-[#64748B]">Speed ~45 km/h</div>
                </div>
              </div>
              <div class="w-8 h-0.5" [ngClass]="selectedTrackingAssignment.status === 'ON_SITE' ? 'bg-indigo-300' : 'bg-slate-200'"></div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px]"
                  [ngClass]="selectedTrackingAssignment.status === 'ON_SITE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'">3</div>
                <div>
                  <div class="font-bold text-[#0B192C]">Incident Perimeter</div>
                  <div class="text-[10px] text-[#64748B]">{{ getSelectedIncident()?.district }} Sector</div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button (click)="closeTrackingModal()" class="px-4 py-2 text-xs font-bold text-[#64748B] bg-white border border-[#CBD5E1] rounded-lg hover:bg-[#F1F5F9] transition-colors">
                Close Tracking
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Create / Dispatch Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-[#0B192C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
          
          <div class="px-8 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div>
              <h3 class="text-lg font-bold text-[#0B192C]">
                {{ isReplacementMode ? 'Select Replacement Rescue Team (Scenario A2)' :
                   isReinforceMode ? 'Dispatch Additional Rescue Team (Scenario A3 Reinforcement)' :
                   isEditMode ? 'Update Assignment: ' + activeAssignment?.assignmentId : 'Dispatch Rescue Assignment' }}
              </h3>
              <p class="text-xs text-[#64748B] mt-0.5">
                {{ isReplacementMode ? 'Reassigning after unit reported inability to accept. Incident remains active.' :
                   isReinforceMode ? 'Adding reinforcement unit. Each assignment is tracked independently.' :
                   isEditMode ? 'Modify mission operational instructions.' : 'Deploy an available rescue unit to an active incident location.' }}
              </p>
            </div>
            <button (click)="closeModal()" class="text-[#64748B] hover:text-[#DC2626] transition-colors p-2 rounded-full hover:bg-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-8 overflow-y-auto flex-1 bg-white">

            <!-- Scenario A1 Alert Banner -->
            <div *ngIf="teamUnavailableError" class="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 mb-5 space-y-2.5 animate-in fade-in">
              <div class="flex items-start gap-2.5">
                <span class="text-lg">⚠️</span>
                <div>
                  <strong class="text-sm">Scenario A1 - Selected Rescue Team is Unavailable</strong>
                  <p class="mt-1 text-[#0B192C]">
                    The system cannot dispatch <strong>"{{ unavailableTeamName }}"</strong> because this unit is currently 
                    <span class="font-mono font-bold text-[#DC2626] bg-red-100 px-1.5 py-0.2 rounded border border-red-200">{{ unavailableTeamStatus }}</span>.
                  </p>
                </div>
              </div>
              <div class="pt-1">
                <button type="button" (click)="returnToAvailableTeams()" 
                  class="px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5">
                  <span>← Return to List of Available Rescue Teams</span>
                </button>
              </div>
            </div>

            <!-- Scenario A2 Alert Notice -->
            <div *ngIf="isReplacementMode" class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-5 flex items-center gap-2.5">
              <span class="text-lg">🚨</span>
              <div>
                <strong>Scenario A2 Replacement Flow:</strong>
                <span> Reassigning for cancelled assignment {{ replacementOldAssignmentId }}. Incident remains open and active.</span>
              </div>
            </div>

            <!-- Scenario A3 Alert Notice -->
            <div *ngIf="isReinforceMode" class="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 mb-5 flex items-center gap-2.5">
              <span class="text-lg">👥</span>
              <div>
                <strong>Scenario A3 Multi-Unit Flow:</strong>
                <span> Dispatching an additional team to the same incident. Each assignment is tracked independently.</span>
              </div>
            </div>

            <form [formGroup]="assignmentForm" class="space-y-5">
              
              <!-- Incident Selection -->
              <div>
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Target Incident <span class="text-[#DC2626]">*</span></label>
                <select formControlName="incidentId" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white transition-all">
                  <option value="">Select Incident...</option>
                  <option *ngFor="let inc of incidents" [value]="inc.incidentId">
                    {{ inc.incidentId }} — {{ inc.type }} ({{ inc.district }}) [{{ inc.priority }}]
                  </option>
                </select>
              </div>

              <!-- Rescue Team Selection -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-[#0B192C]">Assigned Rescue Team <span class="text-[#DC2626]">*</span></label>
                  <label class="flex items-center gap-1.5 text-[11px] text-[#64748B] cursor-pointer">
                    <input type="checkbox" [(ngModel)]="filterAvailableOnly" [ngModelOptions]="{standalone: true}" (change)="onFilterAvailableChange()">
                    <span>Show Available Units Only</span>
                  </label>
                </div>
                <select formControlName="teamId" (change)="onTeamSelected($event)" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white transition-all">
                  <option value="">Select Rescue Team...</option>
                  <option *ngFor="let tm of selectableTeams" [value]="tm.teamId">
                    {{ tm.teamId }} — {{ tm.name }} ({{ tm.type }} - {{ tm.district }}) [{{ tm.status === 'AVAILABLE' ? 'READY' : tm.status }}]
                  </option>
                </select>
              </div>

              <!-- Dispatch Notes -->
              <div>
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Operational Instructions / Directives</label>
                <textarea formControlName="notes" rows="3" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-3 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white transition-all" placeholder="Provide mission objectives, hazards, rendezvous coordinates, and briefing notes..."></textarea>
              </div>

              <!-- Assigned By -->
              <div>
                <label class="block text-xs font-bold text-[#0B192C] mb-1.5">Assigned By <span class="text-[#DC2626]">*</span></label>
                <input formControlName="assignedBy" type="text" class="w-full text-sm border border-[#E2E8F0] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D4ED8] bg-[#F8FAFC] focus:bg-white transition-all">
              </div>

            </form>
          </div>

          <div class="px-8 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="px-5 py-2.5 text-sm font-bold text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] transition-colors">
              Cancel
            </button>
            <button type="button" (click)="onSubmit()" [disabled]="assignmentForm.invalid || submitting" class="px-5 py-2.5 text-sm font-bold text-white bg-[#1D4ED8] rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              <svg *ngIf="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ submitting ? 'Dispatching...' : (isEditMode ? 'Save Instructions' : 'Dispatch Team') }}
            </button>
          </div>

        </div>
      </div>

      <!-- Status Audit History Modal -->
      <div *ngIf="showHistoryModal" class="fixed inset-0 bg-[#0B192C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
          
          <div class="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div>
              <h3 class="text-base font-bold text-[#0B192C]">Status Timeline: {{ activeHistoryAssignment?.assignmentId }}</h3>
              <p class="text-xs text-[#64748B]">Audit trail of operational state transitions logged by field units.</p>
            </div>
            <button (click)="showHistoryModal = false" class="text-[#64748B] hover:text-[#DC2626] p-1.5 rounded-full hover:bg-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto flex-1 space-y-4">
            <div *ngIf="loadingHistory" class="p-8 text-center text-[#64748B]">
              <svg class="w-6 h-6 animate-spin mx-auto text-[#1D4ED8] mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Loading history...
            </div>

            <div *ngIf="!loadingHistory && statusHistory.length === 0" class="p-8 text-center text-[#64748B] text-xs">
              No audit updates recorded yet.
            </div>

            <div *ngIf="!loadingHistory && statusHistory.length > 0" class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
              <div *ngFor="let step of statusHistory" class="relative">
                <div class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#1D4ED8] ring-4 ring-white"></div>
                <div class="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#0B192C]">{{ step.status }}</span>
                    <span class="text-[10px] text-[#64748B]">{{ step.createdAt | date:'short' }}</span>
                  </div>
                  <div class="text-xs text-[#64748B] mt-1">{{ step.notes }}</div>
                  <div class="text-[10px] font-mono text-slate-500 mt-1">Logged by: {{ step.updatedBy }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
            <button (click)="showHistoryModal = false" class="px-4 py-2 text-xs font-bold text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9]">Close</button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class AssignmentsComponent implements OnInit, OnDestroy {
  assignments: RescueAssignment[] = [];
  incidents: Incident[] = [];
  teams: RescueTeam[] = [];
  
  loading = true;
  showModal = false;
  isEditMode = false;
  submitting = false;
  activeAssignment: RescueAssignment | null = null;

  showHistoryModal = false;
  loadingHistory = false;
  activeHistoryAssignment: RescueAssignment | null = null;
  statusHistory: RescueStatusUpdate[] = [];

  // Live Tracking Modal State
  showTrackingModal = false;
  selectedTrackingAssignment: RescueAssignment | null = null;
  mapMode: 'tactical' | 'satellite' | 'google_embed' = 'tactical';
  private trackingMap: any = null;

  searchQuery = '';
  filterStatus = '';

  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' = 'success';

  assignmentForm: FormGroup;

  readonly stages: AssignmentStatus[] = ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED'];

  // Scenarios A1, A2, A3 State
  teamUnavailableError = false;
  unavailableTeamName = '';
  unavailableTeamStatus = '';
  isReplacementMode = false;
  replacementOldAssignmentId = '';
  isReinforceMode = false;
  filterAvailableOnly = false;
  private notifSub?: Subscription;

  constructor(
    private assignmentService: AssignmentService,
    private incidentService: IncidentService,
    private teamService: TeamService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.assignmentForm = this.fb.group({
      incidentId: ['', Validators.required],
      teamId: ['', Validators.required],
      assignedBy: ['District Officer', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadAllData();

    // Auto-refresh upon receiving Scenario A4 field telemetry synchronization
    this.notifSub = this.notificationService.notifications$.subscribe(notifs => {
      const latestA4 = notifs.find(n => n.category === 'A4_CONNECTIVITY' && Date.now() - n.timestamp < 6000);
      if (latestA4) {
        this.loadAllData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }
    this.notifSub?.unsubscribe();
  }

  loadAllData(): void {
    this.loading = true;
    
    this.incidentService.getIncidents().subscribe({
      next: (data) => this.incidents = data || [],
      error: (err) => console.error('Failed to load incidents', err)
    });

    this.teamService.getTeams().subscribe({
      next: (data) => this.teams = data || [],
      error: (err) => console.error('Failed to load teams', err)
    });

    this.assignmentService.getAssignments().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.assignments = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
          this.assignments = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assignments', err);
        this.showFeedback('Failed to load rescue assignments from backend.', 'error');
        this.loading = false;
      }
    });
  }

  get filteredAssignments(): RescueAssignment[] {
    return this.assignments.filter(item => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.assignmentId?.toLowerCase().includes(q) ||
        item.incidentId?.toLowerCase().includes(q) ||
        item.teamId?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q);

      const matchesStatus = !this.filterStatus || item.status === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
  }

  getIncidentDescription(incidentId: string): string {
    const inc = this.incidents.find(i => i.incidentId === incidentId);
    return inc ? `${inc.type} in ${inc.district}` : 'Emergency Incident';
  }

  getTeamName(teamId: string): string {
    const tm = this.teams.find(t => t.teamId === teamId);
    return tm ? tm.name : teamId;
  }

  getTeamCoordsText(teamId: string): string {
    const tm = this.teams.find(t => t.teamId === teamId);
    if (tm?.location?.coordinates && tm.location.coordinates.length >= 2) {
      return `[${tm.location.coordinates[1].toFixed(2)}, ${tm.location.coordinates[0].toFixed(2)}] (${tm.district})`;
    }
    return 'Coordinates Pending';
  }

  getStepClass(currentStatus: string, step: string): string {
    const stageIndex = this.stages.indexOf(step as AssignmentStatus);
    const currentIndex = this.stages.indexOf(currentStatus as AssignmentStatus);

    if (currentStatus === 'REJECTED' || currentStatus === 'CANCELLED') {
      return 'bg-slate-50 text-slate-400 border-slate-200';
    }

    if (currentIndex >= stageIndex) {
      if (step === 'COMPLETED' && currentStatus === 'COMPLETED') {
        return 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
      }
      if (step === currentStatus) {
        return 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm animate-pulse';
      }
      return 'bg-blue-50 text-[#1D4ED8] border-blue-200';
    }

    return 'bg-slate-50 text-slate-400 border-slate-200';
  }

  isAccepted(status: string): boolean {
    return ['ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(status);
  }

  getAssignmentETA(item: RescueAssignment): string {
    if (item.status === 'ASSIGNED') return 'Pending Acceptance';
    if (item.status === 'ON_SITE' || item.status === 'IN_PROGRESS') return 'Arrived On Site';
    if (item.status === 'COMPLETED') return 'Mission Finished';
    if (item.status === 'REJECTED' || item.status === 'CANCELLED') return 'Declined by Unit';

    // Status is ACCEPTED or EN_ROUTE -> Calculate distance and ETA
    const dist = this.calculateDistanceBetween(item.teamId, item.incidentId);
    if (dist === null) return '~20 mins (Est. Transit)';

    const mins = Math.max(5, Math.round((dist / 45) * 60));
    const etaDate = new Date(Date.now() + mins * 60000);
    const timeStr = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `~${mins}m (${timeStr})`;
  }

  getEtaIcon(status: string): string {
    if (status === 'ASSIGNED') return '⏳';
    if (status === 'ACCEPTED' || status === 'EN_ROUTE') return '⏱️';
    if (status === 'ON_SITE') return '📍';
    if (status === 'COMPLETED') return '✓';
    return '•';
  }

  getEtaBadgeClass(status: string): any {
    return {
      'bg-amber-50 text-amber-700 border-amber-200': status === 'ASSIGNED',
      'bg-blue-50 text-[#1D4ED8] border-blue-200': status === 'ACCEPTED' || status === 'EN_ROUTE',
      'bg-indigo-50 text-indigo-700 border-indigo-200': status === 'ON_SITE',
      'bg-emerald-50 text-emerald-700 border-emerald-200': status === 'COMPLETED',
      'bg-slate-50 text-slate-500 border-slate-200': status === 'REJECTED' || status === 'CANCELLED'
    };
  }

  readonly SRI_LANKA_DISTRICTS: Record<string, [number, number]> = {
    'Colombo': [6.9271, 79.8612],
    'Gampaha': [7.0840, 79.9943],
    'Kalutara': [6.5854, 79.9607],
    'Kandy': [7.2906, 80.6337],
    'Matale': [7.4675, 80.6234],
    'Nuwara Eliya': [6.9497, 80.7891],
    'Galle': [6.0535, 80.2210],
    'Matara': [5.9549, 80.5550],
    'Hambantota': [6.1429, 81.1212],
    'Jaffna': [9.6615, 80.0255],
    'Kilinochchi': [9.3803, 80.3770],
    'Mannar': [8.9810, 79.9044],
    'Vavuniya': [8.7542, 80.4982],
    'Mullaitivu': [9.2671, 80.8143],
    'Batticaloa': [7.7310, 81.6747],
    'Ampara': [7.2912, 81.6724],
    'Trincomalee': [8.5874, 81.2152],
    'Kurunegala': [7.4863, 80.3623],
    'Puttalam': [8.0408, 79.8394],
    'Anuradhapura': [8.3114, 80.4037],
    'Polonnaruwa': [7.9403, 81.0188],
    'Badulla': [6.9934, 81.0550],
    'Monaragala': [6.8728, 81.3507],
    'Ratnapura': [6.6828, 80.4037],
    'Kegalle': [7.2513, 80.3464]
  };

  cachedStart: [number, number] = [6.9271, 79.8612];
  cachedEnd: [number, number] = [7.2906, 80.6337];
  cachedRoutePoints: [number, number][] = [];

  getSelectedTeam(): RescueTeam | undefined {
    return this.teams.find(t => t.teamId === this.selectedTrackingAssignment?.teamId);
  }

  getSelectedIncident(): Incident | undefined {
    return this.incidents.find(i => i.incidentId === this.selectedTrackingAssignment?.incidentId);
  }

  getTeamEmoji(team: RescueTeam | undefined): string {
    const type = (team?.type || '').toUpperCase();
    if (type.includes('FIRE')) return '🚒';
    if (type.includes('MEDIC') || type.includes('HEALTH')) return '🚑';
    if (type.includes('FLOOD') || type.includes('WATER') || type.includes('BOAT')) return '🚤';
    if (type.includes('AIR') || type.includes('HELI')) return '🚁';
    return '🛡️';
  }

  getIncidentEmoji(inc: Incident | undefined): string {
    const type = (inc?.type || '').toUpperCase();
    if (type.includes('FLOOD')) return '🌊';
    if (type.includes('LANDSLIDE')) return '⛰️';
    if (type.includes('FIRE')) return '🔥';
    if (type.includes('TSUNAMI')) return '🌊';
    if (type.includes('CYCLONE') || type.includes('STORM') || type.includes('WIND')) return '🌪️';
    return '🚨';
  }

  getIncidentCoords(inc: Incident | undefined): [number, number] {
    if (inc?.location?.coordinates && inc.location.coordinates.length >= 2 && 
       (inc.location.coordinates[0] !== 0 || inc.location.coordinates[1] !== 0)) {
      return [inc.location.coordinates[1], inc.location.coordinates[0]];
    }
    if (inc?.district && this.SRI_LANKA_DISTRICTS[inc.district]) {
      return this.SRI_LANKA_DISTRICTS[inc.district];
    }
    return [6.9271, 79.8612];
  }

  getTeamCoords(tm: RescueTeam | undefined, incDistrict?: string): [number, number] {
    if (tm?.location?.coordinates && tm.location.coordinates.length >= 2 && 
       (tm.location.coordinates[0] !== 0 || tm.location.coordinates[1] !== 0)) {
      return [tm.location.coordinates[1], tm.location.coordinates[0]];
    }
    if (tm?.district && this.SRI_LANKA_DISTRICTS[tm.district]) {
      const base = this.SRI_LANKA_DISTRICTS[tm.district];
      // Offset if in same district as incident so they don't exactly stack
      if (incDistrict && tm.district === incDistrict) {
        return [base[0] + 0.042, base[1] - 0.038];
      }
      return base;
    }
    return [6.9550, 79.8800];
  }

  buildTacticalRoute(start: [number, number], end: [number, number]): [number, number][] {
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;

    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const perpLat = -dLng * 0.12;
    const perpLng = dLat * 0.12;

    const wp1: [number, number] = [
      lat1 + dLat * 0.33 + perpLat,
      lng1 + dLng * 0.33 + perpLng
    ];

    const wp2: [number, number] = [
      lat1 + dLat * 0.67 - perpLat * 0.5,
      lng1 + dLng * 0.67 - perpLng * 0.5
    ];

    return [start, wp1, wp2, end];
  }

  calculateDistanceBetween(teamId: string, incidentId: string): number | null {
    const tm = this.teams.find(t => t.teamId === teamId);
    const inc = this.incidents.find(i => i.incidentId === incidentId);

    const [lat1, lon1] = this.getTeamCoords(tm, inc?.district);
    const [lat2, lon2] = this.getIncidentCoords(inc);

    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  getTrackingDistance(): number | null {
    if (!this.selectedTrackingAssignment) return null;
    return this.calculateDistanceBetween(
      this.selectedTrackingAssignment.teamId, 
      this.selectedTrackingAssignment.incidentId
    );
  }

  setMapMode(mode: 'tactical' | 'satellite' | 'google_embed'): void {
    this.mapMode = mode;
    if (mode !== 'google_embed') {
      setTimeout(() => {
        this.initTrackingMap();
      }, 150);
    }
  }

  getGoogleMapsEmbedUrl(): SafeResourceUrl {
    const start = this.cachedStart;
    const end = this.cachedEnd;
    const url = `https://maps.google.com/maps?saddr=${start[0]},${start[1]}&daddr=${end[0]},${end[1]}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getGoogleMapsExternalUrl(): string {
    const start = this.cachedStart;
    const end = this.cachedEnd;
    return `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&travelmode=driving`;
  }

  openTrackingModal(item: RescueAssignment): void {
    this.selectedTrackingAssignment = item;
    this.showTrackingModal = true;
    this.mapMode = 'tactical';
    setTimeout(() => {
      this.initTrackingMap();
    }, 200);
  }

  closeTrackingModal(): void {
    this.showTrackingModal = false;
    this.selectedTrackingAssignment = null;
    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }
  }

  fitTrackingRoute(): void {
    if (!this.trackingMap || this.cachedRoutePoints.length === 0) return;
    this.trackingMap.fitBounds(L.latLngBounds(this.cachedRoutePoints), { padding: [60, 60] });
  }

  focusTrackingUnit(): void {
    if (!this.trackingMap) return;
    this.trackingMap.flyTo(this.cachedStart, 14, { duration: 1.2 });
  }

  focusTrackingIncident(): void {
    if (!this.trackingMap) return;
    this.trackingMap.flyTo(this.cachedEnd, 14, { duration: 1.2 });
  }

  initTrackingMap(): void {
    if (typeof L === 'undefined' || !this.selectedTrackingAssignment) return;
    if (this.mapMode === 'google_embed') return;

    const mapEl = document.getElementById('assignmentTrackingMap');
    if (!mapEl) return;

    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }

    const tm = this.getSelectedTeam();
    const inc = this.getSelectedIncident();

    const startCoords = this.getTeamCoords(tm, inc?.district);
    const endCoords = this.getIncidentCoords(inc);
    this.cachedStart = startCoords;
    this.cachedEnd = endCoords;

    const routePoints = this.buildTacticalRoute(startCoords, endCoords);
    this.cachedRoutePoints = routePoints;

    this.trackingMap = L.map('assignmentTrackingMap', {
      zoomControl: true,
      attributionControl: true
    }).setView(startCoords, 10);

    // Google Maps Tile Layer: Roadmap or Satellite Hybrid
    const googleTileUrl = this.mapMode === 'satellite'
      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    L.tileLayer(googleTileUrl, {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(this.trackingMap);

    // 1. Red Hazard Impact Perimeter Circle (1.2 km)
    L.circle(endCoords, {
      radius: 1200,
      color: '#DC2626',
      fillColor: '#DC2626',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '5, 5'
    }).bindTooltip(`Disaster Perimeter: ${inc?.type || 'Hazard Zone'} (1.2 km)`, { permanent: false, direction: 'top' })
      .addTo(this.trackingMap);

    // 2. Glowing Route Corridor Polyline (Soft wide halo)
    L.polyline(routePoints, {
      color: '#60A5FA',
      weight: 9,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.trackingMap);

    // 3. Main Tactical Vector Polyline (Royal Blue)
    L.polyline(routePoints, {
      color: '#1D4ED8',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.trackingMap);

    // 4. Directional Route Progression (Dashed)
    L.polyline(routePoints, {
      color: '#FFFFFF',
      weight: 2,
      dashArray: '6, 12',
      opacity: 0.9
    }).addTo(this.trackingMap);

    // 5. Corridor Midpoint Milestone Badge
    const midPoint = routePoints[1] || [(startCoords[0] + endCoords[0]) / 2, (startCoords[1] + endCoords[1]) / 2];
    const dist = this.getTrackingDistance() || 18.2;
    const etaStr = this.getAssignmentETA(this.selectedTrackingAssignment);
    const milestoneHtml = `
      <div style="transform: translate(-50%, -50%);" class="whitespace-nowrap pointer-events-auto">
        <div class="px-3 py-1 bg-[#0B192C]/90 text-white backdrop-blur-md rounded-full shadow-lg border border-blue-400/40 flex items-center gap-1.5 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Corridor: ${dist} km</span>
          <span class="text-blue-300">•</span>
          <span class="text-emerald-300">ETA: ${etaStr}</span>
        </div>
      </div>
    `;
    L.marker(midPoint, {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: milestoneHtml,
        iconSize: [0, 0]
      })
    }).addTo(this.trackingMap);

    // 6. Rescue Unit Marker with Pulsing Beacon
    const teamEmoji = this.getTeamEmoji(tm);
    const teamHtml = `
      <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center pointer-events-auto">
        <div class="relative flex items-center justify-center">
          <span class="absolute w-12 h-12 bg-blue-500/35 rounded-full animate-ping"></span>
          <span class="absolute w-8 h-8 bg-blue-400/50 rounded-full animate-pulse"></span>
          <div class="relative w-10 h-10 bg-[#1D4ED8] text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white text-lg">
            ${teamEmoji}
          </div>
        </div>
        <div class="mt-1 px-2.5 py-0.5 bg-[#0B192C] text-white text-[10px] font-extrabold rounded-md shadow-md border border-slate-700 whitespace-nowrap">
          ${tm?.name || 'Rescue Unit'}
        </div>
        <div class="text-[9px] font-mono text-[#1D4ED8] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 mt-0.5 whitespace-nowrap">
          GPS: [${startCoords[0].toFixed(3)}, ${startCoords[1].toFixed(3)}]
        </div>
      </div>
    `;
    L.marker(startCoords, {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: teamHtml,
        iconSize: [0, 0]
      })
    }).bindPopup(`
      <div style="font-family:sans-serif; font-size:12px; padding:2px;">
        <b style="color:#1D4ED8; font-size:13px;">🛡️ ${tm?.name || 'Rescue Team'}</b><br/>
        <b>Unit ID:</b> ${tm?.teamId || ''}<br/>
        <b>Base:</b> ${tm?.district || 'Sector Base'}<br/>
        <b>Type:</b> ${tm?.type || 'Special Unit'}<br/>
        <b>Status:</b> <span style="color:#1D4ED8; font-weight:bold;">${this.selectedTrackingAssignment?.status}</span>
      </div>
    `).addTo(this.trackingMap);

    // 7. Incident Target Marker with Alert Badge
    const incEmoji = this.getIncidentEmoji(inc);
    const incHtml = `
      <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center pointer-events-auto">
        <div class="relative flex items-center justify-center">
          <span class="absolute w-14 h-14 bg-red-500/30 rounded-full animate-ping"></span>
          <span class="absolute w-9 h-9 bg-red-400/50 rounded-full animate-pulse"></span>
          <div class="relative w-11 h-11 bg-[#DC2626] text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white text-xl">
            ${incEmoji}
          </div>
        </div>
        <div class="mt-1 px-2.5 py-0.5 bg-[#DC2626] text-white text-[10px] font-extrabold rounded-md shadow-md border border-red-300 whitespace-nowrap">
          ${inc?.type || 'Incident'} • ${inc?.priority || 'ALERT'}
        </div>
        <div class="text-[9px] font-mono text-[#DC2626] bg-red-50 px-1.5 py-0.2 rounded border border-red-200 mt-0.5 whitespace-nowrap">
          TARGET: [${endCoords[0].toFixed(3)}, ${endCoords[1].toFixed(3)}]
        </div>
      </div>
    `;
    L.marker(endCoords, {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: incHtml,
        iconSize: [0, 0]
      })
    }).bindPopup(`
      <div style="font-family:sans-serif; font-size:12px; padding:2px;">
        <b style="color:#DC2626; font-size:13px;">🚨 ${inc?.incidentId || 'Incident'}</b><br/>
        <b>Type:</b> ${inc?.type || 'Emergency'}<br/>
        <b>District:</b> ${inc?.district || 'Zone'}<br/>
        <b>Priority:</b> <span style="color:#DC2626; font-weight:bold;">${inc?.priority || 'HIGH'}</span><br/>
        <b>People Affected:</b> ${inc?.peopleAffected ?? 'Unknown'}
      </div>
    `).addTo(this.trackingMap);

    // Fit bounds and invalidate size after modal finishes expanding
    const bounds = L.latLngBounds(routePoints);
    this.trackingMap.fitBounds(bounds, { padding: [70, 70] });
    setTimeout(() => {
      if (this.trackingMap) {
        this.trackingMap.invalidateSize();
        this.trackingMap.fitBounds(bounds, { padding: [70, 70] });
      }
    }, 200);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.isReplacementMode = false;
    this.isReinforceMode = false;
    this.teamUnavailableError = false;
    this.filterAvailableOnly = false;
    this.activeAssignment = null;
    
    // Default to first available team
    const ready = this.availableTeams;
    const defaultTeamId = ready.length > 0 ? ready[0].teamId : (this.teams[0]?.teamId || '');

    this.assignmentForm.reset({
      incidentId: this.incidents.length > 0 ? this.incidents[0].incidentId : '',
      teamId: defaultTeamId,
      assignedBy: 'District Officer',
      notes: 'Urgent rescue coordination dispatched. Proceed to coordinates immediately.'
    });
    this.showModal = true;
  }

  openEditModal(item: RescueAssignment): void {
    this.isEditMode = true;
    this.isReplacementMode = false;
    this.isReinforceMode = false;
    this.teamUnavailableError = false;
    this.activeAssignment = item;
    this.assignmentForm.patchValue({
      incidentId: item.incidentId,
      teamId: item.teamId,
      assignedBy: item.assignedBy,
      notes: item.notes
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.activeAssignment = null;
    this.teamUnavailableError = false;
    this.isReplacementMode = false;
    this.isReinforceMode = false;
    this.filterAvailableOnly = false;
  }

  // --- Scenario A1 Methods ---
  onTeamSelected(event: any): void {
    const teamId = (event.target as HTMLSelectElement).value;
    const tm = this.teams.find(t => t.teamId === teamId);
    if (tm && tm.status !== 'AVAILABLE') {
      this.teamUnavailableError = true;
      this.unavailableTeamName = tm.name;
      this.unavailableTeamStatus = tm.status;
    } else {
      this.teamUnavailableError = false;
    }
  }

  returnToAvailableTeams(): void {
    this.teamUnavailableError = false;
    this.filterAvailableOnly = true;
    const ready = this.availableTeams;
    if (ready.length > 0) {
      this.assignmentForm.patchValue({ teamId: ready[0].teamId });
      this.showFeedback(`Showing available rescue teams only. Selected ${ready[0].name}.`, 'success');
    }
  }

  get availableTeams(): RescueTeam[] {
    return this.teams.filter(t => t.status === 'AVAILABLE');
  }

  get selectableTeams(): RescueTeam[] {
    return this.filterAvailableOnly ? this.availableTeams : this.teams;
  }

  onFilterAvailableChange(): void {
    if (this.filterAvailableOnly) {
      const currentTeamId = this.assignmentForm.value.teamId;
      const isStillAvailable = this.availableTeams.some(t => t.teamId === currentTeamId);
      if (!isStillAvailable && this.availableTeams.length > 0) {
        this.assignmentForm.patchValue({ teamId: this.availableTeams[0].teamId });
        this.teamUnavailableError = false;
      }
    }
  }

  // --- Scenario A2 Methods ---
  openReplacementModal(item: RescueAssignment): void {
    this.isEditMode = false;
    this.isReplacementMode = true;
    this.isReinforceMode = false;
    this.replacementOldAssignmentId = item.assignmentId;
    this.teamUnavailableError = false;
    this.filterAvailableOnly = true;
    
    // Filter available teams excluding the unit that couldn't accept
    const ready = this.teams.filter(t => t.status === 'AVAILABLE' && t.teamId !== item.teamId);
    this.assignmentForm.reset({
      incidentId: item.incidentId,
      teamId: ready.length > 0 ? ready[0].teamId : '',
      assignedBy: 'District Officer',
      notes: `Replacement dispatch for cancelled assignment ${item.assignmentId} (Unit unable to accept). Proceed to incident zone.`
    });
    this.showModal = true;
  }

  // --- Scenario A3 Methods ---
  openReinforceModal(incidentId: string): void {
    this.isEditMode = false;
    this.isReplacementMode = false;
    this.isReinforceMode = true;
    this.teamUnavailableError = false;
    this.filterAvailableOnly = true;
    
    // Exclude teams already assigned and not cancelled
    const activeAssignedIds = this.assignments
      .filter(a => a.incidentId === incidentId && a.status !== 'CANCELLED' && a.status !== 'REJECTED')
      .map(a => a.teamId);
    const ready = this.teams.filter(t => t.status === 'AVAILABLE' && !activeAssignedIds.includes(t.teamId));

    this.assignmentForm.reset({
      incidentId: incidentId,
      teamId: ready.length > 0 ? ready[0].teamId : (this.availableTeams[0]?.teamId || ''),
      assignedBy: 'District Officer',
      notes: `Reinforcement dispatch: Additional unit deployed to Incident ${incidentId}. Coordinate with field units on site.`
    });
    this.showModal = true;
  }

  getAssignmentsCountForIncident(incidentId: string): number {
    return this.assignments.filter(a => a.incidentId === incidentId && a.status !== 'CANCELLED' && a.status !== 'REJECTED').length;
  }

  isMultiUnitIncident(incidentId: string): boolean {
    return this.getAssignmentsCountForIncident(incidentId) > 1;
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid) return;

    const formValue = this.assignmentForm.value;

    // Check Scenario A1: Selected Rescue Team becomes unavailable
    const chosenTeam = this.teams.find(t => t.teamId === formValue.teamId);
    if (chosenTeam && chosenTeam.status !== 'AVAILABLE') {
      this.teamUnavailableError = true;
      this.unavailableTeamName = chosenTeam.name;
      this.unavailableTeamStatus = chosenTeam.status;
      this.notificationService.showWarning(
        'Team Unavailable (Scenario A1)',
        `Rescue Team "${chosenTeam.name}" cannot be dispatched because it is ${chosenTeam.status}. Please select an available team.`
      );
      return;
    }

    this.submitting = true;

    if (this.isEditMode && this.activeAssignment) {
      const updatePayload = {
        incidentId: formValue.incidentId,
        teamId: formValue.teamId,
        notes: formValue.notes,
        updatedBy: 'District Officer'
      };

      this.assignmentService.updateAssignment(this.activeAssignment.assignmentId, updatePayload).subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.showFeedback(`Assignment ${this.activeAssignment?.assignmentId} updated successfully.`, 'success');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Failed to update assignment', err);
          this.submitting = false;
          this.showFeedback('Failed to update assignment.', 'error');
        }
      });
    } else {
      const createPayload = {
        incidentId: formValue.incidentId,
        teamId: formValue.teamId,
        assignedBy: formValue.assignedBy || 'District Officer',
        notes: formValue.notes
      };

      this.assignmentService.createAssignment(createPayload).subscribe({
        next: (created) => {
          this.submitting = false;
          const assignedId = created.assignmentId || 'Created';
          this.closeModal();

          if (this.isReplacementMode) {
            this.showFeedback(`Replacement team "${chosenTeam?.name}" successfully dispatched (${assignedId}) for Incident ${formValue.incidentId} (Scenario A2).`, 'success');
            this.notificationService.publishNotification({
              title: 'Replacement Team Dispatched (A2)',
              message: `Replacement Rescue Team "${chosenTeam?.name}" dispatched for Incident ${formValue.incidentId}.`,
              type: 'success',
              category: 'DISPATCH',
              targetRole: 'ALL',
              incidentId: formValue.incidentId,
              assignmentId: assignedId
            });
          } else if (this.isReinforceMode) {
            this.showFeedback(`Reinforcement unit "${chosenTeam?.name}" successfully dispatched (${assignedId}) to Incident ${formValue.incidentId} (Scenario A3).`, 'success');
            this.notificationService.publishNotification({
              title: 'Reinforcement Unit Dispatched (A3)',
              message: `Additional Rescue Team "${chosenTeam?.name}" dispatched to Incident ${formValue.incidentId}. Independent assignment ${assignedId} created.`,
              type: 'success',
              category: 'A3_REINFORCE',
              targetRole: 'ALL',
              incidentId: formValue.incidentId,
              assignmentId: assignedId
            });
          } else {
            this.showFeedback(`Rescue team dispatched successfully (${assignedId}).`, 'success');
            this.notificationService.publishNotification({
              title: 'Rescue Assignment Dispatched',
              message: `Unit "${chosenTeam?.name}" dispatched to Incident ${formValue.incidentId}.`,
              type: 'info',
              category: 'DISPATCH',
              targetRole: 'ALL',
              incidentId: formValue.incidentId,
              assignmentId: assignedId
            });
          }

          this.loadAllData();
        },
        error: (err) => {
          console.error('Failed to create assignment', err);
          this.submitting = false;
          this.showFeedback('Failed to dispatch team. Verify that incident and team exist.', 'error');
        }
      });
    }
  }

  deleteAssignment(id: string): void {
    if (confirm(`Are you sure you want to withdraw assignment ${id}?`)) {
      this.assignmentService.deleteAssignment(id).subscribe({
        next: () => {
          this.showFeedback(`Assignment ${id} withdrawn successfully.`, 'success');
          this.loadAllData();
        },
        error: (err) => {
          console.error('Failed to delete assignment', err);
          this.showFeedback(`Failed to withdraw assignment ${id}.`, 'error');
        }
      });
    }
  }

  openHistoryModal(item: RescueAssignment): void {
    this.activeHistoryAssignment = item;
    this.showHistoryModal = true;
    this.loadingHistory = true;
    this.statusHistory = [];

    this.assignmentService.getStatusHistory(item.assignmentId).subscribe({
      next: (history) => {
        this.statusHistory = history || [];
        this.loadingHistory = false;
      },
      error: (err) => {
        console.error('Failed to load status history', err);
        this.loadingHistory = false;
      }
    });
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
