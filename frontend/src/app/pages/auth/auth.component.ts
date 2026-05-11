import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  activeTab: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  setTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.error = '';
    this.success = '';
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = '';
    console.log('AuthComponent.onLogin called for email:', this.loginForm.value.email);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        console.log('AuthComponent.onLogin successful for email:', this.loginForm.value.email);
        this.router.navigate(['/products']);
      },
      error: err => {
        console.error('AuthComponent.onLogin failed:', err.error?.message);
        this.error = err.error?.message || 'Hibás email vagy jelszó';
        this.loading = false;
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.error = '';
    const email = this.registerForm.value.email;
    console.log('AuthComponent.onRegister called for email:', email);

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        console.log('AuthComponent.onRegister successful for email:', email);
        this.loading = false;
        this.activeTab = 'login';
        this.loginForm.patchValue({ email });
        this.success = 'Sikeres regisztráció! Kérjük jelentkezz be.';
      },
      error: err => {
        console.error('AuthComponent.onRegister failed:', err.error?.message);
        this.error = err.error?.message || 'Sikertelen regisztráció';
        this.loading = false;
      }
    });
  }

  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }
}
