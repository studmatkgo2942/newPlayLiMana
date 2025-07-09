import type React from "react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"




import "../../components/forms/AuthForm.css"
import "./AuthPage.css"
import {FirebaseUserAccountService} from "../../services/UserAccountService.ts";
import {FirebaseAuthService} from "../../services/AuthService.ts";
import {useAuth} from "../../hooks/UseAuth.tsx";
import AuthForm from "../../components/forms/AuthForm.tsx";

const AuthPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const authService = new FirebaseAuthService()
    const userAccountService = new FirebaseUserAccountService()

    // Redirect if already authenticated
    useEffect(() => {
        if (user) {
            navigate("/")
        }
    }, [user, navigate])

    // Don't render if user is already authenticated
    if (user) {
        return null
    }

    return (
        <div className="auth-page">
            <div className="auth-page-header">
                <h1>Welcome to PlayLiMana</h1>
                <p>Sign in to access your music library and connect with Spotify</p>
            </div>
            <AuthForm authService={authService} userAccountService={userAccountService} />
        </div>
    )
}

export default AuthPage
