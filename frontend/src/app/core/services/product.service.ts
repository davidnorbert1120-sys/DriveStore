import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CreateProductRequest, Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly BASE = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(category?: Category): Observable<Product[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    console.log('ProductService.getAll called, category:', category ?? 'all');
    return this.http.get<Product[]>(this.BASE, { params });
  }

  getById(id: number): Observable<Product> {
    console.log('ProductService.getById called for id:', id);
    return this.http.get<Product>(`${this.BASE}/${id}`);
  }

  getMyProducts(): Observable<Product[]> {
    console.log('ProductService.getMyProducts called');
    return this.http.get<Product[]>(`${this.BASE}/my`);
  }

  create(request: CreateProductRequest): Observable<Product> {
    console.log('ProductService.create called:', request.title);
    return this.http.post<Product>(this.BASE, request);
  }

  update(id: number, request: CreateProductRequest): Observable<Product> {
    console.log('ProductService.update called for id:', id);
    return this.http.put<Product>(`${this.BASE}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    console.log('ProductService.delete called for id:', id);
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    console.log('ProductService.uploadImage called:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/upload/image`, formData);
  }
}
