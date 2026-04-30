import React, { useEffect, useState, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { Password } from 'primereact/password'

const EMPTY_USER = { username: '', password: '', nombre: '', rol: 'vendedor', activo: true }
const ROLES = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Vendedor', value: 'vendedor' },
]

function Users() {
    const toast = useRef(null)
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const [dialogVisible, setDialogVisible] = useState(false)
    const [usuario, setUsuario] = useState(EMPTY_USER)
    const [saving, setSaving] = useState(false)
    const isEditing = Boolean(usuario.id)

    useEffect(() => {
        loadUsuarios()
    }, [])

    async function loadUsuarios() {
        setLoading(true)
        try {
            const rows = await window.electronAPI.users.findAll({
                order: [['username', 'ASC']],
            })
            setUsuarios(rows)
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setLoading(false)
        }
    }

    function openNew() {
        setUsuario(EMPTY_USER)
        setDialogVisible(true)
    }

    function openEdit(row) {
        setUsuario({ ...row, password: '' })
        setDialogVisible(true)
    }

    async function saveUsuario() {
        if (!usuario.username.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Requerido', detail: 'El nombre de usuario es obligatorio' })
            return
        }
        if (!isEditing && !usuario.password) {
            toast.current.show({ severity: 'warn', summary: 'Requerido', detail: 'La contraseña es obligatoria para nuevos usuarios' })
            return
        }
        setSaving(true)
        try {
            if (isEditing) {
                await window.electronAPI.users.update(usuario.id, {
                    username: usuario.username,
                    nombre: usuario.nombre,
                    rol: usuario.rol,
                    activo: usuario.activo,
                    ...(usuario.password ? { password: usuario.password } : {}),
                })
                toast.current.show({ severity: 'success', summary: 'Actualizado', detail: usuario.username })
            } else {
                await window.electronAPI.users.create({
                    username: usuario.username,
                    password: usuario.password,
                    nombre: usuario.nombre,
                    rol: usuario.rol,
                    activo: usuario.activo,
                })
                toast.current.show({ severity: 'success', summary: 'Creado', detail: usuario.username })
            }
            setDialogVisible(false)
            loadUsuarios()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setSaving(false)
        }
    }

    function confirmDelete(row) {
        confirmDialog({
            message: `¿Eliminar al usuario "${row.username}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: () => deleteUsuario(row),
        })
    }

    async function deleteUsuario(row) {
        try {
            await window.electronAPI.users.delete(row.id)
            toast.current.show({ severity: 'info', summary: 'Eliminado', detail: row.username })
            loadUsuarios()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    const rolTemplate = (row) => {
        const severity = row.rol === 'admin' ? 'danger' : 'info'
        const label = row.rol === 'admin' ? 'Administrador' : 'Vendedor'
        return <Tag value={label} severity={severity} />
    }

    const activoTemplate = (row) => (
        <Tag
            value={row.activo ? 'Activo' : 'Inactivo'}
            severity={row.activo ? 'success' : 'secondary'}
        />
    )

    const actionsTemplate = (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(row)} />
        </div>
    )

    const header = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Usuarios</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        placeholder="Buscar..."
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                    />
                </IconField>
                <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
            </div>
        </div>
    )

    const dialogFooter = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label="Cancelar" icon="pi pi-times" outlined onClick={() => setDialogVisible(false)} disabled={saving} />
            <Button label="Guardar" icon="pi pi-check" onClick={saveUsuario} loading={saving} />
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <DataTable
                value={usuarios}
                loading={loading}
                header={header}
                globalFilter={globalFilter}
                globalFilterFields={['username', 'nombre', 'rol']}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="No hay usuarios registrados"
                stripedRows
            >
                <Column field="username" header="Usuario" sortable />
                <Column field="nombre" header="Nombre completo" sortable />
                <Column field="rol" header="Rol" body={rolTemplate} sortable />
                <Column field="activo" header="Estado" body={activoTemplate} sortable />
                <Column body={actionsTemplate} header="Acciones" style={{ width: '8rem' }} />
            </DataTable>

            <Dialog
                header={isEditing ? 'Editar usuario' : 'Nuevo usuario'}
                visible={dialogVisible}
                style={{ width: '420px' }}
                onHide={() => setDialogVisible(false)}
                footer={dialogFooter}
                draggable={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="p-field">
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                            Usuario <span style={{ color: 'red' }}>*</span>
                        </label>
                        <InputText
                            value={usuario.username}
                            onChange={e => setUsuario(prev => ({ ...prev, username: e.target.value }))}
                            style={{ width: '100%' }}
                            placeholder="nombre de usuario"
                        />
                    </div>

                    <div className="p-field">
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                            Nombre completo
                        </label>
                        <InputText
                            value={usuario.nombre}
                            onChange={e => setUsuario(prev => ({ ...prev, nombre: e.target.value }))}
                            style={{ width: '100%' }}
                            placeholder="nombre visible"
                        />
                    </div>

                    <div className="p-field">
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                            Contraseña {!isEditing && <span style={{ color: 'red' }}>*</span>}
                        </label>
                        <Password
                            value={usuario.password}
                            onChange={e => setUsuario(prev => ({ ...prev, password: e.target.value }))}
                            style={{ width: '100%' }}
                            inputStyle={{ width: '100%' }}
                            placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'contraseña'}
                            toggleMask
                            feedback={false}
                        />
                    </div>

                    <div className="p-field">
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Rol</label>
                        <Dropdown
                            value={usuario.rol}
                            options={ROLES}
                            onChange={e => setUsuario(prev => ({ ...prev, rol: e.value }))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="p-field">
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Estado</label>
                        <Dropdown
                            value={usuario.activo}
                            options={[
                                { label: 'Activo', value: true },
                                { label: 'Inactivo', value: false },
                            ]}
                            onChange={e => setUsuario(prev => ({ ...prev, activo: e.value }))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export default Users
