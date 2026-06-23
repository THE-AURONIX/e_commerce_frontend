import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reviews.html'
})
export class AdminReviews implements OnInit {
  private reviewService = inject(ReviewService);
  private modalService = inject(ModalService);

  reviews = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  
  // Modal states
  showResponseModal = signal<boolean>(false);
  selectedReview = signal<any>(null);
  responseComment = signal<string>('');

  Math = Math;

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading.set(true);
    this.reviewService.getAllAdminReviews().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.reviews.set(res.reviews);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleApproval(review: any) {
    const newStatus = review.isApproved ? 'rejected' : 'approved';
    this.reviewService.approveReview(review._id, newStatus).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Update local state
          const updated = this.reviews().map(r => r._id === review._id ? res.review : r);
          this.reviews.set(updated);
        }
      }
    });
  }

  async deleteReview(id: string) {
    const confirmed = await this.modalService.confirm(
      'Delete Review',
      'Are you sure you want to delete this review permanently?'
    );
    
    if (confirmed) {
      this.reviewService.deleteReview(id).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.reviews.set(this.reviews().filter(r => r._id !== id));
          }
        }
      });
    }
  }

  openResponseModal(review: any) {
    this.selectedReview.set(review);
    this.responseComment.set(review.response?.comment || '');
    this.showResponseModal.set(true);
  }

  closeResponseModal() {
    this.showResponseModal.set(false);
    this.selectedReview.set(null);
    this.responseComment.set('');
  }

  submitResponse() {
    const review = this.selectedReview();
    if (!review || !this.responseComment().trim()) return;

    this.reviewService.addResponse(review._id, this.responseComment()).subscribe({
      next: (res: any) => {
        if (res.success) {
          const updated = this.reviews().map(r => r._id === review._id ? res.review : r);
          this.reviews.set(updated);
          this.closeResponseModal();
        }
      }
    });
  }
}
