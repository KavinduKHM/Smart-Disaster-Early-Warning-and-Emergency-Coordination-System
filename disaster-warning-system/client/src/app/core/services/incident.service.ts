import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Incident, CreateIncidentPayload } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private readonly baseUrl = `${environment.apiUrl}/incidents`;

  constructor(private http: HttpClient) {}

  getIncidents(params?: any): Observable<Incident[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Incident[]>(this.baseUrl, { params: httpParams });
  }

  getIncidentById(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.baseUrl}/${id}`);
  }

  createIncident(payload: CreateIncidentPayload): Observable<Incident> {
    return this.http.post<Incident>(this.baseUrl, payload);
  }

  updateIncident(id: string, payload: Partial<CreateIncidentPayload>): Observable<Incident> {
    return this.http.patch<Incident>(`${this.baseUrl}/${id}`, payload);
  }

  closeIncident(id: string): Observable<Incident> {
    return this.http.patch<Incident>(`${this.baseUrl}/${id}/close`, {});
  }
}
