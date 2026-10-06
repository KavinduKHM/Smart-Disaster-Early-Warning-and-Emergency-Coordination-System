import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { WarningService } from '../../../core/services/warning.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Hazard } from '../../../core/models/hazard.model';
import { WarningLevel, NotificationChannel } from '../../../core/models/warning.model';

@Component({
  selector: 'app-create-warning',
  templateUrl: './create-warning.component.html',
  styles: [],
})
export class CreateWarningComponent implements OnInit {
  @Input() preselectedHazardId?: string;
  @Output() warningCreated = new EventEmitter<void>();

  currentStep = 1;
  hazards: Hazard[] = [];
  loading = false;
  issuing = false;

  // Step 1: Hazard Selection
  selectedHazardId = '';
  selectedHazard: Hazard | null = null;

  // Step 2: Target Area (Districts & River Basins)
  allDistricts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
    'Moneragala', 'Ratnapura', 'Kegalle'
  ];

  allRiverBasins = [
    'Kelani River Basin',
    'Mahaweli River Basin',
    'Kalu Ganga River Basin',
    'Gin Ganga River Basin',
    'Nilwala River Basin',
    'Deduru Oya River Basin',
    'Walawe River Basin',
    'Yan Oya River Basin',
  ];

  selectedDistricts: string[] = ['Colombo', 'Gampaha'];
  selectedRiverBasins: string[] = ['Kelani River Basin'];

  // Step 3: Warning Details
  warningLevel: WarningLevel = WarningLevel.WARNING;
  message = 'HEAVY FLOOD RISK: Kelani River water levels rising rapidly. Residents in low-lying zones must prepare for evacuation.';
  emergencyInstructions = 'Move to higher ground immediately. Keep emergency kits ready and follow DMC safety officer directives.';

  warningLevels = [
    { level: WarningLevel.ADVISORY, color: 'border-blue-500 bg-blue-500/10 text-blue-400', desc: 'Awareness alert for potential hazard' },
    { level: WarningLevel.WATCH, color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400', desc: 'Conditions favorable for hazard development' },
    { level: WarningLevel.WARNING, color: 'border-orange-500 bg-orange-500/10 text-orange-400', desc: 'Imminent threat requiring urgent prep' },
    { level: WarningLevel.EMERGENCY, color: 'border-red-500 bg-red-500/10 text-red-400', desc: 'Severe active danger - Evacuate immediately' },
  ];

  // Step 4: Channels Selection
  channels: { key: NotificationChannel; label: string; desc: string; selected: boolean }[] = [
    { key: NotificationChannel.PUSH, label: 'Mobile Push Notification', desc: 'High-priority alert banner sent to mobile devices', selected: true },
    { key: NotificationChannel.SMS, label: 'SMS Gateway Broadcast', desc: 'Cellular text message sent to registered phones in target zone', selected: true },
    { key: NotificationChannel.AUDIBLE, label: 'Audible Siren Alert', desc: 'Activates high-decibel area sirens & loud sound override', selected: true },
  ];

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
      next: (hazards) => {
        this.hazards = hazards;
        this.loading = false;
        if (this.preselectedHazardId) {
          this.selectedHazardId = this.preselectedHazardId;
          this.onHazardSelect();
        } else if (hazards.length > 0) {
          this.selectedHazardId = hazards[0]._id || hazards[0].id || '';
          this.onHazardSelect();
        }
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showError('Error Loading Hazards', err.message);
      },
    });
  }

  onHazardSelect(): void {
    this.selectedHazard = this.hazards.find((h) => (h._id || h.id) === this.selectedHazardId) || null;
    if (this.selectedHazard) {
      if (this.selectedHazard.district && !this.selectedDistricts.includes(this.selectedHazard.district)) {
        this.selectedDistricts = [...this.selectedDistricts, this.selectedHazard.district];
      }
      if (this.selectedHazard.riverBasin && !this.selectedRiverBasins.includes(this.selectedHazard.riverBasin)) {
        this.selectedRiverBasins = [...this.selectedRiverBasins, this.selectedHazard.riverBasin];
      }
    }
  }

  toggleDistrict(district: string): void {
    if (this.selectedDistricts.includes(district)) {
      this.selectedDistricts = this.selectedDistricts.filter((d) => d !== district);
    } else {
      this.selectedDistricts = [...this.selectedDistricts, district];
    }
  }

  toggleRiverBasin(basin: string): void {
    if (this.selectedRiverBasins.includes(basin)) {
      this.selectedRiverBasins = this.selectedRiverBasins.filter((b) => b !== basin);
    } else {
      this.selectedRiverBasins = [...this.selectedRiverBasins, basin];
    }
  }

  toggleChannel(channelKey: NotificationChannel): void {
    const ch = this.channels.find((c) => c.key === channelKey);
    if (ch) {
      ch.selected = !ch.selected;
    }
  }

  getSelectedChannels(): NotificationChannel[] {
    return this.channels.filter((c) => c.selected).map((c) => c.key);
  }

  goToStep(step: number): void {
    if (step === 2 && !this.selectedHazardId) {
      this.notificationService.showWarning('Select Hazard', 'Please select a linked hazard first.');
      return;
    }
    if (step === 3 && this.selectedDistricts.length === 0 && this.selectedRiverBasins.length === 0) {
      this.notificationService.showWarning('Select Target Zone', 'Select at least one targeted district or river basin.');
      return;
    }
    if (step === 4 && (!this.message || !this.emergencyInstructions)) {
      this.notificationService.showWarning('Complete Details', 'Please fill in warning message and emergency instructions.');
      return;
    }
    if (step === 5 && this.getSelectedChannels().length === 0) {
      this.notificationService.showWarning('Select Channels', 'Please select at least one alert delivery channel.');
      return;
    }

    this.currentStep = step;
  }

  submitIssueWarning(): void {
    if (this.getSelectedChannels().length === 0) {
      this.notificationService.showWarning('Channel Required', 'Please select at least one notification channel.');
      return;
    }

    this.issuing = true;
    const dto = {
      hazardId: this.selectedHazardId,
      warningLevel: this.warningLevel,
      message: this.message,
      emergencyInstructions: this.emergencyInstructions,
      affectedDistricts: this.selectedDistricts,
      affectedRiverBasins: this.selectedRiverBasins,
      notificationChannels: this.getSelectedChannels(),
    };

    this.warningService.issueWarning(dto).subscribe({
      next: (res) => {
        this.issuing = false;
        this.notificationService.showSuccess(
          'Warning Issued & Broadcasted!',
          `Alert broadcasted to ${res.broadcastSummary?.recipientCount || 0} targeted citizens across ${dto.notificationChannels.join(', ')} channels.`
        );
        this.warningCreated.emit();
      },
      error: (err) => {
        this.issuing = false;
        this.notificationService.showError('Issue Warning Failed', err.message || 'Server error occurred');
      },
    });
  }
}
