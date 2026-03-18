import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Adminservice } from '../Service/AdminService/adminservice';
import { CommonModule } from '@angular/common';
import { Teacherservice } from '../Service/TeacherService/teacherservice';

declare var bootstrap: any;

@Component({
  selector: 'app-admincoursemanage',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admincoursemanage.html',
  styleUrl: './admincoursemanage.css',
})
export class Admincoursemanage implements OnInit {
  constructor(
    private cdr: ChangeDetectorRef,
    private service: Adminservice,
    private teacherservice : Teacherservice
  ) {}

  @ViewChild('deletemodel') deletemodel!: ElementRef;

  // course wise studnet
  @ViewChild('studentsModal') studentsModal!: ElementRef;
  students: any[] = [];
  isStudentsLoading = false;

  Isloading = false;
  courses: any[] = [];
  Ispublishing = false;

  ngOnInit(): void {
    this.GetAllCoures();
  }

  GetAllCoures() {
    this.courses = [];
    this.Isloading = true;
    this.service.GetAllCourses().subscribe({
      next: (res: any) => {
        this.Isloading = false;
        console.log(res);
        this.courses = res;
        console.log(res);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.Isloading = false;
        console.log(err);
        this.cdr.detectChanges();
      },
    });
  }

  PublishCourse(courseId: number) {
    this.Ispublishing = true;
    console.log(courseId);
    this.service.Publishcourse(courseId).subscribe({
      next: (res) => {
        this.Ispublishing = false;
        // console.log(res);
        this.GetAllCoures();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.Ispublishing = false;
        console.log(err);
        this.cdr.detectChanges();
      },
    });
  }

  selectedCourseId: number | null = null;
  errorMessage: string | null = null;
  isDeleting: boolean = false;

  openDeleteModal(courseId: number) {
    const modal = new bootstrap.Modal(this.deletemodel.nativeElement);
    modal.show();

    this.selectedCourseId = courseId;
    this.errorMessage = null; // ✅ reset old error
  }

  closeModal() {
    const modal = bootstrap.Modal.getInstance(this.deletemodel.nativeElement);
    modal?.hide();
  }

  confirmDelete() {
    if (!this.selectedCourseId) return;

    this.isDeleting = true;
    this.errorMessage = null;

    this.service.DeleteCourseById(this.selectedCourseId).subscribe({
      next: (res: any) => {
        this.courses = this.courses.filter((c) => c.courseId !== this.selectedCourseId);
        this.selectedCourseId = null;
        this.isDeleting = false;
        this.closeModal();
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.isDeleting = false;
        if (typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Something went wrong!';
        }
        this.cdr.detectChanges();
      },
    });
  }

  // coursewise student
  openStudentsModal(courseId: number) {
    this.students = [];
    this.selectedCourseId = courseId;
    this.isStudentsLoading = true;

    new bootstrap.Modal(this.studentsModal.nativeElement).show();

    this.teacherservice.GetStudentCourseWise(courseId).subscribe({
      next: (res:any) => {
        this.students = res;
        this.isStudentsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isStudentsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

}
