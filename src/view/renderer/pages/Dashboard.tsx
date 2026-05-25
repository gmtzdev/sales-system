import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import OpenOperationDialog from '../components/OpenOperationDialog'
import Productos from './Productos'
import Users from './admin/Users'
import Suppliers from './admin/Suppliers'
import Departaments from './admin/Departaments'
import SalesResumen from './SalesResumen'

interface Page {
    key: string
    label: string
    icon: string
    component: React.ReactNode
}

const PAGES: Page[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'pi pi-home', component: <SalesResumen /> },
    { key: 'productos', label: 'Productos', icon: 'pi pi-box', component: <Productos /> },
    { key: 'users', label: 'Usuarios', icon: 'pi pi-users', component: <Users /> },
    { key: 'suppliers', label: 'Suppliers', icon: 'pi pi-truck', component: <Suppliers /> },
    { key: 'departaments', label: 'Departments', icon: 'pi pi-sitemap', component: <Departaments /> },
]

function Dashboard(): React.ReactElement {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const toast = useRef<InstanceType<typeof Toast>>(null)
    const [activePage, setActivePage] = useState<string>('dashboard')

    // Operation state
    const [operation, setOperation] = useState<OperationRecord | null>(null)
    const [checkingOp, setCheckingOp] = useState<boolean>(true)
    const [openOpDialog, setOpenOpDialog] = useState<boolean>(false)
    const [savingOp, setSavingOp] = useState<boolean>(false)

    // useEffect(() => {
    //     // Al cargar el dashboard, verificamos si hay una operación abierta
    //     checkOperation()
    // }, [])

    async function checkOperation(): Promise<boolean> {
        let result = null;
        try {
            const op = await window.electronAPI.operations.findOpen()
            if (op) {
                setOperation(op)
                localStorage.setItem('operation_id', String(op.id))
                result = true
            } else {
                localStorage.removeItem('operation_id')
                setOpenOpDialog(true)
                result = false
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
            result = false
        } finally {
            setCheckingOp(false)
        }
        return result;
    }

    async function crearOperacion(moneyInBox: number): Promise<void> {
        setSavingOp(true)
        try {
            const op = await window.electronAPI.operations.create({
                money_in_box: moneyInBox,
                exchange_rate: 1,
                start_user_id: user?.id ?? 0,
                box_id: 1,
            })
            setOperation(op)
            localStorage.setItem('operation_id', String(op.id))
            setOpenOpDialog(false)
            toast.current?.show({ severity: 'success', summary: 'Operación abierta', detail: `Fondo: $${moneyInBox.toFixed(2)}` })
            navigate('/sales/index')
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setSavingOp(false)
        }
    }

    function handleLogout(): void {
        logout()
        navigate('/')
    }

    // New Sale
    async function handleNewSale(): Promise<void> {
        if (await checkOperation()) {
            navigate('/sales/index')
        }
    }

    const currentPage = PAGES.find(p => p.key === activePage)

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Toast ref={toast} />

            {/* Modal: nueva operación */}
            <OpenOperationDialog
                visible={openOpDialog}
                loading={savingOp}
                onHide={() => setOpenOpDialog(false)}
                onConfirm={crearOperacion}
            />

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
                            onClick={handleNewSale}
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
