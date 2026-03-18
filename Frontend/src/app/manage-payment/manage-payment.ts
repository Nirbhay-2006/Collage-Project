import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Adminservice } from '../Service/AdminService/adminservice';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
declare var bootstrap: any;
@Component({
  selector: 'app-manage-payment',
  imports: [CommonModule,FormsModule],
  templateUrl: './manage-payment.html',
  styleUrl: './manage-payment.css',
})
export class ManagePayment {
  constructor(
    private service: Adminservice,
    private cd: ChangeDetectorRef,
  ) {}
  payments: any[] = [];
  selectedPayment: any = null;
  isLoading = false;
  islist = false;
  errorMessage: string | null = null;

  @ViewChild('detailModal') detailModal!: ElementRef;

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.islist = true;
    this.service.GetAllPayments().subscribe({
      next: (res) => {
        this.islist = false;
        this.payments = res;
        this.cd.detectChanges();
      },
      error: () => {
        this.islist = false;
        this.errorMessage = 'Failed to load payments';
        this.cd.detectChanges();
      },
    });
  }

  openDetailModal(id: number) {
    this.isLoading = true;
    this.errorMessage = null;

    const modal = new bootstrap.Modal(this.detailModal.nativeElement);
    modal.show();

    this.service.GetPaymentDetail(id).subscribe({
      next: (res) => {
        this.selectedPayment = res;
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load details';
        this.isLoading = false;
        this.cd.detectChanges();
      },
    });
  }

  checkPaymentId: string = '';
  checkResult: any = null;
  checkError: string | null = null;
  isChecking = false;

  @ViewChild('checkModal') checkModal!: ElementRef;

  openCheckModal(paymentId?: string) {
    this.checkPaymentId = paymentId || '';
    this.checkResult = null;
    this.checkError = null;

    const modal = new bootstrap.Modal(this.checkModal.nativeElement);
    modal.show();
  }

  checkPayment() {
    if (!this.checkPaymentId) return;

    this.isChecking = true;
    this.checkResult = null;
    this.checkError = null;

    this.service.CheckPayment(this.checkPaymentId).subscribe({
      next: (res) => {
        this.checkResult = res;
        this.isChecking = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        if (err.status === 0) {
          this.checkError = 'Server not reachable';
        } else if (err.error?.message) {
          this.checkError = err.error.message;
        } else {
          this.checkError = 'Failed to check payment';
        }
        this.isChecking = false;
        this.cd.detectChanges();
      },
    });
  }


}
