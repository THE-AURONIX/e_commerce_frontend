import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: Category | string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  children?: Category[]; // For the tree
}

export interface CategoryResponse {
  success: boolean;
  categories: Category[];
  categoryTree: Category[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;
  private http = inject(HttpClient);

  getCategories(): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(this.apiUrl);
  }

  getCategoryById(id: string): Observable<{ success: boolean, category: Category, subcategories: Category[] }> {
    return this.http.get<{ success: boolean, category: Category, subcategories: Category[] }>(`${this.apiUrl}/${id}`);
  }

  createCategory(categoryData: any): Observable<{ success: boolean, category: Category }> {
    return this.http.post<{ success: boolean, category: Category }>(this.apiUrl, categoryData);
  }

  updateCategory(id: string, categoryData: any): Observable<{ success: boolean, category: Category }> {
    return this.http.put<{ success: boolean, category: Category }>(`${this.apiUrl}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }
}
