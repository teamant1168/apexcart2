import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, interval, map, of, Subscription, switchMap } from 'rxjs';
import { LoginReq, LoginResData, RegisterUserData } from '../Models/Auth';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ResponseDto } from '../Models/response';
import { UserDto } from '../Models/user';
import { Router } from '@angular/router';
import { AdminLoginReq } from '../Models/admin';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isUserLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private userDetail = new BehaviorSubject<UserDto | null | undefined>(undefined);
  private refreshTokenSubscription: Subscription | null = null;


  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router
  ) { }

  isUserLogInObservable() {
    //return this.isUserLoggedIn.value && !this.jwtHelper.isTokenExpired(this.getAccessToken());
    return this.isUserLoggedIn.asObservable();
  }

  UserLoggedIn() {
    return this.isUserLoggedIn.value && !this.jwtHelper.isTokenExpired(this.getAccessToken());
  }

  isAdminUser() {
    return this.userDetail.value?.role?.toUpperCase() === 'ADMIN';
  }

  isAdminLoggedIn() {
    return this.UserLoggedIn() && this.isAdminUser();
  }

  getLoggedInUserDetail() {
    return this.userDetail.value;
  }

  getLoggedInUserId() {
    return this.userDetail.value?.userId;
  }

  Login(crediential: LoginReq) {
    return this.http.post<ResponseDto<LoginResData>>('auth/login', crediential).pipe(
      map((res) => {
        this.setUserSession(res);
        return res;
      })
    );
  }

  AdminLogin(crediential: AdminLoginReq) {
    return this.http.post<ResponseDto<LoginResData>>('admin/login', crediential).pipe(
      map((res) => {
        this.setUserSession(res);
        return res;
      })
    );
  }

  RegisterUser(userData: RegisterUserData) {
    return this.http.post<ResponseDto<null>>('auth/register', userData);
  }

  RegisterAdmin(userData: RegisterUserData) {
    return this.http.post<ResponseDto<null>>('admin/register', {
      username: userData.userName,
      email: userData.email,
      password: userData.password,
      address: userData.address
    });
  }

  LogOut() {
    const redirectUrl = this.isAdminUser() ? '/admin/login' : '/';

    return this.http.get<ResponseDto<null>>('auth/revoke').pipe(
      map((res) => {
        if (res.isSuccessed) {
          this.removeUser();
          this.router.navigateByUrl(redirectUrl);
        }
        return res;
      }),
      catchError(() => {
        this.removeUser();
        this.router.navigateByUrl(redirectUrl);

        return of({
          message: 'Logged out locally.',
          isSuccessed: true,
          data: null
        } as ResponseDto<null>);
      })
    );

  }

  refreshUser() {
    const accessToken = localStorage.getItem('accestoken');
    const refreshToken = localStorage.getItem('refreshtoken');

    if (!accessToken || !refreshToken) {
      this.removeUser();
      return of(false);
    }

    return this.http.post<ResponseDto<LoginResData>>('auth/refresh', {
      accessToken,
      refreshToken
    }).pipe(
      map((res) => {
        if (res.isSuccessed == true) {
          this.setUserSession(res);
          return true;
        }

        else {
          this.removeUser();
          return false;

        }
      }),
      catchError(() => {
        this.removeUser();
        return of(false);
      })
    );

  }

  startTokenRefresh() {
    if (!this.refreshTokenSubscription && this.UserLoggedIn()) {
      this.refreshTokenSubscription = interval(5 * 60 * 1000) // Refresh every 5 minutes
        .pipe(
          switchMap(() => this.refreshUser())
        )
        .subscribe({
          next: (token) => {
            console.log('Token refreshed:', token);
          },
          error: (err) => {
            console.error('Token refresh failed:', err);
            this.removeUser();
          },
        });
    }
  }

  stopTokenRefresh() {
    if (this.refreshTokenSubscription) {
      this.refreshTokenSubscription.unsubscribe();
      this.refreshTokenSubscription = null;
    }
  }

  getAccessToken() {
    return localStorage.getItem('accestoken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshtoken');
  }

  private setUserSession(response: ResponseDto<LoginResData>) {
    if (response.isSuccessed !== true) {
      return;
    }

    response.data?.accessToken !== undefined && localStorage.setItem('accestoken', response.data?.accessToken);
    response.data?.refreshToken !== undefined && localStorage.setItem('refreshtoken', response.data?.refreshToken);
    this.userDetail.next(response.data?.userData);
    this.isUserLoggedIn.next(true);
    this.startTokenRefresh();
  }

  private removeUser() {
    localStorage.setItem('accestoken', '');
    localStorage.setItem('refreshtoken', '');
    this.isUserLoggedIn.next(false);
    this.userDetail.next(undefined);
    this.stopTokenRefresh();
  }
}
