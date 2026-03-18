import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginRegisterService } from '../Service/Login-Register/login-register-service';
import { jwtDecode } from 'jwt-decode';
import { HttpErrorResponse } from '@angular/common/http';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  loginfrm!: FormGroup;
  Isseen = false;
  IsLogin = false;
  IsGoogleLogin = false;
  IsGoogleAvailable = true;
  authError = '';
  private googleClientId = '';
  private googleScript?: HTMLScriptElement;

  constructor(
    private fb: FormBuilder,
    private service: LoginRegisterService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loginfrm = this.fb.group({
      emailOrUsername: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', Validators.required],
    });

    this.loadGoogleClientId();
  }

  ngOnDestroy(): void {
    if (this.googleScript) {
      this.googleScript.remove();
    }
  }

  toggleSeen(passwordInput: HTMLInputElement) {
    this.Isseen = !this.Isseen;
    setTimeout(() => {
      passwordInput.focus();
    }, 0);
  }

  Onlogin() {
    this.authError = '';
    this.IsLogin = true;

    this.service.LoginUser(this.loginfrm.value).subscribe({
      next: (res) => {
        this.IsLogin = false;
        this.handleAuthSuccess(res.token);
      },
      error: () => {
        this.IsLogin = false;
        this.authError = 'Invalid username or password. Please try again.';
        this.loginfrm?.setErrors({ LoginFail: true });
      },
    });
  }

  SignInWithGoogle() {
    this.authError = '';

    if (!this.googleClientId) {
      this.authError = 'Google Sign-In is not configured. Please contact support.';
      return;
    }

    if (!window.google?.accounts?.id) {
      this.authError = 'Google Sign-In is not ready yet. Please wait a second and try again.';
      return;
    }

    this.IsGoogleLogin = true;
    window.google.accounts.id.prompt((notification: any) => {
      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        this.IsGoogleLogin = false;
      }
    });
  }

  private loadGoogleClientId() {
    this.service.GetGoogleClientId().subscribe({
      next: (response) => {
        this.googleClientId = response?.clientId?.trim() ?? '';

        if (!this.googleClientId) {
          this.authError = 'Google Sign-In is not configured. Please contact support.';
          return;
        }

        this.loadGoogleAuthScript();
      },
      error: () => {
        this.authError = 'Google Sign-In setup is unavailable right now. Please try email login.';
      },
    });
  }

  private loadGoogleAuthScript() {
    if (document.getElementById('google-identity-script')) {
      this.initializeGoogleAuth();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogleAuth();
    document.head.appendChild(script);
    this.googleScript = script;
  }

  private initializeGoogleAuth() {
    if (!window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => this.onGoogleCredentialResponse(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  private onGoogleCredentialResponse(response: any) {
    const idToken = response?.credential;

    if (!idToken) {
      this.IsGoogleLogin = false;
      this.authError = 'Unable to read Google credentials. Please try again.';
      return;
    }

    this.service.GoogleLogin(idToken).subscribe({
      next: (res) => {
        this.IsGoogleLogin = false;
        this.handleAuthSuccess(res.token);
      },
      error: (error: HttpErrorResponse) => {
        this.IsGoogleLogin = false;
        const backendMessage = error?.error?.message;
        this.authError = backendMessage && typeof backendMessage === 'string'
          ? backendMessage
          : 'Google login failed. Please verify OAuth client ID and try again.';
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
