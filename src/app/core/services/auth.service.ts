import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/user.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  // Reactive state using signals
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.checkInitialState();
  }

  private checkInitialState() {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        this.currentUser.set(JSON.parse(storedUser));
        this.isAuthenticated.set(true);
      }
    }
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response);
        }
      })
    );
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response);
        }
      })
    );
  }

  getMe(): Observable<{success: boolean, user: User}> {
    return this.http.get<{success: boolean, user: User}>(`${this.apiUrl}/me`).pipe(
      tap(response => {
        if (response.success && response.user) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', JSON.stringify(response.user));
          }
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  forgotPassword(email: string) {
    return this.http.post<{ success: boolean, message: string }>(`${this.apiUrl}/forgotpassword`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.put<{ success: boolean, token: string }>(`${this.apiUrl}/resetpassword/${token}`, { password });
  }

  verifyEmail(token: string) {
    return this.http.get<{ success: boolean, message: string }>(`${this.apiUrl}/verifyemail/${token}`);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private handleAuthSuccess(response: AuthResponse) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }
}
