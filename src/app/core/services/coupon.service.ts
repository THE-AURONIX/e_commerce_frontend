import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = `${environment.apiUrl}/coupons`;
  private http = inject(HttpClient);

  getCoupons(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getCoupon(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getActivePublicCoupons(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public/active`);
  }

  validateCoupon(data: { code: string, orderValue: number, cartItems?: any[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validate`, data);
  }

  createCoupon(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateCoupon(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteCoupon(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
