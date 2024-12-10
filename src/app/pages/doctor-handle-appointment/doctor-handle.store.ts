import { Injectable } from "@angular/core";
import { Appointment, Appointmentvalue, DoctorAppointment, System, UserAppointment } from "../../../data/data";
import { DoctorDataService } from "../../../data/doctor.service";
import { ComponentStore } from "../../../component/store.cp";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { combineLatest } from "rxjs";
import { AppointmentStatus } from "../../../component/enum";

export interface DoctorHandleState {
    total_appointment: number;
    appointments: DoctorAppointment[];
    is_meeting: boolean;
    meeting_value: Appointmentvalue;
    month_filter: Date
}

const initialState: DoctorHandleState = {
    total_appointment: 0,
    month_filter: new Date(),
    appointments: [],
    is_meeting: false,
    meeting_value: {
        id: '',
        patientName: 'test',
        address: 'test',
        birth: new Date(),
        comment: 'test',
        appointmentDate: new Date()
    }
};

@Injectable({
    providedIn: 'root'
})
export class DoctorHandleStore {
    private store: ComponentStore<DoctorHandleState>;
    private initialized = false;
    readonly total_appointments$: Observable<number>;
    readonly is_meeting$: Observable<boolean>;
    readonly appointments$: Observable<DoctorAppointment[]>;
    readonly meeting_value$: Observable<Appointmentvalue>;
    readonly month_filter$: Observable<Date>;
    constructor(
        private system: System,
        private doctorStore: DoctorDataService) {
        this.initialize();
        this.store = ComponentStore.getInstance<DoctorHandleState>(initialState);
        this.total_appointments$ = this.store.select(state => state.total_appointment);
        this.is_meeting$ = this.store.select(state => state.is_meeting);
        this.meeting_value$ = this.store.select(state => state.meeting_value);
        this.appointments$ = this.store.select(state => state.appointments);
        this.month_filter$ = this.store.select(state => state.month_filter);
    }

    private async initialize() {
        if (!this.initialized) {
            this.initialized = true;
            await this.setData();
        }
        // this.store.patchState({ appointments: this.doctorStore.getDoctorAppointment() })

    }

    async setData() {
        const data: DoctorAppointment[] = await this.doctorStore.getAppointments();
        this.store.patchState({ appointments: data });
    }

    async updateMeetingValue(id: string) {
        const meetingValue = await this.doctorStore.getAppointmentDetail(id);
        this.store.patchState({ meeting_value: meetingValue });
        this.setData();
    }

    async cancelMeeting(id: string){
        this.doctorStore.cancelAppointment(id);
        this.setData();

    }

    async endMeeting(id: string){
        this.doctorStore.EndingAppointment(id);
        this.setData();

    }

    setIsMeeting(value: boolean) {
        this.store.patchState({ is_meeting: value });
        this.setData();
    }

    setMeetingValue(value: Appointmentvalue) {
        this.store.patchState({ meeting_value: value });
        this.setData();
    }

    setMonth(value: Date) {
        this.store.patchState({ month_filter: value})
    }
}