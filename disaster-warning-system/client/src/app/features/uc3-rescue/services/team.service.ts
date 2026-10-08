import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface LocationInfo {
  type: string;
  coordinates: number[];
}

export interface RescueTeam {
  _id: string;
  teamId: string;
  name: string;
  organization: string;
  type: 'WATER_RESCUE' | 'SEARCH_AND_RESCUE' | 'MEDICAL' | 'FIRE' | 'EVACUATION' | 'GENERAL';
  members: number;
  district: string;
  location?: LocationInfo;
  status: 'AVAILABLE' | 'ASSIGNED' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SITE' | 'IN_PROGRESS' | 'INACTIVE';
  contactNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRescueTeamDto {
  name: string;
  organization: string;
  type: string;
  members: number;
  district: string;
  location: LocationInfo;
}

export interface UpdateRescueTeamDto {
  name?: string;
  organization?: string;
  type?: string;
  members?: number;
  district?: string;
  status?: string;
  location?: LocationInfo;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/rescue-teams`;

  constructor(private http: HttpClient) {}

  getTeams(params?: any): Observable<RescueTeam[]> {
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res: any) => (Array.isArray(res) ? res : res?.data || []))
    );
  }

  getTeam(id: string): Observable<RescueTeam> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => res?.data || res)
    );
  }

  createTeam(data: CreateRescueTeamDto): Observable<RescueTeam> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((res: any) => res?.data || res)
    );
  }

  updateTeam(id: string, data: UpdateRescueTeamDto): Observable<RescueTeam> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((res: any) => res?.data || res)
    );
  }

  deactivateTeam(id: string): Observable<RescueTeam> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      map((res: any) => res?.data || res)
    );
  }
}
