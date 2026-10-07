import { Component, OnInit, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { ReportService, GroundReport } from '../../../core/services/report.service';

declare var L: any;

interface DistrictAnalytics {
  district: string;
  total: number;
  verified: number;
  pending: number;
  percentage: number;
}

@Component({
  selector: 'app-duty-officer-dashboard',
  templateUrl: './duty-officer-dashboard.component.html'
})
export class DutyOfficerDashboardComponent implements OnInit, AfterViewInit {
  user: UserProfile | null = null;
  reports: GroundReport[] = [];
  warnings: any[] = [];
  districtAnalytics: DistrictAnalytics[] = [];

  isLoading: boolean = true;

  stats = {
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    critical: 0
  };

  // Filter state
  activeTabFilter: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL' = 'PENDING';
  selectedDistrictFilter: string = 'ALL';

  districtsList = [
    'ALL', 'Kandy', 'Colombo', 'Badulla', 'Kegalle', 'Kalutara', 'Galle', 
    'Matara', 'Ratnapura', 'Kurunegala', 'Nuwara Eliya', 'Anuradhapura', 
    'Polonnaruwa', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Hambantota'
  ];

  // Leaflet & Google Map state
  selectedReportForMap: GroundReport | null = null;
  mapEmbedUrl: SafeResourceUrl | null = null;
  private leafletMap: any = null;
  private markersGroup: any = null;
  useLeafletMap: boolean = true;

  // Verification Modal state
  selectedReportForVerification: GroundReport | null = null;
  verificationMapUrl: SafeResourceUrl | null = null;
  verificationForm = {
    severity: 'HIGH',
    remarks: 'Verified after ground inspection & photo review.'
  };

  isSubmittingVerification: boolean = false;
  actionSuccessMessage: string = '';
  actionErrorMessage: string = '';

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initLeafletMap();
    }, 500);
  }

  loadData(): void {
    this.isLoading = true;

    // 1. Fetch all ground hazard reports
    this.reportService.getReports().subscribe({
      next: (data) => {
        this.reports = data || [];
        this.calculateStats();
        this.calculateDistrictAnalytics();
        this.updateOverallMapUrl();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching reports:', err);
        this.isLoading = false;
      }
    });

    // 2. Fetch warnings (if any)
    this.reportService.getWarnings().subscribe({
      next: (data) => {
        this.warnings = data || [];
      },
      error: (err) => console.warn('Error fetching warnings:', err)
    });
  }

  calculateStats(): void {
    const total = this.reports.length;
    const pending = this.reports.filter(r => r.status === 'PENDING').length;
    const verified = this.reports.filter(r => r.status === 'VERIFIED').length;
    const rejected = this.reports.filter(r => r.status === 'REJECTED').length;
    const critical = this.reports.filter(r => r.status === 'VERIFIED' && r.severity === 'CRITICAL').length;

    this.stats = { total, pending, verified, rejected, critical };
  }

  calculateDistrictAnalytics(): void {
    const map = new Map<string, { total: number; verified: number; pending: number }>();

    for (const r of this.reports) {
      const dist = r.district || 'Unassigned';
      if (!map.has(dist)) {
        map.set(dist, { total: 0, verified: 0, pending: 0 });
      }
      const entry = map.get(dist)!;
      entry.total += 1;
      if (r.status === 'VERIFIED') entry.verified += 1;
      if (r.status === 'PENDING') entry.pending += 1;
    }

    const totalVerified = this.stats.verified || 1;
    const analytics: DistrictAnalytics[] = [];

    map.forEach((val, key) => {
      const percentage = Math.min(100, Math.round((val.verified / totalVerified) * 100));
      analytics.push({
        district: key,
        total: val.total,
        verified: val.verified,
        pending: val.pending,
        percentage
      });
    });

    analytics.sort((a, b) => b.verified - a.verified);
    this.districtAnalytics = analytics;
  }

  get filteredReports(): GroundReport[] {
    return this.reports.filter(r => {
      const matchesTab = this.activeTabFilter === 'ALL' ? true : r.status === this.activeTabFilter;
      const matchesDistrict = this.selectedDistrictFilter === 'ALL' ? true : r.district === this.selectedDistrictFilter;
      return matchesTab && matchesDistrict;
    });
  }

  get reportsWithCoords(): GroundReport[] {
    return this.reports.filter(r => this.getCoords(r) !== null);
  }

  get verifiedReportsWithCoords(): GroundReport[] {
    return this.reports.filter(r => r.status === 'VERIFIED' && this.getCoords(r) !== null);
  }

  updateOverallMapUrl(): void {
    const valid = this.reportsWithCoords;
    let mapQuery = 'Sri Lanka';

    if (valid.length > 0) {
      const first = valid[0];
      const coords = this.getCoords(first);
      if (coords) {
        mapQuery = `${coords.lat},${coords.lng}`;
      } else {
        mapQuery = encodeURIComponent(`${first.district}, Sri Lanka`);
      }
    }

    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=8&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

    setTimeout(() => {
      this.initLeafletMap();
    }, 200);
  }

  initLeafletMap(): void {
    if (typeof L === 'undefined') {
      this.useLeafletMap = false;
      return;
    }

    const container = document.getElementById('sriLankaMultiPinMap');
    if (!container) return;

    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }

    try {
      // Center map over Sri Lanka [lat: 7.8731, lng: 80.7718] zoom level 8
      this.leafletMap = L.map('sriLankaMultiPinMap').setView([7.8731, 80.7718], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.leafletMap);

      this.markersGroup = L.layerGroup().addTo(this.leafletMap);
      this.renderAllIncidentMarkers();
    } catch (e) {
      console.warn('Leaflet initialization warning:', e);
      this.useLeafletMap = false;
    }
  }

  renderAllIncidentMarkers(): void {
    if (!this.leafletMap || !this.markersGroup || typeof L === 'undefined') return;

    this.markersGroup.clearLayers();

    const validReports = this.reportsWithCoords;

    for (const rep of validReports) {
      const coords = this.getCoords(rep);
      if (!coords) continue;

      let pinColor = '#3b82f6'; // Low / Blue
      if (rep.severity === 'CRITICAL') pinColor = '#ef4444'; // Red
      else if (rep.severity === 'HIGH') pinColor = '#f97316'; // Orange
      else if (rep.severity === 'MEDIUM') pinColor = '#f59e0b'; // Amber
      else if (rep.status === 'PENDING') pinColor = '#8b5cf6'; // Purple for Pending

      const iconHtml = `
        <div style="
          background-color: ${pinColor};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          color: white;
          cursor: pointer;
        ">
          ⚠️
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: iconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const repNum = this.getReportNumber(rep);
      const locStr = rep.address || rep.district + ' District';

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 220px; color: #0f172a;">
          <div style="font-weight: bold; font-size: 13px; color: #1e293b;">#${repNum} • ${rep.hazardType}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">📍 ${locStr}</div>
          <div style="font-size: 10px; margin-top: 4px; font-weight: bold; color: ${pinColor}; uppercase;">
            Status: ${rep.status} ${rep.severity ? '• ' + rep.severity : ''}
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 6px; background: #f1f5f9; padding: 6px; rounded: 6px;">
            "${rep.description.substring(0, 75)}..."
          </div>
        </div>
      `;

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
        .bindPopup(popupHtml);

      this.markersGroup.addLayer(marker);
    }
  }

  selectReportForMap(report: GroundReport): void {
    this.selectedReportForMap = report;
    const coords = this.getCoords(report);

    if (coords && this.leafletMap) {
      this.leafletMap.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }

    let mapQuery = '';
    if (coords) {
      mapQuery = `${coords.lat},${coords.lng}`;
    } else {
      mapQuery = encodeURIComponent(`${report.address || report.district || 'Sri Lanka'}, Sri Lanka`);
    }

    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  openVerificationModal(report: GroundReport): void {
    this.selectedReportForVerification = report;
    this.verificationForm.severity = report.severity || 'HIGH';
    this.verificationForm.remarks = report.verificationRemarks || 'Verified after ground inspection & photo review.';
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const coords = this.getCoords(report);
    let mapQuery = '';
    if (coords) {
      mapQuery = `${coords.lat},${coords.lng}`;
    } else {
      mapQuery = encodeURIComponent(`${report.address || report.district || 'Kandy'}, Sri Lanka`);
    }
    const rawUrl = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;
    this.verificationMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  closeVerificationModal(): void {
    this.selectedReportForVerification = null;
    this.verificationMapUrl = null;
  }

  confirmVerifyReport(): void {
    if (!this.selectedReportForVerification) return;

    this.isSubmittingVerification = true;
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const payload = {
      severity: this.verificationForm.severity,
      remarks: this.verificationForm.remarks
    };

    this.reportService.verifyReport(this.selectedReportForVerification._id, payload).subscribe({
      next: (updated) => {
        this.isSubmittingVerification = false;
        this.actionSuccessMessage = `Report #${this.getReportNumber(updated)} verified successfully as ${updated.severity || payload.severity}!`;
        setTimeout(() => {
          this.closeVerificationModal();
          this.loadData();
        }, 1200);
      },
      error: (err) => {
        this.isSubmittingVerification = false;
        this.actionErrorMessage = err.error?.message || 'Failed to verify report. Please try again.';
      }
    });
  }

  confirmRejectReport(): void {
    if (!this.selectedReportForVerification) return;

    if (!this.verificationForm.remarks) {
      this.actionErrorMessage = 'Please provide rejection remarks/reason.';
      return;
    }

    this.isSubmittingVerification = true;
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const payload = {
      remarks: this.verificationForm.remarks
    };

    this.reportService.rejectReport(this.selectedReportForVerification._id, payload).subscribe({
      next: (updated) => {
        this.isSubmittingVerification = false;
        this.actionSuccessMessage = `Report #${this.getReportNumber(updated)} marked as REJECTED.`;
        setTimeout(() => {
          this.closeVerificationModal();
          this.loadData();
        }, 1200);
      },
      error: (err) => {
        this.isSubmittingVerification = false;
        this.actionErrorMessage = err.error?.message || 'Failed to reject report.';
      }
    });
  }

  getCoords(report: GroundReport): { lat: number; lng: number } | null {
    if (!report) return null;
    if (report.latitude && report.longitude) {
      return { lat: report.latitude, lng: report.longitude };
    }
    if (report.location?.coordinates && report.location.coordinates.length === 2) {
      return { lat: report.location.coordinates[1], lng: report.location.coordinates[0] };
    }
    return null;
  }

  getReportNumber(report: GroundReport): string {
    if (!report) return '';
    return report.reportId || report.reportNumber || ('REP-' + report._id.substring(report._id.length - 6).toUpperCase());
  }

  getSeverityBadgeClass(severity?: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'REJECTED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
