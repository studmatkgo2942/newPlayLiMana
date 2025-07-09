import type React from "react"
import { useState } from "react"
import { useAuth } from "../../hooks/UseAuth"
import { updateProfile } from "firebase/auth"
import AudiusProfileService from "./AudiusProfileService"
import { SpotifyProfileService } from "./SpotifyProfileService"
import { FirebaseUserAccountService } from "../UserAccountService.ts"
import "./PlayLiManaProfileService.css"

const PlayLiManaProfileService: React.FC = () => {
    const { user: firebaseUser, logout: firebaseLogout } = useAuth()
    const userAccountService = new FirebaseUserAccountService()
    const [activeView, setActiveView] = useState<"profile" | "connections" | "security">("profile")
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Form states
    const [displayName, setDisplayName] = useState(firebaseUser?.displayName || "")
    const [bio, setBio] = useState("Just exploring music across different platforms!")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [newUsername, setNewUsername] = useState("")

    // Settings states
    const [darkMode, setDarkMode] = useState(false)

    // Username is now the email
    const username = firebaseUser?.email || ""

    const handleLogout = async () => {
        try {
            await firebaseLogout()
        } catch (error) {
            console.error("Error during logout:", error)
        }
    }

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 5000)
    }

    const handleUpdateProfile = async () => {
        if (!firebaseUser) return

        setIsLoading(true)
        try {
            await updateProfile(firebaseUser, {
                displayName: displayName,
            })
            showMessage("success", "Profile updated successfully!")
            setIsEditing(false)
        } catch (error) {
            console.error("Error updating profile:", error)
            showMessage("error", "Failed to update profile. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (!firebaseUser || !currentPassword || !newPassword) return

        if (newPassword !== confirmPassword) {
            showMessage("error", "New passwords don't match.")
            return
        }

        if (newPassword.length < 6) {
            showMessage("error", "Password must be at least 12 characters long.")
            return
        }

        setIsLoading(true)
        try {
            await userAccountService.updatePassword(newPassword)
            showMessage("success", "Password updated successfully!")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (error: any) {
            console.error("Error updating password:", error)
            if (error.code === "auth/wrong-password") {
                showMessage("error", "Current password is incorrect.")
            } else {
                showMessage("error", "Failed to update password. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            showMessage("error", "Username cannot be empty.")
            return
        }

        setIsLoading(true)
        try {
            await userAccountService.updateUsername(newUsername.trim())
            setNewUsername("")
            showMessage("success", "Username updated successfully!")
        } catch (error: any) {
            console.error("Error updating username:", error)
            showMessage("error", "Failed to update username. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle("dark")
    }

    return (
        <div className="profile-container">
            <div className="profile-wrapper">
                {/* Header */}
                <div className="profile-header">
                    <h1 className="profile-title">Profile</h1>
                    <p className="profile-email">{firebaseUser?.email}</p>

                    {/* Navigation */}
                    <div className="nav-tabs">
                        <button
                            onClick={() => setActiveView("profile")}
                            className={`nav-tab ${activeView === "profile" ? "active" : ""}`}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveView("connections")}
                            className={`nav-tab ${activeView === "connections" ? "active" : ""}`}
                        >
                            Services
                        </button>
                        <button
                            onClick={() => setActiveView("security")}
                            className={`nav-tab ${activeView === "security" ? "active" : ""}`}
                        >
                            Security
                        </button>
                        <button onClick={handleLogout} className="nav-tab logout">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`message-display ${message.type === "success" ? "message-success" : "message-error"}`}>
                        <p>{message.text}</p>
                    </div>
                )}

                {/* Content */}
                {activeView === "profile" && (
                    <div className="content-section">
                        {/* Appearance Section */}
                        <div className="form-group">
                            <h2 className="section-title">Appearance</h2>
                            <div className="appearance-controls">
                                <span className="mode-indicator">Current Mode: {darkMode ? "Dark" : "Light"}</span>
                                <button onClick={toggleDarkMode} className="btn btn-secondary">
                                    Switch to {darkMode ? "Light" : "Dark"} Mode
                                </button>
                            </div>
                        </div>

                        {/* Profile Information Section */}
                        <div>
                            <h2 className="section-title">Profile Information</h2>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <div className="form-value">{username}</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Display Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter your display name"
                                    />
                                ) : (
                                    <div className="form-value">{displayName || "Not set"}</div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <div className="form-value">{firebaseUser?.email}</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bio</label>
                                {isEditing ? (
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        className="form-textarea"
                                        placeholder="Tell us about yourself..."
                                    />
                                ) : (
                                    <div className="form-value">
                                        {bio || <span style={{ opacity: 0.6, fontStyle: "italic" }}>No bio set.</span>}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="btn-group">
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                                        Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                                            Cancel
                                        </button>
                                        <button onClick={handleUpdateProfile} disabled={isLoading} className="btn btn-success">
                                            {isLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeView === "connections" && (
                    <div className="content-section">
                        <h2 className="section-title">Music Services</h2>
                        <p className="section-subtitle">
                            Connect your music streaming accounts to sync playlists and discover music across platforms. Your tokens
                            are securely saved and encrypted.
                        </p>

                        {/* Services Table */}
                        <div className="services-table">
                            <table>
                                <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Account</th>
                                    <th>Email</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                <SpotifyProfileService />
                                <AudiusProfileService />
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeView === "security" && (
                    <div className="content-section">
                        {/* Change Username Section */}
                        <div className="form-group">
                            <h2 className="section-title">Change Username</h2>
                            <div className="form-group">
                                <label className="form-label">Current Username</label>
                                <div className="form-value">{username}</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Username</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter new username"
                                />
                            </div>
                            <button
                                onClick={handleUpdateUsername}
                                disabled={isLoading || !newUsername.trim()}
                                className="btn btn-primary"
                            >
                                {isLoading ? "Updating..." : "Update Username"}
                            </button>
                        </div>

                        {/* Change Password Section */}
                        <div className="form-group">
                            <h2 className="section-title">Change Password</h2>
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="password-input"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="password-input"
                                    placeholder="Enter new password (min 12 characters)"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="password-input"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button
                                onClick={handleUpdatePassword}
                                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                                className="btn btn-primary"
                            >
                                {isLoading ? "Updating..." : "Update Password"}
                            </button>
                        </div>

                        {/* Account Information Section */}
                        <div className="account-info">
                            <h2 className="section-title">Account Information</h2>
                            <div className="info-item">
                                <span className="info-label">Email Address</span>
                                <p className="info-value">{firebaseUser?.email}</p>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Account ID</span>
                                <p className="info-value">{firebaseUser?.uid}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PlayLiManaProfileService
