import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
    id: number
    username: string
    name: string
    email: string
    rol: 'admin' | 'vendedor'
    isActive: boolean
}

interface AuthContextValue {
    user: User | null
    login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
    logout: () => void
}

const SESSION_KEY = 'auth_user'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem(SESSION_KEY)
            return stored ? (JSON.parse(stored) as User) : null
        } catch {
            return null
        }
    })

    useEffect(() => {
        if (user) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user))
        } else {
            localStorage.removeItem(SESSION_KEY)
        }
    }, [user])

    async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
        try {
            const result = await window.electronAPI.users.login(username, password)
            if (result.ok && result.user) {
                setUser(result.user as unknown as User)
                return { ok: true }
            }
            return { ok: false, error: result.error ?? 'Error desconocido' }
        } catch {
            return { ok: false, error: 'Error al conectar con el servidor' }
        }
    }

    function logout(): void {
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}
