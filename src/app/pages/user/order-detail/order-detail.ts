import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  
  orderId = '';
  order = signal<Order | null>(null);
  isLoading = signal<boolean>(true);
  isCancelling = signal<boolean>(false);
  trackingData = signal<any>(null);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id') || '';
      if (this.orderId) {
        this.fetchOrderDetails();
      }
    });
  }

  fetchOrderDetails() {
    this.isLoading.set(true);
    this.orderService.getOrder(this.orderId).subscribe({
      next: (res) => {
        this.order.set(res.order);
        this.isLoading.set(false);
        
        // If order is shipped, we can try to fetch tracking data
        if (res.order.orderStatus === 'shipped') {
           this.fetchTrackingInfo();
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  fetchTrackingInfo() {
    this.orderService.trackShipment(this.orderId).subscribe({
       next: (res) => {
         if (res.success) {
           this.trackingData.set(res.tracking_data);
         }
       },
       error: (err) => console.log('Tracking not available', err)
    });
  }

  async cancelOrder() {
    const confirmed = await this.modalService.confirm(
      'Cancel Order',
      'Are you sure you want to cancel this order? If paid online, a refund will be initiated automatically.'
    );
    if (!confirmed) return;
    
    this.isCancelling.set(true);
    this.orderService.cancelOrder(this.orderId, 'Cancelled by user via dashboard').subscribe({
      next: (res) => {
        this.isCancelling.set(false);
        this.toastService.success('Order cancelled successfully.');
        this.order.set(res.order); // Update UI with cancelled status
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.toastService.error(err.error?.message || 'Failed to cancel order.');
      }
    });
  }

  async initiateReturn() {
    const reason = await this.modalService.prompt(
      'Initiate Return',
      'Please provide a reason for the return:',
      'e.g. Item defective, changed mind'
    );
    if (!reason) return;

    this.orderService.initiateReturn(this.orderId, reason).subscribe({
      next: (res) => {
        this.toastService.success('Return initiated successfully.');
        this.order.set(res.order);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to initiate return.');
      }
    });
  }

  get canCancel(): boolean {
    const status = this.order()?.orderStatus;
    return status !== 'shipped' && status !== 'delivered' && status !== 'cancelled' && status !== 'returned';
  }

  get canReturn(): boolean {
    const order = this.order();
    if (!order) return false;
    // Check if delivered and within return window (7 days in backend)
    // Here we just check status, backend validates window
    return order.orderStatus === 'delivered';
  }
}
