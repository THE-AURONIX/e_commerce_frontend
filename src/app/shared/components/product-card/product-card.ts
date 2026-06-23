import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input({ required: true }) product!: Product;
  private cartService = inject(CartService);
  private userService = inject(UserService);

  get primaryImage() {
    const primary = this.product.images?.find(i => i.isPrimary);
    return primary ? primary.url : this.product.images?.[0]?.url;
  }

  get secondaryImage() {
    if (!this.product.images || this.product.images.length < 2) return null;
    const secondary = this.product.images?.find(i => !i.isPrimary);
    return secondary ? secondary.url : this.product.images[1].url;
  }

  addToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    const variantId = this.product.variants?.length ? this.product.variants[0]._id : null;
    this.cartService.addToCart(this.product, 1, variantId || null);
  }

  get isInWishlist() {
    return this.userService.wishlist().some(item => 
      (item.product?._id || item.product) === this.product._id
    );
  }

  toggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isInWishlist) {
      this.userService.removeFromWishlist(this.product._id).subscribe();
    } else {
      this.userService.addToWishlist(this.product._id).subscribe();
    }
  }
}
