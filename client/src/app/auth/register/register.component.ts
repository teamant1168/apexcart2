import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponseDto } from 'src/app/core/Models/response';
import { AuthService } from 'src/app/core/Services/auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    standalone: false
})
export class RegisterComponent implements OnInit {
  RegistrationForm!:FormGroup;
  isAdminRegistration = false;

  constructor(private fb:FormBuilder,private authService:AuthService,private router:Router,private route:ActivatedRoute){}

  ngOnInit(): void {
    this.isAdminRegistration = this.route.snapshot.routeConfig?.path === 'register-admin';

    this.RegistrationForm = this.fb.group({
      userName: ['',Validators.required],
      email: ['',[Validators.required,Validators.email]],
      password: ['',Validators.required],
      confirmPassword:['',Validators.required],
      address: [''],
    },{validators:this.validatePwAndConfirmPw()})
  }
  Register(){
    if(this.RegistrationForm.valid){
      const registrationData = {
        userName:this.RegistrationForm.get('userName')?.value,
        email:this.RegistrationForm.get('email')?.value,
        password:this.RegistrationForm.get('password')?.value,
        address:''
      };

      const registrationReq = this.isAdminRegistration
        ? this.authService.RegisterAdmin(registrationData)
        : this.authService.RegisterUser(registrationData);

      registrationReq.subscribe({
        next:(res:ResponseDto<null>)=>{
          if(res.isSuccessed){
            this.router.navigateByUrl(this.isAdminRegistration ? '/admin/login' : '/auth/login');
          }
          else{
            alert(res.message)
          }
        }
      })
    }
  }

  private validatePwAndConfirmPw():ValidatorFn{
     return (formGroup:AbstractControl):ValidationErrors|null =>{
          var pw = formGroup.get('password')?.value;
          var confirmPw=formGroup.get('confirmPassword')?.value;
          if(pw!==confirmPw){
            formGroup.get('confirmPassword')?.setErrors({passWordMismatch:true})
            return {passWordMismatch:true};
          }
          else{
            formGroup.get('confirmPassword')?.setErrors(null)
            return null;
          }
     }
  }

}
