import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css'
})
export class AdminCategories implements OnInit {
  private categoryService = inject(CategoryService);
  private modalService = inject(ModalService);

  categories = signal<Category[]>([]);
  categoryTree = signal<Category[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    console.log('Fetching categories...');
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        try {
          console.log('Categories response:', res);
          this.categories.set(res.categories || []);
          this.categoryTree.set(res.categoryTree || []);
          this.loading.set(false);
        } catch (e) {
          console.error('Error in next block:', e);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.loading.set(false);
      }
    });
  }

  async deleteCategory(id: string) {
    const confirmed = await this.modalService.confirm(
      'Delete Category',
      'Are you sure you want to delete this category?'
    );
    
    if (confirmed) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (err) => console.error(err)
      });
    }
  }

  getParentName(parentId: any): string {
    if (!parentId) return '-';
    // parentId could be string or object depending on populate
    const id = typeof parentId === 'string' ? parentId : parentId._id;
    const parent = this.categories().find(c => c._id === id);
    return parent ? parent.name : '-';
  }
}
