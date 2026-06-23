import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CouponService } from '../../../../core/services/coupon.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './admin-coupons.html',
  styleUrl: './admin-coupons.css'
})
export class AdminCoupons implements OnInit {
  couponService = inject(CouponService);
  toastService = inject(ToastService);
  modalService = inject(ModalService);

  coupons: any[] = [];
  loading = signal<boolean>(true);
  currentPage = 1;
  totalPages = 1;
  totalCoupons = 0;

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.loading.set(true);
    this.couponService.getCoupons({ page: this.currentPage, limit: 10 }).subscribe({
      next: (res) => {
        this.coupons = res.coupons;
        this.totalPages = res.totalPages;
        this.totalCoupons = res.total;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toastService.error('Failed to load coupons');
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCoupons();
    }
  }

  async deleteCoupon(id: string) {
    const confirmed = await this.modalService.confirm(
      'Delete Coupon',
      'Are you sure you want to delete this coupon?',
      false
    );
    
    if (confirmed) {
      this.modalService.setLoading(true);
      this.couponService.deleteCoupon(id).subscribe({
        next: () => {
          this.toastService.success('Coupon deleted successfully');
          this.modalService.closeModal();
          this.loadCoupons();
        },
        error: (err) => {
          this.toastService.error('Failed to delete coupon: ' + (err.error?.message || 'Unknown error'));
          this.modalService.closeModal();
        }
      });
    }
  }
}
