import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Hazard } from '../models/hazard.model';
import { HazardWarning, NotificationChannel } from '../models/warning.model';
import { NotificationLog } from '../models/notification-log.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WarningService {
  private baseUrl = environment.apiUrl || 'http://localhost:3000/api';
  private hazardsUrl = `${this.baseUrl}/uc1-warning/hazards`;
  private warningsUrl = `${this.baseUrl}/uc1-warning/warnings`;

  constructor(private http: HttpClient) {}

  // --- HAZARD APIs ---
  getHazards(includeDeleted = false): Observable<Hazard[]> {
    return this.http
      .get<any>(`${this.hazardsUrl}?includeDeleted=${includeDeleted}`)
      .pipe(map((res) => res.data || res));
  }

  getHazard(id: string): Observable<Hazard> {
    return this.http.get<any>(`${this.hazardsUrl}/${id}`).pipe(map((res) => res.data || res));
  }

  createHazard(hazard: Partial<Hazard>): Observable<Hazard> {
    return this.http.post<any>(this.hazardsUrl, hazard).pipe(map((res) => res.data || res));
  }

  updateHazard(id: string, hazard: Partial<Hazard>): Observable<Hazard> {
    return this.http.patch<any>(`${this.hazardsUrl}/${id}`, hazard).pipe(map((res) => res.data || res));
  }

  deleteHazard(id: string): Observable<any> {
    return this.http.delete<any>(`${this.hazardsUrl}/${id}`).pipe(map((res) => res.data || res));
  }

  // --- WARNING APIs ---
  issueWarning(dto: {
    hazardId: string;
    warningLevel: string;
    message: string;
    emergencyInstructions: string;
    affectedDistricts: string[];
    affectedRiverBasins?: string[];
    notificationChannels: NotificationChannel[];
  }): Observable<any> {
    return this.http.post<any>(`${this.warningsUrl}/issue`, dto).pipe(map((res) => res.data || res));
  }

  broadcastWarning(id: string, channels?: NotificationChannel[]): Observable<any> {
    return this.http.post<any>(`${this.warningsUrl}/${id}/broadcast`, { channels }).pipe(map((res) => res.data || res));
  }

  escalateWarning(
    id: string,
    dto: {
      newWarningLevel: string;
      updatedMessage?: string;
      updatedInstructions?: string;
      escalationReason?: string;
    }
  ): Observable<any> {
    return this.http.post<any>(`${this.warningsUrl}/${id}/escalate`, dto).pipe(map((res) => res.data || res));
  }

  getNearbyWarnings(latitude: number, longitude: number, radiusKm = 50): Observable<any> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radiusKm', radiusKm.toString());

    return this.http.get<any>(`${this.warningsUrl}/nearby`, { params }).pipe(map((res) => res.data || res));
  }

  getWarnings(status?: string): Observable<HazardWarning[]> {
    const url = status ? `${this.warningsUrl}?status=${status}` : this.warningsUrl;
    return this.http.get<any>(url).pipe(map((res) => res.data || res));
  }

  getWarning(id: string): Observable<HazardWarning> {
    return this.http.get<any>(`${this.warningsUrl}/${id}`).pipe(map((res) => res.data || res));
  }

  getNotificationLogs(warningId: string): Observable<NotificationLog[]> {
    return this.http.get<any>(`${this.warningsUrl}/${warningId}/logs`).pipe(map((res) => res.data || res));
  }

  cancelWarning(id: string, reason?: string): Observable<HazardWarning> {
    return this.http.post<any>(`${this.warningsUrl}/${id}/cancel`, { reason }).pipe(map((res) => res.data || res));
  }
}
