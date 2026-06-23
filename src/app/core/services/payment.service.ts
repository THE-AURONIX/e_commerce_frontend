import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments/razorpay`;
  private http = inject(HttpClient);

  // Note: the backend handles fetching the keys dynamically from env, but the frontend needs
  // RAZORPAY_KEY_ID to initialize the Razorpay popup. Since we don't have an endpoint specifically for keys,
  // we can use a dummy key or expect it to be passed from backend (maybe createOrder returns the keyId?).
  // Looking at razorpayService.js, `createOrder` doesn't typically return the key.
  // We'll hardcode the test key for the scope of this project or require the user to configure it.
  
  // We will assume RAZORPAY_KEY_ID is available or passed back.

  createRazorpayOrder(orderId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, { orderId });
  }

  verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify`, data);
  }

  loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay SDK failed to load.'));
      document.body.appendChild(script);
    });
  }
}
