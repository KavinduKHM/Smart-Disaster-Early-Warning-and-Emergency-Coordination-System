import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface GroundReport {
  _id: string;
  reportId?: string;
  reportNumber?: string;
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

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getReports(district?: string): Observable<GroundReport[]> {
    const url = district ? `${this.apiUrl}/reports?district=${district}` : `${this.apiUrl}/reports`;
    return this.http.get<GroundReport[]>(url, { headers: this.getAuthHeaders() });
  }

  getMyReports(): Observable<GroundReport[]> {
    return this.http.get<GroundReport[]>(`${this.apiUrl}/reports/my-reports`, { headers: this.getAuthHeaders() });
  }

  getReportStats(district?: string): Observable<any> {
    const url = district ? `${this.apiUrl}/reports/stats?district=${district}` : `${this.apiUrl}/reports/stats`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() });
  }

  createReport(payload: any): Observable<GroundReport> {
    return this.http.post<GroundReport>(`${this.apiUrl}/reports`, payload, { headers: this.getAuthHeaders() });
  }

  verifyReport(id: string, payload: { severity?: string; remarks?: string }): Observable<GroundReport> {
    return this.http.patch<GroundReport>(`${this.apiUrl}/reports/${id}/verify`, payload, { headers: this.getAuthHeaders() });
  }

  rejectReport(id: string, payload: { remarks: string }): Observable<GroundReport> {
    return this.http.patch<GroundReport>(`${this.apiUrl}/reports/${id}/reject`, payload, { headers: this.getAuthHeaders() });
  }

  getWarnings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/warnings`, { headers: this.getAuthHeaders() });
  }

  getShelters(district?: string): Observable<ReliefShelter[]> {
    const url = district ? `${this.apiUrl}/relief/shelters?district=${district}` : `${this.apiUrl}/relief/shelters`;
    return this.http.get<ReliefShelter[]>(url, { headers: this.getAuthHeaders() });
  }
}
