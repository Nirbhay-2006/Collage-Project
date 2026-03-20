import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Teacherservice } from '../Service/TeacherService/teacherservice';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

declare var bootstrap: any;
@Component({
  selector: 'app-teacher-exam-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-exam-list.html',
  styleUrl: './teacher-exam-list.css',
})
export class TeacherExamList implements OnInit {
  examForm!: FormGroup;
  courses: any[] = [];
  exams: any[] = [];
  selectedfile: File | null = null;
  Isloadcourse = false;
  minDateTime: string = '';
  minEndDate: string = '';

  @ViewChild('examcreatemodel') examcreatemodel!: ElementRef;

  constructor(
    private service: Teacherservice,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
  ) {
    this.examForm = this.fb.group(
      {
        CourseId: ['', Validators.required],
        Title: ['', [Validators.required, Validators.minLength(3)]],
        Description: ['', [Validators.required, Validators.minLength(10)]],
        StartAt: ['', Validators.required],
        EndAt: ['', Validators.required],
        DurationMinutes: [0, [Validators.required, Validators.min(1)]],
        RandomQuestionCount: [0, [Validators.required, Validators.min(1)]],
      },
      { validators: this.dateValidator }, // 🔥 custom validator
    );
  }

  ngOnInit(): void {
    this.locadcourse();
    this.loadexamdetail();
    this.setMinDateTime();
    this.setEndMinDateTime();
  }

  setMinDateTime() {
    const now = new Date();

    // format: yyyy-MM-ddTHH:mm
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);

    this.minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  setEndMinDateTime() {
    const tomorrow = new Date();

    // add 1 day safely (handles month/year automatically)
    tomorrow.setDate(tomorrow.getDate() + 1);

    // optional: set time to 00:00 (start of day)
    tomorrow.setHours(0, 0, 0, 0);

    // format to yyyy-MM-ddTHH:mm
    const year = tomorrow.getFullYear();
    const month = ('0' + (tomorrow.getMonth() + 1)).slice(-2);
    const day = ('0' + tomorrow.getDate()).slice(-2);
    const hours = ('0' + tomorrow.getHours()).slice(-2);
    const minutes = ('0' + tomorrow.getMinutes()).slice(-2);

    this.minEndDate = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  get f() {
    return this.examForm.controls;
  }

  // ✅ Helper for error check
  isInvalid(field: string) {
    return this.f[field].touched && this.f[field].invalid;
  }

  // 🔥 date validation
  dateValidator(group: any) {
    const start = group.get('StartAt')?.value;
    const end = group.get('EndAt')?.value;

    if (!start || !end) return null;

    const now = new Date();

    const startDate = new Date(start);
    const endDate = new Date(end);

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (startDate < now) {
      return { startPast: true };
    }

    if (endDate < tomorrow) {
      return { endNotFuture: true }; // ❗ not allowed today
    }

    if (endDate <= startDate) {
      return { endBeforeStart: true };
    }

    return null;
  }

  onFileSelected(event: any) {
    this.selectedfile = event.target.files[0];
  }

  locadcourse() {
    this.Isloadcourse = true;
    this.service.GetOwnCourses().subscribe({
      next: (res: any) => {
        this.Isloadcourse = false;
        this.courses = res;
        console.log(res);
        this.cd.detectChanges();
      },
      error: (err) => {
        this.Isloadcourse = false;
        console.log(err);
        this.cd.detectChanges();
      },
    });
  }

  isLoading: boolean = false;
  submitted = false;

  CreareExam() {
    this.submitted = true;

    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const formData = new FormData();

    Object.keys(this.examForm.value).forEach((key) => {
      formData.append(key, this.examForm.value[key]);
    });

    if (this.selectedfile) {
      formData.append('ExcelFile', this.selectedfile);
    }

    this.service.CreateExam(formData).subscribe({
      next: (res) => {
        console.log('Success', res);

        this.examForm.reset();
        this.selectedfile = null;
        this.submitted = false;

        this.loadexamdetail();
        this.closeModal();

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  loadexamdetail() {
    this.service.GetTeacherWiseExamDetail().subscribe({
      next: (res: any) => {
        console.log(res);
        this.exams = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.log(err);
        this.cd.detectChanges();
      },
    });
  }

  closeModal() {
    const modalEl = this.examcreatemodel.nativeElement;
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
  }

  getExamStatus(exam: any) {
    const now = new Date();

    const start = new Date(exam.startdate);
    const end = new Date(exam.enddate);

    if (now < start) {
      return 'notStarted';
    }

    if (now >= start && now <= end) {
      return 'ongoing';
    }

    return 'finished';
  }

  publishresult(examid: number) {
    this.service.PublishResult(examid).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
