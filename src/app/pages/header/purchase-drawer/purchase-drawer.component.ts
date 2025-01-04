import { Component, Output, EventEmitter } from '@angular/core';
import { NzDrawerComponent } from 'ng-zorro-antd/drawer';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';
import { NzMessageComponent, NzMessageService } from 'ng-zorro-antd/message';
import { UserDataService } from '../../../../data/data';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [
    NzDrawerComponent,
    NzButtonComponent,
    NzModalModule,
    CommonModule,
    NzQRCodeModule,
    NzMessageComponent
  ],
  template: `
    <nz-modal
      [nzVisible]="visible"
      (nzOnClose)="close()"
      [nzTitle]="'Phương thức thanh toán'"
      [nzFooter]="footer"
      [nzClosable]="true"
      [nzContent]="nzDrawerContent"
    >
      <ng-template #nzDrawerContent>
        <div class="payment-options">
          <div class="payment-steps">
            <div class="step">
              <strong>Bước 1:</strong>
              <a> Chọn phương thức thanh toán</a>
            </div>
            <div class="step">
              <strong>Bước 2:</strong>
              <a> Quét mã QR để thanh toán </a>
            </div>
          </div>
          <div
            *ngFor="let method of paymentMethods"
            class="payment-method"
            [class.selected]="selectedMethod === method"
            (click)="selectMethod(method)"
          >
            <div class="method-info">
              <div [innerHTML]="method.icon" class="method-icon"></div>
              <span class="method-name">{{ method.name }}</span>
            </div>
            <span class="amount">{{ amount | currency:'VND':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <div *ngIf="selectedMethod" class="qr-code-section">
          <nz-qrcode [nzValue]="selectedMethod.qrCode" [nzSize]="200"></nz-qrcode>
          <p class="qr-instruction">Quét mã QR để thanh toán {{ amount | currency:'VND':'symbol':'1.0-0' }}</p>
        </div>
      </ng-template>
      <ng-template #footer>
        <div class="footer-container">
          <button nz-button nzType="default" (click)="close()">Hủy</button>
          <button
            nz-button
            nzType="primary"
            [disabled]="!selectedMethod"
            (click)="onSubmit()"
            [nzLoading]="isSubmitting"
          >
            Xác nhận thanh toán
          </button>
        </div>
      </ng-template>  

    </nz-modal>
  `,
  styles: [`
    .payment-options {
      margin-bottom: 20px;
    }
    
    .payment-steps {
      margin-bottom: 20px;
    }
    
    .step {
      margin-bottom: 10px;
    }
    
    .payment-method {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .payment-method:hover {
      background-color: #f5f5f5;
    }
    
    .payment-method.selected {
      border-color: #1890ff;
      background-color: #e6f7ff;
    }
    
    .method-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .footer-container {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }
    
    .method-icon {
      width: 32px;
      height: 32px;
    }
    
    .method-icon svg {
      width: 32px;
      height: 32px;
    }
    
    .qr-code-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 20px;
    }
    
    .qr-instruction {
      margin-top: 12px;
      text-align: center;
      color: #666;
    }
  `]
})
export class PaymentModalComponent {
  @Output() paymentCompleted = new EventEmitter<boolean>();
  visible = false;
  selectedMethod: any = null;
  isSubmitting = false;
  amount = 100000;

  // SVG icons embedded directly
  momoIcon = `<svg viewBox="0 0 1025 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M92 1024c-45-3-78.3-36.4-88.1-78.9C2.7 940.1 2 935 1 930V96c0.3-1.4 0.8-2.9 1-4.3C8.1 50.2 31 22.1 69.9 7.2 78.2 4 87.3 3 96 1h834c1.3 0.3 2.5 0.8 3.8 1 43.2 4.9 78.6 36.5 88.3 78.9 1.1 5 1.9 10.1 2.9 15.1v834c-0.3 1.4-0.8 2.9-1 4.3-6.1 41.4-28.9 69.6-67.9 84.5-8.3 3.2-17.1 5.2-26.1 5.2" fill="#AF026E"/>`;

  zaloPayIcon = `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path d="M512 1024C229.218462 1024 0 794.781538 0 512S229.218462 0 512 0s512 229.218462 512 512-229.218462 512-512 512z" fill="#0090E6"/>`;

  paymentMethods = [
    {
      name: 'Momo',
      icon: this.momoIcon,
      qrCode: 'momo://payment/123456789'
    },
    {
      name: 'ZaloPay',
      icon: this.zaloPayIcon,
      qrCode: 'zalopay://payment/123456789'
    }
  ];

  constructor(
    private message: NzMessageService,
    private userService: UserDataService
  ) { }

  open() {
    this.visible = true;
  }

  close() {
    this.visible = false;
    this.selectedMethod = null;
  }

  selectMethod(method: any) {
    this.selectedMethod = method;
  }

  async onSubmit() {
    if (!this.selectedMethod) return;

    this.isSubmitting = true;

    try {
      // Simulate payment verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get current user's UID
      const uid = this.userService.getCurrentUserUid();

      this.message.success('Thanh toán thành công!');
      this.isSubmitting = false;
      this.paymentCompleted.emit(true);
      this.close();
    } catch (error) {
      console.error('Payment error:', error);
      this.message.error('Thanh toán thất bại. Vui lòng thử lại.');
      this.paymentCompleted.emit(false);
      this.isSubmitting = false;
    }
  }

  onPaymentComplete() {
    return this.paymentCompleted.asObservable();
  }
}