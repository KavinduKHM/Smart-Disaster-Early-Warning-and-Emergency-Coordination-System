import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RescueTeam {
  _id: string;
  name: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'DISPATCHED' | 'ON_SITE';
  type: string;
  capacity: number;
  currentLocation: {
    type: string;
    coordinates: number[];
  };
}

export interface RescueAssignment {
  _id: string;
  incident: any;
  rescueTeam: any;
  status: 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED';
  assignedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  statusHistory: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RescueService {
  private readonly teamsUrl = `${environment.apiUrl}/rescue-teams`;
  private readonly assignmentsUrl = `${environment.apiUrl}/rescue-assignments`;

  constructor(private http: HttpClient) {}

  // --- Teams ---
  getTeams(params?: any): Observable<RescueTeam[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.teamsUrl, { params: httpParams }).pipe(
      map(res => res.data || res)
    );
  }

  // --- Assignments ---
  getAssignments(params?: any): Observable<RescueAssignment[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(this.assignmentsUrl, { params: httpParams }).pipe(
      map(res => res.data || res)
    );
  }

  createAssignment(incidentId: string, teamId: string, assignedBy: string): Observable<RescueAssignment> {
    return this.http.post<any>(this.assignmentsUrl, {
      incidentId,
      teamId,
      assignedBy
    }).pipe(
      map(res => res.data || res)
    );
  }

  updateAssignmentStatus(assignmentId: string, statusEndpoint: string, updatedBy: string, notes?: string): Observable<RescueAssignment> {
    // statusEndpoint can be: 'accept', 'reject', 'en-route', 'on-site', 'complete'
    return this.http.patch<any>(`${this.assignmentsUrl}/${assignmentId}/${statusEndpoint}`, {
      updatedBy,
      notes
    }).pipe(
      map(res => res.data || res)
    );
  }
}
