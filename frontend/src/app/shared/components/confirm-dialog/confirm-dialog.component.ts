import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="dialog">
      <h2 class="dialog__title">{{ data.title }}</h2>
      <p class="dialog__message">{{ data.message }}</p>
      <div class="dialog__actions">
        <button class="dialog__btn dialog__btn--cancel" (click)="cancel()">
          {{ data.cancelText || 'Mégse' }}
        </button>
        <button class="dialog__btn dialog__btn--confirm" (click)="confirm()">
          {{ data.confirmText || 'Megerősítés' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog {
      background: #1a1a1a;
      padding: 1.5rem;
      border-radius: 12px;
      min-width: 320px;

      &__title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #f1f1f1;
        margin: 0 0 0.75rem;
      }

      &__message {
        color: #a0a0a0;
        font-size: 0.9rem;
        margin: 0 0 1.5rem;
        line-height: 1.5;
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      &__btn {
        padding: 0.5rem 1.25rem;
        border-radius: 8px;
        border: none;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &--cancel {
          background: #222;
          color: #a0a0a0;
          border: 1px solid #333;
          &:hover { background: #2a2a2a; color: #fff; }
        }

        &--confirm {
          background: #f97316;
          color: #fff;
          &:hover { background: #ea6900; }
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  confirm(): void { this.dialogRef.close(true); }
  cancel(): void { this.dialogRef.close(false); }
}
