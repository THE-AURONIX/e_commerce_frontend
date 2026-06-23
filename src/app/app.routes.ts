import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(c => c.Home)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products').then(c => c.Products)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login').then(c => c.Login)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register').then(c => c.Register)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then(c => c.ForgotPassword)
  },
  {
    path: 'auth/reset-password/:token',
    loadComponent: () => import('./pages/auth/reset-password/reset-password').then(c => c.ResetPassword)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/products/product-detail/product-detail').then(c => c.ProductDetail)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout').then(c => c.Checkout),
    canActivate: [authGuard]
  },
  {
    path: 'user/profile',
    loadComponent: () => import('./pages/user/profile-dashboard/profile-dashboard').then(c => c.ProfileDashboard),
    children: [
      { path: '', redirectTo: 'info', pathMatch: 'full' },
      { path: 'info', loadComponent: () => import('./pages/user/personal-info/personal-info').then(c => c.PersonalInfo) },
      { path: 'security', loadComponent: () => import('./pages/user/security/security').then(c => c.Security) },
      { path: 'addresses', loadComponent: () => import('./pages/user/addresses/addresses').then(c => c.Addresses) },
      { path: 'wishlist', loadComponent: () => import('./pages/user/wishlist/wishlist').then(c => c.Wishlist) },
      { path: 'orders', loadComponent: () => import('./pages/user/orders/orders').then(c => c.Orders) },
      { path: 'orders/:id', loadComponent: () => import('./pages/user/order-detail/order-detail').then(c => c.OrderDetail) }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    loadComponent: () => import('./layout/admin-layout/admin-layout').then(c => c.AdminLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then(c => c.Dashboard) },
      { path: 'products', loadComponent: () => import('./pages/admin/products/admin-products/admin-products').then(c => c.AdminProducts) },
      { path: 'products/add', loadComponent: () => import('./pages/admin/products/admin-product-form/admin-product-form').then(c => c.AdminProductForm) },
      { path: 'products/edit/:id', loadComponent: () => import('./pages/admin/products/admin-product-form/admin-product-form').then(c => c.AdminProductForm) },
      { path: 'categories', loadComponent: () => import('./pages/admin/categories/admin-categories/admin-categories').then(c => c.AdminCategories) },
      { path: 'categories/add', loadComponent: () => import('./pages/admin/categories/admin-category-form/admin-category-form').then(c => c.AdminCategoryForm) },
      { path: 'categories/edit/:id', loadComponent: () => import('./pages/admin/categories/admin-category-form/admin-category-form').then(c => c.AdminCategoryForm) },
      { path: 'reviews', loadComponent: () => import('./pages/admin/reviews/reviews').then(m => m.AdminReviews) },
      { path: 'orders', loadComponent: () => import('./pages/admin/orders/admin-orders/admin-orders').then(c => c.AdminOrders) },
      { path: 'users', loadComponent: () => import('./pages/admin/users/admin-users/admin-users').then(c => c.AdminUsers) }
    ]
  },
  {
    path: 'user/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/user/profile/profile').then(c => c.Profile)
  }
];
