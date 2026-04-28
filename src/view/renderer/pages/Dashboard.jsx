import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from 'primereact/button'
import Productos from './Productos'
import Usuarios from './Usuarios'
const PAGES = [
    { key: 'productos', label: 'Productos', icon: 'pi pi-box', component: <Productos /> },
    { key: 'usuarios', label: 'Usuarios', icon: 'pi pi-users', component: <Usuarios /> },
]

function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [activePage, setActivePage] = useState('productos')

    function handleLogout() {
        logout()
        navigate('/')
    }

    const currentPage = PAGES.find(p => p.key === activePage)

    return (
        <div style={{ display: 'flex', height: '100vh' }}>

            {/* Sidebar */}
            <aside style={{ width: '220px', background: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', flexShrink: 0 }}>
                <h2 style={{ color: '#1e90ff', margin: '0 0 2rem', fontSize: '1.25rem' }}>Sales App</h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {PAGES.map(page => (
                        <Button
                            key={page.key}
                            label={page.label}
                            icon={page.icon}
                            text
                            style={{
                                justifyContent: 'flex-start',
                                color: activePage === page.key ? '#1e90ff' : '#ccc',
                                background: activePage === page.key ? 'rgba(30,144,255,0.15)' : 'transparent',
                            }}
                            onClick={() => setActivePage(page.key)}
                        />
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ fontWeight: 600 }}>{currentPage?.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Button
                            label="Nueva Venta"
                            icon="pi pi-shopping-cart"
                            severity="success"
                            size="small"
                            onClick={() => navigate('/ventas')}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#555' }}>
                            <i className="pi pi-user" style={{ marginRight: '0.4rem' }} />
                            {user?.username}
                        </span>
                        <Button
                            label="Cerrar sesión"
                            icon="pi pi-sign-out"
                            severity="secondary"
                            outlined
                            size="small"
                            onClick={handleLogout}
                        />
                    </div>
                </header>

                {/* Content */}
                <main style={{ padding: '1.5rem', flex: 1, overflow: 'auto' }}>
                    {currentPage?.component}
                </main>
            </div>
        </div>
    )
}

export default Dashboard

