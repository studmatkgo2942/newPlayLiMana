import { Injectable } from "@angular/core";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User
} from "firebase/auth";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthService {
  private auth = getAuth();
  private currentUser: User | null = null;
  private authenticated$ = new BehaviorSubject<boolean>(false);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.authenticated$.next(!!user);
    });
  }

  async register(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    if (credential.user) {
      await sendEmailVerification(credential.user);
      await signOut(this.auth);
      this.authenticated$.next(false);
    }
    return credential;
  }

  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    if (!credential.user.emailVerified) {
      await signOut(this.auth);
      this.authenticated$.next(false);
      throw new Error('Please verify your email address before logging in.');
    }
    this.authenticated$.next(true);
    return credential;
  }

  logout() {
    this.authenticated$.next(false);
    return signOut(this.auth);
  }

  getUser(): User | null {
    return this.currentUser;
  }

  // This is what your navbar expects!
  isAuthenticated$(): Observable<boolean> {
    return this.authenticated$.asObservable();
  }
}
