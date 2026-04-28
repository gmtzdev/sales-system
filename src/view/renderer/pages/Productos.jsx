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
import { InputNumber } from 'primereact/inputnumber'

const EMPTY_PRODUCT = { nombre: '', descripcion: '', precio: 0, stock: 0 }

function Productos() {
    const toast = useRef(null)
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const [dialogVisible, setDialogVisible] = useState(false)
    const [product, setProduct] = useState(EMPTY_PRODUCT)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadProductos()
    }, [])

    async function loadProductos() {
        setLoading(true)
        try {
            const rows = await window.electronAPI.productos.findAll({
                order: [['nombre', 'ASC']],
            })
            setProductos(rows)
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setLoading(false)
        }
    }

    function openNew() {
        setProduct(EMPTY_PRODUCT)
        setDialogVisible(true)
    }

    function openEdit(row) {
        setProduct({ ...row })
        setDialogVisible(true)
    }

    async function saveProduct() {
        if (!product.nombre.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Requerido', detail: 'El nombre es obligatorio' })
            return
        }
        setSaving(true)
        try {
            if (product.id) {
                await window.electronAPI.productos.update(product.id, {
                    nombre: product.nombre,
                    descripcion: product.descripcion,
                    precio: product.precio,
                    stock: product.stock,
                })
                toast.current.show({ severity: 'success', summary: 'Actualizado', detail: product.nombre })
            } else {
                await window.electronAPI.productos.create({
                    nombre: product.nombre,
                    descripcion: product.descripcion,
                    precio: product.precio,
                    stock: product.stock,
                })
                toast.current.show({ severity: 'success', summary: 'Creado', detail: product.nombre })
            }
            setDialogVisible(false)
            loadProductos()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setSaving(false)
        }
    }

    function confirmDelete(row) {
        confirmDialog({
            message: `¿Eliminar "${row.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: () => deleteProduct(row),
        })
    }

    async function deleteProduct(row) {
        try {
            await window.electronAPI.productos.delete(row.id)
            toast.current.show({ severity: 'info', summary: 'Eliminado', detail: row.nombre })
            loadProductos()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    const actionsTemplate = (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(row)} />
        </div>
    )

    const header = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Productos</span>
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
            <Button label="Guardar" icon="pi pi-check" onClick={saveProduct} loading={saving} />
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <DataTable
                value={productos}
                loading={loading}
                header={header}
                globalFilter={globalFilter}
                globalFilterFields={['nombre', 'descripcion']}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="Sin productos"
                stripedRows
            >
                <Column field="nombre" header="Nombre" sortable />
                <Column field="descripcion" header="Descripción" />
                <Column field="precio" header="Precio" sortable body={r => `$${Number(r.precio).toFixed(2)}`} style={{ width: '120px' }} />
                <Column field="stock" header="Stock" sortable style={{ width: '90px' }} />
                <Column body={actionsTemplate} style={{ width: '100px' }} />
            </DataTable>

            <Dialog
                header={product.id ? 'Editar producto' : 'Nuevo producto'}
                visible={dialogVisible}
                style={{ width: '420px' }}
                onHide={() => setDialogVisible(false)}
                footer={dialogFooter}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
                    <div className="p-fluid">
                        <label style={{ fontSize: '0.875rem', marginBottom: '0.35rem', display: 'block' }}>Nombre *</label>
                        <InputText
                            value={product.nombre}
                            onChange={e => setProduct(p => ({ ...p, nombre: e.target.value }))}
                            autoFocus
                        />
                    </div>
                    <div className="p-fluid">
                        <label style={{ fontSize: '0.875rem', marginBottom: '0.35rem', display: 'block' }}>Descripción</label>
                        <InputText
                            value={product.descripcion}
                            onChange={e => setProduct(p => ({ ...p, descripcion: e.target.value }))}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="p-fluid">
                            <label style={{ fontSize: '0.875rem', marginBottom: '0.35rem', display: 'block' }}>Precio</label>
                            <InputNumber
                                value={product.precio}
                                onValueChange={e => setProduct(p => ({ ...p, precio: e.value ?? 0 }))}
                                mode="currency"
                                currency="USD"
                                locale="es-MX"
                                min={0}
                            />
                        </div>
                        <div className="p-fluid">
                            <label style={{ fontSize: '0.875rem', marginBottom: '0.35rem', display: 'block' }}>Stock</label>
                            <InputNumber
                                value={product.stock}
                                onValueChange={e => setProduct(p => ({ ...p, stock: e.value ?? 0 }))}
                                min={0}
                            />
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export default Productos
