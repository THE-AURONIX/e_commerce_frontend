import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts implements OnInit {
  productService = inject(ProductService);
  toastService = inject(ToastService);
  modalService = inject(ModalService);

  products: Product[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts({ page: this.currentPage, limit: 10, all: 'true' }).subscribe({
      next: (res) => {
        this.products = res.products;
        this.totalPages = res.totalPages;
        this.totalProducts = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load products');
      },
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  async deleteProduct(id: string) {
    const confirmed = await this.modalService.confirm(
      'Delete Product',
      'Are you sure you want to delete this product?'
    );
    
    if (confirmed) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toastService.success('Product deleted successfully');
          this.loadProducts(); // Reload list
        },
        error: (err) => {
          this.toastService.error('Failed to delete product: ' + (err.error?.message || 'Unknown error'));
        },
      });
    }
  }
}
