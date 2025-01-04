// doctor-handle-appointment.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AppointmentStatus, ListOfAppointmentStatus } from '../../../component/enum';
import { DoctorHandleStore } from './doctor-handle.store';
import { DoctorAppointment } from '../../../data/data';
import { DoctorDataService } from '../../../data/doctor.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-handle-appointment',
  templateUrl: './doctor-handle-appointment.component.html',
  styleUrls: ['./doctor-handle-appointment.component.css'],
  providers: [DoctorHandleStore, DoctorDataService]
})
export class DoctorHandleAppointmentComponent implements OnInit, OnDestroy {
  appointments: DoctorAppointment[] = [];
  selectedMonth: Date = new Date();
  monthFormat = 'yyyy/MM';
  private appointmentSubscription: Subscription = new Subscription();
  formatDate(dateString: Date): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  pageSize = 7; // Số items trên mỗi trang
  total = Math.ceil(this.appointments.length / this.pageSize); // Correct total pages calculation
  pageIndex = 1; // Trang hiện tại

  onPageIndexChange(pageIndex: number) {
    this.pageIndex = pageIndex;
  }

  get paginatedAppointments(): DoctorAppointment[] {
    // Ensure appointments is defined and is an array
    if (!this.appointments || !Array.isArray(this.appointments)) {
      return []; // Return an empty array if appointments is undefined or not an array
    }
  
    // Recalculate total pages based on current appointments
    this.total = Math.ceil(this.appointments.length / this.pageSize);
  
    // Calculate start and end indices for pagination
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    // Return sliced appointments, handling cases where endIndex might exceed array length
    return this.appointments.slice(startIndex, Math.min(endIndex, this.appointments.length));
  }

  sortAppointments(appointments: DoctorAppointment[]): DoctorAppointment[] {
    return [...appointments].sort((a, b) => {
      // First, compare by date
      const dateComparison = this.compareDate(a.date, b.date);
      
      // If dates are the same, compare by time
      if (dateComparison === 0) {
        return this.compareTime(a.time, b.time);
      }
      
      return dateComparison;
    });
  }

  // Helper method to compare dates
  compareDate(dateA: Date, dateB: Date): number {
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  }

  // Helper method to compare times in 24-hour format
  compareTime(timeA: string, timeB: string): number {
    // Split time into hours and minutes
    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(part => parseInt(part, 10));
      return hours * 60 + (minutes || 0);
    };

    return parseTime(timeA) - parseTime(timeB);
  }

  // Filter and paginate appointments


  constructor(
    private store: DoctorHandleStore
  ) { 
    this.store.appointments$.subscribe(s => this.appointments = s);
  }

  ngOnInit() {
    this.appointmentSubscription = this.store.appointments$.subscribe(appointments => {
      this.appointments = this.sortAppointments(appointments || []);
      this.total = Math.ceil(this.appointments.length / this.pageSize);
    });
  }

  ngOnDestroy(): void {
    if (this.appointmentSubscription) {
      this.appointmentSubscription.unsubscribe();
    } 
  }

  getStatusConfig(status: AppointmentStatus) {
    return ListOfAppointmentStatus.find(item => item.value === status);
  }

  getEmptyRows(count: number): any[] {
    return new Array(count).fill(null);
  }

  canOpenMeeting(appointmentDate: Date, appointmentTime: string): boolean {
    const now = new Date();
    const appointmentDateTime = new Date(appointmentDate);
    
    // Set the appointment time
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    // Check if it's the same day
    const isSameDay = now.getDate() === appointmentDateTime.getDate() &&
                     now.getMonth() === appointmentDateTime.getMonth() &&
                     now.getFullYear() === appointmentDateTime.getFullYear();
    
    if (!isSameDay) {
      return false;
    }
    
    // Calculate time difference in minutes
    const timeDiff = Math.abs(now.getTime() - appointmentDateTime.getTime()) / (1000 * 60);
    
    // Return true if time difference is 5 minutes or less
    return timeDiff <= 5;
  }

  openMeeting(id: string) {
    this.store.setIsMeeting(true);
    this.store.updateMeetingValue(id);
  }

  cancelAppointment(id: string) {
    this.store.cancelMeeting(id);
  }
}