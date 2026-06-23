import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-personal-info',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal-info.html',
  styleUrl: './personal-info.css'
})
export class PersonalInfo implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  profileForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', [Validators.pattern('^[6-9]\\d{9}$')]],
    dateOfBirth: [''],
    gender: ['']
  });

  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (res: any) => {
        if (res.user) {
          this.profileForm.patchValue({
            firstName: res.user.firstName,
            lastName: res.user.lastName,
            phone: res.user.phone || '',
            dateOfBirth: res.user.dateOfBirth ? res.user.dateOfBirth.split('T')[0] : '',
            gender: res.user.gender || ''
          });
        }
      }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.successMessage.set('Profile updated successfully!');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update profile');
      }
    });
  }
}
