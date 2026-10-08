import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService, Incident } from '../services/incident.service';
import { AssignmentService, RescueAssignment } from '../services/assignment.service';
import { TeamService, RescueTeam } from '../services/team.service';

@Component({
  selector: 'app-rescue-reports',
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
    <div class="flex-1 flex flex-col space-y-5 w-full h-full min-h-0 relative">
      
      <!-- Top Action Ribbon -->
      <div class="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h3 class="text-xl font-bold text-[#0B192C]">Operational Analytics & Reports</h3>
          <p class="text-sm text-[#64748B] mt-1">Comprehensive historical logs, response latency metrics, and rescue team performance audits.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="loadAllMetrics()" class="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#CBD5E1] text-[#0B192C] text-sm font-semibold rounded-lg hover:bg-[#F8FAFC] shadow-sm">
            <svg class="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Re-calculate
          </button>
          <button (click)="exportReport()" class="flex items-center gap-2 px-4 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Summary (CSV)
          </button>
        </div>
      </div>

      <!-- KPI Executive Cards Ribbon -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Disasters Logged</div>
          <div class="text-2xl font-bold text-[#0B192C] mt-1">{{ incidents.length }}</div>
          <div class="text-[11px] text-emerald-600 font-medium mt-1">Resolution rate: {{ resolutionRate }}%</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Missions Dispatched</div>
          <div class="text-2xl font-bold text-[#1D4ED8] mt-1">{{ assignments.length }}</div>
          <div class="text-[11px] text-[#64748B] font-medium mt-1">Completed: {{ completedCount }}</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Civilians Affected</div>
          <div class="text-2xl font-bold text-amber-600 mt-1">{{ totalPeopleAffected }}</div>
          <div class="text-[11px] text-slate-500 font-medium mt-1">Across {{ districtCount }} districts</div>
        </div>

        <div class="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div class="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Deployed Responders</div>
          <div class="text-2xl font-bold text-emerald-600 mt-1">{{ activeFieldPersonnel }}</div>
          <div class="text-[11px] text-slate-500 font-medium mt-1">Available base: {{ availableTeamsCount }} teams</div>
        </div>
      </div>

      <!-- Main Scrollable Analytics Body (Fills Full Height) -->
      <div class="flex-1 flex flex-col bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm min-h-0">
        
        <div class="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div>
            <h4 class="text-sm font-bold text-[#0B192C]">Operational Records Ledger</h4>
            <p class="text-xs text-[#64748B]">Audited archive of incident lifecycles and responding rescue assignments.</p>
          </div>
          <div class="flex items-center gap-2">
            <select [(ngModel)]="filterScope" class="text-xs border border-[#CBD5E1] bg-white rounded-lg px-3 py-1.5 outline-none font-medium text-[#0B192C]">
              <option value="ALL">Scope: All Historical</option>
              <option value="CRITICAL">Critical Incidents</option>
              <option value="COMPLETED">Completed Missions</option>
            </select>
          </div>
        </div>

        <div class="flex-1 overflow-x-auto overflow-y-auto min-h-0">
          <table class="w-full text-sm">
            <thead class="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-10">
              <tr class="text-[11px] uppercase tracking-wider text-[#64748B]">
                <th class="px-6 py-4 text-left font-bold">Event Code</th>
                <th class="px-6 py-4 text-left font-bold">Category & District</th>
                <th class="px-6 py-4 text-left font-bold">Assigned Team</th>
                <th class="px-6 py-4 text-left font-bold">Priority</th>
                <th class="px-6 py-4 text-left font-bold">Affected</th>
                <th class="px-6 py-4 text-left font-bold">Status</th>
                <th class="px-6 py-4 text-right font-bold">Logged Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#F1F5F9]">
              <tr *ngFor="let inc of filteredLedger" class="hover:bg-[#F8FAFC] transition-colors">
                <td class="px-6 py-4 font-mono text-xs font-bold text-[#1D4ED8] whitespace-nowrap">
                  {{ inc.incidentId }}
                </td>
                <td class="px-6 py-4">
                  <div class="text-xs font-bold text-[#0B192C]">{{ inc.type }}</div>
                  <div class="text-[11px] text-[#64748B]">{{ inc.district }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-xs font-medium text-[#0B192C]">{{ getAssignedTeamName(inc.incidentId) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded border"
                    [ngClass]="{
                      'bg-red-50 text-[#DC2626] border-red-200': inc.priority === 'CRITICAL',
                      'bg-amber-50 text-amber-700 border-amber-200': inc.priority === 'HIGH',
                      'bg-yellow-50 text-yellow-700 border-yellow-200': inc.priority === 'MEDIUM',
                      'bg-slate-50 text-slate-700 border-slate-200': inc.priority === 'LOW'
                    }">
                    {{ inc.priority }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-xs text-[#0B192C]">
                  {{ inc.peopleAffected || 0 }} persons
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-xs font-bold"
                    [ngClass]="inc.status === 'CLOSED' ? 'text-slate-500' : 'text-[#1D4ED8]'">
                    {{ inc.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap font-mono text-[11px] text-[#64748B]">
                  {{ inc.createdAt | date:'short' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B] flex-shrink-0">
          <span>Ledger Entries: <strong class="text-[#0B192C]">{{ filteredLedger.length }}</strong></span>
          <span class="font-mono text-[11px] text-slate-500">Official DMC Record</span>
        </div>

      </div>

    </div>
  `
})
export class RescueReportsComponent implements OnInit {
  incidents: Incident[] = [];
  assignments: RescueAssignment[] = [];
  teams: RescueTeam[] = [];
  loading = true;

  filterScope = 'ALL';

  constructor(
    private incidentService: IncidentService,
    private assignmentService: AssignmentService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.loadAllMetrics();
  }

  loadAllMetrics(): void {
    this.loading = true;

    this.incidentService.getIncidents().subscribe({
      next: (data) => this.incidents = Array.isArray(data) ? data : [],
      error: (err) => console.error(err)
    });

    this.assignmentService.getAssignments().subscribe({
      next: (data) => this.assignments = Array.isArray(data) ? data : [],
      error: (err) => console.error(err)
    });

    this.teamService.getTeams().subscribe({
      next: (data) => {
        this.teams = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  get resolutionRate(): number {
    if (this.incidents.length === 0) return 100;
    const closed = this.incidents.filter(i => i.status === 'CLOSED').length;
    return Math.round((closed / this.incidents.length) * 100);
  }

  get completedCount(): number {
    return this.assignments.filter(a => a.status === 'COMPLETED').length;
  }

  get totalPeopleAffected(): number {
    return this.incidents.reduce((acc, i) => acc + (i.peopleAffected || 0), 0);
  }

  get districtCount(): number {
    const districts = new Set(this.incidents.map(i => i.district));
    return districts.size;
  }

  get activeFieldPersonnel(): number {
    const activeTeamIds = this.assignments
      .filter(a => ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'].includes(a.status))
      .map(a => a.teamId);
    return this.teams
      .filter(t => activeTeamIds.includes(t.teamId))
      .reduce((acc, t) => acc + (t.members || 0), 0);
  }

  get availableTeamsCount(): number {
    return this.teams.filter(t => t.status === 'AVAILABLE').length;
  }

  getAssignedTeamName(incidentId: string): string {
    const assignment = this.assignments.find(a => a.incidentId === incidentId);
    if (!assignment) return 'Unassigned';
    const team = this.teams.find(t => t.teamId === assignment.teamId);
    return team ? `${team.name} (${assignment.status})` : assignment.teamId;
  }

  get filteredLedger(): Incident[] {
    if (this.filterScope === 'CRITICAL') {
      return this.incidents.filter(i => i.priority === 'CRITICAL');
    }
    if (this.filterScope === 'COMPLETED') {
      return this.incidents.filter(i => i.status === 'CLOSED');
    }
    return this.incidents;
  }

  exportReport(): void {
    let csv = 'Incident ID,Type,District,Priority,People Affected,Status,Created At\n';
    this.filteredLedger.forEach(i => {
      csv += `"${i.incidentId}","${i.type}","${i.district}","${i.priority}",${i.peopleAffected},"${i.status}","${i.createdAt}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmc-district-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
