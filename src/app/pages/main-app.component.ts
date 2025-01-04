import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MainStore } from './main-app.component.store';
import { System } from '../../data/data';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { filter } from 'rxjs';
@Component({
  selector: 'app-main-app',
  standalone: true,
  imports: [
    NzButtonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    RouterLinkActive,
    HeaderComponent,
    CommonModule,
  ],
  templateUrl: './main-app.component.html',
  styleUrl: './main-app.component.css',
  providers: [MainStore, System]
})
export class MainAppComponent implements OnInit {
  ngOnInit(): void {
    this.hightLightHeader(false);
    this.hightLightSlider(false);
  }
  readonly role$ = this.mainStore.role$;
  readonly bluredHeader$ = this.mainStore.bluredHeader$;
  readonly bluredContent$ = this.mainStore.bluredContent$;
  readonly bluredSlider$ = this.mainStore.bluredSlider$;
  headerGuide: boolean = false;
  sliderGuider: boolean = false;
  welcomeGuider: boolean = false;
  doctorGuider: boolean = false;
  appointmentGuider: boolean = false;
  currentRoute: string = 'welcome';
  constructor(
    private router: Router,
    private authService: AuthService,
    private mainStore: MainStore,
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const path = event.url.split('/').pop();
      this.currentRoute = path;
    });
  }
  closeGuide() {
    this.hightLightHeader(false);
    this.hightLightSlider(false);
    this.hightLightContentWelcome(false);
    this.hightLightContentDoctor(false);
    this.hightLightAppointment(false);
    this.goToWelcome();
  }
  //next
  nextHeader() {
    this.hightLightHeader(false);
    this.hightLightSlider(true);
  }

  nextWelcome() {
    this.hightLightSlider(false);
    this.hightLightContentWelcome(true);
  }

  nextDoctor() {
    this.hightLightContentDoctor(true);
  }

  nextAppointment() {
    this.hightLightContentDoctor(false);
    this.hightLightAppointment(true);
  }
  //back
  backHeader() {
    this.hightLightSlider(false);
    this.hightLightHeader(true);
  }
  backSlider() {
    this.hightLightContentWelcome(false);
    this.hightLightSlider(true);
  }
  backWelcome() {
    this.hightLightContentDoctor(false);
    this.hightLightContentWelcome(true);
  }
  backDoctor() {
    this.hightLightAppointment(false);
    this.hightLightContentDoctor(true);
  }
  logOut() {
    this.authService.logout();
    this.router.navigate(['']);
  }

  //hightLight
  hightLightHeader(value: boolean) {
    this.headerGuide = value;
    this.mainStore.setBluredSlider(value);
    this.mainStore.setBluredContent(value);
    if (value === true) { this.mainStore.setBluredHeader(!value); }
  }

  hightLightSlider(value: boolean) {
    this.sliderGuider = value;
    if (value === true) {
      this.mainStore.setBluredSlider(!value);
    }
    this.mainStore.setBluredHeader(value);
    this.mainStore.setBluredContent(value);
  }

  hightLightContentWelcome(value: boolean) {
    this.goToWelcome();
    this.welcomeGuider = value;
    if (value === true) {
      this.mainStore.setBluredContent(!value);
    }
    this.mainStore.setBluredSlider(value);
    this.mainStore.setBluredHeader(value);
  }

  hightLightContentDoctor(value: boolean) {
    this.doctorGuider = value;
    this.goToDoctor();
  }

  hightLightAppointment(value: boolean) {
    this.goAppoinment();
    this.appointmentGuider = value;
  }
  goToWelcome() {
    this.currentRoute = 'welcome';
    this.router.navigate(['/main-bn/welcome']);
  }

  goToDoctor() {
    this.currentRoute = 'doctor';
    this.router.navigate(['/main-bn/doctor']);
  }

  goAppoinment() {
    this.currentRoute = 'monitor';
    this.router.navigate(['/main-bn/monitor']);
  }
}
