import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/Services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
  standalone: false
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdminLoggedIn()) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }

    this.loginForm = this.fb.group({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });
  }

  login(): void {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const username = (this.loginForm.get('username')?.value ?? '').trim();
    const password = this.loginForm.get('password')?.value ?? '';

    this.authService.AdminLogin({
      username,
      password
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;

        if (res.isSuccessed && res.data?.userData?.role?.toUpperCase() === 'ADMIN') {
          this.router.navigateByUrl('/admin/dashboard');
          return;
        }

        this.loginError = res.message || 'Invalid admin credentials.';
      },
      error: () => {
        this.isSubmitting = false;
        this.loginError = 'Invalid admin credentials.';
      }
    });
  }
}
