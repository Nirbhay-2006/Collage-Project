import { serverRoutes } from './../app.routes.server';
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Teacherservice } from '../Service/TeacherService/teacherservice';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';
declare var bootstrap: any;
@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.css',
})
export class TeacherDashboard implements OnInit {
  @ViewChild('logoutmodel') logoutmodel!: ElementRef;
  constructor(private router: Router,@Inject(PLATFORM_ID) private platformId: Object) {}

  private modalInstance: any;
  username = '';
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');

      if (token) {
        const payload = this.decodeToken(token);
        // console.log('Decoded Token:', payload);

        this.username = payload?.unique_name || payload?.sub || payload?.name;
        // console.log('Username:', this.username);
      }
    }
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1]; // get payload
      const decoded = atob(payload); // base64 decode
      return JSON.parse(decoded);
    } catch (error) {
      console.log('Invalid token', error);
      return null;
    }
  }
  OpenLogout() {
    this.modalInstance = new bootstrap.Modal(this.logoutmodel.nativeElement);
    this.modalInstance.show();
  }

  ConformLogout() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    localStorage.clear();
    this.router.navigate(['/']);
  }
}
