import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CATEGORY_ICONS, CATEGORY_LABELS, Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() buyClick = new EventEmitter<Product>();
  @Output() editClick = new EventEmitter<Product>();
  @Output() deleteClick = new EventEmitter<Product>();

  imageError = false;

  readonly categoryLabels = CATEGORY_LABELS;
  readonly categoryIcons = CATEGORY_ICONS;

  constructor(private authService: AuthService, private router: Router) {}

  get isOwner(): boolean {
    return this.authService.getCurrentUser()?.userId === this.product.userId;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onImageError(): void {
    this.imageError = true;
  }

  goToDetail(): void {
    this.router.navigate(['/products', this.product.id]);
  }

  onBuy(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/auth']);
      return;
    }
    this.buyClick.emit(this.product);
  }

  onEdit(): void {
    this.editClick.emit(this.product);
  }

  onDelete(): void {
    this.deleteClick.emit(this.product);
  }

  getTimeAgo(): string {
    const diff = Date.now() - new Date(this.product.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} perce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} órája`;
    const days = Math.floor(hours / 24);
    return `${days} napja`;
  }
}
