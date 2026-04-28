import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from 'primereact/button'

const NAV_ITEMS = [
    { key: 'ventas', label: 'Ventas', icon: 'pi pi-shopping-cart', path: '/ventas/index', shortcut: 'F1' },
    { key: 'clientes', label: 'Clientes', icon: 'pi pi-users', path: '/ventas/historial', shortcut: 'F2' },
    { key: 'productos', label: 'Productos', icon: 'pi pi-box', path: '/productos', shortcut: 'F3' },
    { key: 'inventario', label: 'Inventario', icon: 'pi pi-warehouse', path: '/inventario', shortcut: 'F4' },
    { key: 'corte', label: 'Corte', icon: 'pi pi-calculator', path: '/corte', shortcut: 'F5' },
    { key: 'configuracion', label: 'Configuración', icon: 'pi pi-cog', path: '/configuracion', shortcut: 'F6' },
]

/**
 * AppHeader – barra de navegación superior reutilizable.
 *
 * Props:
 *   actions  – JSX opcional con botones extra (p. ej. "Vaciar carrito") que se
 *              renderizan a la derecha de la navegación, antes del usuario.
 */
function AppHeader({ actions }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()

    useEffect(() => {
        function handleKeyDown(e) {
            // Ignorar cuando el foco está en un input / textarea / select
            const tag = document.activeElement?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

            if (!e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
                const idx = NAV_ITEMS.findIndex(item => item.shortcut === e.key)
                if (idx >= 0) {
                    e.preventDefault()
                    navigate(NAV_ITEMS[idx].path)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [navigate])

    function handleLogout() {
        logout()
        navigate('/')
    }

    const activeKey = NAV_ITEMS.find(n => location.pathname === n.path)?.key ?? ''

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0 1rem',
            height: '52px',
            background: '#1a1a2e',
            color: '#fff',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
            {/* Brand */}
            <span
                style={{ fontWeight: 800, fontSize: '1rem', color: '#1e90ff', marginRight: '1rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
                onClick={() => navigate('/dashboard')}
            >
                Sales App
            </span>

            {/* Navigation */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', flex: 1 }}>
                {NAV_ITEMS.map(item => {
                    const isActive = activeKey === item.key
                    return (
                        <Button
                            key={item.key}
                            label={item.label}
                            icon={item.icon}
                            text
                            size="small"
                            tooltip={item.shortcut}
                            tooltipOptions={{ position: 'bottom' }}
                            style={{
                                color: isActive ? '#1e90ff' : '#ccc',
                                background: isActive ? 'rgba(30,144,255,0.15)' : 'transparent',
                                borderRadius: '6px',
                                fontWeight: isActive ? 600 : 400,
                                padding: '0.4rem 0.65rem',
                            }}
                            onClick={() => navigate(item.path)}
                        />
                    )
                })}
            </nav>

            {/* Actions + User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                {actions}
                <span style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <i className="pi pi-user" />
                    {user?.username}
                </span>
                <Button
                    icon="pi pi-sign-out"
                    text
                    size="small"
                    tooltip="Cerrar sesión"
                    tooltipOptions={{ position: 'bottom' }}
                    style={{ color: '#aaa' }}
                    onClick={handleLogout}
                />
            </div>
        </header>
    )
}

export default AppHeader
