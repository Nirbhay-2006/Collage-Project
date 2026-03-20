import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginRegisterService } from '../Service/Login-Register/login-register-service';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    google?: any;
  }
}

// Custom password validator
export function customPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null; // required validator will handle empty

    // Prevent simple sequences
    const sequences = ['12345', 'abcdef', 'qwerty', 'password'];
    for (const seq of sequences) {
      if (value.toLowerCase().includes(seq)) {
        return { sequenceNotAllowed: true };
      }
    }

    // Minimum complexity: uppercase, number, special char
    const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/;
    if (!pattern.test(value)) {
      return { weakPassword: true };
    }

    return null; // valid
  };
}

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit, OnDestroy {
  loginfrm!: FormGroup;
  Isseen = false;
  IsLogin = false;
  IsGoogleLogin = false;
  authError = '';

  constructor(
    private fb: FormBuilder,
    private service: LoginRegisterService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loginfrm = this.fb.group({
      emailOrUsername: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required,
        //customPasswordValidator()
      ]],
    });
  }

  ngOnDestroy(): void {}

  toggleSeen(passwordInput: HTMLInputElement) {
    this.Isseen = !this.Isseen;
    setTimeout(() => passwordInput.focus(), 0);
  }

  Onlogin() {
    this.authError = '';
    if (this.loginfrm.invalid) return;

    this.IsLogin = true;
    this.service.LoginUser(this.loginfrm.value).subscribe({
      next: (res) => {
        this.IsLogin = false;
        this.handleAuthSuccess(res.token);
      },
      error: () => {
        this.IsLogin = false;
        this.authError = 'Invalid username or password. Please try again.';
        this.loginfrm.setErrors({ LoginFail: true });
      },
    });
  }

  private handleAuthSuccess(token: string) {
    localStorage.setItem('token', token);

    const decoded: any = jwtDecode(token);
    const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const roleId = decoded['role_id'];

    localStorage.setItem('role', role);
    localStorage.setItem('roleId', roleId);

    switch (role) {
      case 'Admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'Teacher':
        this.router.navigate(['/teacher-dashboard']);
        break;
      case 'Student':
        this.router.navigate(['/student-dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}
