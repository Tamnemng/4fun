import { Component, Input, SimpleChanges } from '@angular/core';
import { AppointmentStatus } from '../../../../component/enum';
interface AppointmentStatusData {
  status: AppointmentStatus;
  count: number;
}

@Component({
  selector: 'app-doctor-welcome-bar-chart',
  templateUrl: './doctor-welcome-bar-chart.component.html',
  styleUrl: './doctor-welcome-bar-chart.component.css'
})
export class DoctorWelcomeBarChartComponent {
  @Input() appointments: AppointmentStatusData[] = [];

  chartData: any[] = [];
  isEmpty: boolean = false;

  private readonly STATUS_LABELS = {
    [AppointmentStatus.CANCEL]: 'Cancelled',
    [AppointmentStatus.READY]: 'Ready',
    [AppointmentStatus.ENDING]: 'Ended',
  };

  private readonly COLORS = {
    [AppointmentStatus.CANCEL]: '#FF6384',
    [AppointmentStatus.READY]: '#4CAF50',
    [AppointmentStatus.ENDING]: '#FFA500',
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appointments']) {
      this.generateBarChart();
    }
  }

  generateBarChart() {
    // Handle case when appointments are empty or all counts are zero
    if (this.appointments.length === 0 || this.appointments.every(a => a.count === 0)) {
      this.chartData = [];
      this.isEmpty = true;
      return;
    }

    this.isEmpty = false;
    const maxCount = Math.max(...this.appointments.map(a => a.count));
    const chartHeight = 180;
    const barWidth = 70;
    const spacing = 20;

    this.chartData = this.appointments.map((item, index) => {
      const height = item.count > 0 
        ? (item.count / maxCount) * chartHeight 
        : 0;
      
      return {
        status: item.status,
        label: this.STATUS_LABELS[item.status],
        count: item.count,
        color: this.COLORS[item.status],
        x: 50 + index * (barWidth + spacing),
        y: 200 - height,
        width: barWidth,
        height: height
      };
    });
  }
}
