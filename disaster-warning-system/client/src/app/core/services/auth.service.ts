import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'RESCUE_TEAM' | 'DUTY_OFFICER' | 'DMC_OFFICER' | 'DISTRICT_OFFICER';
  district: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  badgeId?: string;
  teamId?: string;
  organization?: string;
  teamType?: string;
  membersCount?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
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
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.saveAuthSession(res);
        this.redirectUserByRole(res.user.role);
      })
    );
  }

  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        this.saveAuthSession(res);
        this.redirectUserByRole(res.user.role);
      })
    );
  }

  updateProfile(payload: any): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, payload, { headers: this.getAuthHeaders() }).pipe(
      tap((res) => {
        this.saveAuthSession(res);
      })
    );
  }

  changePassword(payload: any): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/change-password`, payload, { headers: this.getAuthHeaders() });
  }

  private saveAuthSession(res: AuthResponse): void {
    if (res.accessToken) {
      localStorage.setItem('disaster_token', res.accessToken);
    }
    if (res.user) {
      localStorage.setItem('disaster_user', JSON.stringify(res.user));
      this.currentUserSubject.next(res.user);
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
        this.router.navigate(['/duty-officer/dashboard']);
        break;
      case 'DMC_OFFICER':
        this.router.navigate(['/dmc-officer/dashboard']);
        break;
      case 'DISTRICT_OFFICER':
        this.router.navigate(['/relief/shelters']);
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
