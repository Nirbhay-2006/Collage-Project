import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Teacherservice } from '../Service/TeacherService/teacherservice';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { LoginRegisterService } from '../Service/Login-Register/login-register-service';

declare var bootstrap: any;

@Component({
  selector: 'app-teachermain',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './teachermain.html',
  styleUrls: ['./teachermain.css'], // ✅ FIXED
})
export class Teachermain implements OnInit {
  registerForm!: FormGroup;
  editForm!: FormGroup;

  users: any[] = [];
  Isloading = false;
  IsAdd = false;
  SendOtp = false;
  otpValue = '';
  tempemail = '';

  editId: number | null = null;
  DeleteId: number | null = null;

  addModalInstance: any;
  editModalInstance: any;
  deleteModalInstance: any;

  @ViewChild('exampleModal') exampleModal!: ElementRef;
  @ViewChild('Editmodel') Editmodel!: ElementRef;
  @ViewChild('DeleteModal') DeleteModal!: ElementRef;

  constructor(
    private teacher_service: Teacherservice,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {}

  service = inject(LoginRegisterService);

  ngOnInit(): void {
    this.GetTeacher();

    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(3)]],
        middleName: [''],
        lastName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
        password: ['', Validators.required],
        conformpassword: ['', Validators.required],
        role: ['', Validators.required],
        isActive: [true],
      },
      { validators: this.passwordMatchValidator }, // ✅ added
    );

    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      newpassword: [''],
      isActive: [true],
    });
  }

  // ✅ password match validator
  passwordMatchValidator(control: AbstractControl) {
    const pass = control.get('password')?.value;
    const confirm = control.get('conformpassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  GetTeacher() {
    this.Isloading = true;
    this.teacher_service.GetAllTeacher().subscribe({
      next: (res) => {
        this.users = res;
        this.Isloading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.Isloading = false),
    });
  }

  openAddForm() {
    this.addModalInstance = new bootstrap.Modal(this.exampleModal.nativeElement);
    this.addModalInstance.show();
  }

  closeAddForm() {
    bootstrap.Modal.getInstance(this.exampleModal.nativeElement)?.hide();
  }

  AddUser() {
    if (this.registerForm.invalid) return;

    const formData = { ...this.registerForm.value };
    delete formData.conformpassword;

    this.IsAdd = true;
    this.SendOtp = true;

    this.service.RegisterUser(formData).subscribe({
      next: () => {
        this.IsAdd = false;
        this.tempemail = formData.email;
        this.GetTeacher();
        this.cdr.detectChanges();
      },
      error: () => (this.IsAdd = false),
    });
  }

  VarifyOtp() {
    const data = {
      email: this.registerForm.get('email')?.value,
      otp: this.otpValue,
    };

    this.service.OtpVarify(data).subscribe({
      next: () => {
        this.SendOtp = false;
        this.otpValue = '';
        this.registerForm.reset();

        this.addModalInstance?.hide(); // ✅ FIX
        this.cdr.detectChanges();
      },
    });
  }

  EditUser(user: any) {
    this.editId = user.userId;

    this.editForm.patchValue(user);
    this.openEditForm();
  }

  openEditForm() {
    this.editModalInstance = new bootstrap.Modal(this.Editmodel.nativeElement);
    this.editModalInstance.show();
  }

  closeEditForm() {
    bootstrap.Modal.getInstance(this.Editmodel.nativeElement)?.hide();
  }

  UpdateUser() {
    if (this.editForm.invalid) return;

    this.teacher_service.UpdateTeacher(this.editId!, this.editForm.value).subscribe(() => {
      this.editModalInstance?.hide(); // ✅ FIX
      this.GetTeacher();
      this.cdr.detectChanges();
    });
  }

  deleteteacher(id: number) {
    this.DeleteId = id;
    this.deleteModalInstance = new bootstrap.Modal(this.DeleteModal.nativeElement);
    this.deleteModalInstance.show();
  }

  ConfirmDelete() {
    if (!this.DeleteId) return;

    this.teacher_service.Deleteteacher(this.DeleteId).subscribe(() => {
      this.deleteModalInstance?.hide(); // ✅ FIX
      this.GetTeacher();
      this.cdr.detectChanges();
    });
  }

  // shortcut key
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      this.openAddForm();
    }
  }
}
