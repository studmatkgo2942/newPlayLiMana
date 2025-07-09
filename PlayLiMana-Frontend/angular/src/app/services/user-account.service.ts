import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, switchMap, Observable } from 'rxjs';
import { getAuth, updatePassword, sendEmailVerification } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class UserAccountService {
  private apiUrl = 'http://localhost:9000/streamingAccount';

  constructor(private http: HttpClient) {}

  saveNewLogin(email: string): Observable<any> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    return from(user.getIdToken()).pipe(
      switchMap(() =>
        this.http.post(`${this.apiUrl}/register`, {
          uid: user.uid,
          username: email
        })
      )
    );
  }

  updateUsername(newUsername: string): Observable<any> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    return this.http.put(`${this.apiUrl}/username`, {
      uid: user.uid,
      newUsername
    });
  }

  async updatePassword(newPassword: string): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await updatePassword(user, newPassword);
  }

  /**
   * Send a verification email to the current user.
   */
  async sendVerificationEmail(): Promise<void> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (user.emailVerified) throw new Error('Email is already verified.');

    await sendEmailVerification(user);
  }
}
