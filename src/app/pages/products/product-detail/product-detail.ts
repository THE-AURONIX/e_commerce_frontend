import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { UserService } from '../../../core/services/user.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, ProductCard, RouterLink, ReactiveFormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private userService = inject(UserService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  product = signal<any>(null);
  similarProducts = signal<any[]>([]);
  reviews = signal<any[]>([]);
  
  selectedVariant = signal<any>(null);
  selectedQuantity = signal<number>(1);
  activeImage = signal<string>('');
  displayImages = signal<any[]>([]);

  isLoading = signal<boolean>(true);
  isSubmittingReview = signal<boolean>(false);

  reviewForm: FormGroup = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: [''],
    comment: ['']
  });

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
        this.loadReviews(id);
      }
    });
  }

  loadProduct(id: string) {
    this.isLoading.set(true);
    this.selectedQuantity.set(1);
    
    this.productService.getProductById(id).subscribe({
      next: (res: any) => {
        if (res.success && res.product) {
          this.product.set(res.product);
          this.displayImages.set(res.product.images || []);
          this.activeImage.set(res.product.images?.[0]?.url || '');
          
          if (res.product.variants && res.product.variants.length > 0) {
            this.selectVariant(res.product.variants[0]);
          } else {
            this.selectedVariant.set(null);
          }

          this.loadSimilarProducts(res.product.category._id || res.product.category);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadSimilarProducts(categoryId: string) {
    this.productService.getProducts({ category: categoryId, limit: 5 }).subscribe({
      next: (res: any) => {
        if (res.success) {
          const currentId = this.product()._id;
          this.similarProducts.set(res.products.filter((p: any) => p._id !== currentId).slice(0, 4));
        }
      }
    });
  }

  loadReviews(productId: string) {
    this.reviewService.getProductReviews(productId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.reviews.set(res.reviews);
        }
      }
    });
  }

  submitReview() {
    if (this.reviewForm.invalid || !this.isAuthenticated || !this.product()) return;

    this.isSubmittingReview.set(true);
    const reviewData = {
      ...this.reviewForm.value,
      productId: this.product()._id
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.reviewForm.reset({ rating: 5 });
        this.toastService.success('Review submitted for approval!');
        this.loadReviews(this.product()._id);
      },
      error: (err) => {
        this.isSubmittingReview.set(false);
        this.toastService.error(err.error?.message || 'Failed to submit review');
      }
    });
  }

  selectVariant(variant: any) {
    this.selectedVariant.set(variant);
    if (variant && variant.images && variant.images.length > 0) {
      // Map string URLs to object with url property for template compatibility
      const variantImgs = variant.images.map((url: string) => ({ url }));
      this.displayImages.set(variantImgs);
      this.activeImage.set(variantImgs[0].url);
    } else if (this.product()) {
      this.displayImages.set(this.product().images || []);
      if (this.product().images?.length > 0) {
        this.activeImage.set(this.product().images[0].url);
      }
    }
  }

  setActiveImage(url: string) {
    this.activeImage.set(url);
  }

  get currentPrice() {
    if (this.selectedVariant()) {
      return this.selectedVariant().comparePrice || this.selectedVariant().price;
    }
    return this.product()?.comparePrice || this.product()?.basePrice;
  }

  get originalPrice() {
    if (this.selectedVariant()) {
      return this.selectedVariant().comparePrice ? this.selectedVariant().price : null;
    }
    return this.product()?.comparePrice ? this.product()?.basePrice : null;
  }

  get availableStock() {
    if (this.selectedVariant()) {
      return this.selectedVariant().inventory?.quantity || 0;
    }
    return this.product()?.inventory?.quantity || 0;
  }

  get isOutOfStock() {
    return this.availableStock <= 0;
  }

  incrementQuantity() {
    if (this.selectedQuantity() < this.availableStock) {
      this.selectedQuantity.update(q => q + 1);
    }
  }

  decrementQuantity() {
    if (this.selectedQuantity() > 1) {
      this.selectedQuantity.update(q => q - 1);
    }
  }

  addToCart() {
    if (this.isOutOfStock) return;
    const prod = this.product();
    const variantId = this.selectedVariant() ? this.selectedVariant()._id : null;
    this.cartService.addToCart(prod, this.selectedQuantity(), variantId);
  }

  addToWishlist() {
    this.userService.addToWishlist(this.product()._id).subscribe();
  }

  // Expose Math to template
  Math = Math;

  scrollToReviews() {
    const el = document.getElementById('reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
