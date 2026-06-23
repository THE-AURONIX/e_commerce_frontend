import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService, Category } from '../../../../core/services/category.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-product-form.html',
  styleUrl: './admin-product-form.css',
})
export class AdminProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  productForm!: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  isSubmitting = false;

  selectedFiles: File[] = [];
  previewImages: string[] = [];
  existingImages: any[] = [];

  variantSelectedFiles = new Map<number, File[]>();
  variantPreviewImages = new Map<number, string[]>();
  variantExistingImages = new Map<number, string[]>();

  categories: Category[] = [];
  mainCategories: Category[] = [];
  subCategories: Category[] = [];

  ngOnInit() {
    this.initForm();
    this.loadCategories();
    this.productId = this.route.snapshot.paramMap.get('id');

    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }

    // Listen to category changes to filter subcategories
    this.productForm.get('category')?.valueChanges.subscribe((categoryId) => {
      this.updateSubCategories(categoryId);
      // Reset subCategory if the parent changed
      const currentSub = this.productForm.get('subCategory')?.value;
      if (currentSub && !this.subCategories.find((c) => c._id === currentSub)) {
        this.productForm.get('subCategory')?.setValue('');
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.mainCategories = this.categories.filter((c) => !c.parentCategory);
        // If edit mode and already loaded a category, update subcategories
        if (this.productForm.get('category')?.value) {
          this.updateSubCategories(this.productForm.get('category')?.value);
        }
        console.log('Categories: ', this.mainCategories);
      },
      error: () => console.error('Failed to load categories'),
    });
  }

  updateSubCategories(parentId: string) {
    if (!parentId) {
      this.subCategories = [];
      return;
    }
    // Handle case where parentCategory might be an object or a string ID
    this.subCategories = this.categories.filter((c) => {
      if (!c.parentCategory) return false;
      const pId =
        typeof c.parentCategory === 'string' ? c.parentCategory : (c.parentCategory as any)._id;
      return pId === parentId;
    });
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      shortDescription: [''],
      sku: ['', Validators.required],
      hsnCode: ['', Validators.required],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      comparePrice: [null],
      category: ['', Validators.required],
      subCategory: [''],
      brand: [''],
      tags: [''], // Will split by comma
      quantity: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      isFeatured: [false],
      variants: this.fb.array([]),
    });
  }

  get variants() {
    return this.productForm.get('variants') as FormArray;
  }

  createVariant(data?: any): FormGroup {
    return this.fb.group({
      size: [data?.size || ''],
      color: [data?.color || ''],
      material: [data?.material || ''],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      comparePrice: [data?.comparePrice || null],
      costPrice: [data?.costPrice || null],
      barcode: [data?.barcode || ''],
      weight: [data?.weight || 500],
      quantity: [data?.inventory?.quantity || 0, [Validators.required, Validators.min(0)]],
    });
  }

  addVariant() {
    this.variants.push(this.createVariant());
  }

  removeVariant(index: number) {
    this.variants.removeAt(index);
  }

  loadProduct(id: string) {
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        const p = res.product;
        this.productForm.patchValue({
          name: p.name,
          description: p.description,
          shortDescription: p.shortDescription || '',
          sku: p.sku,
          hsnCode: p.hsnCode || '',
          basePrice: p.basePrice,
          comparePrice: p.comparePrice,
          category: (p.category as any)?._id || p.category,
          subCategory: (p.subCategory as any)?._id || p.subCategory || '',
          brand: p.brand,
          tags: p.tags ? p.tags.join(', ') : '',
          isActive: p.isActive,
          isFeatured: p.isFeatured || false,
          quantity: p.inventory?.quantity || 0,
        });
        this.existingImages = p.images || [];

        // Load variants
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v: any, index: number) => {
            this.variants.push(this.createVariant(v));
            if (v.images && v.images.length > 0) {
              this.variantExistingImages.set(index, v.images);
            }
          });
        }
      },
      error: () => {
        this.toastService.error('Failed to load product details');
        this.router.navigate(['/admin/products']);
      },
    });
  }

  getVariantPreviewImages(index: number): string[] {
    return this.variantPreviewImages.get(index) || [];
  }

  getVariantExistingImages(index: number): string[] {
    return this.variantExistingImages.get(index) || [];
  }

  onVariantFileSelected(event: any, index: number) {
    const files = event.target.files;
    if (files) {
      if (!this.variantSelectedFiles.has(index)) {
        this.variantSelectedFiles.set(index, []);
      }
      if (!this.variantPreviewImages.has(index)) {
        this.variantPreviewImages.set(index, []);
      }

      const currentFiles = this.variantSelectedFiles.get(index)!;
      const currentPreviews = this.variantPreviewImages.get(index)!;

      for (let i = 0; i < files.length; i++) {
        if (currentFiles.length < 5) {
          currentFiles.push(files[i]);

          const reader = new FileReader();
          reader.onload = (e: any) => {
            currentPreviews.push(e.target.result);
          };
          reader.readAsDataURL(files[i]);
        }
      }
    }
  }

  removeVariantSelectedImage(variantIndex: number, imageIndex: number) {
    const currentFiles = this.variantSelectedFiles.get(variantIndex);
    const currentPreviews = this.variantPreviewImages.get(variantIndex);
    if (currentFiles) currentFiles.splice(imageIndex, 1);
    if (currentPreviews) currentPreviews.splice(imageIndex, 1);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (this.selectedFiles.length < 5) {
          this.selectedFiles.push(files[i]);

          // Preview
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.previewImages.push(e.target.result);
          };
          reader.readAsDataURL(files[i]);
        }
      }
    }
  }

  removeSelectedImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewImages.splice(index, 1);
  }

  onSubmit() {
    if (this.productForm.invalid) return;
    this.isSubmitting = true;

    const formData = this.productForm.value;

    // Map form to match backend schema (inventory object for main product and variants)
    const mappedVariants = formData.variants.map((v: any) => {
      const variantPayload: any = {
        ...v,
        inventory: {
          quantity: v.quantity,
          trackQuantity: true,
        },
      };

      // Remove empty variant fields
      if (variantPayload.size === '') delete variantPayload.size;
      if (variantPayload.color === '') delete variantPayload.color;
      if (variantPayload.material === '') delete variantPayload.material;
      if (variantPayload.barcode === '') delete variantPayload.barcode;
      if (variantPayload.comparePrice === '' || variantPayload.comparePrice === null) delete variantPayload.comparePrice;
      if (variantPayload.costPrice === '' || variantPayload.costPrice === null) delete variantPayload.costPrice;

      return variantPayload;
    });

    const payload: any = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      inventory: {
        quantity: formData.quantity,
        trackQuantity: true,
      },
      variants: mappedVariants,
    };

    // Clean up empty optional fields from main product
    if (!payload.subCategory) delete payload.subCategory;
    if (payload.comparePrice === '' || payload.comparePrice === null) delete payload.comparePrice;
    if (payload.brand === '') delete payload.brand;
    if (payload.shortDescription === '') delete payload.shortDescription;

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe({
        next: (res) => this.handleImageUpload(res.product),
        error: (err) => this.handleError(err),
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: (res) => this.handleImageUpload(res.product),
        error: (err) => this.handleError(err),
      });
    }
  }

  handleImageUpload(product: any) {
    if (this.selectedFiles.length === 0) {
      this.handleVariantImageUploads(product);
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach((file) => formData.append('images', file));

    this.productService.uploadProductImages(product._id!, formData).subscribe({
      next: () => this.handleVariantImageUploads(product),
      error: (err) => this.handleError(err),
    });
  }

  handleVariantImageUploads(product: any) {
    const uploadTasks: Promise<any>[] = [];

    // The created/updated product has the variants with their actual database _id's
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any, index: number) => {
        const files = this.variantSelectedFiles.get(index);
        if (files && files.length > 0) {
          const formData = new FormData();
          files.forEach(file => formData.append('images', file));
          
          const req = new Promise((resolve, reject) => {
            this.productService.uploadVariantImages(product._id!, variant._id, formData).subscribe({
              next: res => resolve(res),
              error: err => reject(err)
            });
          });
          uploadTasks.push(req);
        }
      });
    }

    if (uploadTasks.length > 0) {
      Promise.all(uploadTasks).then(() => {
        this.finishSubmission();
      }).catch(err => {
        this.handleError({ error: { message: 'Failed to upload some variant images' } });
      });
    } else {
      this.finishSubmission();
    }
  }

  finishSubmission() {
    this.isSubmitting = false;
    this.toastService.success(`Product ${this.isEditMode ? 'updated' : 'created'} successfully!`);
    this.router.navigate(['/admin/products']);
  }

  handleError(err: any) {
    this.isSubmitting = false;
    
    let errorMsg = 'Unknown error';
    if (err.error && err.error.error) {
      errorMsg = Array.isArray(err.error.error) ? err.error.error.join(', ') : err.error.error;
    } else if (err.error && err.error.message) {
      errorMsg = err.error.message;
    }
    
    this.toastService.error('Operation failed: ' + errorMsg);
  }
}
