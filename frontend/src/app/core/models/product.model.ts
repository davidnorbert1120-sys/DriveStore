export enum Category {
  KAROSSZERIA = 'KAROSSZERIA',
  MOTOR = 'MOTOR',
  FUTOMUW = 'FUTOMUW',
  ELEKTRONIKA = 'ELEKTRONIKA'
}

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.KAROSSZERIA]: 'Karosszéria',
  [Category.MOTOR]: 'Motor',
  [Category.FUTOMUW]: 'Futómű',
  [Category.ELEKTRONIKA]: 'Elektronika'
};

export const CATEGORY_ICONS: Record<Category, string> = {
  [Category.KAROSSZERIA]: 'directions_car',
  [Category.MOTOR]: 'settings',
  [Category.FUTOMUW]: 'tire_repair',
  [Category.ELEKTRONIKA]: 'electric_bolt'
};

export interface Product {
  id: number;
  title: string;
  price: number;
  category: Category;
  imageUrl: string;
  userId: number;
  userEmail: string;
  createdAt: string;
}

export interface CreateProductRequest {
  title: string;
  price: number;
  category: Category;
  imageUrl: string;
}

export interface ProductEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED';
  product: Product;
}
