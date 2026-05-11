import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../models/message.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly BASE = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  getByProduct(productId: number): Observable<Message[]> {
    console.log('MessageService.getByProduct called for productId:', productId);
    return this.http.get<Message[]>(`${this.BASE}/product/${productId}`);
  }

  send(productId: number, content: string, receiverId?: number): Observable<Message> {
    console.log('MessageService.send called for productId:', productId, 'receiverId:', receiverId);
    return this.http.post<Message>(this.BASE, { productId, content, receiverId });
  }
}
