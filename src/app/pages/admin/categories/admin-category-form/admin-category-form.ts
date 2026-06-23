import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-category-form.html',
  styleUrl: './admin-category-form.css'
})
export class AdminCategoryForm implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  categoryForm!: FormGroup;
  isEditMode = false;
  categoryId: string | null = null;
  isSubmitting = false;

  parentCategories: Category[] = [];

  ngOnInit() {
    this.initForm();
    this.loadParentCategories();
    
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.isEditMode = true;
      this.loadCategory(this.categoryId);
    }
  }

  initForm() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentCategory: [''],
      sortOrder: [0, Validators.min(0)]
    });
  }

  loadParentCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        // Only allow top-level categories as parents (or all if desired, but top-level is standard)
        // Also exclude the current category from being its own parent
        this.parentCategories = res.categories.filter(c => c._id !== this.categoryId);
      }
    });
  }

  loadCategory(id: string) {
    this.categoryService.getCategoryById(id).subscribe({
      next: (res) => {
        const c = res.category;
        this.categoryForm.patchValue({
          name: c.name,
          description: c.description || '',
          parentCategory: (c.parentCategory as any)?._id || c.parentCategory || '',
          sortOrder: c.sortOrder || 0
        });
      },
      error: () => {
        this.toastService.error('Failed to load category');
        this.router.navigate(['/admin/categories']);
      }
    });
  }

  onSubmit() {
    if (this.categoryForm.invalid) return;
    this.isSubmitting = true;

    const payload = { ...this.categoryForm.value };
    if (!payload.parentCategory) {
      payload.parentCategory = null;
    }

    if (this.isEditMode && this.categoryId) {
      this.categoryService.updateCategory(this.categoryId, payload).subscribe({
        next: () => this.finishSubmission(),
        error: (err) => this.handleError(err)
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: () => this.finishSubmission(),
        error: (err) => this.handleError(err)
      });
    }
  }

  finishSubmission() {
    this.isSubmitting = false;
    this.toastService.success(`Category ${this.isEditMode ? 'updated' : 'created'} successfully!`);
    this.router.navigate(['/admin/categories']);
  }

  handleError(err: any) {
    this.isSubmitting = false;
    this.toastService.error('Operation failed: ' + (err.error?.message || 'Unknown error'));
  }
}
