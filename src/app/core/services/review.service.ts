import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;
  private http = inject(HttpClient);
  private productService = inject(ProductService);

  getProductReviews(productId: string) {
    return this.http.get<{ success: boolean, count: number, reviews: any[], pagination: any }>(`${this.apiUrl}/product/${productId}`);
  }

  getUserReviews() {
    return this.http.get<{ success: boolean, count: number, reviews: any[] }>(`${this.apiUrl}/user`);
  }

  getPendingReviews() {
    return this.http.get<{ success: boolean, count: number, pendingReviews: any[] }>(`${this.apiUrl}/pending`);
  }

  createReview(reviewData: any) {
    return this.http.post<{ success: boolean, review: any }>(this.apiUrl, reviewData).pipe(
      tap(() => this.productService.clearCache())
    );
  }

  updateReview(id: string, reviewData: any) {
    return this.http.put<{ success: boolean, review: any }>(`${this.apiUrl}/${id}`, reviewData).pipe(
      tap(() => this.productService.clearCache())
    );
  }

  deleteReview(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.productService.clearCache())
    );
  }

  markHelpful(id: string) {
    return this.http.put<{ success: boolean, review: any }>(`${this.apiUrl}/${id}/helpful`, {});
  }

  // Admin APIs
  getAllAdminReviews() {
    return this.http.get<{ success: boolean, count: number, reviews: any[], totalPages: number, currentPage: number }>(`${this.apiUrl}/all`);
  }

  approveReview(id: string, status: 'approved' | 'rejected') {
    return this.http.put<{ success: boolean, review: any }>(`${this.apiUrl}/${id}/approve`, { status }).pipe(
      tap(() => this.productService.clearCache())
    );
  }

  addResponse(id: string, comment: string) {
    return this.http.post<{ success: boolean, review: any }>(`${this.apiUrl}/${id}/response`, { comment });
  }
}
