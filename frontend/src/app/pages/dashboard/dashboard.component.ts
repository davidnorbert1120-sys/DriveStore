import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CATEGORY_LABELS, Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  readonly categoryLabels = CATEGORY_LABELS;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyProducts();
  }

  loadMyProducts(): void {
    this.loading = true;
    this.productService.getMyProducts().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get userEmail(): string {
    return this.authService.getCurrentUser()?.email ?? '';
  }

  onEdit(product: Product): void {
    console.log('DashboardComponent.onEdit called for product:', product.title);
    this.router.navigate(['/upload'], { queryParams: { id: product.id } });
  }

  onDelete(product: Product): void {
    console.log('DashboardComponent.onDelete called for product:', product.title);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Hirdetés törlése',
        message: `Biztosan törlöd: "${product.title}"?`,
        confirmText: 'Törlés'
      },
      panelClass: 'dark-dialog'
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => {
          console.log('DashboardComponent.onDelete successful for product:', product.title);
          this.products = this.products.filter(p => p.id !== product.id);
          this.snackBar.open('Hirdetés törölve', '✕', { duration: 3000, panelClass: 'snack-success' });
        },
        error: err => {
          console.error('DashboardComponent.onDelete failed:', err);
          this.snackBar.open('Hiba történt', '✕', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    });
  }
}
