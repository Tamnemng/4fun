import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorStore } from '../../doctor/doctor.store';
import { System, UserDataService } from '../../../../data/data';
import { TimePickerComponent } from '../../doctor/time-picker/time-picker.component';
import { Doctor } from '../../../../data/data';
import { EmailVerificationService } from '../../../../component/email';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HeaderComponent } from '../../header/header.component';
import { MainStore } from '../../main-app.component.store';
interface TimeAndDateSelection {
  time: string;
  date: Date;
}


@Component({
  selector: 'app-welcome-form',
  templateUrl: './welcome-form.component.html',
  styleUrl: './welcome-form.component.css',
  providers: [System, UserDataService, DoctorStore, TimePickerComponent, HeaderComponent],
})
export class WelcomeFormComponent implements OnInit {
  currentPage = 1;
  pageSize = 18;
  readonly filteredDoctors$ = this.store.filteredDoctors$;
  steps = 0;
  isVisible = false;
  selectedDoctor: string | null = null;
  selectedDoctorFullName: string | null = null;
  @ViewChild(TimePickerComponent)
  timePickerComponent!: TimePickerComponent;
  disableTime = [
    '241204 14:30',
    '241204 15:00'
  ]
  form = new UntypedFormGroup({
    selectedType: new UntypedFormControl(null, [Validators.required]),
    comment: new UntypedFormControl(null, [Validators.required, Validators.maxLength(500)]),
    selectedDate: new UntypedFormControl(null, [Validators.required]),
    selectedTime: new UntypedFormControl(null, [Validators.required]),
    selectedDoctorFullName: new UntypedFormControl(null)
  });

  ngOnInit(): void {
    this.resetForm();
    this.store.setData();
    localStorage.removeItem('selectedDate');
    localStorage.removeItem('selectedTime');
  }

  constructor(
    private store: DoctorStore,
    private timePicker: TimePickerComponent,
    private userDataService: UserDataService,
    private emailVerificationService: EmailVerificationService,
    private message: NzMessageService,
    private header: HeaderComponent,
    private turn: MainStore
  ) {
  }

  resetForm(): void {
    this.form.reset();
    this.form.patchValue({
      selectedType: null,
      comment: null,
      selectedDate: null,
      selectedTime: null,
      selectedDoctorFullName: null
    });
    this.selectedDoctor = null;
    this.selectedDoctorFullName = null;
    if (this.timePickerComponent) {
      this.timePickerComponent.availableTimes.forEach(time => {
        time.selected = false;
        time.disabled = true;
      });
    }
    this.steps = 0;
  }

  // Handle time and date selection from TimePickerComponent
  onTimeAndDateChange(selection: { time: string, date: Date } | null): void {
    console.log('Selection received:', selection);
    
    if (selection) {
      console.log('Date:', selection.date);
      console.log('Time:', selection.time);
      
      this.form.patchValue({ 
        selectedDate: selection.date, 
        selectedTime: selection.time 
      });
    } else {
      console.log('Selection is null');
      this.form.patchValue({ 
        selectedDate: null, 
        selectedTime: null 
      });
    }
  }

  // New method to select a doctor
  selectDoctor(doctor: Doctor): void {
    // If the same doctor is clicked again, unselect
    this.selectedDoctor = this.selectedDoctor === doctor.id ? null : doctor.id;
    this.selectedDoctorFullName = this.selectedDoctor ? doctor.name : null;

    // Update the form with the selected doctor's full name
    this.form.patchValue({
      selectedDoctorFullName: this.selectedDoctorFullName
    });
  }

  onback(): void {
    if (this.steps > 0) {
      this.steps--;
    }
  }

  oncontinue(): void {
    // Validate current step before continuing
    if (this.isCurrentStepValid()) {
      this.steps++;
      this.store.setFiltersTag(this.form.get('selectedType')?.value);
    } else {
      this.markCurrentStepControlsAsDirty();
    }
  }

  private isCurrentStepValid(): boolean {
    // Add validation logic based on current step
    switch (this.steps) {
      case 0:
        return this.form.get('selectedType')?.valid ?? false;
      case 1:
        return (this.form.get('selectedDate')?.valid ?? false) &&
          (this.form.get('selectedTime')?.valid ?? false);
      case 2:
        return this.form.get('comment')?.valid ?? false;
      default:
        return false;
    }
  }

  private markCurrentStepControlsAsDirty(): void {
    switch (this.steps) {
      case 0:
        this.form.get('selectedType')?.markAsTouched();
        break;
      case 1:
        this.form.get('selectedDate')?.markAsTouched();
        this.form.get('selectedTime')?.markAsTouched();
        break;
      case 2:
        this.form.get('comment')?.markAsTouched();
        break;
    }
  }

  open(): void {
    this.isVisible = true;
  }

  close(): void {
    this.isVisible = false;
    this.steps = 0;
    this.resetForm();
    this.timePicker.clearSelections();
  }

  async submit(): Promise<void> {
    if (this.form.valid) {
      const formData = {
        ...this.form.value,
        selectedDoctorFullName: this.selectedDoctorFullName
      };
  
      try {
        const userName = this.userDataService.getCurrentUserName();
        const uid = this.userDataService.getCurrentUserUid();
        const userEmail = this.userDataService.getCurrentUserEmail();
  
        const appointmentId = await this.userDataService.createAppointment(
          uid,
          this.selectedDoctor!,
          this.selectedDoctorFullName!,
          formData.selectedTime,
          formData.selectedDate,
          formData.comment
        );
  
        const emailSent = await this.emailVerificationService.sendAppointmentEmail(
          userEmail,
          userName,
          appointmentId,
          formData.selectedDate.toLocaleDateString(),
          formData.selectedTime,
          this.selectedDoctorFullName!
        );
  
        if (emailSent) {
          this.message.success('Appointment registered successfully');
          this.isVisible = false;
          this.steps = 0;
          this.resetForm();
          this.turn.setTurn();
          this.timePicker.clearSelections();
        } else {
          this.message.error('Failed to send confirmation email');
        }
      } catch (error) {
        if (error instanceof Error) {
          switch (error.message) {
            case 'No turns available':
              this.message.error('You do not have enough turns to book an appointment');
              break;
            default:
              this.message.error('Failed to register appointment. Please try again.');
              console.error(error);
          }
        } else {
          this.message.error('An unexpected error occurred');
          console.error(error);
        }
      }
    } else {
      this.markAllControlsAsDirty();
      this.message.error('Please fill out all required fields correctly');
    }
  }

  private markAllControlsAsDirty(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity({ onlySelf: true });
    });
  }
}