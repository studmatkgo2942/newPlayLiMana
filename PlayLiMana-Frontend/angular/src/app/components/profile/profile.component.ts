import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserAccountService } from '../../services/user-account.service';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  getAuth,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reload,
  sendEmailVerification
} from 'firebase/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private userService: UserAccountService) {
    this.form = this.fb.group({
      newUsername: ['', [Validators.required, Validators.email]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
        ]
      ]
    });
  }

  /** Change Email (Username) and trigger verification */
  async onUpdateUsername() {
    this.successMessage = '';
    this.errorMessage = '';
    const newUsername = this.form.get('newUsername')?.value?.trim();

    if (!newUsername) {
      this.errorMessage = 'Email is required.';
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.errorMessage = 'User not authenticated.';
      return;
    }

    try {
      // Always reload to ensure fresh user state!
      await reload(user);

      // Block if the old (current) email is not verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        this.errorMessage = 'Please verify your **current** email address first. We have sent a new link to your inbox. Once verified, reload the page and try again.';
        return;
      }

      // Actually update the email (may throw)
      await updateEmail(user, newUsername);

      // Reload so user.email points to the *new* address
      await reload(user);

      // Send verification to the *new* address
      await sendEmailVerification(user);

      // Optional: Sign out for extra safety (forces user to re-login)
      // await auth.signOut();

      // Update in your backend
      await firstValueFrom(this.userService.updateUsername(newUsername));

      this.successMessage = 'Email updated! Please check your new inbox for a verification link before logging in again.';
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        // Prompt for re-authentication, then try again!
        try {
          const currentPassword = prompt('Please re-enter your password to continue');
          if (!currentPassword) throw new Error('Reauthentication cancelled');
          const credential = EmailAuthProvider.credential(user.email!, currentPassword);
          await reauthenticateWithCredential(user, credential);

          await reload(user);

          // Retry update
          await updateEmail(user, newUsername);
          await reload(user);
          await sendEmailVerification(user);
          await firstValueFrom(this.userService.updateUsername(newUsername));
          this.successMessage = 'Email updated after reauthentication! Please check your new inbox for a verification link.';
        } catch (reauthErr: any) {
          this.errorMessage = reauthErr.message || 'Reauthentication failed.';
        }
      } else if (err.code === 'auth/email-already-in-use') {
        this.errorMessage = 'This email address is already in use by another account.';
      } else if (err.code === 'auth/invalid-email') {
        this.errorMessage = 'Please enter a valid email address.';
      } else {
        this.errorMessage = err.message || 'Failed to update email.';
      }
    }
  }

  /** Change password - standard flow */
  async onUpdatePassword() {
    this.successMessage = '';
    this.errorMessage = '';
    const newPassword = this.form.get('newPassword')?.value;
    const valid = this.form.get('newPassword')?.valid;

    if (!newPassword || !valid) {
      this.errorMessage = 'Password must meet strength requirements.';
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.errorMessage = 'User not authenticated.';
      return;
    }

    try {
      await this.userService.updatePassword(newPassword);
      this.successMessage = 'Password updated successfully!';
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        try {
          const currentPassword = prompt('Please re-enter your password to continue');
          if (!currentPassword) throw new Error('Reauthentication cancelled');
          const credential = EmailAuthProvider.credential(user.email!, currentPassword);
          await reauthenticateWithCredential(user, credential);

          await this.userService.updatePassword(newPassword);
          this.successMessage = 'Password updated successfully after reauthentication!';
        } catch (reauthErr: any) {
          this.errorMessage = reauthErr.message || 'Reauthentication failed.';
        }
      } else {
        this.errorMessage = err.message || 'Failed to update password.';
      }
    }
  }
}
