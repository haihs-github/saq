import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API = environment.apiUrl;
  constructor(private http: HttpClient) {}

  login(credentials: { userName: string, password: string }): Observable<any> {
    return this.http.post<any>(`${this.API}/login`, credentials)
    .pipe(
      tap(response => {
        this.setToken(response.token)
      })
    )
  }

  logout() {
    this.removeToken();
  }

  isLoggedIn(): boolean {
    if(this.getToken()){
      if(this.getToken() !== "undefined"){
        return true
      }else {
        return false
      }
    }
    return false
  }

  private getToken(): string | null {
    if (this.isSessionStorageSupported()) {
      return sessionStorage.getItem('token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (this.isSessionStorageSupported()) {
      sessionStorage.setItem('token', token);
    }
  }

  private removeToken(): void {
    if (this.isSessionStorageSupported()) {
      sessionStorage.removeItem('token');
    }
  }

  private isSessionStorageSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  }


  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const roles = ['Giáoviên', 'Banquảnlý', 'Bangiámhiệu'];
    for (let role of roles) {
      if (token.endsWith(role)) return role;
    }
    return null;
  }

getIdUser(): string {
  const token = this.getToken();
  if (!token) return '0';

  const match = token.match(/^\d+/);
  return match ? match[0] : '0';
}


  isTeacher(): boolean {
    return this.getRole() === 'Giáoviên';
  }
  isFacilityManager(): boolean {
    return this.getRole() === 'Banquảnlý';
  }
  isManagementBoard(): boolean {
    return this.getRole() === 'Bangiámhiệu';
  }
  isAdmin(): boolean {
    const role = this.getRole();
    return role === 'Bangiámhiệu' || role === 'Banquảnlý';
  }

}
