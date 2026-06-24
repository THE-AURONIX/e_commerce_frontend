import { Component, inject, OnInit, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService, Order } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalService } from '../../../core/services/modal.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';

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
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  
  orderId = '';
  order = signal<Order | null>(null);
  isLoading = signal<boolean>(true);
  isCancelling = signal<boolean>(false);
  isProcessingPayment = signal<boolean>(false);
  trackingData = signal<any>(null);

  ngOnInit() {
    this.paymentService.loadRazorpayScript().catch(err => console.error(err));
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

  async payNow() {
    const currentOrder = this.order();
    if (!currentOrder || currentOrder.paymentStatus === 'paid') return;

    this.isProcessingPayment.set(true);

    try {
      const rzpOrderRes = await this.paymentService.createRazorpayOrder(currentOrder._id).toPromise();
      const user = this.authService.currentUser();
      
      const options = {
        key: rzpOrderRes.key || 'rzp_test_YourMockKeyHere',
        amount: rzpOrderRes.razorpayOrder.amount,
        currency: rzpOrderRes.razorpayOrder.currency,
        name: 'Premium Minimal Store',
        description: 'Order Payment',
        order_id: rzpOrderRes.razorpayOrder.id,
        prefill: {
          name: currentOrder.shipping?.address ? `${currentOrder.shipping.address.firstName} ${currentOrder.shipping.address.lastName}` : (user?.firstName ? `${user.firstName} ${user.lastName}` : ''),
          email: user?.email || '',
          contact: currentOrder.shipping?.address?.phone || ''
        },
        handler: (response: any) => {
          this.ngZone.run(() => {
            this.paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: currentOrder._id
            }).subscribe({
              next: () => {
                this.isProcessingPayment.set(false);
                this.toastService.success('Payment Successful!');
                this.fetchOrderDetails();
              },
              error: () => {
                this.isProcessingPayment.set(false);
                this.toastService.error('Payment verification failed.');
              }
            });
          });
        },
        theme: { color: '#000000' },
        modal: {
            ondismiss: () => {
                this.ngZone.run(() => {
                  this.isProcessingPayment.set(false);
                  this.toastService.info('Payment cancelled.');
                });
            }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.ngZone.run(() => {
          this.isProcessingPayment.set(false);
          this.toastService.error('Payment failed: ' + response.error.description);
        });
      });
      rzp.open();
      
    } catch (error) {
      this.isProcessingPayment.set(false);
      this.toastService.error('Failed to initialize payment.');
      console.error(error);
    }
  }
}
