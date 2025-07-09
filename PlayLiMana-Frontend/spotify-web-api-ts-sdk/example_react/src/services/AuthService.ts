import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth"
import {auth} from "../config/Firebase.ts"

export interface AuthService {
    login(email: string, password: string): Promise<User>

    register(email: string, password: string): Promise<User>

    logout(): Promise<void>

    getCurrentUser(): User | null

    onAuthStateChanged(callback: (user: User | null) => void): () => void
}

export class FirebaseAuthService implements AuthService {
    async login(email: string, password: string): Promise<User> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)

        // Check if email is verified
        if (!userCredential.user.emailVerified) {
            await this.logout()
            throw new Error("Please verify your email address before logging in. Check your inbox for a verification link.")
        }

        return userCredential.user
    }

    async register(email: string, password: string): Promise<User> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)

        // Send email verification
        await sendEmailVerification(userCredential.user)

        // Sign out the user immediately after registration
        await this.logout()

        return userCredential.user
    }

    async logout(): Promise<void> {
        await signOut(auth)
    }

    getCurrentUser(): User | null {
        return auth.currentUser
    }

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        return onAuthStateChanged(auth, callback)
    }
}
