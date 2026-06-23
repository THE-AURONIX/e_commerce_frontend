import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-wishlist',
  imports: [CommonModule, ProductCard],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class Wishlist implements OnInit {
  private userService = inject(UserService);
  wishlist = this.userService.wishlist;

  ngOnInit() {
    this.userService.getWishlist().subscribe();
  }
}
