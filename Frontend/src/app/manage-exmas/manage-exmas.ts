import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Adminservice } from '../Service/AdminService/adminservice';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-manage-exmas',
  imports: [CommonModule],
  templateUrl: './manage-exmas.html',
  styleUrl: './manage-exmas.css',
})
export class ManageExmas {
  exams: any[] = [];
  students: any[] = [];

  selectedExam: any = null;
  selectedExamId: number | null = null;

  errorMessage: string | null = null;

  // ✅ LOADERS
  isLoading = false;
  isDeleting = false;
  isStudentsLoading = false;

  @ViewChild('detailModal') detailModal!: ElementRef;
  @ViewChild('deleteModal') deleteModal!: ElementRef;
  @ViewChild('studentsModal') studentsModal!: ElementRef;

  constructor(
    private service: Adminservice,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.isLoading = true;
    this.errorMessage = null;

    this.service.getAllExams().subscribe({
      next: (res) => {
        this.exams = res;
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load exams';
        this.isLoading = false;
        this.cd.detectChanges();
      },
    });
  }

  // 📘 DETAILS
  openDetailModal(exam: any) {
    this.selectedExam = exam;
    new bootstrap.Modal(this.detailModal.nativeElement).show();
  }

  // 🗑 DELETE
  openDeleteModal(id: number) {
    this.selectedExamId = id;
    new bootstrap.Modal(this.deleteModal.nativeElement).show();
  }

  confirmDelete() {
    if (!this.selectedExamId) return;

    this.isDeleting = true;

    this.service.deleteExam(this.selectedExamId).subscribe({
      next: () => {
        this.exams = this.exams.filter(e => e.examId !== this.selectedExamId);
        this.selectedExamId = null;
        this.isDeleting = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Delete failed';
        this.isDeleting = false;
        this.cd.detectChanges();
      },
    });
  }

  // 👨‍🎓 STUDENTS
  openStudentsModal(id: number) {
    this.students = [];
    this.isStudentsLoading = true;

    new bootstrap.Modal(this.studentsModal.nativeElement).show();

    this.service.getStudentsByExam(id).subscribe({
      next: (res) => {
        this.students = res;
        this.isStudentsLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load students';
        this.isStudentsLoading = false;
        this.cd.detectChanges();
      },
    });
  }
}
