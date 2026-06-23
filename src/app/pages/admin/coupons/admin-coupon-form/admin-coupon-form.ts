import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CouponService } from '../../../../core/services/coupon.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-coupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-coupon-form.html',
  styleUrl: './admin-coupon-form.css'
})
export class AdminCouponForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private couponService = inject(CouponService);
  private toastService = inject(ToastService);

  couponForm!: FormGroup;
  isEditMode = false;
  couponId: string | null = null;
  loading = signal<boolean>(false);

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  initForm() {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      discountType: ['percentage', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      minOrderValue: [0, Validators.min(0)],
      maxDiscountAmount: [null, Validators.min(0)],
      usageLimit: [null, Validators.min(1)],
      userUsageLimit: [1, [Validators.required, Validators.min(1)]],
      validFrom: ['', Validators.required],
      validUntil: ['', Validators.required],
      isActive: [true]
    });
  }

  checkEditMode() {
    this.couponId = this.route.snapshot.paramMap.get('id');
    if (this.couponId) {
      this.isEditMode = true;
      this.loadCouponDetails(this.couponId);
    }
  }

  loadCouponDetails(id: string) {
    this.loading.set(true);
    this.couponService.getCoupon(id).subscribe({
      next: (res) => {
        try {
          const coupon = res.coupon;
          this.couponForm.patchValue({
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minOrderValue: coupon.minOrderValue,
            maxDiscountAmount: coupon.maxDiscountAmount,
            usageLimit: coupon.usageLimit,
            userUsageLimit: coupon.userUsageLimit,
            validFrom: this.formatDate(coupon.validFrom),
            validUntil: this.formatDate(coupon.validUntil),
            isActive: coupon.isActive
          });
          this.loading.set(false);
        } catch (err: any) {
          this.toastService.error('Error patching form: ' + err.message);
          this.loading.set(false);
        }
      },
      error: () => {
        this.toastService.error('Failed to load coupon details');
        this.router.navigate(['/admin/coupons']);
        this.loading.set(false);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    // Format to YYYY-MM-DD for input[type="date"]
    return d.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formData = this.couponForm.value;

    const request = this.isEditMode && this.couponId
      ? this.couponService.updateCoupon(this.couponId, formData)
      : this.couponService.createCoupon(formData);

    request.subscribe({
      next: () => {
        this.toastService.success(`Coupon ${this.isEditMode ? 'updated' : 'created'} successfully`);
        this.router.navigate(['/admin/coupons']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(err.error?.message || 'Failed to save coupon');
      }
    });
  }
}
