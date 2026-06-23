import { Component, HostListener, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  isScrolled = false;
  activeItem = 'Home';
  isSearchOpen = false;
  searchQuery = '';
  activeHoverCategory: string | null = null;

  authService = inject(AuthService);
  cartService = inject(CartService);
  categoryService = inject(CategoryService);
  userService = inject(UserService);
  private router = inject(Router);

  isAuthenticated = this.authService.isAuthenticated;
  user = this.authService.currentUser;
  
  categoryTree = signal<Category[]>([]);

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        this.userService.getWishlist().subscribe();
      } else {
        this.userService.wishlist.set([]);
      }
    });
  }

  // Customizable 5 categories for the navbar
  staticCategories = [
    { name: 'Men', slug: 'men' },
    { name: 'Women', slug: 'women' },
    { name: 'Kids', slug: 'kids' },
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Home & Living', slug: 'home-living' }
  ];

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        if (res.success) {
          this.categoryTree.set(res.categoryTree);
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  setActive(item: string) {
    this.activeItem = item;
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
      this.searchQuery = '';
      this.isSearchOpen = false;
    }
  }

  setHoverCategory(categoryId: string | null) {
    this.activeHoverCategory = categoryId;
  }
}
