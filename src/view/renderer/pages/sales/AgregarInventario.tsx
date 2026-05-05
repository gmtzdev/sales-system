import React, { useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber'
import { Toast } from 'primereact/toast'

interface ProductRow {
    code: string
    description: string
    dinventary: number
    supplier?: { id: number; name: string }
    departament?: { id: number; name: string }
}

function AgregarInventario() {
    const toast = useRef<Toast>(null)

    const [searchCode, setSearchCode] = useState('')
    const [product, setProduct] = useState<ProductRow | null>(null)
    const [searching, setSearching] = useState(false)
    const [cantidad, setCantidad] = useState<number>(0)
    const [saving, setSaving] = useState(false)

    async function buscarProducto() {
        const code = searchCode.trim()
        if (!code) return
        setSearching(true)
        setProduct(null)
        setCantidad(0)
        try {
            const row = await window.electronAPI.productos.findByCode(code) as ProductRow | null
            if (!row) {
                toast.current?.show({ severity: 'warn', summary: 'No encontrado', detail: `No se encontró el producto "${code}".` })
            } else {
                setProduct(row)
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setSearching(false)
        }
    }

    async function agregarAlInventario() {
        if (!product) return
        if (cantidad <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Cantidad inválida', detail: 'Ingrese una cantidad mayor a cero.' })
            return
        }
        setSaving(true)
        try {
            const nuevoStock = Number(product.dinventary) + cantidad
            await window.electronAPI.productos.update(product.code, { dinventary: nuevoStock })
            toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: `Stock de "${product.code}" actualizado a ${nuevoStock}.` })
            setProduct(prev => prev ? { ...prev, dinventary: nuevoStock } : null)
            setCantidad(0)
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setSaving(false)
        }
    }

    function limpiar() {
        setSearchCode('')
        setProduct(null)
        setCantidad(0)
    }

    return (
        <div style={{ maxWidth: '520px' }}>
            <Toast ref={toast} />

            <h4 style={{ margin: '0 0 1.25rem 0', color: '#1a1a2e' }}>Agregar al Inventario</h4>

            {/* Buscador */}
            <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Código del producto</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <InputText
                        value={searchCode}
                        onChange={e => setSearchCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && buscarProducto()}
                        placeholder="Ej. PROD-001"
                        style={{ flex: 1 }}
                    />
                    <Button
                        icon="pi pi-search"
                        onClick={buscarProducto}
                        loading={searching}
                        tooltip="Buscar producto"
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>

            {/* Resultado */}
            {product && (
                <>
                    {/* Descripción */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Descripción</label>
                        <InputText
                            value={product.description}
                            readOnly
                            style={{ width: '100%', background: '#f0f4f8', color: '#444' }}
                        />
                    </div>

                    {/* Cantidad actual + a agregar */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Cantidad actual</label>
                            <InputNumber
                                value={Number(product.dinventary)}
                                readOnly
                                minFractionDigits={2}
                                inputStyle={{ width: '100%', background: '#f0f4f8', color: '#444' }}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Cantidad a agregar</label>
                            <InputNumber
                                value={cantidad}
                                onValueChange={(e: InputNumberValueChangeEvent) => setCantidad(e.value ?? 0)}
                                min={0}
                                minFractionDigits={2}
                                style={{ width: '100%' }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button
                            label="Agregar"
                            icon="pi pi-plus"
                            onClick={agregarAlInventario}
                            loading={saving}
                            disabled={cantidad <= 0}
                        />
                        <Button
                            label="Limpiar"
                            icon="pi pi-refresh"
                            outlined
                            severity="secondary"
                            onClick={limpiar}
                            disabled={saving}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.35rem',
    fontWeight: 500,
    fontSize: '0.875rem',
}

export default AgregarInventario
