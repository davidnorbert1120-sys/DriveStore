import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Category } from '../../core/models/product.model';

interface CategoryCard {
  icon: string;
  label: string;
  description: string;
  color: string;
  category: Category;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly categories: CategoryCard[] = [
    { icon: '🚗', label: 'Karosszéria', description: 'Lökhárítók, ajtók, sárvédők, motorháztetők', color: '#f97316', category: Category.KAROSSZERIA },
    { icon: '⚙️', label: 'Motor', description: 'Motorblokkok, hengerfejek, vezérlések', color: '#3b82f6', category: Category.MOTOR },
    { icon: '🔩', label: 'Futómű', description: 'Lengéscsillapítók, rugók, kerékagy', color: '#22c55e', category: Category.FUTOMUW },
    { icon: '⚡', label: 'Elektronika', description: 'ECU, érzékelők, világítás, multimédia', color: '#a855f7', category: Category.ELEKTRONIKA },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  goToProducts(category?: Category): void {
    this.router.navigate(['/products'], category ? { queryParams: { category } } : {});
  }
  goToRegister(): void { this.router.navigate(['/auth']); }
  goToLogin(): void { this.router.navigate(['/auth']); }
}
