import { Injectable } from '@angular/core';
import { getDatabase, ref, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import { BehaviorSubject, Observable } from 'rxjs';

const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);

export interface Appointment {
    key: string;
    doctor: string;
    room: string;
    day: string;
    month: string;
    year: string;
    time: string;
    meet: boolean;
}

export interface User {
    name: string;
    phoneNumber: string;
    email: string;
    address: string;
}

export interface Doctor {
    name: string;
    specialization: string;
    tag: string;
    imageUrl: string;
}

@Injectable({
    providedIn: 'root'
})

export class UserDataService {
    private currentUser: any = null;
    private userDataSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

    constructor() {
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

    refreshUserData(uid: string) {
        this.fetchUserData(uid)
    }

    getName(): string {
        return this.currentUser ? this.currentUser.name : '';
    }

    getAddress(): string {
        return this.currentUser ? this.currentUser.address : '';
    }

    getPhoneNumber(): string {
        return this.currentUser ? this.currentUser.phoneNumber : '';
    }

    getEmail(): string {
        return this.currentUser ? this.currentUser.email : '';
    }

    getAppointments(): Appointment[] {
        return [
            { key: '1', doctor: 'tam', room: 'a123', day: '1', month: '1', year: '1900', time: '0:00:00', meet: false },
            { key: '2', doctor: 'tam', room: 'a123', day: '1', month: '1', year: '1900', time: '0:00:00', meet: false },
            { key: '3', doctor: 'tam', room: 'a123', day: '1', month: '1', year: '1900', time: '0:00:00', meet: false }
        ];
    }

    getHistoryAppointments(): Appointment[] {
        return [
            { key: '1', doctor: 'tam', room: 'a123', day: '1', month: '1', year: '1900', time: '0:00:00', meet: true },
            { key: '2', doctor: 'tam', room: 'a123', day: '1', month: '1', year: '1900', time: '0:00:00', meet: true },
            { key: '3', doctor: 'tam', room: 'a123', day: '1', month: '1', year: '1900', time: '0:00:00', meet: true }
        ];
    }
}

export class System {
    getListDoctor(): Doctor[] {
        return [
            { name: 'trang', specialization: 'Cardiology', tag: 'tm', imageUrl: 'https://static.vecteezy.com/system/resources/previews/036/594/092/original/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg' },
            { name: 'bao', specialization: 'Neurology', tag: 'tk', imageUrl: 'https://static.vecteezy.com/system/resources/previews/036/594/092/original/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg' },
            { name: 'yen', specialization: 'Gastroenterology', tag: 'th', imageUrl: 'https://static.vecteezy.com/system/resources/previews/036/594/092/original/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg' },
            { name: 'hoang', specialization: 'Dermatology', tag: 'dl', imageUrl: 'https://static.vecteezy.com/system/resources/previews/036/594/092/original/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg' },
            { name: 'thu', specialization: 'Ear, Nose, and Throat', tag: 'tmh', imageUrl: 'https://static.vecteezy.com/system/resources/previews/036/594/092/original/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg' }
        ];
    }

    getListNumber(): number {
        return this.getListDoctor().length;
    }
}

export class DoctorDataService {

}

//tạo  data structure cho bác sĩ