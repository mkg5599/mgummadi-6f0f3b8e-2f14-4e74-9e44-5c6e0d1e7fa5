import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { User } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/auth';
  private tokenKey = 'access_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    // Check local storage on init (browser only)
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(this.tokenKey);
      if (token) {
        this.userSubject.next(this.decodeToken(token));
      }
    }
  }

  login(credentials: { username: string; password: string }) {
    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.access_token);
          this.userSubject.next(this.decodeToken(response.access_token));
        }),
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUserRole() {
    const user = this.userSubject.value;
    return user ? user.role : null;
  }

  private decodeToken(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
