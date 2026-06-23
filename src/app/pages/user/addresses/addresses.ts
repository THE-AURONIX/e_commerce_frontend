import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-addresses',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addresses.html',
  styleUrl: './addresses.css'
})
export class Addresses implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private modalService = inject(ModalService);

  addresses = this.userService.addresses;
  isAdding = signal(false);
  isLoading = signal(false);

  addressForm: FormGroup = this.fb.group({
    type: ['home', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    landmark: [''],
    isDefault: [false]
  });

  ngOnInit() {
    this.userService.getAddresses().subscribe();
  }

  toggleAdd() {
    this.isAdding.set(!this.isAdding());
    this.addressForm.reset({ type: 'home', isDefault: false });
  }

  async deleteAddress(id: string) {
    const confirmed = await this.modalService.confirm(
      'Delete Address',
      'Are you sure you want to delete this address?'
    );
    if (confirmed) {
      this.userService.deleteAddress(id).subscribe();
    }
  }

  makeDefault(id: string, addr: any) {
    this.userService.updateAddress(id, { ...addr, isDefault: true }).subscribe();
  }

  onSubmit() {
    if (this.addressForm.invalid) return;
    this.isLoading.set(true);

    this.userService.addAddress(this.addressForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isAdding.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
