import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { Doctor, System, UserDataService } from '../../../../data/data';
import { TimePickerComponent } from '../time-picker/time-picker.component';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { DoctorStore } from '../doctor.store';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTextareaCountComponent } from 'ng-zorro-antd/input';
import { Subscription } from 'rxjs';
import { catchError, concatMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EmailVerificationService } from '../../../../component/email';
import { HeaderComponent } from '../../header/header.component';
import { MainStore } from '../../main-app.component.store';
import { PaymentModalComponent } from '../../header/purchase-drawer/purchase-drawer.component';
interface TimeAndDateSelection {
  time: string;
  date: Date;
}

@Component({
  selector: 'app-doctor-modal',
  standalone: true,
  imports: [
    CommonModule,
    NzDrawerModule,
    NzGridModule,
    NzFormModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzInputModule,
    TimePickerComponent,
    NzTextareaCountComponent,
    NzLayoutModule,
    PaymentModalComponent
  ],
  templateUrl: './doctor-modal.component.html',
  styleUrl: './doctor-modal.component.css',
  providers: [DoctorStore, System, UserDataService, TimePickerComponent, HeaderComponent]
})
export class DoctorModalComponent implements OnInit, OnDestroy {
  readonly visible$ = this.store.is_modal$;
  readonly form_value$ = this.store.modal_value$;
  private destroy$ = new Subject<void>();
  private valueSubscription?: Subscription;
  readonly timeDisable$ = this.store.timeDisable$;
  doctor: string = '';
  doctorId: string = '';
  @ViewChild(TimePickerComponent) timePickerComponent!: TimePickerComponent;
  @ViewChild('paymentModal') paymentModal!: PaymentModalComponent;
  form = new UntypedFormGroup({
    comment: new UntypedFormControl(null, [Validators.required, Validators.maxLength(500)]),
    selectedDate: new UntypedFormControl(null, [Validators.required]),
    selectedTime: new UntypedFormControl(null, [Validators.required])
  });

  constructor(
    private store: DoctorStore,
    private timePicker: TimePickerComponent,// Inject TimePickerComponent
    private message: NzMessageService,
    private userDataService: UserDataService,
    private emailVerificationService: EmailVerificationService,
    private header: HeaderComponent,
    private turn: MainStore
  ) {
    
  }

  ngOnInit() {
    localStorage.removeItem('selectedDate');
    localStorage.removeItem('selectedTime');
    this.valueSubscription = this.form_value$
      .pipe(takeUntil(this.destroy$))
      .subscribe((x) => {
        if (x && x.name) {
          this.doctor = x.name;
          this.doctorId = x.id;
        }
        else {
          this.doctor = '';
        }
        this.resetForm();
      });

    // Initialize form with default values
    this.resetForm();
  }

  ngOnDestroy() {
    this.form.patchValue({
      name: ''
    })
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTimeAndDateSelected(selection: TimeAndDateSelection | null) {
    if (selection) {
      // Use Object.assign to create a new object and prevent circular references
      const formValue = {
        selectedDate: new Date(selection.date),
        selectedTime: selection.time
      };

      this.form.patchValue(formValue, {
        emitEvent: false,
        onlySelf: true
      });
    } else {
      this.form.patchValue({
        selectedDate: null,
        selectedTime: null,
      }, {
        emitEvent: false,
        onlySelf: true
      });
    }
  }

  onClose() {
    this.resetForm();
    this.store.setIsModal(false);
  }

  submitAppointment() {
    if (this.form.valid) {
      const formData = {
        ...this.form.value,
        selectedDate: this.form.get('selectedDate')?.value,
        selectedTime: this.form.get('selectedTime')?.value,
        comment: this.form.get('comment')?.value
      };

      // Show payment modal first
      this.paymentModal.open();

      // Subscribe to payment completion
      this.paymentModal.onPaymentComplete().subscribe(
        (success) => {
          if (success) {
            this.message
              .loading('Action in progress', { nzDuration: 2500 })
              .onClose!.pipe(
                concatMap(() => {
                  const uid = this.userDataService.getCurrentUserUid();
                  if (formData.selectedDate) {
                    return this.userDataService.createAppointment(
                      uid, 
                      this.doctorId, 
                      this.doctor, 
                      formData.selectedTime, 
                      formData.selectedDate, 
                      formData.comment
                    );
                  } else {
                    throw new Error('Selected date is null');
                  }
                }),
                concatMap((appointmentId) => {
                  const email = this.userDataService.getCurrentUserEmail();
                  const name = this.userDataService.getCurrentUserName();
                  this.emailVerificationService.sendAppointmentEmail(
                    email,
                    name,
                    appointmentId,
                    formData.selectedDate.toLocaleDateString(),
                    formData.selectedTime,
                    this.doctor
                  );
                  return this.message.success('Đăng ký khám thành công!', { nzDuration: 2500 }).onClose!;
                }),
                catchError((error) => {
                  switch (error.message) {
                    case 'No turns available':
                      this.message.error('Bạn không đủ lượt để đặt lịch khám');
                      break;
                    default:
                      this.message.error('Đăng ký không thành công. Vui lòng thử lại.');
                  }
                  return this.message.error('Đăng ký không thành công', { nzDuration: 2500 }).onClose!;
                })
              )
              .subscribe(() => {
                this.turn.setTurn();
                this.onClose();
              });
          }
        }
      );
    } else {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  resetForm(): void {
    // Suspend form value emission during reset
    this.form.reset(undefined, {
      emitEvent: false,
      onlySelf: true
    });

    // Set default values without emitting events
    this.form.patchValue({
      comment: null,
      selectedDate: null,
      selectedTime: null
    }, {
      emitEvent: false,
      onlySelf: true
    });

    // Reset TimePicker using the injected service
    this.timePicker.clearSelections();

    // Mark form as pristine and untouched
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}