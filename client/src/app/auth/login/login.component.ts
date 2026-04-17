import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/Services/auth.service';


@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})
export class LoginComponent implements OnInit {
   loginForm!:FormGroup;
   isSubmitting = false;
   loginError = '';

   constructor(private fb:FormBuilder,private authService:AuthService,private router:Router){}

  ngOnInit(): void {
    if (this.authService.isAdminLoggedIn()) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }

    this.loginForm = this.fb.group({
      credential: new FormControl('', Validators.required),
      password:new FormControl('',Validators.required)
    })
  }

  Login(){
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.Login({
      email: (this.loginForm.get('credential')?.value ?? '').trim(),
      password: this.loginForm.get('password')?.value ?? ''
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;

        if (res.isSuccessed === true) {
          const role = res.data?.userData?.role?.toUpperCase();
          this.router.navigateByUrl(role === 'ADMIN' ? '/admin/dashboard' : '/');
          return;
        }

        this.loginError = res.message || 'Invalid credentials.';
      },
      error: () => {
        this.isSubmitting = false;
        this.loginError = 'Invalid credentials.';
      }
    });
  }
}
