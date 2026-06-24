import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-review-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './review-popup.html',
  styles: [`
    .review-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .review-modal {
      background: white;
      width: 100%;
      max-width: 500px;
      margin: 1rem;
      border-radius: 0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .star-rating i {
      cursor: pointer;
      font-size: 1.5rem;
    }
    .star-rating i:hover, .star-rating i.active {
      color: #ffc107;
    }
  `]
})
export class ReviewPopup implements OnInit {
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  pendingProducts = signal<any[]>([]);
  currentProduct = signal<any>(null);
  showPopup = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  hoverRating = signal<number>(0);

  reviewForm: FormGroup = this.fb.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: [''],
    comment: ['']
  });

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.checkPendingReviews();
    }
  }

  checkPendingReviews() {
    this.reviewService.getPendingReviews().subscribe({
      next: (res) => {
        if (res.success && res.pendingReviews.length > 0) {
          // Filter out reviews that have been skipped 3 or more times
          const pending = res.pendingReviews.filter((p: any) => {
            const skipCount = parseInt(localStorage.getItem(`review_skip_${p.orderId}_${p.product._id}`) || '0');
            return skipCount < 3;
          });

          if (pending.length > 0) {
            this.pendingProducts.set(pending);
            this.showNextProduct();
          }
        }
      }
    });
  }

  showNextProduct() {
    const products = this.pendingProducts();
    if (products.length > 0) {
      this.currentProduct.set(products[0]);
      this.showPopup.set(true);
      this.reviewForm.reset({ rating: 0 });
    } else {
      this.showPopup.set(false);
    }
  }

  setRating(val: number) {
    this.reviewForm.patchValue({ rating: val });
  }

  dismiss() {
    const prod = this.currentProduct();
    if (prod) {
      const key = `review_skip_${prod.orderId}_${prod.product._id}`;
      const count = parseInt(localStorage.getItem(key) || '0');
      localStorage.setItem(key, (count + 1).toString());
    }
    
    // Remove the current product from the queue and show next
    const updated = this.pendingProducts().slice(1);
    this.pendingProducts.set(updated);
    this.showNextProduct();
  }

  submitReview() {
    if (this.reviewForm.invalid) return;

    this.isSubmitting.set(true);
    const prod = this.currentProduct();
    const data = {
      ...this.reviewForm.value,
      productId: prod.product._id,
      orderId: prod.orderId
    };

    this.reviewService.createReview(data).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dismiss();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.dismiss();
      }
    });
  }
}
