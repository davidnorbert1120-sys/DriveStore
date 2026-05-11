import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CATEGORY_ICONS, CATEGORY_LABELS, Product } from '../../core/models/product.model';
import { Message, ConversationPartner } from '../../core/models/message.model';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatThread') chatThread?: ElementRef;

  product: Product | null = null;
  loading = true;
  imageError = false;
  lightboxOpen = false;

  allMessages: Message[] = [];
  messagesLoading = false;
  newMessage = '';
  sendingMessage = false;
  selectedPartner: ConversationPartner | null = null;
  private shouldScrollChat = false;
  private wsSub?: Subscription;

  readonly categoryLabels = CATEGORY_LABELS;
  readonly categoryIcons = CATEGORY_ICONS;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private productService: ProductService,
    private authService: AuthService,
    private messageService: MessageService,
    private wsService: WebsocketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.getById(id).subscribe({
      next: p => {
        this.product = p;
        this.loading = false;
        if (this.isLoggedIn) {
          this.loadMessages();
          this.subscribeToIncomingMessages();
        }
      },
      error: () => { this.loading = false; this.router.navigate(['/products']); }
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsService.unsubscribeFromMessages();
  }

  private subscribeToIncomingMessages(): void {
    if (!this.product) return;
    this.wsService.connect();
    this.wsService.subscribeToMessages(this.product.id, this.currentUserId);
    this.wsSub = this.wsService.getMessageEvents().subscribe(msg => {
      if (this.allMessages.some(m => m.id === msg.id)) return;
      this.allMessages = [...this.allMessages, msg];
      this.shouldScrollChat = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollChat) {
      this.scrollChatToBottom();
      this.shouldScrollChat = false;
    }
  }

  get isOwner(): boolean {
    return this.authService.getCurrentUser()?.userId === this.product?.userId;
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUserEmail(): string {
    return this.authService.getCurrentUser()?.email ?? '';
  }

  get currentUserId(): number {
    return this.authService.getCurrentUser()?.userId ?? 0;
  }

  /** Unique buyers who messaged the owner (for owner's conversation list) */
  get conversationPartners(): ConversationPartner[] {
    const seen = new Map<number, ConversationPartner>();
    for (const m of this.allMessages) {
      if (m.senderUserId !== this.currentUserId && !seen.has(m.senderUserId)) {
        seen.set(m.senderUserId, { userId: m.senderUserId, email: m.senderEmail });
      }
    }
    return Array.from(seen.values());
  }

  /** Messages in the currently selected thread */
  get threadMessages(): Message[] {
    if (!this.isOwner) return this.allMessages;
    if (!this.selectedPartner) return [];
    return this.allMessages.filter(
      m => m.senderUserId === this.selectedPartner!.userId ||
           (m.senderUserId === this.currentUserId && this.isMessageInThread(m))
    );
  }

  private isMessageInThread(ownerMsg: Message): boolean {
    const idx = this.allMessages.indexOf(ownerMsg);
    for (let i = idx - 1; i >= 0; i--) {
      if (this.allMessages[i].senderUserId !== this.currentUserId) {
        return this.allMessages[i].senderUserId === this.selectedPartner?.userId;
      }
    }
    return false;
  }

  selectPartner(partner: ConversationPartner): void {
    this.selectedPartner = partner;
    this.shouldScrollChat = true;
  }

  openChat(): void {
    document.querySelector('.chat-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  loadMessages(): void {
    if (!this.product) return;
    this.messagesLoading = true;
    this.messageService.getByProduct(this.product.id).subscribe({
      next: msgs => {
        this.allMessages = msgs;
        this.messagesLoading = false;
        if (!this.isOwner) this.shouldScrollChat = true;
      },
      error: () => { this.messagesLoading = false; }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.product || this.sendingMessage) return;
    if (this.isOwner && !this.selectedPartner) return;

    console.log('ProductDetailComponent.sendMessage called for product:', this.product.title);
    this.sendingMessage = true;
    const receiverId = this.isOwner ? this.selectedPartner!.userId : undefined;

    this.messageService.send(this.product.id, this.newMessage.trim(), receiverId).subscribe({
      next: msg => {
        console.log('ProductDetailComponent.sendMessage successful, id:', msg.id);
        this.allMessages = [...this.allMessages, msg];
        this.newMessage = '';
        this.sendingMessage = false;
        this.shouldScrollChat = true;
      },
      error: err => {
        console.error('ProductDetailComponent.sendMessage failed:', err);
        this.snackBar.open('Üzenet küldése sikertelen', '✕', { duration: 3000, panelClass: 'snack-error' });
        this.sendingMessage = false;
      }
    });
  }

  private scrollChatToBottom(): void {
    if (this.chatThread) {
      this.chatThread.nativeElement.scrollTop = this.chatThread.nativeElement.scrollHeight;
    }
  }

  onBuy(): void {
    if (!this.product) return;
    console.log('ProductDetailComponent.onBuy called for product:', this.product.title);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Biztosan meg akarod venni: "${this.product.title}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed || !this.product) return;
      this.productService.buy(this.product.id).subscribe({
        next: () => {
          console.log('ProductDetailComponent.onBuy successful for product:', this.product?.title);
          this.snackBar.open('Sikeres vásárlás!', '✕', { duration: 3000, panelClass: 'snack-success' });
          this.router.navigate(['/products']);
        },
        error: err => {
          console.error('ProductDetailComponent.onBuy failed:', err);
          this.snackBar.open('Hiba történt', '✕', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    });
  }

  onEdit(): void {
    if (this.product) {
      console.log('ProductDetailComponent.onEdit called for product:', this.product.title);
      this.router.navigate(['/upload'], { queryParams: { id: this.product.id } });
    }
  }

  onDelete(): void {
    if (!this.product) return;
    console.log('ProductDetailComponent.onDelete called for product:', this.product.title);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Biztosan törlöd: "${this.product.title}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed || !this.product) return;
      this.productService.delete(this.product!.id).subscribe({
        next: () => {
          console.log('ProductDetailComponent.onDelete successful for product:', this.product?.title);
          this.snackBar.open('Hirdetés törölve', '✕', { duration: 3000, panelClass: 'snack-success' });
          this.router.navigate(['/products']);
        },
        error: err => {
          console.error('ProductDetailComponent.onDelete failed:', err);
          this.snackBar.open('Hiba történt', '✕', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    });
  }

  getFormattedDate(): string {
    if (!this.product) return '';
    return new Date(this.product.createdAt).toLocaleDateString('hu-HU', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatMsgTime(sentAt: string): string {
    return new Date(sentAt).toLocaleString('hu-HU', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
