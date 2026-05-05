import React from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

function Ventas(): React.ReactElement {
    const location = useLocation()

    if (location.pathname === '/sales' || location.pathname === '/sales/') {
        return <Navigate to="/sales/index" replace />
    }

    console.log(location.pathname)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f6f9' }}>

            <AppHeader actions={null} />

            {/* Contenido de la sub-ruta activa */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Outlet />
            </div>
        </div>
    )
}

export default Ventas
