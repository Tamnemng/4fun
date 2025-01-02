import { Injectable } from '@angular/core';
import { getDatabase, ref, set, get, update, remove } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import { BehaviorSubject } from 'rxjs';
import { AppointmentStatus } from '../component/enum';
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);

export interface Appointment {
  key: string;
  doctor: string;
  date: string;
  time: string;
  status: AppointmentStatus
}

export interface DoctorAppointment {
  id: string;
  patientName: string;
  time: string;
  date: Date;
  status: AppointmentStatus;
}

export interface User {
  uid: string;
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  appointments: AppointmentData[]
}

export interface AppointmentData {
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  createdAt: string;
  healthCondition: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  tag: string;
  imageUrl: string;
}
//use for the table
export interface UserAppointment {
  id: number;
  patientName: string;
  comment: string;
  status: AppointmentStatus;
  appointmentDate: Date;
}

//use for the drawer
export interface Appointmentvalue {
  id: string;
  patientName: string;
  birth: Date;
  address: string;
  comment: string;
  appointmentDate: Date;
}

@Injectable({
  providedIn: 'root'
})

export class UserDataService {
  private currentUser: any = null;
  private userDataSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(

  ) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.fetchUserData(user.uid);
      } else {
        this.currentUser = null;
        this.userDataSubject.next(null);
      }
    });
  }

  async getAllPatients(): Promise<User[]> {
    const patientsRef = ref(db, 'users');
    try {
      const snapshot = await get(patientsRef);
      if (snapshot.exists()) {
        const users = snapshot.val() as Record<string, any>;
        return Object.entries(users)
          .filter(([_, userData]) => !userData.id)
          .map(([uid, userData]) => ({
            uid: uid,
            id: '',
            name: userData.name || '',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || '',
            address: userData.address || '',
            turn: 0, // Adding turn to match User interface
            appointments: userData.appointments
              ? Object.entries(userData.appointments)
                .filter(([_, appointmentData]) => typeof appointmentData === 'object')
                .map(([key, appointmentData]) => {
                  const appointment = appointmentData as AppointmentData;
                  return {
                    key,
                    doctorName: appointment.doctorName || '',
                    appointmentDate: appointment.appointmentDate || '',
                    appointmentTime: appointment.appointmentTime || '',
                    createdAt: appointment.createdAt || '',
                    healthCondition: appointment.healthCondition || ''
                  };
                })
              : []
          })) as User[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching patients:", error);
      return [];
    }
  }



  private fetchUserData(uid: string) {
    const userRef = ref(db, `users/${uid}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        this.currentUser = { ...this.currentUser, ...snapshot.val() };
        this.userDataSubject.next(this.currentUser);
      }
    }).catch((error) => {
      console.error("Error fetching user data:", error);
    });
  }

  getUserData() {
    return this.userDataSubject.asObservable();
  }

  public async userData(): Promise<User | null> {
    const uid = this.getCurrentUserUid();

    if (!uid) {
      return null;
    }

    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val() as User;
        // Update the current user and notify subscribers
        this.currentUser = { ...this.currentUser, ...userData };
        this.userDataSubject.next(this.currentUser);

        return userData;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  refreshUserData(uid: string) {
    this.fetchUserData(uid)
  }

  async getAppointments(): Promise<Appointment[]> {
    const uid = this.getCurrentUserUid();
    const appointmentsRef = ref(db, `appointments`);

    try {
      const snapshot = await get(appointmentsRef);
      if (!snapshot.exists()) return [];

      const now = new Date();
      return Object.entries(snapshot.val() || {})
        .filter(([_, appointmentData]: [string, any]) =>
          appointmentData.uid === uid &&
          (appointmentData.status != 'ENDING' && appointmentData.status != 'CANCEL')
        )
        .map(([key, appointmentData]: [string, any]) => {
          return {
            key,
            doctor: appointmentData.doctorName,
            date: new Date(appointmentData.appointmentDate).toLocaleDateString(),
            time: appointmentData.appointmentTime,
            status: appointmentData.status
          };
        });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  }

  async getAppointmentsId(id: string): Promise<AppointmentData[]> {
    const appointmentsRef = ref(db, `appointments`);
    console.log('true1');

    try {
      const snapshot = await get(appointmentsRef);
      if (!snapshot.exists()) return [];
  
      return Object.entries(snapshot.val() || {})
        .filter(([_, appointmentData]: [string, any]) =>
          appointmentData.uid === id
        )
        .map(([_, appointmentData]: [string, any]) => {
          console.log('true');
          return {
            appointmentDate: appointmentData.appointmentDate,
            appointmentTime: appointmentData.appointmentTime,
            doctorName: appointmentData.doctorName,
            createdAt: appointmentData.createdAt,
            healthCondition: appointmentData.healthCondition
          };
        });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  }

  async getAppointmentsHistory(): Promise<Appointment[]> {
    const uid = this.getCurrentUserUid();
    const appointmentsRef = ref(db, `appointments`);

    try {
      const snapshot = await get(appointmentsRef);
      if (!snapshot.exists()) return [];

      const now = new Date();
      return Object.entries(snapshot.val() || {})
        .filter(([_, appointmentData]: [string, any]) =>
          appointmentData.uid === uid &&
          (appointmentData.status != 'READY')

        )
        .map(([key, appointmentData]: [string, any]) => {
          return {
            key,
            doctor: appointmentData.doctorName,
            date: new Date(appointmentData.appointmentDate).toLocaleDateString(),
            time: appointmentData.appointmentTime,
            status: appointmentData.status
          };
        });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  }



  private async markAppointmentAsMet(uid: string, appointmentKey: string): Promise<void> {
    const appointmentRef = ref(db, `users/${uid}/appointments/${appointmentKey}`);
    try {
      await update(appointmentRef, { meet: true });
    } catch (error) {
      console.error("Error marking appointment as met:", error);
    }
  }

  private combineDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  async createAppointment(uid: string, doctorId: string, doctorName: string, time: string, date: Date, healthCondition: string) {
    // Ensure turn is a valid number
    const currentTurn = await this.getTurn() || 0;

    // Check if turn is a valid number and greater than 0
    if (!Number.isInteger(currentTurn) || currentTurn <= 0) {
      throw new Error('No turns available');
    }

    const appointmentId = this.generateAppointmentId(date, time, doctorId)
    const globalAppointmentRef = ref(db, `appointments/${appointmentId}`);
    const userRef = ref(db, `users/${uid}`);

    const appointmentData = {
      doctorName: doctorName,
      doctorId: doctorId,
      uid: uid,
      appointmentTime: time,
      appointmentDate: date.toISOString(),
      healthCondition: healthCondition,
      createdAt: new Date().toISOString(),
      status: AppointmentStatus.READY
    };

    return Promise.all([
      set(globalAppointmentRef, appointmentData),
      update(userRef, { turn: Math.max(0, currentTurn - 1) }) // Ensure turn never goes below 0
    ])
      .then(async () => {
        // Safely update local user data
        if (this.currentUser) {
          this.currentUser.turn = Math.max(0, currentTurn - 1);
          this.userDataSubject.next(this.currentUser);

          // Fetch latest user data to ensure complete synchronization
          await this.userData();
        }
        return appointmentId;
      })
      .catch((error) => {
        console.error('Appointment creation error:', error);
        throw error;
      });
  }

  private generateAppointmentId(date: Date, time: string, doctorName: string): string {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const [hours, minutes] = time.split(':');
    const doctorNamePart = doctorName.replace(/\s+/g, '').toUpperCase();

    return `${doctorNamePart}${year}${month}${day}${hours}${minutes}`;
  }

  public getDoctorId(): string {
    return this.currentUser.id;
  }

  public getCurrentUserUid(): string {
    if (!this.currentUser) {
      console.warn('No current user found');
      return ''; // Or throw an error
    }
    return this.currentUser.uid;
  }

  public async getTurn(): Promise<number> {
    try {
      const uid = this.getCurrentUserUid();
      if (!uid) {
        return 0; // Or handle this case appropriately
      }

      const usersRef = ref(db, `users/${uid}`);
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        return snapshot.val().turn || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching turn:', error);
      return 0;
    }
  }

  public getCurrentUserEmail(): string {
    return this.currentUser.email;
  }

  public getCurrentUserName(): string {
    return this.currentUser.name;
  }

  async cancelAppointment(appointmentKey: string): Promise<void> {
    const uid = this.getCurrentUserUid();
    const appointmentRef = ref(db, `appointments/${appointmentKey}`);
    try {
      await update(appointmentRef, {
        status: AppointmentStatus.CANCEL
      });
    } catch (error) {
      throw error;
    }
  }

  async addTurn(value: number): Promise<void> {
    const uid = this.getCurrentUserUid();
    const userRef = ref(db, `users/${uid}`);
    try {
      const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      await update(userRef, {
        turn: safeValue
      });
      await this.userData();
    } catch (error) {
      throw error;
    }
  }
}
export class System {
  doctorList: Doctor[] = [];
  doctorListAvailable = false;

  // Mock data for doctors
  mockList() {
    this.doctorListAvailable = true;
  }
  async getListDoctor(): Promise<Doctor[]> {
    if (this.doctorListAvailable) return this.doctorList;

    const snapShot = await get(ref(db, 'doctors'));
    if (snapShot.exists()) {
      const data = snapShot.val() as Record<string, Record<string, Doctor>>;
      this.doctorList = Object.entries(data)
        .flatMap(([tag, doctors]) =>
          Object.values(doctors).map(doctor => ({
            ...doctor,
            tag
          }))
        );
    }

    if (this.doctorList.length === 0) {
      this.mockList();
      for (const doctor of this.doctorList) {
        const doctorRef = ref(db, `doctors/${doctor.tag}/${doctor.id}`);
        await set(doctorRef, doctor);
      }
    }

    return this.doctorList;
  }
  getListNumber(): number {
    return this.doctorList.length;
  }
  async getDisabledTimes(doctorId: string): Promise<string[]> {
    const db = getDatabase();
    const appointmentsRef = ref(db, 'appointments');
    
    try {
      const snapshot = await get(appointmentsRef);
      if (!snapshot.exists()) return [];
  
      const appointments = snapshot.val();
      const disabledTimes: string[] = [];
  
      // Filter and process appointments
      Object.keys(appointments)
        .filter(key => key.startsWith(doctorId)) // Filter appointments for specific doctor
        .forEach(key => {
          // Extract date and time from the appointment key
          // Format: doctorId(xx) + yymmdd + hhmm
          const dateStr = key.substring(2, 8);  // yymmdd
          const timeStr = key.substring(8, 12); // hhmm
          
          // Convert to required format: 'yymmdd hh:mm'
          const formattedTime = `${dateStr} ${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
          
          disabledTimes.push(formattedTime);
        });
  
      return disabledTimes;
    } catch (error) {
      console.error("Error fetching disabled times:", error);
      return [];
    }
  }

  async getDisableTimes(doctorId: string): Promise<string[]> {
    const db = getDatabase();
    const appointmentsRef = ref(db, 'appointments');
    
    try {
      const snapshot = await get(appointmentsRef);
      if (!snapshot.exists()) return [];
  
      const appointments = snapshot.val();
      const disabledTimes: string[] = [];
  
      // Filter and process appointments
      Object.keys(appointments)
        .filter(key => key.startsWith(doctorId)) // Filter appointments for specific doctor
        .forEach(key => {
          // Lấy phần timestamp từ key (bỏ qua doctorId)
          const timeStamp = key.substring(2); // Lấy từ vị trí thứ 2 trở đi
          disabledTimes.push(timeStamp);
        });
  
      return disabledTimes;
    } catch (error) {
      console.error("Error fetching disabled times:", error);
      return [];
    }
  }
}


//tạo  data structure cho bác sĩ
