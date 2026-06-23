import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';
import { tap } from 'rxjs';

export interface CartItem {
  _id?: string;
  product: Product | string | any;
  variant?: string | null;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal?: number;
  total?: number;
  couponApplied?: {
    code: string;
    discountAmount: number;
    discountType: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  cart = signal<Cart>({ items: [] });
  isCartOpen = signal<boolean>(false);

  constructor() {
    this.initCart();
  }

  private initCart() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.authService.isAuthenticated()) {
        this.fetchCartFromApi().subscribe();
      } else {
        this.loadLocalCart();
      }
    }
  }

  toggleCart() {
    this.isCartOpen.update(val => !val);
  }

  private loadLocalCart() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('guestCart');
      if (stored) {
        this.cart.set(JSON.parse(stored));
      }
    }
  }

  private saveLocalCart() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('guestCart', JSON.stringify(this.cart()));
    }
  }

  addToCart(product: Product, quantity: number = 1, variantId: string | null = null) {
    if (this.authService.isAuthenticated()) {
      this.http.post<{ success: boolean, cart: Cart }>(this.apiUrl, {
        productId: product._id,
        variantId,
        quantity
      }).pipe(
        tap(res => this.cart.set(res.cart)),
        tap(() => this.isCartOpen.set(true))
      ).subscribe();
    } else {
      this.addLocalItem(product, quantity, variantId);
      this.isCartOpen.set(true);
    }
  }

  private addLocalItem(product: Product, quantity: number, variantId: string | null) {
    const currentCart = this.cart();
    let price = product.basePrice;
    
    if (variantId && product.variants?.length) {
        const variant = product.variants.find(v => v._id === variantId);
        if (variant) price = variant.price;
    }

    const existingIndex = currentCart.items.findIndex(
      item => (item.product as any)._id === product._id && item.variant === variantId
    );

    if (existingIndex > -1) {
      currentCart.items[existingIndex].quantity += quantity;
    } else {
      currentCart.items.push({
        product: product, 
        variant: variantId,
        quantity,
        price
      });
    }

    this.cart.set({ ...currentCart });
    this.saveLocalCart();
  }

  removeFromCart(itemId: string) {
    if (this.authService.isAuthenticated()) {
      this.http.delete<{ success: boolean, cart: Cart }>(`${this.apiUrl}/${itemId}`).pipe(
        tap(res => this.cart.set(res.cart))
      ).subscribe();
    } else {
      const currentCart = this.cart();
      currentCart.items = currentCart.items.filter(item => {
        const pId = typeof item.product === 'string' ? item.product : item.product._id;
        return pId !== itemId;
      });
      this.cart.set({ ...currentCart });
      this.saveLocalCart();
    }
  }

  private fetchCartFromApi() {
    return this.http.get<{ success: boolean, cart: Cart }>(this.apiUrl).pipe(
      tap(res => this.cart.set(res.cart))
    );
  }

  syncGuestCart() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const stored = localStorage.getItem('guestCart');
    if (!stored) return;

    const guestCart: Cart = JSON.parse(stored);
    if (!guestCart.items.length) return;

    const syncPayload = guestCart.items.map(item => ({
      productId: typeof item.product === 'string' ? item.product : item.product._id,
      variantId: item.variant,
      quantity: item.quantity
    }));

    this.http.post<{ success: boolean, cart: Cart }>(`${this.apiUrl}/sync`, { cartItems: syncPayload }).pipe(
      tap(res => {
        this.cart.set(res.cart);
        localStorage.removeItem('guestCart');
      })
    ).subscribe();
  }

  updateCartItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.http.put<{ success: boolean, cart: Cart }>(`${this.apiUrl}/${itemId}`, { quantity }).pipe(
        tap(res => this.cart.set(res.cart))
      ).subscribe();
    } else {
      const currentCart = this.cart();
      const itemIndex = currentCart.items.findIndex(item => {
        const pId = typeof item.product === 'string' ? item.product : item.product._id;
        return pId === itemId || item._id === itemId;
      });

      if (itemIndex > -1) {
        currentCart.items[itemIndex].quantity = quantity;
        this.cart.set({ ...currentCart });
        this.saveLocalCart();
      }
    }
  }

  clearCart() {
    if (this.authService.isAuthenticated()) {
      this.http.delete<{ success: boolean, cart: Cart }>(this.apiUrl).pipe(
        tap(res => this.cart.set(res.cart))
      ).subscribe();
    } else {
      this.cart.set({ items: [] });
      this.saveLocalCart();
    }
  }

  applyCoupon(code: string) {
    return this.http.post<{ success: boolean, cart: Cart, message?: string }>(`${this.apiUrl}/coupon`, { code }).pipe(
      tap(res => this.cart.set(res.cart))
    );
  }

  removeCoupon() {
    return this.http.delete<{ success: boolean, cart: Cart }>(`${this.apiUrl}/coupon`).pipe(
      tap(res => this.cart.set(res.cart))
    );
  }

  get cartTotalItems() {
    return this.cart().items.reduce((acc, item) => acc + item.quantity, 0);
  }

  get cartSubtotal() {
    return this.cart().items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }
}
