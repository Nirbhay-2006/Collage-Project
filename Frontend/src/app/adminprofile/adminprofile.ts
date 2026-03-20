import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Adminservice } from '../Service/AdminService/adminservice';
import { CommonModule } from '@angular/common';
import { ConnectableObservable } from 'rxjs';

@Component({
  selector: 'app-adminprofile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './adminprofile.html',
  styleUrls: ['./adminprofile.css'],
})
export class Adminprofile implements OnInit {
  profileForm!: FormGroup;
  userData: any;
  isEditMode = false;

  constructor(
    private service: Adminservice,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      userId: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      email: [''],
      phone: [''],
      username: [''],
      roleId: [''], // ✅ ADD
      isActive: [''], // ✅ ADD
      createdAt: [''], // ✅ ADD
      lastLoginAt: [''], // ✅ ADD
      updatedAt: [''], // ✅ ADD
    });
    this.loadProfile();
  }

  loadProfile() {
    this.service.Getprofile().subscribe({
      next: (res: any) => {
        this.userData = res; // ✅ store original
        this.profileForm.patchValue(res); // form
        console.log(res);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Error loading profile', err);
      },
    });
  }

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
  }

  saveProfile() {
    var updateformobj = {
      firstName: this.profileForm.get('firstName')?.value,
      middleName: this.profileForm.get('middleName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      email: this.profileForm.get('email')?.value,
      phone: this.profileForm.get('phone')?.value,
    };
    console.log(updateformobj);
    this.service.UpdateProfile(updateformobj).subscribe({
      next: (res) => {
        console.log(res);
        this.isEditMode = !this.isEditMode;
        this.loadProfile();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  get fullName() {
    const f = this.profileForm.value;
    return `${f.firstName} ${f.middleName || ''} ${f.lastName}`.trim();
  }
}
