import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { AuthService } from "../../services/AuthService.ts"
import type { UserAccountService } from "../../services/UserAccountService.ts"

interface AuthFormProps {
    authService: AuthService
    userAccountService: UserAccountService
}

const AuthForm: React.FC<AuthFormProps> = ({ authService, userAccountService }) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const navigate = useNavigate()

    const clearMessages = () => {
        setError("")
        setSuccess("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearMessages()
        setIsSubmitting(true)

        try {
            if (isLogin) {
                await authService.login(email, password)
                // On successful login, save the user in backend if you want (optional)
                await userAccountService.saveNewLogin(email)
                navigate("/library")
            } else {
                await authService.register(email, password)
                // Do not login or navigate now!
                setSuccess("Registration successful! Please check your email inbox and verify your address before logging in.")
            }
        } catch (err: any) {
            setError(err.message ?? "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleMode = () => {
        setIsLogin(!isLogin)
        clearMessages()
        setEmail("")
        setPassword("")
    }

    return (
        <div className="auth-form">
            <h2>{isLogin ? "Login" : "Register"}</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        disabled={isSubmitting}
                    />
                </label>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (isLogin ? "Logging in..." : "Registering...") : isLogin ? "Login" : "Register"}
                </button>
                <button type="button" onClick={toggleMode} disabled={isSubmitting}>
                    {isLogin ? "Create Account" : "Back to Login"}
                </button>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
            </form>
        </div>
    )
}

export default AuthForm
