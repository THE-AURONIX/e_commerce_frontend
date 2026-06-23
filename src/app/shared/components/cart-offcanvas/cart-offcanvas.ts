import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-cart-offcanvas',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart-offcanvas.html',
  styleUrl: './cart-offcanvas.css'
})
export class CartOffcanvas {
  cartService = inject(CartService);
  toastService = inject(ToastService);
  cart = this.cartService.cart;
  isOpen = this.cartService.isCartOpen;
  couponCode: string = '';

  closeCart() {
    this.cartService.isCartOpen.set(false);
  }

  removeItem(item: any) {
    this.cartService.removeFromCart(item._id);
  }

  updateQuantity(item: any, quantity: number) {
    if (quantity < 1) {
      this.removeItem(item);
      return;
    }
    this.cartService.updateCartItemQuantity(item._id, quantity);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  applyCoupon() {
    if (!this.couponCode) return;
    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: () => this.couponCode = '',
      error: (err) => this.toastService.error(err.error?.message || 'Invalid coupon')
    });
  }

  removeCoupon() {
    this.cartService.removeCoupon().subscribe();
  }
}
