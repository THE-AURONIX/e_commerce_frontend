import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginatedProducts, Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private http = inject(HttpClient);

  private productsCache = new Map<string, PaginatedProducts>();
  private singleProductCache = new Map<string, { success: boolean, product: Product }>();

  getProducts(params: any = {}): Observable<PaginatedProducts> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    const cacheKey = httpParams.toString() || 'all';
    
    if (this.productsCache.has(cacheKey)) {
      return of(this.productsCache.get(cacheKey)!);
    }

    return this.http.get<PaginatedProducts>(this.apiUrl, { params: httpParams }).pipe(
      tap(res => this.productsCache.set(cacheKey, res))
    );
  }

  getProductById(id: string): Observable<{ success: boolean, product: Product }> {
    if (this.singleProductCache.has(id)) {
      return of(this.singleProductCache.get(id)!);
    }

    return this.http.get<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}`).pipe(
      tap(res => this.singleProductCache.set(id, res))
    );
  }

  clearCache() {
    this.productsCache.clear();
    this.singleProductCache.clear();
  }

  // Admin Methods
  createProduct(productData: any): Observable<{ success: boolean, product: Product }> {
    return this.http.post<{ success: boolean, product: Product }>(this.apiUrl, productData).pipe(
      tap(() => this.clearCache())
    );
  }

  updateProduct(id: string, productData: any): Observable<{ success: boolean, product: Product }> {
    return this.http.put<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}`, productData).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteProduct(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  uploadProductImages(id: string, formData: FormData): Observable<{ success: boolean, product: Product }> {
    return this.http.post<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}/images`, formData).pipe(
      tap(() => this.clearCache())
    );
  }

  uploadVariantImages(id: string, variantId: string, formData: FormData): Observable<{ success: boolean, product: Product }> {
    return this.http.post<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}/variants/${variantId}/images`, formData).pipe(
      tap(() => this.clearCache())
    );
  }

  // Variant Methods
  addVariant(id: string, variantData: any): Observable<{ success: boolean, product: Product }> {
    return this.http.post<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}/variants`, variantData).pipe(
      tap(() => this.clearCache())
    );
  }

  updateVariant(id: string, variantId: string, variantData: any): Observable<{ success: boolean, product: Product }> {
    return this.http.put<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}/variants/${variantId}`, variantData).pipe(
      tap(() => this.clearCache())
    );
  }

  removeVariant(id: string, variantId: string): Observable<{ success: boolean, product: Product }> {
    return this.http.delete<{ success: boolean, product: Product }>(`${this.apiUrl}/${id}/variants/${variantId}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
