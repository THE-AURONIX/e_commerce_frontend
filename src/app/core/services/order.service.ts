import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Order {
  _id: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  shipping?: {
    address?: any;
    cost: number;
    method: string;
  };
  discount?: {
    couponCode: string;
    discountAmount: number;
  };
  items: any[];
  timeline: any[];
  createdAt: string;
  paymentMethod: string;
  paymentDetails?: any;
  user?: any;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  private http = inject(HttpClient);

  placeOrder(data: any): Observable<{ success: boolean, order: Order, message?: string }> {
    return this.http.post<{ success: boolean, order: Order, message?: string }>(this.apiUrl, data);
  }

  getMyOrders(params?: any): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getOrder(id: string): Observable<{ success: boolean, order: Order }> {
    return this.http.get<{ success: boolean, order: Order }>(`${this.apiUrl}/${id}`);
  }

  cancelOrder(id: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  trackShipment(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/shipments/track/${id}`);
  }

  // Return APIs
  initiateReturn(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/return`, { reason });
  }

  // Admin APIs
  getAllOrders(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/all`, { params });
  }

  updateOrderStatus(id: string, status: string, note?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status, note });
  }

  approveReturn(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/return/approve`, {});
  }
}
