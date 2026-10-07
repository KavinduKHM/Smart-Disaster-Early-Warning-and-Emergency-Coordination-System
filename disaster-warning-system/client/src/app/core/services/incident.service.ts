import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    return this.http.get<any>(this.baseUrl, { params: httpParams }).pipe(
      map(res => res.data || res)
    );
  }

  getIncidentById(id: string): Observable<Incident> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => res.data || res)
    );
  }

  createIncident(payload: CreateIncidentPayload): Observable<Incident> {
    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(res => res.data || res)
    );
  }

  updateIncident(id: string, payload: Partial<CreateIncidentPayload>): Observable<Incident> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, payload).pipe(
      map(res => res.data || res)
    );
  }

  closeIncident(id: string): Observable<Incident> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/close`, {}).pipe(
      map(res => res.data || res)
    );
  }
}
