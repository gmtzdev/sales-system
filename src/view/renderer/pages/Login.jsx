import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

// Primereact
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'

function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    function handleSubmit(e) {
        e.preventDefault()
        const ok = login(username, password)
        if (ok) {
            navigate('/dashboard')
        } else {
            setError('Usuario o contraseña incorrectos')
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card title="Sales App" subTitle="Iniciar sesión" style={{ width: '360px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && <Message severity="error" text={error} style={{ width: '100%' }} />}

                    <div className="p-fluid">
                        <label htmlFor="username" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                            Usuario
                        </label>
                        <InputText
                            id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="p-fluid">
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                            Contraseña
                        </label>
                        <Password
                            inputId="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            feedback={false}
                            toggleMask
                            required
                        />
                    </div>

                    <Button type="submit" label="Entrar" icon="pi pi-sign-in" />
                </form>
            </Card>
        </div>
    )
}

export default Login


