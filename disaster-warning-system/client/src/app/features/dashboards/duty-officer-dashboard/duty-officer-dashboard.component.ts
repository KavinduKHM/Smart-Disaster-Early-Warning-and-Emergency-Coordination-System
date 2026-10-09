import { Component, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
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
  @Output() raiseAlertForReport = new EventEmitter<GroundReport>();
  @Output() goToHazardReports = new EventEmitter<void>();

  user: UserProfile | null = null;
  reports: GroundReport[] = [];
  warnings: any[] = [];
  districtAnalytics: DistrictAnalytics[] = [];

  isLoading: boolean = true;

  // Filter state
  activeTabFilter: 'PENDING' | 'VERIFIED' | 'CRITICAL' | 'REJECTED' | 'ALL' = 'PENDING';
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

  // PDF Modal state
  showPdfModal: boolean = false;
  pdfGeneratedDate: Date = new Date();

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

  openPdfModal(): void {
    this.pdfGeneratedDate = new Date();
    this.showPdfModal = true;
  }

  closePdfModal(): void {
    this.showPdfModal = false;
  }

  downloadPrintPdf(): void {
    window.print();
  }

  constructor(
    private authService: AuthService,
    private reportService: ReportService,
    private sanitizer: DomSanitizer
  ) { }

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
        const res = data as any;
        this.reports = Array.isArray(res) ? res : (res && res.data && Array.isArray(res.data) ? res.data : []);
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

  onGoToHazardReports(): void {
    this.goToHazardReports.emit();
  }

  get districtReports(): GroundReport[] {
    if (!this.selectedDistrictFilter || this.selectedDistrictFilter === 'ALL') {
      return this.reports;
    }
    const target = this.selectedDistrictFilter.trim().toLowerCase();
    return this.reports.filter(r => {
      if (!r.district) return false;
      return r.district.trim().toLowerCase() === target;
    });
  }

  get stats() {
    const list = this.districtReports;
    const total = list.length;
    const pending = list.filter(r => r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION').length;
    const verified = list.filter(r => r.status === 'VERIFIED').length;
    const rejected = list.filter(r => r.status === 'REJECTED').length;
    const critical = list.filter(r => (r.status === 'VERIFIED' || r.status === 'PENDING') && r.severity === 'CRITICAL').length;
    return { total, pending, verified, rejected, critical };
  }

  get filteredReports(): GroundReport[] {
    const list = this.districtReports;
    return list.filter(r => {
      if (this.activeTabFilter === 'ALL') return true;
      if (this.activeTabFilter === 'PENDING') return r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION';
      if (this.activeTabFilter === 'VERIFIED') return r.status === 'VERIFIED';
      if (this.activeTabFilter === 'CRITICAL') return r.severity === 'CRITICAL';
      if (this.activeTabFilter === 'REJECTED') return r.status === 'REJECTED';
      return true;
    });
  }

  onDistrictChange(newDistrict: string): void {
    this.selectedDistrictFilter = newDistrict;
    const list = this.districtReports;
    if (this.activeTabFilter === 'PENDING') {
      const pendingCount = list.filter(r => r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION').length;
      if (pendingCount === 0 && list.length > 0) {
        const verifiedCount = list.filter(r => r.status === 'VERIFIED').length;
        this.activeTabFilter = verifiedCount > 0 ? 'VERIFIED' : 'ALL';
      }
    }
    this.focusMapOnDistrict(newDistrict);
    this.renderAllIncidentMarkers();
  }

  focusMapOnDistrict(district: string): void {
    if (!this.leafletMap) return;
    if (!district || district === 'ALL') {
      this.leafletMap.flyTo([7.8731, 80.7718], 8, { duration: 1.0 });
      return;
    }
    const distReports = this.reports.filter(r => 
      r.district && r.district.toLowerCase() === district.toLowerCase() && this.getCoords(r) !== null
    );
    if (distReports.length > 0) {
      const coords = this.getCoords(distReports[0]);
      if (coords) {
        this.leafletMap.flyTo([coords.lat, coords.lng], 12, { duration: 1.2 });
        return;
      }
    }
    const districtCoords: { [key: string]: [number, number] } = {
      colombo: [6.9271, 79.8612],
      kandy: [7.2906, 80.6337],
      galle: [6.0535, 80.2210],
      kalutara: [6.5854, 79.9607],
      badulla: [6.9934, 81.0550],
      kegalle: [7.2513, 80.3464],
      matara: [5.9549, 80.5550],
      ratnapura: [6.6828, 80.4034],
      kurunegala: [7.4863, 80.3623],
      'nuwara eliya': [6.9497, 80.7891],
      anuradhapura: [8.3114, 80.4037],
      polonnaruwa: [7.9403, 81.0188],
      jaffna: [9.6615, 80.0255],
      batticaloa: [7.7310, 81.6747],
      trincomalee: [8.5874, 81.2152],
      hambantota: [6.1429, 81.1212]
    };
    const center = districtCoords[district.toLowerCase()];
    if (center) {
      this.leafletMap.flyTo(center, 11, { duration: 1.2 });
    }
  }

  focusOnReport(report: GroundReport, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.selectedReportForMap = report;
    const coords = this.getCoords(report);
    if (coords && this.leafletMap) {
      this.leafletMap.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
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
      if (r.status === 'PENDING' || r.status === 'PENDING_VERIFICATION') entry.pending += 1;
    }

    const totalVerified = this.reports.filter(r => r.status === 'VERIFIED').length || 1;
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
      // Center map over Sri Lanka [lat: 7.8731, lng: 80.7718] zoom level 7.5
      this.leafletMap = L.map('sriLankaMultiPinMap').setView([7.8731, 80.7718], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(this.leafletMap);

      this.markersGroup = L.layerGroup().addTo(this.leafletMap);
      this.renderAllIncidentMarkers();

      setTimeout(() => {
        if (this.leafletMap) this.leafletMap.invalidateSize();
      }, 400);
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

      let pinColor = '#10B981'; // Verified default: emerald
      if (rep.severity === 'CRITICAL') pinColor = '#EF4444'; // Red
      else if (rep.severity === 'HIGH') pinColor = '#F97316'; // Orange
      else if (rep.severity === 'MEDIUM') pinColor = '#F59E0B'; // Amber
      if (rep.status === 'PENDING' || rep.status === 'PENDING_VERIFICATION') pinColor = '#8B5CF6'; // Purple for Pending
      else if (rep.status === 'REJECTED') pinColor = '#64748B'; // Slate

      const isDistrictMatch = !this.selectedDistrictFilter || this.selectedDistrictFilter === 'ALL' || 
        (rep.district && rep.district.toLowerCase() === this.selectedDistrictFilter.toLowerCase());

      const pinSize = isDistrictMatch ? 30 : 22;
      const borderSize = isDistrictMatch ? 3 : 2;

      const iconHtml = `
        <div style="
          background-color: ${pinColor};
          width: ${pinSize}px;
          height: ${pinSize}px;
          border-radius: 50%;
          border: ${borderSize}px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isDistrictMatch ? '14px' : '10px'};
          color: white;
          cursor: pointer;
        ">
          ${rep.status === 'VERIFIED' ? '✅' : '⚠️'}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: iconHtml,
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize / 2]
      });

      const repNum = this.getReportNumber(rep);
      const locStr = rep.address || (rep.district + ' District');

      const popupHtml = `
        <div style="font-family: Inter, sans-serif; padding: 4px; max-width: 230px; color: #0B192C;">
          <div style="font-weight: 700; font-size: 13px; color: #0B192C;">#${repNum} • ${rep.hazardType}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">📍 ${locStr}</div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;">
              ${rep.status}
            </span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;">
              ${rep.severity || 'HIGH'}
            </span>
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 8px; background: #F8FAFC; padding: 6px; border-radius: 6px; border: 1px solid #E2E8F0;">
            "${(rep.description || '').substring(0, 75)}..."
          </div>
        </div>
      `;

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
        .bindPopup(popupHtml);

      marker.on('click', () => {
        this.selectedReportForMap = rep;
      });

      this.markersGroup.addLayer(marker);
    }
  }

  selectReportForMap(report: GroundReport): void {
    this.focusOnReport(report);
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

  confirmVerifyReport(launchAlert: boolean = false): void {
    if (!this.selectedReportForVerification) return;

    this.isSubmittingVerification = true;
    this.actionSuccessMessage = '';
    this.actionErrorMessage = '';

    const targetReport = this.selectedReportForVerification;
    const payload = {
      severity: this.verificationForm.severity,
      remarks: this.verificationForm.remarks
    };

    this.reportService.verifyReport(targetReport._id, payload).subscribe({
      next: (updated) => {
        this.isSubmittingVerification = false;
        this.activeTabFilter = 'VERIFIED';
        this.actionSuccessMessage = `Report #${this.getReportNumber(updated)} verified successfully as ${updated.severity || payload.severity}!`;
        setTimeout(() => {
          this.closeVerificationModal();
          this.loadData();
          if (launchAlert) {
            this.onRaiseAlert(updated);
          }
        }, 1000);
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

  onRaiseAlert(report: GroundReport): void {
    if (this.selectedReportForVerification) {
      this.closeVerificationModal();
    }
    this.raiseAlertForReport.emit(report);
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

  getReportNumber(report: any): string {
    if (!report) return '';
    if (report.reportId) return report.reportId;
    if (report.reportNumber) return report.reportNumber;
    const id = report._id || report.id || '';
    if (typeof id === 'string' && id.length > 0) {
      return 'REP-' + (id.length >= 6 ? id.substring(id.length - 6) : id).toUpperCase();
    }
    return 'REP-SUBMITTED';
  }

  getSeverityBadgeClass(severity?: string): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'PENDING_VERIFICATION': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
