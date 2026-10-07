import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface GroundReport {
  _id: string;
  reportId?: string;
  reportNumber?: string;
  reportedBy?: string;
  reporterType?: string;
  hazardType: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  district: string;
  address?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  photos?: string[];
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED' | 'ARCHIVED';
  verificationRemarks?: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface ReliefShelter {
  _id?: string;
  name: string;
  district: string;
  location: string;
  capacity: number;
  currentEvacuees: number;
  status: string;
  facilities?: string[];
  distanceKm?: number;
}

/**
 * ReportService
 * Client-side service managing HTTP communications for Member 2 Ground Hazard Reports & Duty Officer Triage.
 * Follows Angular Injectable service pattern with JWT authentication header interception.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Constructs HTTP Authorization headers carrying JWT Bearer token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * Fetches ground hazard reports, optionally filtered by district or query object
   * @param filter District string or query object
   */
  getReports(filter?: string | { district?: string; status?: string }): Observable<GroundReport[]> {
    let url = `${this.apiUrl}/reports`;
    if (typeof filter === 'string' && filter) {
      url = `${this.apiUrl}/reports?district=${filter}`;
    } else if (typeof filter === 'object' && filter) {
      const params = new URLSearchParams();
      if (filter.district) params.set('district', filter.district);
      if (filter.status) params.set('status', filter.status);
      url = `${this.apiUrl}/reports?${params.toString()}`;
    }
    return this.http.get<GroundReport[]>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Fetches a single ground hazard report by Mongo ID or human-readable reportId
   * @param id Mongo Object ID or report identifier (e.g. REP-2026-0001)
   */
  getReportById(id: string): Observable<GroundReport> {
    return this.http.get<GroundReport>(`${this.apiUrl}/reports/${id}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Fetches user's own submitted ground hazard reports
   */
  getMyReports(): Observable<GroundReport[]> {
    return this.http.get<GroundReport[]>(`${this.apiUrl}/reports/my-reports`, { headers: this.getAuthHeaders() });
  }

  /**
   * Aggregates report statistics (total, pending, verified, rejected, archived)
   * @param district Optional district name filter
   */
  getReportStats(district?: string): Observable<any> {
    const url = district ? `${this.apiUrl}/reports/stats?district=${district}` : `${this.apiUrl}/reports/stats`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Submits a new ground hazard report to backend API
   * @param payload Ground hazard report payload containing coordinates and evidence photos
   */
  createReport(payload: any): Observable<GroundReport> {
    return this.http.post<GroundReport>(`${this.apiUrl}/reports`, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Verifies a ground hazard report and assigns hazard severity level
   * @param id Report identifier
   * @param payload Verification decision carrying assigned severity and audit remarks
   */
  verifyReport(id: string, payload: { severity?: string; remarks?: string }): Observable<GroundReport> {
    return this.http.patch<GroundReport>(`${this.apiUrl}/reports/${id}/verify`, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Rejects an invalid or false ground hazard report
   * @param id Report identifier
   * @param payload Rejection audit remarks
   */
  rejectReport(id: string, payload: { remarks: string }): Observable<GroundReport> {
    return this.http.patch<GroundReport>(`${this.apiUrl}/reports/${id}/reject`, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Fetches active national early warning bulletins
   */
  getWarnings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/warnings`, { headers: this.getAuthHeaders() });
  }

  /**
   * Fetches registered relief evacuation shelters
   * @param district Optional district filter
   */
  getShelters(district?: string): Observable<ReliefShelter[]> {
    const url = district ? `${this.apiUrl}/relief/shelters?district=${district}` : `${this.apiUrl}/relief/shelters`;
    return this.http.get<ReliefShelter[]>(url, { headers: this.getAuthHeaders() });
  }
}
