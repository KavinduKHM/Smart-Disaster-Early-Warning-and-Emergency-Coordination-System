import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { ReportService, GroundReport, ReliefShelter } from '../../../core/services/report.service';

@Component({
  selector: 'app-citizen-home',
  templateUrl: './citizen-home.component.html'
})
export class CitizenHomeComponent implements OnInit {
  user: UserProfile | null = null;
  myReports: GroundReport[] = [];
  districtReports: GroundReport[] = [];
  shelters: ReliefShelter[] = [];
  
  stats = {
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  };

  isLoading: boolean = true;
  isSafeBeaconActive: boolean = false;
  selectedReport: GroundReport | null = null;
  selectedReportMapUrl: SafeResourceUrl | null = null;
  activeCardFilter: 'VERIFIED' | 'PENDING' | 'MY_REPORTS' | 'SHELTERS' | null = null;

  // New Hazard Report Modal Form State
  showCreateModal: boolean = false;
  isSubmittingReport: boolean = false;
  isFetchingLocation: boolean = false;
  createReportErrorMessage: string = '';
  createReportSuccessMessage: string = '';
  newReportMapUrl: SafeResourceUrl | null = null;

  newReport = {
    hazardType: 'FLOOD',
    description: '',
    address: 'Peradeniya Main Rd, Gatambe',
    latitude: 7.2906,
    longitude: 80.6337,
    district: 'Kandy',
    photos: [] as string[]
  };

  hazardTypes = [
    { value: 'FLOOD', label: '🌊 Flood Inundation' },
    { value: 'LANDSLIDE', label: '⛰️ Slope Slippage / Landslide' },
    { value: 'ROAD_BLOCKAGE', label: '🚧 Road Debris Blockage' },
    { value: 'RISING_RIVER', label: '📈 Rising River Threshold' },
    { value: 'FALLEN_TREE', label: '🌳 Fallen Tree / Infrastructure' },
    { value: 'BUILDING_DAMAGE', label: '🏠 Structural Building Damage' },
    { value: 'FIRE', label: '🔥 Fire Emergency' },
    { value: 'OTHER', label: '⚠️ Other Hazard' }
  ];

  districts = [
    'Kandy', 'Colombo', 'Badulla', 'Kegalle', 'Kalutara', 'Galle', 
    'Matara', 'Ratnapura', 'Kurunegala', 'Nuwara Eliya', 'Anuradhapura', 
    'Polonnaruwa', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Hambantota'
  ];

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    if (this.user?.district) {
      this.newReport.district = this.user.district;
    }
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    const district = this.user?.district || 'Kandy';

    // 1. Fetch citizen's own reports from DB
    this.reportService.getMyReports().subscribe({
      next: (res) => {
        this.myReports = res || [];
      },
      error: (err) => console.error('Error loading my reports:', err)
    });

    // 2. Fetch district hazard reports from DB
    this.reportService.getReports(district).subscribe({
      next: (res) => {
        this.districtReports = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading district reports:', err);
        this.isLoading = false;
      }
    });

    // 3. Fetch report stats for district from DB
    this.reportService.getReportStats(district).subscribe({
      next: (res) => {
        if (res) {
          this.stats = {
            total: res.total || 0,
            pending: res.pending || 0,
            verified: res.verified || 0,
            rejected: res.rejected || 0
          };
        }
      },
      error: (err) => console.error('Error loading report stats:', err)
    });

    // 4. Fetch relief shelters from DB
    this.reportService.getShelters(district).subscribe({
      next: (res) => {
        this.shelters = res || [];
      },
      error: (err) => console.error('Error loading shelters:', err)
    });
  }

  get verifiedIncidentsList(): GroundReport[] {
    return this.districtReports.filter(r => r.status === 'VERIFIED');
  }

  get myPendingReportsList(): GroundReport[] {
    return this.myReports.filter(r => r.status === 'PENDING');
  }

  getReportNumber(report: GroundReport): string {
    if (!report) return '';
    return report.reportId || report.reportNumber || ('REP-' + report._id.substring(report._id.length - 6).toUpperCase());
  }

  getReportLocation(report: GroundReport): string {
    if (!report) return '';
    return report.address || report.locationName || (report.district + ' District');
  }

  getReportCoords(report: GroundReport): { lat: number; lng: number } | null {
    if (!report) return null;
    if (report.latitude && report.longitude) {
      return { lat: report.latitude, lng: report.longitude };
    }
    if (report.location?.coordinates && report.location.coordinates.length === 2) {
      return { lat: report.location.coordinates[1], lng: report.location.coordinates[0] };
    }
    return null;
  }

  // --- LODGE NEW REPORT MODAL LOGIC ---
  openCreateReportModal(): void {
    this.showCreateModal = true;
    this.createReportErrorMessage = '';
    this.createReportSuccessMessage = '';
    this.updateCreateReportMapUrl();
  }

  closeCreateReportModal(): void {
    this.showCreateModal = false;
  }

  districtCoordsMap: { [key: string]: { lat: number; lng: number } } = {
    'Kandy': { lat: 7.2906, lng: 80.6337 },
    'Colombo': { lat: 6.9271, lng: 79.8612 },
    'Badulla': { lat: 6.9934, lng: 81.0550 },
    'Kegalle': { lat: 7.2513, lng: 80.3464 },
    'Kalutara': { lat: 6.5854, lng: 79.9607 },
    'Galle': { lat: 6.0535, lng: 80.2210 },
    'Matara': { lat: 5.9549, lng: 80.5550 },
    'Ratnapura': { lat: 6.6828, lng: 80.3992 },
    'Kurunegala': { lat: 7.4863, lng: 80.3623 },
    'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
    'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
    'Polonnaruwa': { lat: 7.9403, lng: 81.0188 },
    'Jaffna': { lat: 9.6615, lng: 80.0255 },
    'Batticaloa': { lat: 7.7310, lng: 81.6747 },
    'Trincomalee': { lat: 8.5874, lng: 81.2152 },
    'Hambantota': { lat: 6.1246, lng: 81.1185 }
  };

  fetchUserCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.createReportErrorMessage = 'Geolocation is not supported by your browser.';
      return;
    }

    this.isFetchingLocation = true;
    this.createReportErrorMessage = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.newReport.latitude = parseFloat(position.coords.latitude.toFixed(6));
        this.newReport.longitude = parseFloat(position.coords.longitude.toFixed(6));
        this.isFetchingLocation = false;
        this.detectDistrictFromCoords(this.newReport.latitude, this.newReport.longitude);
        this.updateCreateReportMapUrl();
      },
      (error) => {
        this.isFetchingLocation = false;
        console.warn('Geolocation error:', error);
        this.createReportErrorMessage = 'Could not fetch current GPS location. Default coordinates set.';
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  detectDistrictFromCoords(lat: number, lng: number): void {
    if (!lat || !lng) return;

    let closestDistrict = 'Kandy';
    let minDistance = Infinity;

    for (const d of this.districts) {
      const coords = this.districtCoordsMap[d];
      if (coords) {
        const dist = Math.hypot(coords.lat - lat, coords.lng - lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestDistrict = d;
        }
      }
    }

    this.newReport.district = closestDistrict;

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const placeName = (addr.state_district || addr.district || addr.county || addr.city || addr.state || '').toLowerCase();
          
          const matchedDistrict = this.districts.find(d => placeName.includes(d.toLowerCase()));
          if (matchedDistrict) {
            this.newReport.district = matchedDistrict;
          }
        }
      })
      .catch(err => console.warn('Reverse geocoding error:', err));
  }

  updateCreateReportMapUrl(): void {
    const rawUrl = `https://maps.google.com/maps?q=${this.newReport.latitude},${this.newReport.longitude}&z=15&output=embed`;
    this.newReportMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    this.detectDistrictFromCoords(this.newReport.latitude, this.newReport.longitude);
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.newReport.photos = [reader.result as string];
      }
    };
    reader.readAsDataURL(file);
  }

  submitNewReport(): void {
    if (!this.newReport.description || !this.newReport.hazardType) {
      this.createReportErrorMessage = 'Please select a hazard type and provide a description.';
      return;
    }

    this.isSubmittingReport = true;
    this.createReportErrorMessage = '';
    this.createReportSuccessMessage = '';

    const payload = {
      hazardType: this.newReport.hazardType,
      description: this.newReport.description,
      address: this.newReport.address,
      district: this.newReport.district,
      latitude: Number(this.newReport.latitude),
      longitude: Number(this.newReport.longitude),
      photos: this.newReport.photos
    };

    this.reportService.createReport(payload).subscribe({
      next: (res) => {
        this.isSubmittingReport = false;
        this.createReportSuccessMessage = `Report #${this.getReportNumber(res)} lodged successfully! Sent for Duty Officer triage.`;
        setTimeout(() => {
          this.closeCreateReportModal();
          this.loadData();
        }, 1200);
      },
      error: (err) => {
        this.isSubmittingReport = false;
        this.createReportErrorMessage = err.error?.message || 'Failed to submit report. Please check required fields.';
      }
    });
  }

  // --- INCIDENT DETAILS & FILTER MODALS ---
  openReportModal(report: GroundReport): void {
    this.selectedReport = report;
    const coords = this.getReportCoords(report);
    let mapQuery = '';
    if (coords) {
      mapQuery = `${coords.lat},${coords.lng}`;
    } else {
      const locName = this.getReportLocation(report);
      mapQuery = encodeURIComponent(`${locName}, ${report.district || 'Kandy'}, Sri Lanka`);
    }
    
    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
    this.selectedReportMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  closeReportModal(): void {
    this.selectedReport = null;
    this.selectedReportMapUrl = null;
  }

  openCardFilterModal(type: 'VERIFIED' | 'PENDING' | 'MY_REPORTS' | 'SHELTERS'): void {
    this.activeCardFilter = type;
  }

  closeCardFilterModal(): void {
    this.activeCardFilter = null;
  }

  toggleSafeBeacon(): void {
    this.isSafeBeaconActive = !this.isSafeBeaconActive;
  }

  logout(): void {
    this.authService.logout();
  }
}
