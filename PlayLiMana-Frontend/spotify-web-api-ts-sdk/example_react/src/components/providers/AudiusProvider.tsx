import type React from "react"
import type { ReactNode } from "react"
import { AudiusProvider as AudiusContextProvider } from "../../context/AudiusContext"

interface AudiusProviderProps {
    children: ReactNode
}

const AudiusProvider = ({ children }: AudiusProviderProps) => {
    return <AudiusContextProvider>{children}</AudiusContextProvider>
}

export const AudiusProviderComponent: React.FC<AudiusProviderProps> = ({ children }) => {
    return <AudiusProvider>{children}</AudiusProvider>
}

// Re-export the provider for convenience
export { AudiusProvider }
export default AudiusProvider
