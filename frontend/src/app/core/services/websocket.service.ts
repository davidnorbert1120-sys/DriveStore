import { Injectable, OnDestroy } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { ProductEvent } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private client!: Client;
  private productEvents$ = new Subject<ProductEvent>();

  connect(): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as any,
      reconnectDelay: 5000,
      onConnect: () => {
        this.client.subscribe('/topic/products', message => {
          const event: ProductEvent = JSON.parse(message.body);
          this.productEvents$.next(event);
        });
      }
    });
    this.client.activate();
  }

  getProductEvents(): Observable<ProductEvent> {
    return this.productEvents$.asObservable();
  }

  disconnect(): void {
    this.client?.deactivate();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
