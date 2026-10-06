import { Component, OnInit } from '@angular/core';
import { WarningService } from '../../../core/services/warning.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HazardWarning, WarningLevel, WarningStatus } from '../../../core/models/warning.model';
import { NotificationLog } from '../../../core/models/notification-log.model';

@Component({
  selector: 'app-active-warnings',
  templateUrl: './active-warnings.component.html',
  styles: [],
})
export class ActiveWarningsComponent implements OnInit {
  warnings: HazardWarning[] = [];
  loading = false;

  // Drawer progressive disclosure state
  selectedWarning: HazardWarning | null = null;
  isDrawerOpen = false;
  notificationLogs: NotificationLog[] = [];
  logsLoading = false;

  // Escalation Modal state
  isEscalateModalOpen = false;
  escalatingWarning: HazardWarning | null = null;
  newWarningLevel: WarningLevel = WarningLevel.EMERGENCY;
  updatedMessage = '';
  updatedInstructions = '';
  escalationReason = '';
  escalating = false;

  warningLevels = [WarningLevel.ADVISORY, WarningLevel.WATCH, WarningLevel.WARNING, WarningLevel.EMERGENCY];

  constructor(
    private warningService: WarningService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadActiveWarnings();
  }

  loadActiveWarnings(): void {
    this.loading = true;
    this.warningService.getWarnings().subscribe({
      next: (data) => {
        this.warnings = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showError('Failed to Load Warnings', err.message);
      },
    });
  }

  openDrawer(warning: HazardWarning): void {
    this.selectedWarning = warning;
    this.isDrawerOpen = true;
    this.loadLogs(warning._id || warning.warningId);
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedWarning = null;
    this.notificationLogs = [];
  }

  loadLogs(warningId: string): void {
    this.logsLoading = true;
    this.warningService.getNotificationLogs(warningId).subscribe({
      next: (logs) => {
        this.notificationLogs = logs;
        this.logsLoading = false;
      },
      error: () => {
        this.logsLoading = false;
      },
    });
  }

  openEscalateModal(warning: HazardWarning, event: Event): void {
    event.stopPropagation();
    this.escalatingWarning = warning;
    this.newWarningLevel = WarningLevel.EMERGENCY;
    this.updatedMessage = `[ESCALATED ALERT]: ${warning.message}`;
    this.updatedInstructions = warning.emergencyInstructions;
    this.escalationReason = 'Rapid deterioration of environmental weather parameters.';
    this.isEscalateModalOpen = true;
  }

  closeEscalateModal(): void {
    this.isEscalateModalOpen = false;
    this.escalatingWarning = null;
  }

  submitEscalation(): void {
    if (!this.escalatingWarning) return;

    this.escalating = true;
    const dto = {
      newWarningLevel: this.newWarningLevel,
      updatedMessage: this.updatedMessage,
      updatedInstructions: this.updatedInstructions,
      escalationReason: this.escalationReason,
    };

    this.warningService.escalateWarning(this.escalatingWarning._id || this.escalatingWarning.warningId, dto).subscribe({
      next: (updated) => {
        this.escalating = false;
        this.notificationService.showSuccess('Warning Escalated!', `Warning ${updated.warningId} escalated to ${this.newWarningLevel}. Broadcast triggered.`);
        this.closeEscalateModal();
        this.loadActiveWarnings();
      },
      error: (err) => {
        this.escalating = false;
        this.notificationService.showError('Escalation Failed', err.message);
      },
    });
  }

  cancelWarning(warning: HazardWarning, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to resolve/cancel Warning ${warning.warningId}?`)) {
      return;
    }

    this.warningService.cancelWarning(warning._id || warning.warningId, 'Hazard condition resolved').subscribe({
      next: () => {
        this.notificationService.showInfo('Warning Cancelled', `Warning ${warning.warningId} marked as CANCELLED.`);
        this.loadActiveWarnings();
      },
      error: (err) => {
        this.notificationService.showError('Failed to Cancel', err.message);
      },
    });
  }

  getLevelBadgeClass(level: string): string {
    switch (level) {
      case 'Emergency': return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'Warning': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Watch': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'Advisory': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  getChannelProgressPercentage(metric: any): number {
    if (!metric || !metric.targetRecipientCount) return 0;
    return Math.round((metric.deliveredCount / metric.targetRecipientCount) * 100);
  }
}
