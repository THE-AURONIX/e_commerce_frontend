import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);

  orders = signal<Order[]>([]);
  stats = signal<any>({});
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  statusFilter = signal<string>('');

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(page: number = 1) {
    this.isLoading.set(true);
    const params: any = { page, limit: 10 };
    if (this.statusFilter()) {
      params.status = this.statusFilter();
    }

    this.orderService.getAllOrders(params).subscribe({
      next: (res) => {
        this.orders.set(res.orders);
        this.stats.set(res.stats);
        this.currentPage.set(res.currentPage);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange(status: string) {
    this.statusFilter.set(status);
    this.loadOrders(1);
  }

  async updateStatus(id: string, status: string) {
    const confirmed = await this.modalService.confirm(
      'Change Status',
      `Are you sure you want to change order status to ${status}?`
    );
    if (!confirmed) {
      // Re-fetch to reset select to original status
      this.loadOrders(this.currentPage());
      return;
    }
    
    this.orderService.updateOrderStatus(id, status).subscribe({
      next: () => {
        this.toastService.success('Order status updated!');
        this.loadOrders(this.currentPage());
      },
      error: (err) => this.toastService.error(err.error?.message || 'Update failed')
    });
  }

  async approveReturn(id: string) {
    const confirmed = await this.modalService.confirm(
      'Approve Return',
      'Approve return and initiate refund?'
    );
    if (!confirmed) return;
    
    this.orderService.approveReturn(id).subscribe({
      next: () => {
        this.toastService.success('Return approved and refund processed!');
        this.loadOrders(this.currentPage());
      },
      error: (err) => this.toastService.error(err.error?.message || 'Approval failed')
    });
  }
}
