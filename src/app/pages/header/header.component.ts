import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { UserDataService, User } from '../../../data/data';
import { BehaviorSubject, catchError, from, of, Subscription, switchMap } from 'rxjs';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { MainStore } from '../main-app.component.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NzDropDownModule, NzIconModule, NzToolTipModule,
    NzButtonComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  readonly role$ = this.mainStore.role$;
  readonly turn$ = this.mainStore.turn$;
  // Sử dụng BehaviorSubject để theo dõi thay đổi của user
  private userSubject = new BehaviorSubject<User>({
    uid: '',
    id: '',
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
    appointments: []
  });

  // Expose as Observable for template
  user$ = this.userSubject.asObservable();

  private userSubscription: Subscription | undefined;

  constructor(
    private data: UserDataService,
    private mainStore: MainStore,
  ) {
    this.setData();
  }

  // Thêm phương thức userData như bạn yêu cầu
  async userData(): Promise<void> {
    try {
      // Gọi phương thức userData từ UserDataService
      const userData = await this.data.userData();

      if (userData) {
        // Tạo user mới với thông tin được cập nhật
        const updatedUser: User = {
          uid: userData.uid || '',
          id: userData.id || '',
          name: userData.name || '',
          phoneNumber: userData.phoneNumber || '',
          email: userData.email || '',
          address: userData.address || '',
          appointments: userData.appointments || []
        };

        // Cập nhật BehaviorSubject với user mới
        this.userSubject.next(updatedUser);
      } else {
        // Reset user nếu không có dữ liệu
        this.userSubject.next({
          uid: '',
          id: '',
          name: '',
          phoneNumber: '',
          email: '',
          address: '',
          appointments: []
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Reset user trong trường hợp có lỗi
      this.userSubject.next({
        uid: '',
        id: '',
        name: '',
        phoneNumber: '',
        email: '',
        address: '',
        appointments: []
      });
    }
  }

  setData(): void {
    this.userSubscription = this.data.getUserData().subscribe(userData => {
      if (userData) {
        const updatedUser = {
          uid: userData.uid || '',
          id: '',
          name: userData.name || '',
          phoneNumber: userData.phoneNumber || '',
          email: userData.email || '',
          address: userData.address || '',
          appointments: []
        };
        // Cập nhật giá trị mới cho BehaviorSubject
        this.userSubject.next(updatedUser);
      } else {
        // Reset user nếu không có dữ liệu
        this.userSubject.next({
          uid: '',
          id: '',
          name: '',
          phoneNumber: '',
          email: '',
          address: '',
          appointments: []
        });
      }
    });
  }

  ngOnInit(): void {
    // Gọi userData khi component khởi tạo (tuỳ chọn)
    this.userData();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}