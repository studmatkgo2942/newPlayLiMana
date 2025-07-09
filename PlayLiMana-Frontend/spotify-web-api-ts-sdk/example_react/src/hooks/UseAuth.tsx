import type React from "react"
import {useState, useEffect, createContext, useContext, type ReactNode} from "react"
import type {User} from "firebase/auth"
import {FirebaseAuthService} from "../services/AuthService.ts"

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<User>
    register: (email: string, password: string) => Promise<User>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const authService = new FirebaseAuthService()

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged((user) => {
            console.log("Auth state changed:", user ? "User logged in" : "User logged out")
            setUser(user)
            setLoading(false)
        })

        return unsubscribe
    }, [authService])

    const login = async (email: string, password: string): Promise<User> => {
        const user = await authService.login(email, password)
        setUser(user)
        return user
    }

    const register = async (email: string, password: string): Promise<User> => {
        return await authService.register(email, password)
    }

    const logout = async (): Promise<void> => {
        await authService.logout()
        setUser(null)
    }

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
