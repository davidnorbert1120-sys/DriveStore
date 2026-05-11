import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Category, CATEGORY_LABELS } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent implements OnInit {
  form: FormGroup;
  loading = false;
  uploadingImage = false;
  editId: number | null = null;
  imagePreview = '';

  readonly categories = Object.values(Category);
  readonly categoryLabels = CATEGORY_LABELS;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    public router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      price: ['', [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.editId = +params['id'];
        this.productService.getById(this.editId).subscribe(product => {
          this.form.patchValue(product);
          this.imagePreview = product.imageUrl;
        });
      }
    });

  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = e => { this.imagePreview = e.target?.result as string; };
    reader.readAsDataURL(file);

    console.log('UploadComponent.onFileSelected called:', file.name);
    this.uploadingImage = true;
    this.productService.uploadImage(file).subscribe({
      next: res => {
        console.log('UploadComponent image upload successful:', res.url);
        this.form.patchValue({ imageUrl: res.url });
        this.uploadingImage = false;
      },
      error: err => {
        console.error('UploadComponent image upload failed:', err);
        this.snackBar.open('Képfeltöltés sikertelen', '✕', { duration: 3000, panelClass: 'snack-error' });
        this.uploadingImage = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const request = { ...this.form.value, price: +this.form.value.price };
    console.log('UploadComponent.onSubmit called:', this.editId ? `edit id=${this.editId}` : 'new', request.title);
    const action$ = this.editId
      ? this.productService.update(this.editId, request)
      : this.productService.create(request);

    action$.subscribe({
      next: product => {
        console.log('UploadComponent submit successful for product:', product.title);
        this.snackBar.open(
          this.editId ? 'Hirdetés frissítve!' : 'Hirdetés feltöltve!',
          '✕', { duration: 3000, panelClass: 'snack-success' }
        );
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        console.error('UploadComponent submit failed:', err);
        this.snackBar.open('Hiba történt', '✕', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
