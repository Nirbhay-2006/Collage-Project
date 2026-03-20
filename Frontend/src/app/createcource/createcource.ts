import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Teacherservice } from '../Service/TeacherService/teacherservice';

@Component({
  selector: 'app-createcource',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './createcource.html',
  styleUrl: './createcource.css',
})
export class Createcource {

  courseForm: FormGroup;

  selectedFiles: File[] = [];
  thumbnailFile!: File;

  thumbnailError: string = '';
  fileErrors: string[] = [];

  @ViewChild('fileInput') fileInput!: ElementRef;

  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private service: Teacherservice
  ) {

    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      fees: [null, [Validators.required, Validators.min(0)]],
    });

  }

  // ✅ Thumbnail Validation
  onThumbnailChange(event: any) {
    this.thumbnailError = '';

    const file = event.target.files[0];

    if (!file) return;

    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      this.thumbnailError = 'Thumbnail must be greater than 0 and at most 5 MB.';
      this.thumbnailFile = undefined as any;
      return;
    }

    this.thumbnailFile = file;
  }

  // ✅ Video Validation
  onFileChange(event: any) {
    this.fileErrors = [];
    this.selectedFiles = [];

    const files = Array.from(event.target.files) as File[];

    files.forEach(file => {
      if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
        this.fileErrors.push(`${file.name} must be between 0 and 5 MB.`);
      } else {
        this.selectedFiles.push(file);
      }
    });
  }

  // ✅ Submit
  onSubmit() {

    // mark all fields touched
    this.courseForm.markAllAsTouched();

    if (this.courseForm.invalid || this.thumbnailError || this.fileErrors.length > 0) {
      return;
    }

    const formData = new FormData();

    formData.append('Title', this.courseForm.value.title);
    formData.append('Description', this.courseForm.value.description);
    formData.append('StartDate', this.courseForm.value.startDate);
    formData.append('EndDate', this.courseForm.value.endDate);
    formData.append('Fees', this.courseForm.value.fees);

    if (this.thumbnailFile) {
      formData.append('ThumbailUrl', this.thumbnailFile);
    }

    this.selectedFiles.forEach(file => {
      formData.append('Files', file);
    });

    this.isUploading = true;

    this.service.CreateCourses(formData).subscribe({

      next: () => {
        this.isUploading = false;

        this.courseForm.reset();
        this.selectedFiles = [];
        this.thumbnailFile = undefined as any;
        this.thumbnailError = '';
        this.fileErrors = [];

        this.fileInput.nativeElement.value = '';
      },

      error: (err) => {
        this.isUploading = false;
        console.error(err);
      }

    });

  }

}
