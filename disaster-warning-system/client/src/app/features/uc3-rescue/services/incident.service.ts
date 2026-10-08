import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface LocationInfo {
  type: string;
  coordinates: number[];
}

export interface Incident {
  _id: string;
  incidentId: string;
  type: string;
  description: string;
  district: string;
  location: LocationInfo;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ARCHIVED';
  peopleAffected: number;
  requiredAssistance: string[];
  createdBy: string;
  reportedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentDto {
  type: string;
  description: string;
  district: string;
  location: LocationInfo;
  priority: string;
  peopleAffected: number;
  requiredAssistance: string[];
  createdBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;

  constructor(private http: HttpClient) {}

  getIncidents(params?: any): Observable<Incident[]> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res: any) => (Array.isArray(res) ? res : res?.data || []))
    );
  }

  getIncident(id: string): Observable<Incident> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => res?.data || res)
    );
  }

  createIncident(data: CreateIncidentDto): Observable<Incident> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((res: any) => res?.data || res)
    );
  }

  updateIncident(id: string, data: any): Observable<Incident> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((res: any) => res?.data || res)
    );
  }

  closeIncident(id: string): Observable<Incident> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/close`, {}).pipe(
      map((res: any) => res?.data || res)
    );
  }
}

