import { Injectable } from "@angular/core";
import { Doctor, System } from "../../../data/data";
import { ComponentStore } from "../../../component/store.cp";
import { Observable } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import { combineLatest } from "rxjs";

export interface DoctorState {
  filter_tag: string;
  filter_search: string;
  filter_date: string;
  search_data: string;
  data: Doctor[];
  is_modal: boolean;
  timeDisable: string[];
  modal_value: Doctor
  total_doctors: number;
  initial_tag: string;
}

const initialState: DoctorState = {
  total_doctors: 0,
  timeDisable: [],
  filter_date: '',
  filter_tag: 'all',
  filter_search: '',
  search_data: '',
  data: [],
  is_modal: false,
  modal_value: {
    id: '',
    name: '',
    specialization: '',
    tag: '',
    imageUrl: ''
  },
  initial_tag: 'all',
};

@Injectable({
  providedIn: 'root'
})
export class DoctorStore {
  private store: ComponentStore<DoctorState>;
  private initialized = false;
  readonly modal_value$: Observable<Doctor>
  readonly initial_tag$: Observable<string>;
  readonly total_doctors$: Observable<number>;
  readonly data$: Observable<Doctor[]>;
  readonly filter_tag$: Observable<string>;
  readonly filter_date$: Observable<string>;
  readonly filter_search$: Observable<string>;
  readonly search_data$: Observable<string>;
  readonly is_modal$: Observable<boolean>;
  readonly timeDisable$: Observable<string[]>;
  readonly filteredDoctors$: Observable<Doctor[]>;
  readonly filteredDoctorsDate$: Observable<Doctor[]>;
  id: string = '';

  constructor(private system: System) {
    this.store = ComponentStore.getInstance<DoctorState>(initialState);
    this.initial_tag$ = this.store.select(s => s.initial_tag);
    this.timeDisable$ = this.store.select(s => s.timeDisable);
    this.total_doctors$ = this.store.select(s => s.total_doctors);
    this.data$ = this.store.select(state => state.data);
    this.filter_tag$ = this.store.select(state => state.filter_tag);
    this.filter_date$ = this.store.select(state => state.filter_date);
    this.filter_search$ = this.store.select(state => state.filter_search);
    this.search_data$ = this.store.select(state => state.search_data);
    this.is_modal$ = this.store.select(state => state.is_modal);
    this.modal_value$ = this.store.select(state => state.modal_value);
    this.filteredDoctorsDate$ = combineLatest([this.data$, this.filter_tag$, this.filter_date$]).pipe(
      switchMap(async ([doctors, tag, date]) => {
        const availableDoctors = [];
        for (const doctor of doctors) {
          const tagMatch = tag === 'all' || doctor?.tag === tag;
          
          if (tagMatch) {
            const disabledTimes = await this.getTimeDisable(doctor.id);
            const isTimeAvailable = !disabledTimes.includes(date);
    
            if (isTimeAvailable) {
              availableDoctors.push(doctor);
            }
          }
        }
        
        return availableDoctors;
      })
    );
    this.filteredDoctors$ = combineLatest([this.data$, this.filter_tag$, this.filter_search$]).pipe(
      map(([doctors, tag, search]) =>
        doctors.filter(doctor => {
          const nameMatch = !search || !doctor?.name
            ? true
            : doctor.name.toLowerCase().includes(search.toLowerCase());
          const tagMatch = tag === 'all' || doctor?.tag === tag;
          return nameMatch && tagMatch;
        })
      )
    );
    this.initialize();
  }

  private async initialize() {
    if (!this.initialized) {
      await this.setData();
      this.setTotal(0);
      this.initialized = true;
    }
  }

  async setModalValue(value: Doctor) {
    await this.setTimeDisable(value.id);
    this.store.patchState({ modal_value: value })
  }

  setTotal(res: number) {
    const total_doctors = res !== 0 ? this.system.getListNumber() : res;
    this.store.patchState({ total_doctors });
  }

  setInitialTag(value: string) {
    this.store.patchState({ initial_tag: value });
  }

  async setTimeDisable(id: string) {
    const timeDisable: string[] = await this.system.getDisabledTimes(id);
    this.store.patchState({ timeDisable });
  }

  async getTimeDisable(id: string) {
    const timeDisable: string[] = await this.system.getDisableTimes(id);
    return timeDisable;
  }

  async setData() {
    const data: Doctor[] = await this.system.getListDoctor();
    this.store.patchState({ data });
  }

  setFiltersTag(filter_tag: string) {
    this.store.patchState({ filter_tag });
  }

  setWelcomeFilter(filter_tag: string, date: string) {
    this.store.patchState({ filter_tag: filter_tag, filter_date: date });
  }

  setFiltersSearch(filter_search: string) {
    this.store.patchState({ filter_search });
  }

  setSearchData(search_data: string) {
    this.store.patchState({ search_data });
  }

  setIsModal(is_modal: boolean) {
    this.store.patchState({ is_modal });
  }
}
