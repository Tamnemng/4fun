import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzDatePickerModule],
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.css']
})
export class TimePickerComponent implements OnInit {
  availableTimes: { time: string, selected: boolean, disabled?: boolean }[] = [];
  selectedTime: string = '';
  selectedDate: Date | null = null;

  @Output() timeAndDateSelected = new EventEmitter<{ time: string, date: Date }>();

  ngOnInit() {
    this.generateAvailableTimes();
  }

  generateAvailableTimes() {
    const morningStart = 8;
    const morningEnd = 11;
    const afternoonStart = 13;
    const afternoonEnd = 17;

    for (let hour = morningStart; hour <= morningEnd; hour++) {
      this.availableTimes.push({ time: `${hour}:00`, selected: false });
      if (hour < morningEnd) {
        this.availableTimes.push({ time: `${hour}:30`, selected: false });
      }
    }

    for (let hour = afternoonStart; hour <= afternoonEnd; hour++) {
      this.availableTimes.push({ time: `${hour}:00`, selected: false });
      if (hour < afternoonEnd) {
        this.availableTimes.push({ time: `${hour}:30`, selected: false });
      }
    }

    // After generating times, disable all of them initially
    this.availableTimes.forEach(time => time.disabled = true);
  }

  onDateChange(result: Date): void {
    this.selectedDate = result;
    this.updateAvailableTimes();
    this.emitSelectedTimeAndDate();
  }

  updateAvailableTimes() {
    if (this.selectedDate) {
      const now = new Date();
      const isToday = this.selectedDate.toDateString() === now.toDateString();

      this.availableTimes.forEach(timeSlot => {
        const [hours, minutes] = timeSlot.time.split(':').map(Number);
        const slotDate = new Date(this.selectedDate || new Date());
        slotDate.setHours(hours, minutes, 0, 0);

        timeSlot.disabled = isToday && slotDate <= now;
      });
    } else {
      this.availableTimes.forEach(timeSlot => timeSlot.disabled = true);
    }
  }

  onTimeSelect(selectedTime: { time: string, selected: boolean, disabled?: boolean }) {
    if (!this.selectedDate || selectedTime.disabled) return;

    this.availableTimes.forEach(time => time.selected = false);
    selectedTime.selected = true;
    this.selectedTime = selectedTime.time;
    this.emitSelectedTimeAndDate();
  }

  private emitSelectedTimeAndDate() {
    if (this.selectedDate && this.selectedTime) {
      this.timeAndDateSelected.emit({ time: this.selectedTime, date: this.selectedDate });
    }
  }
}
