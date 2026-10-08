import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService, Incident } from '../services/incident.service';
import { TeamService, RescueTeam } from '../services/team.service';

declare const L: any;

@Component({
  selector: 'app-emergency-map',
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
  `],
  template: `
    <div class="flex-1 flex flex-col space-y-4 w-full h-full min-h-0 relative">
      
      <!-- Top Action Ribbon -->
      <div class="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-[#0B192C]">Emergency Geospatial Operations Map</h3>
          <p class="text-sm text-[#64748B] mt-1">Live tactical coordinates of emergency incidents, active rescue team bases, and field units.</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-xs font-semibold text-[#0B192C] bg-white border border-[#CBD5E1] px-3 py-2 rounded-lg cursor-pointer">
            <input type="checkbox" [(ngModel)]="showIncidents" (change)="updateMapMarkers()" class="accent-[#DC2626]">
            <span>Incidents ({{ incidents.length }})</span>
          </label>
          <label class="flex items-center gap-2 text-xs font-semibold text-[#0B192C] bg-white border border-[#CBD5E1] px-3 py-2 rounded-lg cursor-pointer">
            <input type="checkbox" [(ngModel)]="showTeams" (change)="updateMapMarkers()" class="accent-[#1D4ED8]">
            <span>Rescue Units ({{ teams.length }})</span>
          </label>
          <button (click)="resetMapView()" class="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#0B192C] text-xs font-semibold rounded-lg hover:bg-[#F8FAFC]">
            Center Map
          </button>
        </div>
      </div>

      <!-- Main Map Container Grid (Fills Full Height) -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        
        <!-- Left 3 Cols: Leaflet Interactive Map Canvas -->
        <div class="lg:col-span-3 h-full min-h-[400px] relative bg-slate-100">
          <div id="emergencyTacticalMap" class="w-full h-full z-0"></div>

          <!-- Floating Legend -->
          <div class="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl p-3 shadow-lg text-xs space-y-2 pointer-events-auto">
            <div class="font-bold text-[#0B192C] text-[11px] uppercase tracking-wider">Tactical Legend</div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#DC2626] border-2 border-white shadow-sm"></span>
              <span class="text-[#64748B]">Critical / High Incident</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#D97706] border-2 border-white shadow-sm"></span>
              <span class="text-[#64748B]">Medium / Low Incident</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#1D4ED8] border-2 border-white shadow-sm"></span>
              <span class="text-[#64748B]">Rescue Team Position</span>
            </div>
          </div>
        </div>

        <!-- Right Col: Interactive Location List -->
        <div class="lg:col-span-1 h-full min-h-0 flex flex-col border-l border-[#E2E8F0] bg-[#F8FAFC]">
          <div class="p-4 border-b border-[#E2E8F0] bg-white">
            <h4 class="text-xs font-bold text-[#0B192C] uppercase tracking-wider">Tactical Geo-Pins</h4>
            <p class="text-[11px] text-[#64748B] mt-0.5">Click any entity to fly to coordinates.</p>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
            <!-- Incidents Group -->
            <div *ngIf="showIncidents">
              <div class="text-[10px] font-bold uppercase text-[#DC2626] px-1 py-1">Incidents ({{ incidents.length }})</div>
              <div *ngFor="let inc of incidents" 
                (click)="focusIncident(inc)"
                class="p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#DC2626] cursor-pointer transition-all hover:shadow-sm">
                <div class="flex items-center justify-between text-xs font-bold text-[#0B192C]">
                  <span>{{ inc.incidentId }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-normal"
                    [ngClass]="inc.priority === 'CRITICAL' ? 'bg-red-100 text-[#DC2626]' : 'bg-slate-100 text-slate-700'">
                    {{ inc.priority }}
                  </span>
                </div>
                <div class="text-xs text-[#0B192C] font-semibold mt-1">{{ inc.type }}</div>
                <div class="text-[11px] text-[#64748B]">{{ inc.district }}</div>
              </div>
            </div>

            <!-- Rescue Teams Group -->
            <div *ngIf="showTeams" class="pt-2">
              <div class="text-[10px] font-bold uppercase text-[#1D4ED8] px-1 py-1">Rescue Teams ({{ teams.length }})</div>
              <div *ngFor="let tm of teams" 
                (click)="focusTeam(tm)"
                class="p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#1D4ED8] cursor-pointer transition-all hover:shadow-sm">
                <div class="flex items-center justify-between text-xs font-bold text-[#0B192C]">
                  <span>{{ tm.teamId }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-normal"
                    [ngClass]="tm.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-[#1D4ED8]'">
                    {{ tm.status }}
                  </span>
                </div>
                <div class="text-xs text-[#0B192C] font-semibold mt-1">{{ tm.name }}</div>
                <div class="text-[11px] text-[#64748B]">{{ tm.organization }} • {{ tm.district }}</div>
              </div>
            </div>

          </div>

          <div class="p-3 border-t border-[#E2E8F0] bg-white text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Projection: WGS84</span>
            <span class="text-[#1D4ED8] font-bold">GPS Active</span>
          </div>
        </div>

      </div>

    </div>
  `
})
export class EmergencyMapComponent implements OnInit, AfterViewInit, OnDestroy {
  incidents: Incident[] = [];
  teams: RescueTeam[] = [];

  showIncidents = true;
  showTeams = true;

  private map: any = null;
  private markersLayer: any = null;

  constructor(
    private incidentService: IncidentService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadData(): void {
    this.incidentService.getIncidents().subscribe({
      next: (data) => {
        this.incidents = Array.isArray(data) ? data : [];
        this.updateMapMarkers();
      },
      error: (err) => console.error(err)
    });

    this.teamService.getTeams().subscribe({
      next: (data) => {
        this.teams = Array.isArray(data) ? data : [];
        this.updateMapMarkers();
      },
      error: (err) => console.error(err)
    });
  }

  initMap(): void {
    if (typeof L === 'undefined') {
      console.warn('Leaflet script is not yet loaded.');
      return;
    }

    const mapElement = document.getElementById('emergencyTacticalMap');
    if (!mapElement || this.map) return;

    // Centered at Sri Lanka
    this.map = L.map('emergencyTacticalMap').setView([7.8731, 80.7718], 8);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.updateMapMarkers();
  }

  resetMapView(): void {
    if (this.map) {
      this.map.setView([7.8731, 80.7718], 8);
    }
  }

  updateMapMarkers(): void {
    if (!this.map || !this.markersLayer || typeof L === 'undefined') return;

    this.markersLayer.clearLayers();

    // Plot Incidents
    if (this.showIncidents) {
      this.incidents.forEach((inc) => {
        if (inc.location?.coordinates && inc.location.coordinates.length >= 2) {
          const lng = inc.location.coordinates[0];
          const lat = inc.location.coordinates[1];
          const isCritical = inc.priority === 'CRITICAL' || inc.priority === 'HIGH';

          const marker = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: isCritical ? '#DC2626' : '#D97706',
            color: '#FFFFFF',
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0.9
          });

          const popupContent = `
            <div style="font-family:sans-serif; min-width: 180px;">
              <div style="font-weight:bold; color:#0B192C; font-size:13px;">${inc.incidentId} - ${inc.type}</div>
              <div style="font-size:11px; color:#DC2626; font-weight:bold; margin-top:2px;">Priority: ${inc.priority}</div>
              <div style="font-size:12px; color:#475569; margin-top:4px;">${inc.description || ''}</div>
              <div style="font-size:11px; color:#64748B; margin-top:4px;">District: <b>${inc.district}</b></div>
              <div style="font-size:10px; color:#94A3B8; font-family:monospace; margin-top:2px;">GPS: [${lat.toFixed(4)}, ${lng.toFixed(4)}]</div>
            </div>
          `;
          marker.bindPopup(popupContent);
          this.markersLayer.addLayer(marker);
        }
      });
    }

    // Plot Rescue Teams
    if (this.showTeams) {
      this.teams.forEach((tm) => {
        if (tm.location?.coordinates && tm.location.coordinates.length >= 2) {
          const lng = tm.location.coordinates[0];
          const lat = tm.location.coordinates[1];

          const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#1D4ED8',
            color: '#FFFFFF',
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0.95
          });

          const popupContent = `
            <div style="font-family:sans-serif; min-width: 180px;">
              <div style="font-weight:bold; color:#0B192C; font-size:13px;">${tm.teamId} - ${tm.name}</div>
              <div style="font-size:11px; color:#1D4ED8; font-weight:bold; margin-top:2px;">${tm.type} (${tm.status})</div>
              <div style="font-size:12px; color:#475569; margin-top:4px;">Org: ${tm.organization}</div>
              <div style="font-size:11px; color:#64748B; margin-top:4px;">Personnel: <b>${tm.members} members</b></div>
              <div style="font-size:10px; color:#94A3B8; font-family:monospace; margin-top:2px;">Base: [${lat.toFixed(4)}, ${lng.toFixed(4)}]</div>
            </div>
          `;
          marker.bindPopup(popupContent);
          this.markersLayer.addLayer(marker);
        }
      });
    }
  }

  focusIncident(inc: Incident): void {
    if (this.map && inc.location?.coordinates) {
      const lng = inc.location.coordinates[0];
      const lat = inc.location.coordinates[1];
      this.map.flyTo([lat, lng], 13, { duration: 1.2 });
    }
  }

  focusTeam(tm: RescueTeam): void {
    if (this.map && tm.location?.coordinates) {
      const lng = tm.location.coordinates[0];
      const lat = tm.location.coordinates[1];
      this.map.flyTo([lat, lng], 13, { duration: 1.2 });
    }
  }
}
