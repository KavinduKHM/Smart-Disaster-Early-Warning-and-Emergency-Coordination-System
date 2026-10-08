import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { AssignmentService, RescueAssignment } from '../../uc3-rescue/services/assignment.service';
import { TeamService, RescueTeam } from '../../uc3-rescue/services/team.service';
import { IncidentService, Incident } from '../../uc3-rescue/services/incident.service';

export type RescuePage = 'missions' | 'navigation' | 'connectivity' | 'readiness' | 'comms';

export interface OfflineTelemetryUpdate {
  id: string;
  timestamp: number;
  type: 'STATUS_UPDATE' | 'GPS_UPDATE' | 'MISSION_DECLINE' | 'NOTES';
  assignmentId?: string;
  teamId: string;
  payload: any;
  summary: string;
}

const OFFLINE_QUEUE_KEY = 'RESCUE_OFFLINE_TELEMETRY_QUEUE';

@Component({
  selector: 'app-rescue-team-dashboard',
  templateUrl: './rescue-team-dashboard.component.html',
  styleUrls: ['./rescue-team-dashboard.component.css']
})
export class RescueTeamDashboardComponent implements OnInit, OnDestroy {
  readonly OFFLINE_QUEUE_KEY = OFFLINE_QUEUE_KEY;
  user: UserProfile | null = null;
  activePage: RescuePage = 'missions';

  // Navigation Items
  readonly navItems: { id: RescuePage; label: string; icon: string; count?: () => number }[] = [
    { 
      id: 'missions', 
      label: 'Active Missions', 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      count: () => this.myAssignments.filter(a => ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SITE'].includes(a.status)).length
    },
    { 
      id: 'navigation', 
      label: 'Tactical Navigation', 
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' 
    },
    { 
      id: 'connectivity', 
      label: 'Field Connectivity (A4)', 
      icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
      count: () => this.offlineQueue.length
    },
    { 
      id: 'readiness', 
      label: 'Unit Readiness (A1)', 
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' 
    },
    { 
      id: 'comms', 
      label: 'Comms & Bulletins', 
      icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' 
    }
  ];

  // Core Data
  teams: RescueTeam[] = [];
  currentTeam: RescueTeam | null = null;
  selectedTeamId: string = '';
  assignments: RescueAssignment[] = [];
  incidents: Incident[] = [];

  loading = true;
  actionLoading = false;
  feedbackMessage: string | null = null;
  feedbackType: 'success' | 'error' | 'warning' = 'success';

  // Scenario A4: Network Connection Simulation & Queue
  isOfflineSimulated = false;
  isBrowserOnline = true;
  offlineQueue: OfflineTelemetryUpdate[] = [];
  isSyncing = false;
  private onlineListener?: () => void;
  private offlineListener?: () => void;

  // Scenario A2: Cannot Accept Mission Modal
  showDeclineModal = false;
  selectedDeclineAssignment: RescueAssignment | null = null;
  declineReason = 'Mechanical failure of rescue vehicle';
  customDeclineNote = '';
  declineSubmitting = false;

  readonly declineReasons: string[] = [
    'Mechanical failure of rescue vehicle',
    'Access corridor flooded / Route impassable',
    'Crew engaged in critical life-saving extraction',
    'Severe equipment casualty (Boat / Generator / Medical pack)',
    'Personnel medical emergency / Crew injury',
    'Weather hazards exceed safe operating parameters'
  ];

  // Mission Detail Drawer / Modal
  showDetailModal = false;
  activeDetailAssignment: RescueAssignment | null = null;

  // GPS Telemetry Transmitter
  currentLat: number = 7.2906;
  currentLng: number = 80.6337;

  constructor(
    private authService: AuthService,
    private assignmentService: AssignmentService,
    private teamService: TeamService,
    private incidentService: IncidentService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.initConnectivityListeners();
    this.loadOfflineQueue();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    if (this.onlineListener) window.removeEventListener('online', this.onlineListener);
    if (this.offlineListener) window.removeEventListener('offline', this.offlineListener);
  }

  // --- CONNECTIVITY & OFFLINE QUEUE (Scenario A4) ---
  private initConnectivityListeners(): void {
    this.isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    this.onlineListener = () => {
      this.isBrowserOnline = true;
      if (!this.isOfflineSimulated && this.offlineQueue.length > 0) {
        this.showFeedback(`Connection restored! ${this.offlineQueue.length} telemetry item(s) pending sync.`, 'warning');
      }
    };

    this.offlineListener = () => {
      this.isBrowserOnline = false;
      this.showFeedback('Field network disconnected. Storing telemetry in offline cache.', 'warning');
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  get isEffectivelyOffline(): boolean {
    return this.isOfflineSimulated || !this.isBrowserOnline;
  }

  toggleSimulatedOffline(): void {
    this.isOfflineSimulated = !this.isOfflineSimulated;
    if (this.isOfflineSimulated) {
      this.showFeedback('⚡ Offline Mode Activated: Telemetry & status updates will be captured locally (Scenario A4).', 'warning');
      this.notificationService.publishNotification({
        title: 'Rescue Team Operating Offline',
        message: `${this.currentTeam?.name || 'Unit'} has entered disconnected field zone (Scenario A4).`,
        type: 'warning',
        category: 'A4_CONNECTIVITY',
        targetRole: 'DISTRICT_OFFICER',
        teamId: this.currentTeam?.teamId
      });
    } else {
      this.showFeedback('📶 Online Network Restored! Ready to synchronize offline updates with central system.', 'success');
      if (this.offlineQueue.length > 0) {
        // Prompt automatic sync or notify
        this.syncOfflineQueue();
      }
    }
  }

  private loadOfflineQueue(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw) {
        this.offlineQueue = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse offline queue', e);
    }
  }

  private saveOfflineQueue(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.error('Failed to save offline queue', e);
    }
  }

  enqueueOfflineUpdate(item: Omit<OfflineTelemetryUpdate, 'id' | 'timestamp'>): void {
    const queueItem: OfflineTelemetryUpdate = {
      ...item,
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
    this.showFeedback(`⚡ Saved in offline cache: ${item.summary}. Will sync upon reconnect.`, 'warning');
  }

  syncOfflineQueue(): void {
    if (this.offlineQueue.length === 0) {
      this.showFeedback('No pending offline telemetry to synchronize.', 'warning');
      return;
    }

    if (this.isEffectivelyOffline) {
      this.showFeedback('Cannot synchronize while offline. Please restore connectivity first.', 'error');
      return;
    }

    this.isSyncing = true;
    const itemsToSync = [...this.offlineQueue];
    const totalCount = itemsToSync.length;

    // Execute sync requests sequentially
    let completedCount = 0;
    const executeNext = (index: number) => {
      if (index >= itemsToSync.length) {
        // Finished all items
        this.offlineQueue = [];
        this.saveOfflineQueue();
        this.isSyncing = false;
        this.showFeedback(`✅ Successfully synchronized all ${totalCount} offline telemetry & status updates!`, 'success');
        
        // Notify District Officer that data has been synchronized!
        this.notificationService.publishNotification({
          title: 'Field Telemetry Synchronized (A4)',
          message: `Rescue Team ${this.currentTeam?.name || 'Unit'} reconnected and synchronized ${totalCount} telemetry and status updates. District Officer dashboard updated.`,
          type: 'success',
          category: 'A4_CONNECTIVITY',
          targetRole: 'DISTRICT_OFFICER',
          teamId: this.currentTeam?.teamId
        });

        this.loadAllData();
        return;
      }

      const item = itemsToSync[index];
      if (item.type === 'STATUS_UPDATE' && item.assignmentId) {
        const updateCall = item.payload.status === 'ACCEPTED'
          ? this.assignmentService.acceptAssignment(item.assignmentId, item.payload.updatedBy)
          : item.payload.status === 'EN_ROUTE'
          ? this.assignmentService.enRouteAssignment(item.assignmentId, item.payload.updatedBy)
          : item.payload.status === 'ON_SITE'
          ? this.assignmentService.onSiteAssignment(item.assignmentId, item.payload.updatedBy)
          : item.payload.status === 'COMPLETED'
          ? this.assignmentService.completeAssignment(item.assignmentId, item.payload.updatedBy, item.payload.notes)
          : item.payload.status === 'CANCELLED'
          ? this.assignmentService.cancelAssignment(item.assignmentId, item.payload.updatedBy, item.payload.notes)
          : this.assignmentService.updateAssignment(item.assignmentId, item.payload);

        updateCall.subscribe({
          next: () => {
            completedCount++;
            executeNext(index + 1);
          },
          error: (err) => {
            console.error('Failed to sync item', item, err);
            // continue next anyway to avoid permanent blocking
            executeNext(index + 1);
          }
        });
      } else if (item.type === 'GPS_UPDATE') {
        const team = this.currentTeam;
        if (team?._id) {
          this.teamService.updateTeam(team._id, {
            location: {
              type: 'Point',
              coordinates: [item.payload.lng, item.payload.lat]
            }
          }).subscribe({
            next: () => {
              completedCount++;
              executeNext(index + 1);
            },
            error: () => executeNext(index + 1)
          });
        } else {
          executeNext(index + 1);
        }
      } else if (item.type === 'MISSION_DECLINE' && item.assignmentId) {
        this.assignmentService.cancelAssignment(
          item.assignmentId,
          this.currentTeam?.name || 'Rescue Team',
          item.payload.reason
        ).subscribe({
          next: () => {
            completedCount++;
            executeNext(index + 1);
          },
          error: () => executeNext(index + 1)
        });
      } else {
        executeNext(index + 1);
      }
    };

    executeNext(0);
  }

  clearOfflineQueue(): void {
    if (confirm('Clear all stored offline items without syncing?')) {
      this.offlineQueue = [];
      this.saveOfflineQueue();
      this.showFeedback('Offline queue cleared.', 'warning');
    }
  }

  // --- DATA LOADING & INITIALIZATION ---
  loadAllData(): void {
    this.loading = true;

    this.teamService.getTeams().subscribe({
      next: (teamsData) => {
        this.teams = teamsData || [];
        this.resolveCurrentTeam();

        this.incidentService.getIncidents().subscribe({
          next: (incData) => this.incidents = incData || [],
          error: (e) => console.error('Error loading incidents', e)
        });

        this.assignmentService.getAssignments().subscribe({
          next: (asnData) => {
            this.assignments = asnData || [];
            this.loading = false;
          },
          error: (err) => {
            console.error('Failed to load assignments', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load teams', err);
        this.loading = false;
      }
    });
  }

  private resolveCurrentTeam(): void {
    if (this.teams.length === 0) return;

    // Match by user teamId or badge or district, or default to first
    let found = this.teams.find(t => t.teamId === this.user?.teamId);
    if (!found && this.user?.district) {
      found = this.teams.find(t => (t.district || '').toLowerCase() === (this.user?.district || '').toLowerCase());
    }
    if (!found) {
      found = this.teams[0];
    }

    this.currentTeam = found;
    this.selectedTeamId = found.teamId;

    if (found.location?.coordinates && found.location.coordinates.length >= 2) {
      this.currentLng = found.location.coordinates[0];
      this.currentLat = found.location.coordinates[1];
    }
  }

  switchActiveTeam(teamId: string): void {
    const found = this.teams.find(t => t.teamId === teamId);
    if (found) {
      this.currentTeam = found;
      this.selectedTeamId = found.teamId;
      if (found.location?.coordinates && found.location.coordinates.length >= 2) {
        this.currentLng = found.location.coordinates[0];
        this.currentLat = found.location.coordinates[1];
      }
      this.showFeedback(`Active view switched to: ${found.name} (${found.teamId})`, 'success');
    }
  }

  // --- FILTERED DATA FOR CURRENT TEAM ---
  get myAssignments(): RescueAssignment[] {
    if (!this.currentTeam) return [];
    return this.assignments.filter(a => a.teamId === this.currentTeam?.teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  get activeMissionsCount(): number {
    return this.myAssignments.filter(a => ['ACCEPTED', 'EN_ROUTE', 'ON_SITE'].includes(a.status)).length;
  }

  get completedMissionsCount(): number {
    return this.myAssignments.filter(a => a.status === 'COMPLETED').length;
  }

  get pendingMissionsCount(): number {
    return this.myAssignments.filter(a => a.status === 'ASSIGNED').length;
  }

  // --- SCENARIO A1: UNIT READINESS TOGGLE ---
  toggleTeamReadiness(newStatus: 'AVAILABLE' | 'INACTIVE'): void {
    if (!this.currentTeam) return;

    this.actionLoading = true;
    const teamId = this.currentTeam._id;
    const teamName = this.currentTeam.name;

    this.teamService.updateTeam(teamId, { status: newStatus }).subscribe({
      next: (updated) => {
        this.actionLoading = false;
        if (this.currentTeam) {
          this.currentTeam.status = newStatus as any;
        }

        if (newStatus === 'INACTIVE') {
          this.showFeedback(`⚠️ Team readiness set to UNAVAILABLE (Maintenance/Rest). System will notify District Officer if dispatch is attempted (Scenario A1).`, 'warning');
          
          this.notificationService.publishNotification({
            title: `Team Unavailable: ${teamName} (A1)`,
            message: `Rescue Team ${teamName} has marked status as UNAVAILABLE. District Officer cannot dispatch this unit.`,
            type: 'warning',
            category: 'A1_UNAVAILABLE',
            targetRole: 'DISTRICT_OFFICER',
            teamId: this.currentTeam?.teamId
          });
        } else {
          this.showFeedback(`✅ Team readiness set to AVAILABLE. Ready for emergency dispatches!`, 'success');
          
          this.notificationService.publishNotification({
            title: `Team Ready for Service: ${teamName}`,
            message: `Rescue Team ${teamName} is back in service and ready for active deployments.`,
            type: 'success',
            category: 'GENERAL',
            targetRole: 'DISTRICT_OFFICER',
            teamId: this.currentTeam?.teamId
          });
        }
      },
      error: (err) => {
        console.error('Failed to update readiness', err);
        this.actionLoading = false;
        this.showFeedback('Failed to update unit readiness.', 'error');
      }
    });
  }

  // --- SCENARIO A2: CANNOT ACCEPT ASSIGNMENT ---
  openDeclineModal(item: RescueAssignment): void {
    this.selectedDeclineAssignment = item;
    this.declineReason = this.declineReasons[0];
    this.customDeclineNote = '';
    this.showDeclineModal = true;
  }

  closeDeclineModal(): void {
    this.showDeclineModal = false;
    this.selectedDeclineAssignment = null;
  }

  confirmDeclineAssignment(): void {
    if (!this.selectedDeclineAssignment) return;

    const assignment = this.selectedDeclineAssignment;
    const reasonText = this.customDeclineNote 
      ? `${this.declineReason} - Note: ${this.customDeclineNote}`
      : this.declineReason;
    const teamName = this.currentTeam?.name || 'Rescue Team';

    const targetId = assignment.assignmentId || assignment._id;
    this.declineSubmitting = true;

    // Check if offline (Scenario A4 + A2)
    if (this.isEffectivelyOffline) {
      this.enqueueOfflineUpdate({
        type: 'MISSION_DECLINE',
        assignmentId: targetId,
        teamId: assignment.teamId,
        payload: { reason: reasonText },
        summary: `Decline Assignment ${targetId}: ${this.declineReason}`
      });

      // Optimistically update local view
      assignment.status = 'CANCELLED';
      this.declineSubmitting = false;
      this.closeDeclineModal();
      this.showFeedback(`Assignment ${targetId} marked CANCELLED locally (Offline). District Officer will be notified on sync.`, 'warning');
      return;
    }

    this.assignmentService.cancelAssignment(targetId, teamName, reasonText).subscribe({
      next: () => {
        this.declineSubmitting = false;
        this.closeDeclineModal();
        assignment.status = 'CANCELLED';

        this.showFeedback(`Assignment ${targetId} CANCELLED. System informed District Officer to dispatch replacement unit (Scenario A2).`, 'warning');

        // Publish high-priority notification to District Officer
        this.notificationService.publishNotification({
          title: `Mission Declined: Unit Cannot Accept (A2)`,
          message: `Rescue Team "${teamName}" CANNOT ACCEPT assignment ${targetId} for Incident ${assignment.incidentId}. Reason: ${reasonText}. Incident remains open; please select replacement team.`,
          type: 'error',
          category: 'A2_REJECTED',
          targetRole: 'DISTRICT_OFFICER',
          incidentId: assignment.incidentId,
          assignmentId: targetId,
          teamId: assignment.teamId,
          actionLabel: 'Select Replacement Team'
        });

        this.loadAllData();
      },
      error: (err) => {
        console.error('Failed to cancel assignment', err);
        this.declineSubmitting = false;
        this.showFeedback('Failed to cancel assignment on server.', 'error');
      }
    });
  }

  // --- MISSION PROGRESSION STEPS ---
  acceptMission(assignment: RescueAssignment): void {
    const teamName = this.currentTeam?.name || 'Rescue Unit';

    if (this.isEffectivelyOffline) {
      this.enqueueOfflineUpdate({
        type: 'STATUS_UPDATE',
        assignmentId: assignment.assignmentId,
        teamId: assignment.teamId,
        payload: { status: 'ACCEPTED', updatedBy: teamName },
        summary: `Accept Mission ${assignment.assignmentId}`
      });
      assignment.status = 'ACCEPTED';
      this.showFeedback(`Mission ${assignment.assignmentId} accepted (Saved offline).`, 'success');
      return;
    }

    this.actionLoading = true;
    this.assignmentService.acceptAssignment(assignment.assignmentId, teamName).subscribe({
      next: () => {
        this.actionLoading = false;
        assignment.status = 'ACCEPTED';
        this.showFeedback(`Mission ${assignment.assignmentId} ACCEPTED! Prepare for deployment.`, 'success');

        this.notificationService.publishNotification({
          title: `Mission Accepted: ${assignment.assignmentId}`,
          message: `Rescue Team "${teamName}" accepted dispatch for Incident ${assignment.incidentId}.`,
          type: 'success',
          category: 'DISPATCH',
          targetRole: 'DISTRICT_OFFICER',
          incidentId: assignment.incidentId,
          assignmentId: assignment.assignmentId
        });
      },
      error: (err) => {
        console.error('Failed to accept mission', err);
        this.actionLoading = false;
        this.showFeedback('Failed to accept mission.', 'error');
      }
    });
  }

  markEnRoute(assignment: RescueAssignment): void {
    const teamName = this.currentTeam?.name || 'Rescue Unit';

    if (this.isEffectivelyOffline) {
      this.enqueueOfflineUpdate({
        type: 'STATUS_UPDATE',
        assignmentId: assignment.assignmentId,
        teamId: assignment.teamId,
        payload: { status: 'EN_ROUTE', updatedBy: teamName },
        summary: `Mark En Route ${assignment.assignmentId}`
      });
      assignment.status = 'EN_ROUTE';
      this.showFeedback(`Unit marked EN ROUTE (Offline cache).`, 'success');
      return;
    }

    this.actionLoading = true;
    this.assignmentService.enRouteAssignment(assignment.assignmentId, teamName).subscribe({
      next: () => {
        this.actionLoading = false;
        assignment.status = 'EN_ROUTE';
        this.showFeedback(`Unit status: EN ROUTE to destination corridor.`, 'success');

        this.notificationService.publishNotification({
          title: `Unit En Route: ${assignment.assignmentId}`,
          message: `Rescue Team "${teamName}" is in transit to Incident ${assignment.incidentId}.`,
          type: 'info',
          category: 'DISPATCH',
          targetRole: 'DISTRICT_OFFICER',
          incidentId: assignment.incidentId,
          assignmentId: assignment.assignmentId
        });
      },
      error: (err) => {
        console.error('Failed to mark en route', err);
        this.actionLoading = false;
        this.showFeedback('Failed to update status.', 'error');
      }
    });
  }

  markOnSite(assignment: RescueAssignment): void {
    const teamName = this.currentTeam?.name || 'Rescue Unit';

    if (this.isEffectivelyOffline) {
      this.enqueueOfflineUpdate({
        type: 'STATUS_UPDATE',
        assignmentId: assignment.assignmentId,
        teamId: assignment.teamId,
        payload: { status: 'ON_SITE', updatedBy: teamName },
        summary: `Mark On Site ${assignment.assignmentId}`
      });
      assignment.status = 'ON_SITE';
      this.showFeedback(`Unit marked ON SITE (Offline cache). Commencing extraction.`, 'success');
      return;
    }

    this.actionLoading = true;
    this.assignmentService.onSiteAssignment(assignment.assignmentId, teamName).subscribe({
      next: () => {
        this.actionLoading = false;
        assignment.status = 'ON_SITE';
        this.showFeedback(`Unit arrived ON SITE. Commencing search and extraction operations.`, 'success');

        this.notificationService.publishNotification({
          title: `Unit Arrived On Site: ${assignment.assignmentId}`,
          message: `Rescue Team "${teamName}" arrived at Incident ${assignment.incidentId}. Active rescue commenced.`,
          type: 'info',
          category: 'DISPATCH',
          targetRole: 'DISTRICT_OFFICER',
          incidentId: assignment.incidentId,
          assignmentId: assignment.assignmentId
        });
      },
      error: (err) => {
        console.error('Failed to mark on site', err);
        this.actionLoading = false;
        this.showFeedback('Failed to update status.', 'error');
      }
    });
  }

  completeMission(assignment: RescueAssignment): void {
    const teamName = this.currentTeam?.name || 'Rescue Unit';

    if (this.isEffectivelyOffline) {
      this.enqueueOfflineUpdate({
        type: 'STATUS_UPDATE',
        assignmentId: assignment.assignmentId,
        teamId: assignment.teamId,
        payload: { status: 'COMPLETED', updatedBy: teamName, notes: 'Victims evacuated and secured' },
        summary: `Complete Mission ${assignment.assignmentId}`
      });
      assignment.status = 'COMPLETED';
      this.showFeedback(`Mission ${assignment.assignmentId} completed (Saved offline).`, 'success');
      return;
    }

    this.actionLoading = true;
    this.assignmentService.completeAssignment(assignment.assignmentId, teamName, 'All life-saving activities completed').subscribe({
      next: () => {
        this.actionLoading = false;
        assignment.status = 'COMPLETED';
        this.showFeedback(`🎉 Mission ${assignment.assignmentId} marked COMPLETED! Excellent work.`, 'success');

        this.notificationService.publishNotification({
          title: `Mission Completed: ${assignment.assignmentId}`,
          message: `Rescue Team "${teamName}" successfully completed rescue operations for Incident ${assignment.incidentId}.`,
          type: 'success',
          category: 'DISPATCH',
          targetRole: 'DISTRICT_OFFICER',
          incidentId: assignment.incidentId,
          assignmentId: assignment.assignmentId
        });
      },
      error: (err) => {
        console.error('Failed to complete mission', err);
        this.actionLoading = false;
        this.showFeedback('Failed to complete mission.', 'error');
      }
    });
  }

  // --- GPS POSITION TRANSMISSION (Scenario A4) ---
  transmitLocationUpdate(deltaLat: number, deltaLng: number): void {
    this.currentLat = +(this.currentLat + deltaLat).toFixed(4);
    this.currentLng = +(this.currentLng + deltaLng).toFixed(4);

    const team = this.currentTeam;
    if (!team) return;

    if (this.isEffectivelyOffline) {
      this.enqueueOfflineUpdate({
        type: 'GPS_UPDATE',
        teamId: team.teamId,
        payload: { lat: this.currentLat, lng: this.currentLng },
        summary: `GPS Coordinate Telemetry: [${this.currentLat}, ${this.currentLng}]`
      });
      return;
    }

    this.teamService.updateTeam(team._id, {
      location: {
        type: 'Point',
        coordinates: [this.currentLng, this.currentLat]
      }
    }).subscribe({
      next: () => {
        this.showFeedback(`📍 GPS Telemetry Transmitted: [${this.currentLat}, ${this.currentLng}]`, 'success');
      },
      error: (err) => {
        console.error('Failed to update location', err);
        this.showFeedback('Failed to transmit location.', 'error');
      }
    });
  }

  // --- NAVIGATION HELPERS ---
  getNavigationIncident(assignment: RescueAssignment | null): Incident | undefined {
    if (!assignment) return undefined;
    return this.incidents.find(i => i.incidentId === assignment.incidentId);
  }

  getGoogleMapsEmbedUrl(assignment: RescueAssignment): SafeResourceUrl {
    const inc = this.getNavigationIncident(assignment);
    const originLat = this.currentLat;
    const originLng = this.currentLng;
    let destLat = 7.2906;
    let destLng = 80.6337;

    if (inc?.location?.coordinates && inc.location.coordinates.length >= 2) {
      destLat = inc.location.coordinates[1];
      destLng = inc.location.coordinates[0];
    }

    const url = `https://maps.google.com/maps?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getGoogleMapsExternalUrl(assignment: RescueAssignment): string {
    const inc = this.getNavigationIncident(assignment);
    const originLat = this.currentLat;
    const originLng = this.currentLng;
    let destLat = 7.2906;
    let destLng = 80.6337;

    if (inc?.location?.coordinates && inc.location.coordinates.length >= 2) {
      destLat = inc.location.coordinates[1];
      destLng = inc.location.coordinates[0];
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  }

  getDistanceKm(assignment: RescueAssignment): number {
    const inc = this.getNavigationIncident(assignment);
    if (!inc?.location?.coordinates || inc.location.coordinates.length < 2) return 14.5;

    const lat1 = this.currentLat;
    const lon1 = this.currentLng;
    const lat2 = inc.location.coordinates[1];
    const lon2 = inc.location.coordinates[0];

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(1);
  }

  getETA(assignment: RescueAssignment): string {
    if (assignment.status === 'ON_SITE') return 'On Scene';
    if (assignment.status === 'COMPLETED') return 'Finished';
    if (assignment.status === 'CANCELLED' || assignment.status === 'REJECTED') return 'Mission Aborted';

    const dist = this.getDistanceKm(assignment);
    const mins = Math.max(4, Math.round((dist / 40) * 60));
    return `~${mins} mins (${dist} km)`;
  }

  // --- MODAL DETAILS ---
  openDetailModal(item: RescueAssignment): void {
    this.activeDetailAssignment = item;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.activeDetailAssignment = null;
  }

  // --- GENERAL HELPERS ---
  navigate(page: RescuePage): void {
    this.activePage = page;
  }

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    const name = this.user?.name || this.currentTeam?.name || 'RT';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getStatusBadgeClass(status: string): any {
    return {
      'bg-amber-100 text-amber-800 border-amber-300': status === 'ASSIGNED',
      'bg-blue-100 text-blue-800 border-blue-300': status === 'ACCEPTED',
      'bg-indigo-100 text-indigo-800 border-indigo-300': status === 'EN_ROUTE',
      'bg-purple-100 text-purple-800 border-purple-300': status === 'ON_SITE',
      'bg-emerald-100 text-emerald-800 border-emerald-300': status === 'COMPLETED',
      'bg-rose-100 text-rose-800 border-rose-300': status === 'CANCELLED' || status === 'REJECTED'
    };
  }

  showFeedback(message: string, type: 'success' | 'error' | 'warning'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => {
      if (this.feedbackMessage === message) {
        this.feedbackMessage = null;
      }
    }, 6000);
  }

  handleNotificationAction(notif: AppNotification): void {
    if (notif.incidentId || notif.assignmentId) {
      this.navigate('missions');
    }
  }
}
