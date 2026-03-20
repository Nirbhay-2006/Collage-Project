import { ChangeDetectorRef, Component } from '@angular/core';
import { Teacherservice } from '../Service/TeacherService/teacherservice';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacherdash',
  imports: [CommonModule],
  templateUrl: './teacherdash.html',
  styleUrl: './teacherdash.css',
})
export class Teacherdash {
  // Mock Data
  recentExams: any[] = [];
  recentSubscribers: any[] = [];

  isLoadingExams = true;
  isLoadingSubscribers = true;

  displayedColumns: string[] = ['title', 'students', 'status', 'revenue', 'actions'];
  totalcourse: any;
  totalStudents: any;
  totalexam: any;
  totalEarning: any;

  constructor(
    private service: Teacherservice,
    private cd: ChangeDetectorRef,
  ) {}

  username = '';
  ngOnInit(): void {
    this.Gettotalcourses();
    this.GetTotalEarnings();
    this.GetTotalExam();
    this.GetTotalStudent();
    this.loadRecentExams();
    this.loadRecentSubscribers();
    const token = localStorage.getItem('token');

    if (token) {
      const payload = this.decodeToken(token);

      this.username = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
      console.log('Username:', this.username);
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

  publishCourse(id: number) {
    console.log('Publishing course:', id);
  }

  Gettotalcourses() {
    this.service.Gettotalcourses().subscribe({
      next: (res: any) => {
        console.log('total course ', res);
        this.totalcourse = res.totalCourses;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  GetTotalStudent() {
    this.service.GetTotalStudent().subscribe({
      next: (res: any) => {
        console.log('total Student ', res);
        this.totalStudents = res.totalStudents;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  GetTotalExam() {
    this.service.GetTotalExam().subscribe({
      next: (res: any) => {
        console.log('total GetTotalExamExam ', res);
        this.totalexam = res.totalexam;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  GetTotalEarnings() {
    this.service.GetTotalEarnings().subscribe({
      next: (res: any) => {
        console.log('total Eaning ', res);
        this.totalEarning = res.totalEarning;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  loadRecentExams() {
    this.isLoadingExams = true;

    this.service.getRecentExams().subscribe({
      next: (res: any) => {
        this.recentExams = res;
        this.isLoadingExams = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.isLoadingExams = false;
      },
    });
  }

  loadRecentSubscribers() {
    this.isLoadingSubscribers = true;

    this.service.getRecentSubscribers().subscribe({
      next: (res: any) => {
        this.recentSubscribers = res;
        this.isLoadingSubscribers = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.isLoadingSubscribers = false;
      },
    });
  }
}
