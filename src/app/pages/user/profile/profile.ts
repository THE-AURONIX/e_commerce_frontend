import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  authService = inject(AuthService);
  router = inject(Router);
  user = this.authService.currentUser;

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
