import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-security',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './security.html',
  styleUrl: './security.css'
})
export class Security {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  passwordMatchValidator(g: AbstractControl) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.passwordForm.invalid) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.userService.updatePassword({
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.successMessage.set('Password successfully updated!');
        this.passwordForm.reset();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update password');
      }
    });
  }
}
