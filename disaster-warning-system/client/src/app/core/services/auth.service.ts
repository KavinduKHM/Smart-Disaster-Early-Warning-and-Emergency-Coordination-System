import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { User, AuthResponse, UserProfile } from '../models/user.model';

export { UserProfile };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredUser(): UserProfile | null {
    const userJson = localStorage.getItem('disaster_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  get token(): string | null {
    return localStorage.getItem('disaster_token');
  }

  getToken(): string | null {
    return this.token;
  }

  get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      map((res: any) => (res && res.data ? res.data : res)),
      tap((res: any) => {
        this.saveAuthSession(res);
        if (res && res.user && res.user.role) {
          this.redirectUserByRole(res.user.role);
        }
      })
    );
  }

  register(payload: any): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
      map((res: any) => (res && res.data ? res.data : res)),
      tap((res: any) => {
        this.saveAuthSession(res);
        if (res && res.user && res.user.role) {
          this.redirectUserByRole(res.user.role);
        }
      })
    );
  }

  updateProfile(payload: any): Observable<AuthResponse> {
    return this.http.put<any>(`${this.apiUrl}/profile`, payload, { headers: this.getAuthHeaders() }).pipe(
      map((res: any) => (res && res.data ? res.data : res)),
      tap((res: any) => {
        this.saveAuthSession(res);
      })
    );
  }

  changePassword(payload: any): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/change-password`, payload, { headers: this.getAuthHeaders() });
  }

  private saveAuthSession(res: any): void {
    const data = res && res.data ? res.data : res;
    if (data?.accessToken) {
      localStorage.setItem('disaster_token', data.accessToken);
    }
    if (data?.user) {
      localStorage.setItem('disaster_user', JSON.stringify(data.user));
      this.currentUserSubject.next(data.user);
    }
  }

  logout(): void {
    localStorage.removeItem('disaster_token');
    localStorage.removeItem('disaster_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  redirectUserByRole(role: string): void {
    switch (role) {
      case 'CITIZEN':
        this.router.navigate(['/citizen/home']);
        break;
      case 'RESCUE_TEAM':
        this.router.navigate(['/rescue-team/dashboard']);
        break;
      case 'DUTY_OFFICER':
      case 'DISTRICT_OFFICER':
        this.router.navigate(['/district-officer/dashboard']);
        break;
      case 'DMC_OFFICER':
        this.router.navigate(['/dmc-officer/dashboard']);
        break;
      default:
        this.router.navigate(['/citizen/home']);
        break;
    }
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }
}
