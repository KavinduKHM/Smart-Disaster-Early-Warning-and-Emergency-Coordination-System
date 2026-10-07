import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReliefService {
  private readonly apiUrl =
    'http://localhost:3000/uc4-relief';

  constructor(
    private http: HttpClient,
  ) {}

  // Dashboard
  getDashboard(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/dashboard`,
    );
  }

  // Relief Needs
  getReliefNeeds(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/needs`,
    );
  }

  createReliefNeed(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/needs`,
      data,
    );
  }

  // Shelters
  getShelters(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/shelters`,
    );
  }

  getShelter(id: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/shelters/${id}`,
    );
  }

  createShelter(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/shelters`,
      data,
    );
  }

  updateShelterStatus(
    id: string,
    status: string,
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/shelters/${id}/status`,
      { status },
    );
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

    return this.http.get<any[]>(url);
  }

  registerEvacuee(
    data: any,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/evacuees`,
      data,
    );
  }

  // Resources
  getResources(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/resources`,
    );
  }

  createResource(
    data: any,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/resources`,
      data,
    );
  }

  // Allocations
  getAllocations(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/allocations`,
    );
  }

  allocateResource(
    data: any,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/allocations`,
      data,
    );
  }
}