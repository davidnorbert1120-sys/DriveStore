import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';
import { ProductEvent } from '../models/product.model';
import { Message } from '../models/message.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private client?: Client;
  private productEvents$ = new Subject<ProductEvent>();
  private messageEvents$ = new Subject<Message>();
  private messageSub?: StompSubscription;
  private pendingMessageTopic?: string;

  connect(): void {
    if (this.client) return;
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as any,
      reconnectDelay: 5000,
      onConnect: () => {
        this.client!.subscribe('/topic/products', message => {
          const event: ProductEvent = JSON.parse(message.body);
          this.productEvents$.next(event);
        });
        if (this.pendingMessageTopic) {
          this.doSubscribeMessages(this.pendingMessageTopic);
        }
      }
    });
    this.client.activate();
  }

  getProductEvents(): Observable<ProductEvent> {
    return this.productEvents$.asObservable();
  }

  getMessageEvents(): Observable<Message> {
    return this.messageEvents$.asObservable();
  }

  subscribeToMessages(productId: number, userId: number): void {
    const topic = `/topic/messages/${productId}/${userId}`;
    this.messageSub?.unsubscribe();
    this.pendingMessageTopic = topic;
    if (this.client?.connected) {
      this.doSubscribeMessages(topic);
    }
  }

  private doSubscribeMessages(topic: string): void {
    this.messageSub = this.client!.subscribe(topic, message => {
      const msg: Message = JSON.parse(message.body);
      this.messageEvents$.next(msg);
    });
  }

  unsubscribeFromMessages(): void {
    this.messageSub?.unsubscribe();
    this.messageSub = undefined;
    this.pendingMessageTopic = undefined;
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = undefined;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
