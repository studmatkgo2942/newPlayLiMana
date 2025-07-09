import type React from "react"
import {useState} from "react"
import {useForm} from "react-hook-form"
import {
    getAuth,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    reload,
    sendEmailVerification,
} from "firebase/auth"
import type {UserAccountService} from "../../services/UserAccountService.ts"

interface ProfileFormData {
    newUsername: string
    newPassword: string
}

interface ProfileFormProps {
    userService?: UserAccountService
}

const ProfileForm: React.FC<ProfileFormProps> = ({userService}) => {
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    const {
        register,
        getValues,
        formState: {errors, isValid},
    } = useForm<ProfileFormData>({
        mode: "onChange",
        defaultValues: {
            newUsername: "",
            newPassword: "",
        },
    })

    const clearMessages = () => {
        setSuccessMessage("")
        setErrorMessage("")
    }

    const promptForReauth = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            const password = prompt("Please re-enter your password to continue")
            if (!password) {
                reject(new Error("Reauthentication cancelled"))
            } else {
                resolve(password)
            }
        })
    }

    const handleUpdateUsername = async () => {
        clearMessages()
        setIsUpdatingUsername(true)

        const newUsername = getValues("newUsername")?.trim()

        if (!newUsername) {
            setErrorMessage("Email is required.")
            setIsUpdatingUsername(false)
            return
        }

        const auth = getAuth()
        const user = auth.currentUser

        if (!user) {
            setErrorMessage("User not authenticated.")
            setIsUpdatingUsername(false)
            return
        }

        try {
            // Always reload to ensure fresh user state
            await reload(user)

            // Block if the old (current) email is not verified
            if (!user.emailVerified) {
                await sendEmailVerification(user)
                setErrorMessage(
                    "Please verify your **current** email address first. We have sent a new link to your inbox. Once verified, reload the page and try again.",
                )
                setIsUpdatingUsername(false)
                return
            }

            // Actually update the email
            await updateEmail(user, newUsername)

            // Reload so user.email points to the new address
            await reload(user)

            // Send verification to the new address
            await sendEmailVerification(user)

            // Update in your backend (if userService is provided)
            if (userService) {
                await userService.updateUsername(newUsername)
            }

            setSuccessMessage("Email updated! Please check your new inbox for a verification link before logging in again.")
        } catch (err: any) {
            if (err.code === "auth/requires-recent-login") {
                try {
                    const currentPassword = await promptForReauth()
                    const credential = EmailAuthProvider.credential(user.email!, currentPassword)
                    await reauthenticateWithCredential(user, credential)

                    await reload(user)

                    // Retry update
                    await updateEmail(user, newUsername)
                    await reload(user)
                    await sendEmailVerification(user)

                    if (userService) {
                        await userService.updateUsername(newUsername)
                    }

                    setSuccessMessage(
                        "Email updated after reauthentication! Please check your new inbox for a verification link.",
                    )
                } catch (reauthErr: any) {
                    setErrorMessage(reauthErr.message || "Reauthentication failed.")
                }
            } else if (err.code === "auth/email-already-in-use") {
                setErrorMessage("This email address is already in use by another account.")
            } else if (err.code === "auth/invalid-email") {
                setErrorMessage("Please enter a valid email address.")
            } else {
                setErrorMessage(err.message || "Failed to update email.")
            }
        } finally {
            setIsUpdatingUsername(false)
        }
    }

    const handleUpdatePassword = async () => {
        clearMessages()
        setIsUpdatingPassword(true)

        const newPassword = getValues("newPassword")
        const passwordField = register("newPassword", {
            required: true,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
        })

        if (!newPassword || errors.newPassword) {
            setErrorMessage("Password must meet strength requirements.")
            setIsUpdatingPassword(false)
            return
        }

        const auth = getAuth()
        const user = auth.currentUser

        if (!user) {
            setErrorMessage("User not authenticated.")
            setIsUpdatingPassword(false)
            return
        }

        try {
            if (userService) {
                await userService.updatePassword(newPassword)
            } else {
                // Fallback to direct Firebase call
                await updatePassword(user, newPassword)
            }
            setSuccessMessage("Password updated successfully!")
        } catch (err: any) {
            if (err.code === "auth/requires-recent-login") {
                try {
                    const currentPassword = await promptForReauth()
                    const credential = EmailAuthProvider.credential(user.email!, currentPassword)
                    await reauthenticateWithCredential(user, credential)

                    if (userService) {
                        await userService.updatePassword(newPassword)
                    } else {
                        await updatePassword(user, newPassword)
                    }
                    setSuccessMessage("Password updated successfully after reauthentication!")
                } catch (reauthErr: any) {
                    setErrorMessage(reauthErr.message || "Reauthentication failed.")
                }
            } else {
                setErrorMessage(err.message || "Failed to update password.")
            }
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    return (
        <div className="profile-form">
            <form>
                {/* Username (Email) Update */}
                <div className="form-group">
                    <label htmlFor="newUsername">New Username (Email)</label>
                    <input
                        id="newUsername"
                        type="email"
                        {...register("newUsername", {
                            required: "Email is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Please enter a valid email",
                            },
                        })}
                        className={errors.newUsername ? "invalid" : ""}
                        autoComplete="username"
                        placeholder="Enter new email"
                    />
                    <button type="button" onClick={handleUpdateUsername}
                            disabled={!!errors.newUsername || isUpdatingUsername}>
                        {isUpdatingUsername ? "Updating..." : "Update Username"}
                    </button>
                    {errors.newUsername && <div className="input-error">Please enter a valid email.</div>}
                </div>

                {/* Password Update */}
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                        id="newPassword"
                        type="password"
                        {...register("newPassword", {
                            required: "Password is required",
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                                message:
                                    "Password must be at least 8 characters, with uppercase, lowercase, number, and special character",
                            },
                        })}
                        className={errors.newPassword ? "invalid" : ""}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                    />
                    <button type="button" onClick={handleUpdatePassword}
                            disabled={!!errors.newPassword || isUpdatingPassword}>
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </button>
                    {errors.newPassword && (
                        <div className="input-error">
                            Password must be at least 8 characters, with uppercase, lowercase, number, and special
                            character.
                        </div>
                    )}
                </div>
            </form>

            {/* Success/Error messages */}
            {successMessage && <p className="success">{successMessage}</p>}
            {errorMessage && <p className="error">{errorMessage}</p>}
        </div>
    )
}

export default ProfileForm
