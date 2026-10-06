import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined') return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      map((res: any) => {
        const authData: AuthResponse = res.data || res;
        if (authData && authData.accessToken) {
          localStorage.setItem('token', authData.accessToken);
          localStorage.setItem('user', JSON.stringify(authData.user));
          this.currentUserSubject.next(authData.user);
        }
        return authData;
      })
    );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      map((res: any) => {
        const authData: AuthResponse = res.data || res;
        if (authData && authData.accessToken) {
          localStorage.setItem('token', authData.accessToken);
          localStorage.setItem('user', JSON.stringify(authData.user));
          this.currentUserSubject.next(authData.user);
        }
        return authData;
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map((res: any) => {
        const user: User = res.data || res;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
        return user;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
