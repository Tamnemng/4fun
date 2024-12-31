import { Component } from '@angular/core';
import { AppointmentData, User, UserDataService } from '../../../data/data';

@Component({
  selector: 'app-doctor-patient',
  templateUrl: './doctor-patient.component.html',
  styleUrl: './doctor-patient.component.css'
})
export class DoctorPatientComponent {
  patients: User[] = [];
  filteredPatients: User[] = [];
  searchTerm: string = '';
  
  drawerVisible = false;
  selectedPatient: User | null = null;
  patientAppointments: AppointmentData[] = [];

  constructor(private userDataService: UserDataService) {}

  ngOnInit() {
    this.loadPatients();
  }

  async loadPatients() {
    this.patients = await this.userDataService.getAllPatients();
    this.filteredPatients = [...this.patients];
  }

  filterPatients() {
    if (!this.searchTerm) {
      this.filteredPatients = [...this.patients];
    } else {
      this.filteredPatients = this.patients.filter(patient => 
        patient.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.phoneNumber.includes(this.searchTerm.toLowerCase())
      );
    }
  }

   async openAppointmentDrawer(patient: User) {
    this.selectedPatient = patient;
    this.patientAppointments = await this.userDataService.getAppointmentsId(patient.uid);
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.selectedPatient = null;
    this.patientAppointments = [];
  }
}
