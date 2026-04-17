import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BrandResDto, CategoryResDto, ProductResDto } from 'src/app/core/Models/catalog';
import { AdminService } from 'src/app/core/Services/admin.service';
import { AuthService } from 'src/app/core/Services/auth.service';
import { CatalogService } from 'src/app/core/Services/catalog.service';
import { NotificationService } from 'src/app/notification/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('thumbnailInput') thumbnailInput?: ElementRef<HTMLInputElement>;

  productForm!: FormGroup;
  products: ProductResDto[] = [];
  categories: CategoryResDto[] = [];
  brands: BrandResDto[] = [];

  isLoadingProducts = false;
  isSaving = false;
  editingProductId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private adminService: AdminService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadLookups();
    this.loadProducts();
  }

  get isOutOfStockSelected(): boolean {
    return this.productForm?.get('stockStatus')?.value === 'out';
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      name: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      originalPrice: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
      discountPercentage: new FormControl<number | null>(null),
      discountAmount: new FormControl<number | null>(null),
      stockQuantity: new FormControl<number | null>(1, [Validators.required, Validators.min(1)]),
      stockStatus: new FormControl<'in' | 'out'>('in', Validators.required),
      isFeatured: new FormControl(false),
      categoryId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      brandId: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      thumbnail: new FormControl<File | null>(null)
    });

    this.onStockStatusChange();
  }

  onStockStatusChange(): void {
    const stockStatus = this.productForm.get('stockStatus')?.value;
    const stockQuantityControl = this.productForm.get('stockQuantity');

    if (!stockQuantityControl) {
      return;
    }

    if (stockStatus === 'out') {
      stockQuantityControl.setValidators([Validators.required, Validators.min(0)]);
      stockQuantityControl.setValue(0);
      stockQuantityControl.updateValueAndValidity();
      return;
    }

    stockQuantityControl.setValidators([Validators.required, Validators.min(1)]);

    const stockQuantity = Number(stockQuantityControl.value ?? 0);
    if (Number.isNaN(stockQuantity) || stockQuantity < 1) {
      stockQuantityControl.setValue(1);
    }

    stockQuantityControl.updateValueAndValidity();
  }

  private loadLookups(): void {
    this.catalogService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
      }
    });

    this.catalogService.getBrands().subscribe({
      next: (res) => {
        this.brands = res.data ?? [];
      }
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;

    this.catalogService.getProducts({
      pageIndex: 1,
      pageSize: 100,
      sort: 'newest'
    }).subscribe({
      next: (res) => {
        this.products = res.data?.data ?? [];
      },
      error: () => {
        this.isLoadingProducts = false;
        this.notificationService.Error('Unable to load products.');
      },
      complete: () => {
        this.isLoadingProducts = false;
      }
    });
  }

  onThumbnailSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files && target.files.length > 0 ? target.files[0] : null;
    this.productForm.patchValue({ thumbnail: file });
    this.productForm.get('thumbnail')?.markAsDirty();
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const thumbnail = this.productForm.get('thumbnail')?.value as File | null;
    if (this.editingProductId === null && !thumbnail) {
      this.notificationService.Warning('Thumbnail is required for new product.');
      return;
    }

    this.isSaving = true;
    const payload = this.buildProductPayload();

    const request$ = this.editingProductId === null
      ? this.adminService.createProduct(payload)
      : this.adminService.updateProduct(this.editingProductId, payload);

    request$.subscribe({
      next: () => {
        this.notificationService.Success(
          this.editingProductId === null ? 'Product created successfully.' : 'Product updated successfully.'
        );

        this.resetForm();
        this.loadProducts();
      },
      error: () => {
        this.isSaving = false;
        this.notificationService.Error('Unable to save product. Please try again.');
      },
      complete: () => {
        this.isSaving = false;
      }
    });
  }

  editProduct(product: ProductResDto): void {
    this.editingProductId = product.id;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      originalPrice: product.originalPrice,
      discountPercentage: product.discountPercentage,
      discountAmount: product.discountAmount,
      stockQuantity: product.stockQuantity,
      stockStatus: product.inStock ? 'in' : 'out',
      isFeatured: product.isFeatured,
      categoryId: product.category.id,
      brandId: product.brand.id,
      thumbnail: null
    });

    this.onStockStatusChange();

    this.clearThumbnailInput();
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteProduct(product: ProductResDto): void {
    const confirmed = confirm(`Delete product \"${product.name}\"?`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteProduct(product.id).subscribe({
      next: () => {
        this.notificationService.Success('Product deleted successfully.');

        if (this.editingProductId === product.id) {
          this.resetForm();
        }

        this.loadProducts();
      },
      error: () => {
        this.notificationService.Error('Unable to delete product. Please try again.');
      }
    });
  }

  toggleStock(product: ProductResDto): void {
    const setInStock = !product.inStock;
    const stockQuantity = setInStock ? Math.max(product.stockQuantity, 1) : 0;

    this.adminService.updateProductStock(product.id, {
      inStock: setInStock,
      stockQuantity
    }).subscribe({
      next: () => {
        this.notificationService.Success(
          setInStock ? 'Product marked as In Stock.' : 'Product marked as Out of Stock.'
        );
        this.loadProducts();
      },
      error: () => {
        this.notificationService.Error('Unable to update stock status.');
      }
    });
  }

  logout(): void {
    this.authService.LogOut().subscribe({
      error: () => {
        this.router.navigateByUrl('/admin/login');
      }
    });
  }

  trackByProductId(index: number, product: ProductResDto): number {
    return product.id;
  }

  private buildProductPayload(): FormData {
    const payload = new FormData();

    const name = this.productForm.get('name')?.value ?? '';
    const description = this.productForm.get('description')?.value ?? '';
    const originalPrice = Number(this.productForm.get('originalPrice')?.value ?? 0);
    const discountPercentage = this.productForm.get('discountPercentage')?.value;
    const discountAmount = this.productForm.get('discountAmount')?.value;
    const stockStatus = this.productForm.get('stockStatus')?.value;
    let stockQuantity = Number(this.productForm.get('stockQuantity')?.value ?? 0);
    const isFeatured = this.productForm.get('isFeatured')?.value === true;
    const categoryId = Number(this.productForm.get('categoryId')?.value ?? 0);
    const brandId = Number(this.productForm.get('brandId')?.value ?? 0);
    const thumbnail = this.productForm.get('thumbnail')?.value as File | null;

    if (stockStatus === 'out') {
      stockQuantity = 0;
    } else if (Number.isNaN(stockQuantity) || stockQuantity < 1) {
      stockQuantity = 1;
    }

    payload.append('name', String(name));
    payload.append('description', String(description));
    payload.append('originalPrice', String(originalPrice));
    payload.append('stockQuantity', String(stockQuantity));
    payload.append('isFeatured', String(isFeatured));
    payload.append('categoryId', String(categoryId));
    payload.append('brandId', String(brandId));

    if (discountPercentage !== null && discountPercentage !== undefined && String(discountPercentage) !== '') {
      payload.append('discountPercentage', String(discountPercentage));
    }

    if (discountAmount !== null && discountAmount !== undefined && String(discountAmount) !== '') {
      payload.append('discountAmount', String(discountAmount));
    }

    if (thumbnail) {
      payload.append('thumbnail', thumbnail, thumbnail.name);
    }

    return payload;
  }

  private resetForm(): void {
    this.editingProductId = null;
    this.productForm.reset({
      name: '',
      description: '',
      originalPrice: null,
      discountPercentage: null,
      discountAmount: null,
      stockQuantity: 1,
      stockStatus: 'in',
      isFeatured: false,
      categoryId: null,
      brandId: null,
      thumbnail: null
    });

    this.onStockStatusChange();

    this.clearThumbnailInput();
  }

  private clearThumbnailInput(): void {
    if (this.thumbnailInput?.nativeElement) {
      this.thumbnailInput.nativeElement.value = '';
    }
  }
}
