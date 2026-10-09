import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ReliefService {
  private readonly apiUrl = `${environment.apiUrl}/uc4-relief`;

  constructor(
    private http: HttpClient,
  ) {}

  // Dashboard
  getDashboard(): Observable<any> {
    return this.http.get<any | ApiResponse<any>>(
      `${this.apiUrl}/dashboard`,
    ).pipe(map((response) => this.unwrap(response)));
  }

  // Relief Needs
  getReliefNeeds(): Observable<any[]> {
    return this.http.get<any[] | ApiResponse<any[]>>(
      `${this.apiUrl}/needs`,
    ).pipe(map((response) => this.unwrap(response)));
  }

  createReliefNeed(data: any): Observable<any> {
    return this.http.post<any | ApiResponse<any>>(
      `${this.apiUrl}/needs`,
      data,
    ).pipe(map((response) => this.unwrap(response)));
  }

  // Shelters
  getShelters(): Observable<any[]> {
    return this.http.get<any[] | ApiResponse<any[]>>(
      `${this.apiUrl}/shelters`,
    ).pipe(map((response) => this.unwrap(response)));
  }

  getShelter(id: string): Observable<any> {
    return this.http.get<any | ApiResponse<any>>(
      `${this.apiUrl}/shelters/${id}`,
    ).pipe(map((response) => this.unwrap(response)));
  }

  createShelter(data: any): Observable<any> {
    return this.http.post<any | ApiResponse<any>>(
      `${this.apiUrl}/shelters`,
      data,
    ).pipe(map((response) => this.unwrap(response)));
  }

  updateShelterStatus(
    id: string,
    status: string,
  ): Observable<any> {
    return this.http.patch<any | ApiResponse<any>>(
      `${this.apiUrl}/shelters/${id}/status`,
      { status },
    ).pipe(map((response) => this.unwrap(response)));
  }

  // Evacuees
  getEvacuees(
    shelterId?: string,
  ): Observable<any[]> {
    let url =
      `${this.apiUrl}/evacuees`;

    if (shelterId) {
      url += `?shelterId=${shelterId}`;
    }

    return this.http.get<any[] | ApiResponse<any[]>>(url)
      .pipe(map((response) => this.unwrap(response)));
  }

  registerEvacuee(
    data: any,
  ): Observable<any> {
    return this.http.post<any | ApiResponse<any>>(
      `${this.apiUrl}/evacuees`,
      data,
    ).pipe(map((response) => this.unwrap(response)));
  }

  // Resources
  getResources(): Observable<any[]> {
    return this.http.get<any[] | ApiResponse<any[]>>(
      `${this.apiUrl}/resources`,
    ).pipe(map((response) => this.unwrap(response)));
  }

  createResource(
    data: any,
  ): Observable<any> {
    return this.http.post<any | ApiResponse<any>>(
      `${this.apiUrl}/resources`,
      data,
    ).pipe(map((response) => this.unwrap(response)));
  }

  // Allocations
  getAllocations(): Observable<any[]> {
    return this.http.get<any[] | ApiResponse<any[]>>(
      `${this.apiUrl}/allocations`,
    ).pipe(map((response) => this.unwrap(response)));
  }

  allocateResource(
    data: any,
  ): Observable<any> {
    return this.http.post<any | ApiResponse<any>>(
      `${this.apiUrl}/allocations`,
      data,
    ).pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: T | ApiResponse<T>): T {
    return response !== null && typeof response === 'object' && 'data' in response
      ? response.data
      : response;
  }
}