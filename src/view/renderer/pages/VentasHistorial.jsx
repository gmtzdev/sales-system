import React, { useEffect, useState, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Toast } from 'primereact/toast'
import { Tag } from 'primereact/tag'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'

function VentasHistorial() {
    const toast = useRef(null)
    const [ventas, setVentas] = useState([])
    const [loading, setLoading] = useState(false)
    const [detalle, setDetalle] = useState(null)
    const [dialogVisible, setDialogVisible] = useState(false)
    const [loadingDetalle, setLoadingDetalle] = useState(false)

    useEffect(() => {
        loadVentas()
    }, [])

    async function loadVentas() {
        setLoading(true)
        try {
            const rows = await window.electronAPI.ventas.findAll()
            setVentas(rows)
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setLoading(false)
        }
    }

    async function verDetalle(row) {
        setLoadingDetalle(true)
        setDialogVisible(true)
        try {
            const data = await window.electronAPI.ventas.findById(row.id)
            setDetalle(data)
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
            setDialogVisible(false)
        } finally {
            setLoadingDetalle(false)
        }
    }

    const fechaTemplate = (row) => {
        const d = new Date(row.fecha)
        return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
    }

    const totalTemplate = (row) => (
        <Tag value={`$${Number(row.total).toFixed(2)}`} severity="success" />
    )

    const accionesTemplate = (row) => (
        <Button
            icon="pi pi-eye"
            rounded
            text
            severity="info"
            tooltip="Ver detalle"
            tooltipOptions={{ position: 'left' }}
            onClick={() => verDetalle(row)}
        />
    )

    return (
        <div style={{ padding: '1.25rem', height: '100%', overflow: 'auto' }}>
            <Toast ref={toast} />

            <DataTable
                value={ventas}
                loading={loading}
                paginator
                rows={15}
                rowsPerPageOptions={[15, 30, 50]}
                emptyMessage="No hay ventas registradas"
                stripedRows
                header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Historial de ventas</span>
                        <Button icon="pi pi-refresh" outlined size="small" label="Actualizar" onClick={loadVentas} />
                    </div>
                }
            >
                <Column field="id" header="#" style={{ width: '4rem' }} sortable />
                <Column field="fecha" header="Fecha" body={fechaTemplate} sortable style={{ width: '11rem' }} />
                <Column field="vendedor" header="Vendedor" sortable />
                <Column field="notas" header="Notas" />
                <Column field="total" header="Total" body={totalTemplate} sortable style={{ width: '9rem' }} />
                <Column body={accionesTemplate} style={{ width: '4rem' }} />
            </DataTable>

            {/* Diálogo de detalle */}
            <Dialog
                header={detalle ? `Venta #${detalle.id}` : 'Cargando...'}
                visible={dialogVisible}
                style={{ width: '520px' }}
                onHide={() => { setDialogVisible(false); setDetalle(null) }}
                draggable={false}
            >
                {loadingDetalle ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
                    </div>
                ) : detalle && (
                    <>
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#555' }}>
                            <span><strong>Fecha:</strong> {new Date(detalle.fecha).toLocaleString('es-MX')}</span>
                            <span><strong>Vendedor:</strong> {detalle.vendedor || '—'}</span>
                        </div>
                        {detalle.notas && (
                            <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '1rem' }}>
                                <strong>Notas:</strong> {detalle.notas}
                            </p>
                        )}
                        <DataTable value={detalle.detalles ?? []} size="small" stripedRows>
                            <Column
                                header="Producto"
                                body={r => r.producto?.nombre ?? `ID ${r.producto_id}`}
                            />
                            <Column
                                field="precio_unitario"
                                header="Precio"
                                body={r => `$${Number(r.precio_unitario).toFixed(2)}`}
                                style={{ width: '7rem' }}
                            />
                            <Column field="cantidad" header="Cant." style={{ width: '5rem' }} />
                            <Column
                                field="subtotal"
                                header="Subtotal"
                                body={r => `$${Number(r.subtotal).toFixed(2)}`}
                                style={{ width: '7rem', fontWeight: 600 }}
                            />
                        </DataTable>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Tag value={`Total: $${Number(detalle.total).toFixed(2)}`} severity="success" style={{ fontSize: '1rem', padding: '0.4rem 0.9rem' }} />
                        </div>
                    </>
                )}
            </Dialog>
        </div>
    )
}

export default VentasHistorial
