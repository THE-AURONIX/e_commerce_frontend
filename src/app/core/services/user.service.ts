import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  profile = signal<any>(null);
  addresses = signal<any[]>([]);
  wishlist = signal<any[]>([]);

  getProfile() {
    return this.http.get<{ success: boolean, user: any }>(`${this.apiUrl}/profile`).pipe(
      tap(res => this.profile.set(res.user))
    );
  }

  updateProfile(data: any) {
    return this.http.put<{ success: boolean, user: any }>(`${this.apiUrl}/profile`, data).pipe(
      tap(res => this.profile.set(res.user))
    );
  }

  updatePassword(data: any) {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/password`, data);
  }

  getAddresses() {
    // The profile endpoint already has user.addresses, but maybe there's a separate address getter?
    // Wait, the API JSON didn't show a GET /addresses explicitly, but let's see. 
    // Actually the profile object contains addresses.
    return this.http.get<{ success: boolean, user: any }>(`${this.apiUrl}/profile`).pipe(
      tap(res => {
        this.profile.set(res.user);
        this.addresses.set(res.user.addresses || []);
      })
    );
  }

  addAddress(data: any) {
    return this.http.post<{ success: boolean, addresses: any[] }>(`${this.apiUrl}/addresses`, data).pipe(
      tap(res => this.addresses.set(res.addresses))
    );
  }

  updateAddress(id: string, data: any) {
    return this.http.put<{ success: boolean, addresses: any[] }>(`${this.apiUrl}/addresses/${id}`, data).pipe(
      tap(res => this.addresses.set(res.addresses))
    );
  }

  deleteAddress(id: string) {
    return this.http.delete<{ success: boolean, addresses: any[] }>(`${this.apiUrl}/addresses/${id}`).pipe(
      tap(res => this.addresses.set(res.addresses))
    );
  }

  getWishlist() {
    return this.http.get<{ success: boolean, wishlist: any[] }>(`${this.apiUrl}/wishlist`).pipe(
      tap(res => this.wishlist.set(res.wishlist))
    );
  }

  addToWishlist(productId: string) {
    return this.http.post<{ success: boolean, wishlist: any[] }>(`${this.apiUrl}/wishlist/${productId}`, {}).pipe(
      tap(res => this.wishlist.set(res.wishlist))
    );
  }

  removeFromWishlist(productId: string) {
    return this.http.delete<{ success: boolean, wishlist: any[] }>(`${this.apiUrl}/wishlist/${productId}`).pipe(
      tap(res => this.wishlist.set(res.wishlist))
    );
  }

  // Admin APIs
  getAllUsers(params?: any) {
    return this.http.get<{ success: boolean, users: any[], total: number, totalPages: number, currentPage: number }>(`${this.apiUrl}`, { params });
  }

  updateUserRole(userId: string, role: string) {
    return this.http.put<{ success: boolean, message: string, user: any }>(`${this.apiUrl}/${userId}/role`, { role });
  }
}
