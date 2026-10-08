import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AssignmentService, RescueAssignment } from '../services/assignment.service';
import { IncidentService, Incident } from '../services/incident.service';
import { TeamService, RescueTeam } from '../services/team.service';

declare const L: any;

@Component({
  selector: 'app-live-operations',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#DC2626] animate-ping"></span>
            <h3 class="text-xl font-bold text-[#0B192C]">Live Rescue Operations Center</h3>
          </div>
          <p class="text-sm text-[#64748B] mt-1">
            Real-time tracking of deployed field units, route vectors, and estimated arrival times (ETA).
            <span class="text-[#1D4ED8] font-semibold">Status is updated by rescue teams.</span>
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- View Mode Toggle: Cards vs Tactical Route Map -->
          <div class="inline-flex rounded-lg border border-[#CBD5E1] bg-white p-0.5 shadow-sm">
            <button (click)="setViewMode('cards')" 
              class="px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5"
              [ngClass]="viewMode === 'cards' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0B192C]'">
              <span>📋 Operations Cards</span>
            </button>
            <button (click)="setViewMode('map')" 
              class="px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5"
              [ngClass]="viewMode === 'map' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-[#64748B] hover:text-[#0B192C]'">
              <span>🗺️ Live Route Map</span>
            </button>
          </div>

          <button (click)="loadActiveOperations()" class="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#0B192C] text-xs font-semibold rounded-lg hover:bg-[#F8FAFC] shadow-sm transition-colors">
            <svg class="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Live Sync
          </button>
        </div>
      </div>

      <!-- Live Operations Status Ribbon -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Active Operations</div>
            <div class="text-2xl font-bold text-[#0B192C] mt-1">{{ activeAssignments.length }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center font-bold text-lg">🚨</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Units En Route</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">{{ countStatus('EN_ROUTE') }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">🚒</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Units On Site</div>
            <div class="text-2xl font-bold text-indigo-600 mt-1">{{ countStatus('ON_SITE') }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">📍</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Awaiting Acceptance</div>
            <div class="text-2xl font-bold text-blue-600 mt-1">{{ countStatus('ASSIGNED') }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-bold text-lg">⏳</div>
        </div>
      </div>

      <!-- Main Operational Monitor Body (Fills Full Height) -->
      <div class="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm min-h-0 relative">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <svg class="w-9 h-9 animate-spin text-[#1D4ED8] mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span class="text-sm font-medium">Synchronizing live emergency feeds...</span>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && activeAssignments.length === 0" class="flex-1 flex flex-col items-center justify-center p-16 text-center text-[#64748B]">
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mb-4 border border-emerald-200">✓</div>
          <h4 class="text-base font-bold text-[#0B192C]">All Operations Clear</h4>
          <p class="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            There are currently no active rescue assignments awaiting completion in this district sector.
          </p>
        </div>

        <!-- VIEW 1: Active Operations Cards Grid -->
        <div *ngIf="!loading && activeAssignments.length > 0 && viewMode === 'cards'" class="flex-1 overflow-y-auto p-6 space-y-4">
          <div *ngFor="let op of activeAssignments" 
            (click)="openTrackingModal(op)"
            class="border border-[#E2E8F0] rounded-xl p-5 hover:border-[#1D4ED8] hover:shadow-md transition-all bg-[#F8FAFC] cursor-pointer group">
            
            <div class="flex flex-wrap items-start justify-between gap-4">
              
              <!-- Left: Operation Info & Location -->
              <div class="space-y-2 flex-1">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {{ op.assignmentId }}
                  </span>
                  
                  <!-- Status Badge -->
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5"
                    [ngClass]="{
                      'bg-blue-50 text-[#1D4ED8] border-blue-200': op.status === 'ASSIGNED',
                      'bg-sky-50 text-sky-700 border-sky-200': op.status === 'ACCEPTED',
                      'bg-amber-50 text-amber-700 border-amber-200': op.status === 'EN_ROUTE',
                      'bg-indigo-50 text-indigo-700 border-indigo-200': op.status === 'ON_SITE',
                      'bg-emerald-50 text-emerald-700 border-emerald-200': op.status === 'COMPLETED'
                    }">
                    <span class="w-1.5 h-1.5 rounded-full animate-ping"
                      [ngClass]="{
                        'bg-[#1D4ED8]': op.status === 'ASSIGNED',
                        'bg-sky-600': op.status === 'ACCEPTED',
                        'bg-amber-600': op.status === 'EN_ROUTE',
                        'bg-indigo-600': op.status === 'ON_SITE',
                        'bg-emerald-600': op.status === 'COMPLETED'
                      }"></span>
                    {{ op.status.replace('_', ' ') }}
                  </span>

                  <span class="text-xs text-[#64748B]">Dispatched {{ op.assignedAt | date:'mediumTime' }}</span>
                </div>

                <div>
                  <h4 class="text-base font-bold text-[#0B192C]">
                    Incident: {{ getIncidentTitle(op.incidentId) }}
                  </h4>
                  <p class="text-xs text-[#64748B] mt-0.5">{{ op.notes || 'No dispatch notes recorded.' }}</p>
                </div>

                <!-- Team Info & Live Location Pill -->
                <div class="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                  <div class="flex items-center gap-1 font-semibold text-[#0B192C]">
                    <span>🛡️ Unit:</span>
                    <span>{{ getTeamName(op.teamId) }}</span>
                  </div>
                  
                  <div class="flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                    <span>📍 Team Live GPS:</span>
                    <span class="font-bold text-[#0B192C]">{{ getTeamCoordsText(op.teamId) }}</span>
                  </div>

                  <div class="flex items-center gap-1">
                    <span>Officer:</span>
                    <span class="font-medium text-[#0B192C]">{{ op.assignedBy }}</span>
                  </div>
                </div>
              </div>

              <!-- Right: Real-Time ETA & Vector Card -->
              <div class="flex flex-col items-end gap-2.5">
                
                <!-- Prominent Live ETA Badge -->
                <div class="bg-white border rounded-xl p-3 shadow-sm text-right min-w-[210px]"
                  [ngClass]="isAccepted(op.status) ? 'border-blue-200' : 'border-[#E2E8F0]'">
                  <div class="text-[10px] uppercase font-bold text-[#64748B]">Estimated Arrival (ETA)</div>
                  
                  <div class="text-base font-extrabold mt-0.5"
                    [ngClass]="isAccepted(op.status) ? 'text-[#1D4ED8]' : 'text-amber-600'">
                    {{ getOperationETA(op) }}
                  </div>

                  <div class="text-[11px] text-[#64748B] mt-0.5 font-mono" *ngIf="getDistanceBetween(op.teamId, op.incidentId) !== null">
                    Distance: {{ getDistanceBetween(op.teamId, op.incidentId) }} km to sector
                  </div>
                </div>

                <!-- Open Tactical Route Map Button -->
                <button (click)="openTrackingModal(op); $event.stopPropagation()" class="px-4 py-2 text-xs font-bold text-white bg-[#1D4ED8] rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-all">
                  <span>🛰️ Track Route & Map</span>
                </button>

              </div>

            </div>
          </div>
        </div>

        <!-- VIEW 2: Full Unified Tactical Route Operations Map -->
        <div *ngIf="!loading && activeAssignments.length > 0 && viewMode === 'map'" class="flex-1 w-full h-full relative min-h-[460px] bg-slate-900">
          <div id="allLiveOpsMap" class="w-full h-full z-0"></div>

          <!-- Top-Left Floating Controls & Stats -->
          <div class="absolute top-4 left-4 z-[400] bg-[#0B192C]/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl pointer-events-auto space-y-2">
            <div class="flex items-center justify-between gap-3 border-b border-slate-700 pb-1.5">
              <span class="text-xs font-bold text-blue-400 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE MISSIONS RADAR
              </span>
              <span class="text-[10px] font-mono text-slate-400">{{ activeAssignments.length }} ACTIVE</span>
            </div>
            <div class="text-[11px] text-slate-300">
              Live vectors connecting rescue units to assigned disaster zones.
            </div>
            <div class="pt-1 flex gap-2">
              <button (click)="fitAllOpsMap()" class="px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                🎯 Fit All Routes
              </button>
            </div>
          </div>

          <!-- Floating Interactive Active Operations Quick Selector (Right Side) -->
          <div class="absolute top-4 right-4 z-[400] w-72 max-h-[80%] bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl p-3 flex flex-col pointer-events-auto">
            <div class="text-[11px] font-bold uppercase tracking-wider text-[#0B192C] pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>Active Missions</span>
              <span class="text-[10px] bg-blue-50 text-[#1D4ED8] px-1.5 py-0.5 rounded font-mono font-bold">{{ activeAssignments.length }}</span>
            </div>

            <div class="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
              <div *ngFor="let op of activeAssignments" 
                (click)="focusOperationOnMap(op)"
                class="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#1D4ED8] hover:shadow-sm cursor-pointer transition-all">
                <div class="flex items-center justify-between text-xs font-bold text-[#0B192C]">
                  <span class="font-mono text-[#1D4ED8]">{{ op.assignmentId }}</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded font-bold"
                    [ngClass]="op.status === 'EN_ROUTE' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#1D4ED8]'">
                    {{ op.status }}
                  </span>
                </div>
                <div class="text-[11px] font-semibold text-[#0B192C] mt-1 truncate">
                  🛡️ {{ getTeamName(op.teamId) }}
                </div>
                <div class="text-[10px] text-[#64748B] flex items-center justify-between mt-1">
                  <span>🚨 {{ getIncidentTitle(op.incidentId) }}</span>
                  <span class="font-bold text-emerald-600">{{ getOperationETA(op) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom-Left Map Legend -->
          <div class="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-xs shadow-lg space-y-1.5 pointer-events-auto">
            <div class="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Map Legend</div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#1D4ED8] border border-white"></span>
              <span class="text-[#0B192C] font-medium">Rescue Unit Position</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#DC2626] border border-white"></span>
              <span class="text-[#0B192C] font-medium">Emergency Incident</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-4 h-1 rounded bg-[#1D4ED8]"></span>
              <span class="text-[#64748B]">Active Transit Corridor</span>
            </div>
          </div>

        </div>

        <!-- Footer Info -->
        <div class="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B] flex-shrink-0">
          <span>Active Operations Count: <strong class="text-[#0B192C]">{{ activeAssignments.length }}</strong></span>
          <span class="font-mono text-[11px] text-emerald-600">● Live Field Telemetry Active</span>
        </div>

      </div>

      <!-- Tactical Route Tracking Modal (When clicking any operation or "Track Route") -->
      <div *ngIf="showTrackingModal && selectedTrackingOp" class="fixed inset-0 bg-[#0B192C]/75 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6 animate-fadeIn">
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
                    Tactical Route Tracking: {{ selectedTrackingOp.assignmentId }}
                  </h3>
                  <span class="px-2.5 py-0.5 text-[11px] font-bold rounded-full border"
                    [ngClass]="{
                      'bg-blue-50 text-[#1D4ED8] border-blue-200': selectedTrackingOp.status === 'ASSIGNED',
                      'bg-sky-50 text-sky-700 border-sky-200': selectedTrackingOp.status === 'ACCEPTED',
                      'bg-amber-50 text-amber-700 border-amber-200': selectedTrackingOp.status === 'EN_ROUTE',
                      'bg-indigo-50 text-indigo-700 border-indigo-200': selectedTrackingOp.status === 'ON_SITE',
                      'bg-emerald-50 text-emerald-700 border-emerald-200': selectedTrackingOp.status === 'COMPLETED'
                    }">
                    {{ selectedTrackingOp.status.replace('_', ' ') }}
                  </span>
                </div>
                <p class="text-xs text-[#64748B] mt-0.5">
                  Real-time telemetry, active highway transit corridor, and dynamic arrival calculation.
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
              <div class="text-sm font-bold text-[#0B192C] mt-1 truncate">{{ getTeamName(selectedTrackingOp.teamId) }}</div>
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
                {{ getDistanceBetween(selectedTrackingOp.teamId, selectedTrackingOp.incidentId) !== null ? getDistanceBetween(selectedTrackingOp.teamId, selectedTrackingOp.incidentId) + ' km' : 'Calculating...' }}
              </div>
              <div class="text-[10px] text-emerald-600 mt-0.5 font-medium">Direct road corridor vector</div>
            </div>

            <div class="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div class="text-[10px] uppercase font-bold text-[#64748B] flex items-center justify-between">
                <span>Estimated Arrival</span>
                <span class="text-xs">⏱️</span>
              </div>
              <div class="text-sm font-bold text-emerald-600 mt-1">
                {{ getOperationETA(selectedTrackingOp) }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">
                {{ isAccepted(selectedTrackingOp.status) ? 'Speed ~45 km/h • Priority transit' : 'Awaiting team acceptance' }}
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
              id="liveOpTrackingMap" 
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
                    <span class="text-emerald-400 font-bold">{{ getDistanceBetween(selectedTrackingOp.teamId, selectedTrackingOp.incidentId) }} km</span>
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
                  [ngClass]="selectedTrackingOp.status === 'EN_ROUTE' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-600'">2</div>
                <div>
                  <div class="font-bold text-[#0B192C]">Road Corridor</div>
                  <div class="text-[10px] text-[#64748B]">Speed ~45 km/h</div>
                </div>
              </div>
              <div class="w-8 h-0.5" [ngClass]="selectedTrackingOp.status === 'ON_SITE' ? 'bg-indigo-300' : 'bg-slate-200'"></div>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px]"
                  [ngClass]="selectedTrackingOp.status === 'ON_SITE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'">3</div>
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

    </div>
  `
})
export class LiveOperationsComponent implements OnInit, OnDestroy {
  assignments: RescueAssignment[] = [];
  incidents: Incident[] = [];
  teams: RescueTeam[] = [];
  loading = true;

  // View switch: 'cards' or 'map'
  viewMode: 'cards' | 'map' = 'cards';

  // Live Tracking Modal State
  showTrackingModal = false;
  selectedTrackingOp: RescueAssignment | null = null;
  mapMode: 'tactical' | 'satellite' | 'google_embed' = 'tactical';
  private trackingMap: any = null;
  private overviewMap: any = null;

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

  constructor(
    private assignmentService: AssignmentService,
    private incidentService: IncidentService,
    private teamService: TeamService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadActiveOperations();
  }

  ngOnDestroy(): void {
    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }
    if (this.overviewMap) {
      this.overviewMap.remove();
      this.overviewMap = null;
    }
  }

  setViewMode(mode: 'cards' | 'map'): void {
    this.viewMode = mode;
    if (mode === 'map') {
      setTimeout(() => {
        this.initAllOpsMap();
      }, 200);
    }
  }

  loadActiveOperations(): void {
    this.loading = true;

    this.incidentService.getIncidents().subscribe({
      next: (data) => {
        this.incidents = data || [];
        if (this.viewMode === 'map') this.initAllOpsMap();
      },
      error: (err) => console.error(err)
    });

    this.teamService.getTeams().subscribe({
      next: (data) => {
        this.teams = data || [];
        if (this.viewMode === 'map') this.initAllOpsMap();
      },
      error: (err) => console.error(err)
    });

    this.assignmentService.getAssignments().subscribe({
      next: (data) => {
        this.assignments = Array.isArray(data) ? data : [];
        this.loading = false;
        if (this.viewMode === 'map') {
          setTimeout(() => this.initAllOpsMap(), 200);
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  get activeAssignments(): RescueAssignment[] {
    return this.assignments.filter(a => ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(a.status));
  }

  countStatus(status: string): number {
    return this.activeAssignments.filter(a => a.status === status).length;
  }

  getIncidentTitle(id: string): string {
    const inc = this.incidents.find(i => i.incidentId === id);
    return inc ? `${inc.incidentId} — ${inc.type} (${inc.district})` : id;
  }

  getTeamName(id: string): string {
    const tm = this.teams.find(t => t.teamId === id);
    return tm ? tm.name : id;
  }

  getTeamCoordsText(teamId: string): string {
    const tm = this.teams.find(t => t.teamId === teamId);
    if (tm?.location?.coordinates && tm.location.coordinates.length >= 2) {
      return `[${tm.location.coordinates[1].toFixed(2)}, ${tm.location.coordinates[0].toFixed(2)}] (${tm.district})`;
    }
    return 'Coordinates Pending';
  }

  isAccepted(status: string): boolean {
    return ['ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(status);
  }

  getOperationETA(op: RescueAssignment): string {
    if (op.status === 'ASSIGNED') return 'Pending Acceptance';
    if (op.status === 'ON_SITE' || op.status === 'IN_PROGRESS') return 'Unit On Site Now';

    const dist = this.getDistanceBetween(op.teamId, op.incidentId);
    if (dist === null) return '~20 mins (Est. Transit)';

    const mins = Math.max(5, Math.round((dist / 45) * 60));
    const etaDate = new Date(Date.now() + mins * 60000);
    const timeStr = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `~${mins} mins (${timeStr})`;
  }

  getSelectedTeam(): RescueTeam | undefined {
    return this.teams.find(t => t.teamId === this.selectedTrackingOp?.teamId);
  }

  getSelectedIncident(): Incident | undefined {
    return this.incidents.find(i => i.incidentId === this.selectedTrackingOp?.incidentId);
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

  getDistanceBetween(teamId: string, incidentId: string): number | null {
    const tm = this.teams.find(t => t.teamId === teamId);
    const inc = this.incidents.find(i => i.incidentId === incidentId);

    const [lat1, lon1] = this.getTeamCoords(tm, inc?.district);
    const [lat2, lon2] = this.getIncidentCoords(inc);

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
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

  openTrackingModal(op: RescueAssignment): void {
    this.selectedTrackingOp = op;
    this.showTrackingModal = true;
    this.mapMode = 'tactical';
    setTimeout(() => {
      this.initTrackingMap();
    }, 200);
  }

  closeTrackingModal(): void {
    this.showTrackingModal = false;
    this.selectedTrackingOp = null;
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
    if (typeof L === 'undefined' || !this.selectedTrackingOp) return;
    if (this.mapMode === 'google_embed') return;

    const mapEl = document.getElementById('liveOpTrackingMap');
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

    this.trackingMap = L.map('liveOpTrackingMap', {
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

    // 2. Glowing Route Corridor Polyline
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
    const dist = this.getDistanceBetween(this.selectedTrackingOp.teamId, this.selectedTrackingOp.incidentId) || 18.2;
    const etaStr = this.getOperationETA(this.selectedTrackingOp);
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
        <b>Status:</b> <span style="color:#1D4ED8; font-weight:bold;">${this.selectedTrackingOp?.status}</span>
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

  // Unified Overview Map displaying all active operation routes simultaneously
  initAllOpsMap(): void {
    if (typeof L === 'undefined') return;

    const mapEl = document.getElementById('allLiveOpsMap');
    if (!mapEl) return;

    if (this.overviewMap) {
      this.overviewMap.remove();
      this.overviewMap = null;
    }

    this.overviewMap = L.map('allLiveOpsMap', {
      zoomControl: true,
      attributionControl: true
    }).setView([7.8731, 80.7718], 8);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(this.overviewMap);

    const allPoints: [number, number][] = [];

    this.activeAssignments.forEach(op => {
      const tm = this.teams.find(t => t.teamId === op.teamId);
      const inc = this.incidents.find(i => i.incidentId === op.incidentId);

      const start = this.getTeamCoords(tm, inc?.district);
      const end = this.getIncidentCoords(inc);
      allPoints.push(start);
      allPoints.push(end);

      const route = this.buildTacticalRoute(start, end);

      // Glow corridor
      L.polyline(route, { color: '#60A5FA', weight: 7, opacity: 0.45 }).addTo(this.overviewMap);
      // Core route
      L.polyline(route, { color: '#1D4ED8', weight: 3.5, opacity: 0.95 }).addTo(this.overviewMap);
      // Dashed progression
      L.polyline(route, { color: '#FFFFFF', weight: 1.5, dashArray: '6, 10', opacity: 0.9 }).addTo(this.overviewMap);

      // Incident perimeter
      L.circle(end, { radius: 1000, color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.12, weight: 1 }).addTo(this.overviewMap);

      // Team marker
      const teamEmoji = this.getTeamEmoji(tm);
      const teamHtml = `
        <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center cursor-pointer pointer-events-auto">
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 bg-blue-500/35 rounded-full animate-ping"></span>
            <div class="relative w-8 h-8 bg-[#1D4ED8] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-sm">
              ${teamEmoji}
            </div>
          </div>
          <div class="mt-0.5 px-2 py-0.2 bg-[#0B192C] text-white text-[9px] font-bold rounded shadow whitespace-nowrap">
            ${tm?.name || 'Unit'}
          </div>
        </div>
      `;
      L.marker(start, {
        icon: L.divIcon({ className: 'custom-div-icon', html: teamHtml, iconSize: [0, 0] })
      }).bindPopup(`
        <div style="font-family:sans-serif; font-size:12px;">
          <b style="color:#1D4ED8;">🛡️ ${tm?.name || 'Unit'}</b><br/>
          <b>Assignment:</b> ${op.assignmentId}<br/>
          <b>Status:</b> ${op.status}
        </div>
      `).addTo(this.overviewMap);

      // Incident marker
      const incEmoji = this.getIncidentEmoji(inc);
      const incHtml = `
        <div style="transform: translate(-50%, -50%);" class="flex flex-col items-center cursor-pointer pointer-events-auto">
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 bg-red-500/35 rounded-full animate-ping"></span>
            <div class="relative w-8 h-8 bg-[#DC2626] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-sm">
              ${incEmoji}
            </div>
          </div>
          <div class="mt-0.5 px-2 py-0.2 bg-[#DC2626] text-white text-[9px] font-bold rounded shadow whitespace-nowrap">
            ${inc?.type || 'Incident'}
          </div>
        </div>
      `;
      L.marker(end, {
        icon: L.divIcon({ className: 'custom-div-icon', html: incHtml, iconSize: [0, 0] })
      }).bindPopup(`
        <div style="font-family:sans-serif; font-size:12px;">
          <b style="color:#DC2626;">🚨 ${inc?.incidentId}</b><br/>
          <b>Type:</b> ${inc?.type}<br/>
          <b>District:</b> ${inc?.district}
        </div>
      `).addTo(this.overviewMap);
    });

    if (allPoints.length > 0) {
      this.overviewMap.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
    }

    setTimeout(() => {
      if (this.overviewMap) {
        this.overviewMap.invalidateSize();
      }
    }, 200);
  }

  fitAllOpsMap(): void {
    if (!this.overviewMap) return;
    const allPoints: [number, number][] = [];
    this.activeAssignments.forEach(op => {
      const tm = this.teams.find(t => t.teamId === op.teamId);
      const inc = this.incidents.find(i => i.incidentId === op.incidentId);
      allPoints.push(this.getTeamCoords(tm, inc?.district));
      allPoints.push(this.getIncidentCoords(inc));
    });
    if (allPoints.length > 0) {
      this.overviewMap.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] });
    }
  }

  focusOperationOnMap(op: RescueAssignment): void {
    if (!this.overviewMap) {
      this.openTrackingModal(op);
      return;
    }
    const tm = this.teams.find(t => t.teamId === op.teamId);
    const inc = this.incidents.find(i => i.incidentId === op.incidentId);
    const start = this.getTeamCoords(tm, inc?.district);
    const end = this.getIncidentCoords(inc);
    this.overviewMap.fitBounds(L.latLngBounds([start, end]), { padding: [80, 80] });
  }
}
