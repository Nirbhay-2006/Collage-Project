import { CommonModule, isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Adminservice } from '../Service/AdminService/adminservice';
import { jwtDecode } from 'jwt-decode';
declare var bootstrap: any;
@Component({
  selector: 'app-admindashboard',
  imports: [CommonModule],
  templateUrl: './admindashboard.html',
  styleUrl: './admindashboard.css',
})
export class Admindashboard implements OnInit {
  @ViewChild('logoutmodel') logoutmodel!: ElementRef;
  private modalInstance: any;

  username: string = '';
  chart: any; // 👈 for exam chart
  courseChart: any; // 👈 ✅ ADD THIS

  constructor(
    private router: Router,
    private service: Adminservice,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}
  ngOnInit() {
    const name = this.getUsername();
    this.username = name || ''; // ✅ fallback to empty string
    this.loadDashboard();
    this.loadTopExams();
  }

  OpenLogout() {
    this.modalInstance = new bootstrap.Modal(this.logoutmodel.nativeElement);
    this.modalInstance.show();
  }

  ConformLogout() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }

    // Cleanup backdrop manually to prevent login page "freeze"
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
    document.body.classList.remove('modal-open');

    localStorage.clear();
    this.router.navigate(['/']);
  }

  stats: any[] = [];
  isLoading: boolean = true;
  getUsername(): string {
    const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

    if (isPlatformBrowser(this.platformId)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return '';

        const decoded: any = jwtDecode(token);
        return decoded?.[NAME_CLAIM] || '';
      } catch (error) {
        console.error('Invalid token', error);
        return '';
      }
    }

    return '';
  }

  getShortName(name: string): string {
    if (!name) return '';

    const parts = name.trim().split(' ');

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  loadDashboard() {
    this.isLoading = true;

    this.service.GetDahsboardData().subscribe({
      next: (res: any) => {
        // 🔥 Convert API response to array
        this.stats = [
          { title: 'Students', value: res.totalStudents, percent: 10, isUp: true },
          { title: 'Teachers', value: res.totalTeachers, percent: 5, isUp: true },
          { title: 'Exams', value: res.totalExams, percent: 8, isUp: true },
          { title: 'Submitted', value: res.submittedAttempts, percent: 12, isUp: true },
          { title: 'Pending', value: res.pendingAttempts, percent: 3, isUp: false },
          { title: 'Earnings', value: '₹' + this.formatNumber(res.totalEarnings), percent: 15, isUp: true },
          { title: 'Courses', value: res.totalcourse, percent: 15, isUp: true },
          { title: 'Published Courses', value: res.publishedcourse, percent: 15, isUp: true },
        ];
        this.loadChart();

        this.loadCourseChart();

        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cd.detectChanges();
      },
    });
  }

  formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1).replace('.0', '') + 'K';
    }
    return value.toString();
  }


  examsdetail: any[] = [];
  isloadexamdetail: boolean = true;

  loadTopExams() {
    this.isloadexamdetail = true;

    this.service.GetAvgExamDetails().subscribe({
      next: (res: any) => {
        console.log(res);
        this.isloadexamdetail = false;
        this.examsdetail = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isloadexamdetail = false;
        this.cd.detectChanges();
      },
    });
  }

  loadChart() {
    const labels = this.examsdetail.map((e) => e.examTitle);
    const data = this.examsdetail.map((e) => e.avgPercentage);

    new Chart('examChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Avg Score (%)',
            data: data,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  }

  loadCourseChart() {
    // 🔥 Example (replace with API if available)
    const courseData = [
      { courseName: 'Angular', earning: 5000 },
      { courseName: 'React', earning: 8000 },
      { courseName: 'Node', earning: 3000 },
    ];

    const labels = courseData.map((c) => c.courseName);
    const data = courseData.map((c) => c.earning);

    if (this.courseChart) {
      this.courseChart.destroy();
    }

    this.courseChart = new Chart('courseChart', {
      type: 'bar',
      data: {
        labels: labels, // 👈 X-axis (Courses)
        datasets: [
          {
            label: 'Earnings (₹)',
            data: data, // 👈 Y-axis (Earnings)
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
