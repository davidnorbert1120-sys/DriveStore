import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Category, CATEGORY_LABELS, Product } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = true;
  selectedCategory: Category | null = null;
  private wsSub?: Subscription;

  readonly categories = Object.values(Category);
  readonly categoryLabels = CATEGORY_LABELS;

  constructor(
    private productService: ProductService,
    private wsService: WebsocketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const cat = this.route.snapshot.queryParamMap.get('category') as Category | null;
    if (cat && Object.values(Category).includes(cat)) {
      this.selectedCategory = cat;
    }
    this.loadProducts();
    this.wsService.connect();
    this.wsSub = this.wsService.getProductEvents().subscribe(event => {
      if (event.type === 'CREATED') {
        this.products = [event.product, ...this.products];
      } else if (event.type === 'UPDATED') {
        this.products = this.products.map(p => p.id === event.product.id ? event.product : p);
      } else if (event.type === 'DELETED') {
        this.products = this.products.filter(p => p.id !== event.product.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsService.disconnect();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll(this.selectedCategory ?? undefined).subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  filterBy(category: Category | null): void {
    console.log('ProductsComponent.filterBy called:', category ?? 'all');
    this.selectedCategory = category;
    this.loadProducts();
  }

  onBuy(product: Product): void {
    console.log('ProductsComponent.onBuy called for product:', product.title);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Megvásárlás megerősítése',
        message: `Biztosan megveszed: "${product.title}"?`,
        confirmText: 'Megveszem',
        cancelText: 'Mégse'
      },
      panelClass: 'dark-dialog'
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => {
          console.log('ProductsComponent.onBuy successful for product:', product.title);
          this.snackBar.open('Vásárlás sikeres!', '✕', { duration: 3000, panelClass: 'snack-success' });
        },
        error: err => {
          console.error('ProductsComponent.onBuy failed:', err);
          this.snackBar.open('Hiba történt', '✕', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    });
  }

  onEdit(product: Product): void {
    console.log('ProductsComponent.onEdit called for product:', product.title);
    this.router.navigate(['/upload'], { queryParams: { id: product.id } });
  }

  onDelete(product: Product): void {
    console.log('ProductsComponent.onDelete called for product:', product.title);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Hirdetés törlése',
        message: `Biztosan törlöd: "${product.title}"?`,
        confirmText: 'Törlés',
      },
      panelClass: 'dark-dialog'
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: () => {
          console.log('ProductsComponent.onDelete successful for product:', product.title);
          this.snackBar.open('Hirdetés törölve', '✕', { duration: 3000, panelClass: 'snack-success' });
        },
        error: err => {
          console.error('ProductsComponent.onDelete failed:', err);
          this.snackBar.open('Hiba történt', '✕', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    });
  }
}
