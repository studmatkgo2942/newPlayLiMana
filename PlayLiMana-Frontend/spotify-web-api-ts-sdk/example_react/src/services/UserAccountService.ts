import {
    getAuth,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    sendEmailVerification
} from "firebase/auth"

export interface UserAccountService {
    updateUsername(newUsername: string): Promise<any>
    updatePassword(newPassword: string): Promise<any>
    saveNewLogin(email: string): Promise<any>
    saveUserWithSpotifyToken?(userId: string, spotifyToken: string): Promise<any>
    saveUserWithAudiusToken?(userId: string, audiusToken: string): Promise<any>
    saveServiceToken?(serviceName: string, accountId: string, authToken: string): Promise<any>
    removeServiceToken?(serviceName: string): Promise<any>
}

export class FirebaseUserAccountService implements UserAccountService {
    async updateUsername(newEmail: string): Promise<any> {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        /* 1) change the e-mail inside Firebase */
        try {
            await updateEmail(user, newEmail);
        } catch (err: any) {
            if (err.code === "auth/requires-recent-login") {
                const pwd = prompt("Please re-enter your password");
                if (!pwd) throw new Error("Re-authentication cancelled");
                const cred = EmailAuthProvider.credential(user.email!, pwd);
                await reauthenticateWithCredential(user, cred);
                await updateEmail(user, newEmail);     // retry
            } else {
                throw err;
            }
        }

        /* 2) send a fresh verification link */
        await sendEmailVerification(user, {
            // optional: deep-link after verification
            url: `${window.location.origin}/emailVerified`
        });

        /* 3) update your back-end only after Firebase succeeds */
        const resp = await fetch("/api/v1/auth/username", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({ newUsername: newEmail }),
        });
        if (!resp.ok) throw new Error("Failed to update username in backend");

        return resp.json();
    }

    async updatePassword(newPassword: string): Promise<any> {
        const auth = getAuth()
        const user = auth.currentUser

        if (!user) {
            throw new Error("User not authenticated")
        }

        try {
            // Firebase handles password updates directly
            await updatePassword(user, newPassword)
        } catch (error: any) {
            if (error.code === "auth/requires-recent-login") {
                // Prompt for re-authentication
                const currentPassword = prompt("Please re-enter your current password to continue")
                if (!currentPassword) throw new Error("Reauthentication cancelled")

                const credential = EmailAuthProvider.credential(user.email!, currentPassword)
                await reauthenticateWithCredential(user, credential)

                // Retry password update
                await updatePassword(user, newPassword)
            } else {
                throw error
            }
        }
    }

    async saveNewLogin(email: string): Promise<any> {
        const auth = getAuth()
        const user = auth.currentUser

        if (!user) {
            throw new Error("User not authenticated")
        }

        // Save user login to your backend with Firebase UID
        const response = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await this.getAuthToken()}`,
            },
            body: JSON.stringify({
                email,
                firebaseUid: user.uid,
                lastLogin: new Date().toISOString(),
            }),
        })

        if (!response.ok) {
            throw new Error("Failed to save login to backend")
        }

        return response.json()
    }

    // Spotify integration
    async saveUserWithSpotifyToken(userId: string, spotifyToken: string): Promise<any> {
        const response = await fetch("/api/v1/auth/save-service-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await this.getAuthToken()}`,
            },
            body: JSON.stringify({
                serviceName: "Spotify",
                accountId: userId,
                authToken: spotifyToken,
                tokenSavedAt: new Date().toISOString(),
            }),
        })

        if (!response.ok) {
            throw new Error("Failed to save Spotify token")
        }

        return response.json()
    }

    // Audius integration
    async saveUserWithAudiusToken(userId: string, audiusToken: string): Promise<any> {
        const response = await fetch("/api/v1/auth/save-service-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await this.getAuthToken()}`,
            },
            body: JSON.stringify({
                serviceName: "Audius",
                accountId: userId,
                authToken: audiusToken,
                tokenSavedAt: new Date().toISOString(),
            }),
        })

        if (!response.ok) {
            throw new Error("Failed to save Audius token")
        }

        return response.json()
    }

    // Generic service token save - This is the main method we're using
    async saveServiceToken(serviceName: string, accountId: string, authToken: string): Promise<any> {
        console.log(`Saving ${serviceName} token for account ${accountId}`)

        const response = await fetch("/api/v1/auth/save-service-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await this.getAuthToken()}`,
            },
            body: JSON.stringify({
                serviceName,
                accountId,
                authToken,
                tokenSavedAt: new Date().toISOString(),
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`Failed to save ${serviceName} token:`, response.status, errorText)
            throw new Error(`Failed to save ${serviceName} token: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log(`${serviceName} token saved successfully:`, result)
        return result
    }

    // Remove service token from backend
    async removeServiceToken(serviceName: string): Promise<any> {
        console.log(`Removing ${serviceName} token from backend`)

        const response = await fetch(`/api/v1/auth/remove-service-token/${serviceName}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await this.getAuthToken()}`,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`Failed to remove ${serviceName} token:`, response.status, errorText)
            throw new Error(`Failed to remove ${serviceName} token: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log(`${serviceName} token removed successfully:`, result)
        return result
    }

    private async getAuthToken(): Promise<string> {
        const auth = getAuth()
        const user = auth.currentUser

        if (!user) {
            throw new Error("User not authenticated")
        }

        return await user.getIdToken()
    }
}
