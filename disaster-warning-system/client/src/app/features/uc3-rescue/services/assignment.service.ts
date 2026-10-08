import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export type AssignmentStatus = 
  | 'ASSIGNED' 
  | 'DISPATCHED' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EN_ROUTE' 
  | 'ON_SITE' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'FAILED';

export interface RescueAssignment {
  _id: string;
  assignmentId: string;
  incidentId: string;
  teamId: string;
  assignedBy: string;
  status: AssignmentStatus;
  assignedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RescueStatusUpdate {
  _id: string;
  assignmentId: string;
  status: string;
  updatedBy: string;
  notes?: string;
  createdAt: string;
}

export interface CreateAssignmentDto {
  incidentId: string;
  teamId: string;
  assignedBy: string;
  notes?: string;
}

export interface UpdateAssignmentDto {
  incidentId?: string;
  teamId?: string;
  status?: string;
  updatedBy?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private apiUrl = `${environment.apiUrl}/rescue-assignments`;

  constructor(private http: HttpClient) {}

  getAssignments(params?: any): Observable<RescueAssignment[]> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res: any) => (Array.isArray(res) ? res : res?.data || []))
    );
  }

  getAssignment(id: string): Observable<RescueAssignment> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => res?.data || res)
    );
  }

  createAssignment(data: CreateAssignmentDto): Observable<RescueAssignment> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((res: any) => res?.data || res)
    );
  }

  updateAssignment(id: string, data: UpdateAssignmentDto): Observable<RescueAssignment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((res: any) => res?.data || res)
    );
  }

  deleteAssignment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => this.rejectAssignment(id, 'District Officer', 'Assignment cancelled and withdrawn')),
      map((res: any) => res?.data || res)
    );
  }


  getStatusHistory(id: string): Observable<RescueStatusUpdate[]> {
    return this.http.get<any>(`${this.apiUrl}/${id}/status-history`).pipe(
      map((res: any) => (Array.isArray(res) ? res : res?.data || []))
    );
  }

  // Lifecycle Transition Shortcuts
  acceptAssignment(id: string, updatedBy: string): Observable<RescueAssignment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/accept`, { updatedBy }).pipe(
      map((res: any) => res?.data || res)
    );
  }

  rejectAssignment(id: string, updatedBy: string, notes?: string): Observable<RescueAssignment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/reject`, { updatedBy, notes: notes || 'Declined by team' }).pipe(
      map((res: any) => res?.data || res)
    );
  }

  enRouteAssignment(id: string, updatedBy: string): Observable<RescueAssignment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/en-route`, { updatedBy }).pipe(
      map((res: any) => res?.data || res)
    );
  }

  onSiteAssignment(id: string, updatedBy: string): Observable<RescueAssignment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/on-site`, { updatedBy }).pipe(
      map((res: any) => res?.data || res)
    );
  }

  completeAssignment(id: string, updatedBy: string, notes?: string): Observable<RescueAssignment> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/complete`, { updatedBy, notes: notes || 'Rescue operation completed' }).pipe(
      map((res: any) => res?.data || res)
    );
  }
}
