import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserAccountService } from '../../services/user-account.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  email: string = '';
  password: string = '';
  isLogin = true;
  error: string = '';
  success: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private userAccountService: UserAccountService
  ) {}

  async submit() {
    this.error = '';
    this.success = '';
    try {

      if (this.isLogin) {
        await this.authService.login(this.email, this.password);
        // On successful login, save the user in backend if you want (optional):
        await firstValueFrom(this.userAccountService.saveNewLogin(this.email));
        this.router.navigate(['/library']);
      } else {
        await this.authService.register(this.email, this.password);
        // Do not login or navigate now!
        this.success = 'Registration successful! Please check your email inbox and verify your address before logging in.';
      }
    } catch (err: any) {
      this.error = err.message || 'Something went wrong';
    }
  }

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.success = '';
  }
}
