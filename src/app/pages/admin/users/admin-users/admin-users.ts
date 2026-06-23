import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  users = signal<any[]>([]);
  loading = signal(false);
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  searchQuery = signal('');
  roleFilter = signal('');

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page: number = 1) {
    this.loading.set(true);
    const params: any = { page, limit: 10 };
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.roleFilter()) params.role = this.roleFilter();

    this.userService.getAllUsers(params).subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.total.set(res.total);
        this.currentPage.set(res.currentPage);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    this.loadUsers(1);
  }

  async changeRole(userId: string, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value;
    const confirmed = await this.modalService.confirm(
      'Change Role',
      `Are you sure you want to change this user's role to ${newRole}?`
    );
    
    if (confirmed) {
      this.userService.updateUserRole(userId, newRole).subscribe({
        next: () => {
          this.toastService.success(`User role updated to ${newRole}`);
          this.loadUsers(this.currentPage());
        },
        error: (err) => {
          this.toastService.error('Failed to update role');
          this.loadUsers(this.currentPage()); // revert select
        }
      });
    } else {
      this.loadUsers(this.currentPage()); // revert select if cancelled
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadUsers(page);
    }
  }
}
