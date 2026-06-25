import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product, Category } from '../../core/models/product.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  imports: [CommonModule, ProductCard],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  selectedSort = signal<string>('newest');

  totalCount = signal<number>(0);
  page = signal<number>(1);
  totalPages = signal<number>(1);
  limit = signal<number>(10);

  @HostListener('window:resize')
  onResize() {
    this.updateLimit(true);
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    this.fetchCategories();
    this.updateLimit(false);

    this.route.queryParams.subscribe(params => {
      this.searchQuery.set(params['search'] || '');
      this.selectedCategory.set(params['category'] || '');
      this.minPrice.set(params['minPrice'] ? Number(params['minPrice']) : null);
      this.maxPrice.set(params['maxPrice'] ? Number(params['maxPrice']) : null);
      this.selectedSort.set(params['sort'] || 'newest');
      this.page.set(params['page'] ? Number(params['page']) : 1);

      this.fetchProducts();
    });
  }

  updateLimit(fetchAfter: boolean = false) {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    let newLimit = 10;

    if (width < 768) {
      newLimit = 6;
    } else if (width < 992) {
      newLimit = 8;
    } else {
      newLimit = 10;
    }

    if (this.limit() !== newLimit) {
      this.limit.set(newLimit);
      if (fetchAfter) {
        // Reset to page 1 to prevent being on a page that doesn't exist with new limit
        this.page.set(1);
        this.fetchProducts();
      }
    }
  }

  fetchProducts() {
    this.isLoading.set(true);
    const params: any = {};
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.selectedCategory()) params.category = this.selectedCategory();
    if (this.minPrice()) params.minPrice = this.minPrice();
    if (this.maxPrice()) params.maxPrice = this.maxPrice();
    if (this.selectedSort()) params.sort = this.selectedSort();
    params.page = this.page();
    params.limit = this.limit();

    this.productService.getProducts(params).subscribe({
      next: (res: any) => {
        this.products.set(res.products);
        this.totalCount.set(res.total);
        this.totalPages.set(res.totalPages || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  fetchCategories() {
    this.http.get<{success: boolean, categories: Category[]}>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res.categories),
      error: (err) => console.error(err)
    });
  }

  applyFilters(updates: any) {
    const currentParams = { ...this.route.snapshot.queryParams };
    const newParams = { ...currentParams, ...updates };

    // Clean up empty params
    Object.keys(newParams).forEach(key => {
      if (newParams[key] === null || newParams[key] === '') {
        delete newParams[key];
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: newParams,
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.selectedCategory() || this.minPrice() !== null || this.maxPrice() !== null || this.selectedSort() !== 'newest');
  }
}
