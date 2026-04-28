import React from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import AppHeader from '../components/AppHeader'

const SUBNAV = [
    { key: 'nueva', label: 'Nueva Venta', icon: 'pi pi-plus-circle', path: '/ventas/index' },
    { key: 'historial', label: 'Historial', icon: 'pi pi-history', path: '/ventas/historial' },
]

function Ventas() {
    const navigate = useNavigate()
    const location = useLocation()

    if (location.pathname === '/ventas' || location.pathname === '/ventas/') {
        return <Navigate to="/ventas/index" replace />
    }

    console.log(location.pathname)


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f6f9' }}>

            <AppHeader />

            {/* Contenido de la sub-ruta activa */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Outlet />
            </div>
        </div>
    )
}

export default Ventas
