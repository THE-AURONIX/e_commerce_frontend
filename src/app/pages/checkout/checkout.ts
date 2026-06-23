import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  cart = this.cartService.cart;
  isProcessing = false;
  
  // Wizard State
  currentStep = 1;
  
  // Addresses
  addresses = this.userService.addresses;
  selectedAddressId: string | null = null;
  showNewAddressForm = false;
  addressForm!: FormGroup;

  // Coupon
  couponCode: string = '';

  // Payment
  paymentMethod: string = 'card';

  ngOnInit() {
    if (this.cart().items.length === 0) {
      this.router.navigate(['/products']);
      return;
    }

    this.userService.getAddresses().subscribe();

    this.addressForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      addressLine1: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
    
    // Attempt to load Razorpay
    this.paymentService.loadRazorpayScript().catch(err => console.error(err));
  }

  // --- Step Navigation ---
  nextStep() {
    if (this.currentStep === 1) {
      if (!this.selectedAddressId && !this.showNewAddressForm) {
        this.toastService.error('Please select or add a shipping address.');
        return;
      }
      if (this.showNewAddressForm && this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        return;
      }
    }
    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  // --- Address Logic ---
  selectAddress(id: string) {
    this.selectedAddressId = id;
    this.showNewAddressForm = false;
  }

  toggleNewAddress() {
    this.showNewAddressForm = true;
    this.selectedAddressId = null;
  }

  // --- Coupon Logic ---
  applyCoupon() {
    if (!this.couponCode) return;
    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: () => {
        this.couponCode = '';
        this.toastService.success('Coupon applied successfully');
      },
      error: (err) => this.toastService.error(err.error?.message || 'Invalid coupon')
    });
  }

  removeCoupon() {
    this.cartService.removeCoupon().subscribe();
  }

  // --- Checkout Logic ---
  async placeOrder() {
    this.isProcessing = true;

    let shippingAddress;

    if (this.showNewAddressForm) {
      shippingAddress = this.addressForm.value;
    } else {
      const selected = this.addresses().find(a => a._id === this.selectedAddressId);
      if (!selected) {
        this.toastService.error('Selected address not found.');
        this.isProcessing = false;
        return;
      }
      shippingAddress = {
        firstName: selected.firstName,
        lastName: selected.lastName,
        phone: selected.phone,
        addressLine1: selected.addressLine1,
        city: selected.city,
        state: selected.state,
        pincode: selected.pincode
      };
    }

    const orderPayload = {
      shippingAddress,
      paymentMethod: this.paymentMethod
    };

    this.orderService.placeOrder(orderPayload).subscribe({
      next: async (res) => {
        if (this.paymentMethod === 'cod' || res.order.totalAmount === 0) {
          this.isProcessing = false;
          this.toastService.success(res.order.totalAmount === 0 ? 'Order placed successfully!' : 'Order placed successfully via Cash on Delivery!');
          this.router.navigate(['/user/profile/orders']);
        } else {
          await this.processRazorpayPayment(res.order._id, res.order.totalAmount);
        }
      },
      error: (err) => {
        this.isProcessing = false;
        this.toastService.error(err.error?.message || 'Failed to place order');
      }
    });
  }

  private async processRazorpayPayment(orderId: string, amount: number) {
    try {
      const rzpOrderRes = await this.paymentService.createRazorpayOrder(orderId).toPromise();
      
      const selectedAddress = this.addresses().find(a => a._id === this.selectedAddressId);
      const user = this.authService.currentUser();

      const options = {
        key: rzpOrderRes.key || 'rzp_test_YourMockKeyHere', // Use key from backend
        amount: rzpOrderRes.razorpayOrder.amount,
        currency: rzpOrderRes.razorpayOrder.currency,
        name: 'Premium Minimal Store',
        description: 'Order Payment',
        order_id: rzpOrderRes.razorpayOrder.id,
        prefill: {
          name: selectedAddress ? `${selectedAddress.firstName} ${selectedAddress.lastName}` : (user?.firstName ? `${user.firstName} ${user.lastName}` : ''),
          email: user?.email || '',
          contact: selectedAddress?.phone || ''
        },
        handler: (response: any) => {
          this.paymentService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderId
          }).subscribe({
            next: () => {
              this.isProcessing = false;
              this.toastService.success('Payment Successful!');
              this.router.navigate(['/user/profile/orders']);
            },
            error: () => {
              this.isProcessing = false;
              this.toastService.error('Payment verification failed.');
            }
          });
        },
        theme: { color: '#000000' },
        modal: {
            ondismiss: () => {
                this.isProcessing = false;
                this.toastService.info('Payment cancelled. Your order is pending payment.');
                this.router.navigate(['/user/profile/orders']);
            }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.isProcessing = false;
        this.toastService.error('Payment failed: ' + response.error.description);
      });
      rzp.open();
      
    } catch (error) {
      this.isProcessing = false;
      this.toastService.error('Failed to initialize payment.');
      console.error(error);
    }
  }
}
