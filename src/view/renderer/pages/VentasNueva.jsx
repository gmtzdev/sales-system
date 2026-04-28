import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputNumber } from 'primereact/inputnumber'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Toast } from 'primereact/toast'
import { Divider } from 'primereact/divider'
import { InputTextarea } from 'primereact/inputtextarea'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Badge } from 'primereact/badge'
import Productos from './Productos'
import './VentasNueva.css'

const tabls = [
    { key: 'catalogo', label: 'Catálogo', icon: 'pi pi-th-large' },
    { key: 'productos', label: 'Productos', icon: 'pi pi-box' }
]

function VentasNueva() {
    const toast = useRef(null)
    const { user } = useAuth()
    const [panelIzq, setPanelIzq] = useState('catalogo')
    const [productos, setProductos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [carrito, setCarrito] = useState([])
    const [notas, setNotas] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [tickets, setTickets] = useState(['Ticket #1', 'Ticket #2', 'Ticket #3',])
    const [ticketActivo, setTicketActivo] = useState('Ticket #1')
    const [carritoSeleccionado, setCarritoSeleccionado] = useState(null) // producto_id seleccionado

    useEffect(() => {
        loadProductos()
    }, [])



    async function searchProduct() {
        const q = busqueda.trim()
        if (!q) return

        try {
            const resultados = await window.electronAPI.productos.findAll({
                where: { nombre: q },
            })

            // Coincidencia exacta primero, luego parcial
            let encontrado = resultados.find(
                p => p.nombre.toLowerCase() === q.toLowerCase()
            ) ?? resultados[0]

            if (!encontrado) {
                toast.current.show({ severity: 'warn', summary: 'No encontrado', detail: `No hay productos con "${q}"` })
                return
            }

            agregarAlCarrito(encontrado)
            setBusqueda('')
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }













    async function loadProductos() {
        try {
            const rows = await window.electronAPI.productos.findAll({
                order: [['nombre', 'ASC']],
            })
            setProductos(rows)
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    // ── Carrito ──────────────────────────────────────────────────
    function agregarAlCarrito(producto) {
        if (producto.stock <= 0) {
            toast.current.show({ severity: 'warn', summary: 'Sin stock', detail: `"${producto.nombre}" no tiene stock disponible` })
            return
        }
        setCarrito(prev => {
            const idx = prev.findIndex(i => i.producto_id === producto.id)
            if (idx >= 0) {
                const item = prev[idx]
                if (item.cantidad >= producto.stock) {
                    toast.current.show({ severity: 'warn', summary: 'Stock insuficiente', detail: `Máximo ${producto.stock} unidades` })
                    return prev
                }
                const updated = [...prev]
                updated[idx] = {
                    ...item,
                    cantidad: item.cantidad + 1,
                    subtotal: Number(((item.cantidad + 1) * item.precio_unitario).toFixed(2)),
                }
                return updated
            }
            const nuevo = {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: Number(producto.precio),
                cantidad: 1,
                subtotal: Number(producto.precio),
                stock: producto.stock,
            }
            setCarritoSeleccionado(producto.id)
            return [...prev, nuevo]
        })
    }

    function cambiarCantidad(producto_id, nuevaCantidad) {
        setCarrito(prev =>
            prev.map(item => {
                if (item.producto_id !== producto_id) return item
                const cant = Math.max(1, Math.min(nuevaCantidad ?? 1, item.stock))
                return { ...item, cantidad: cant, subtotal: Number((cant * item.precio_unitario).toFixed(2)) }
            }),
        )
    }

    function quitarDelCarrito(producto_id) {
        setCarrito(prev => prev.filter(i => i.producto_id !== producto_id))
    }

    function limpiarCarrito() {
        setCarrito([])
        setNotas('')
        setCarritoSeleccionado(null)
    }

    // ── Navegación teclado en carrito ──────────────────────────
    useEffect(() => {
        function handleKey(e) {
            // Ignorar si el foco está en un input/textarea
            // if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
            if (carrito.length === 0) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCarritoSeleccionado(prev => {
                    const idx = carrito.findIndex(i => i.producto_id === prev)
                    return carrito[Math.min(idx + 1, carrito.length - 1)].producto_id
                })
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCarritoSeleccionado(prev => {
                    const idx = carrito.findIndex(i => i.producto_id === prev)
                    return carrito[Math.max(idx - 1, 0)].producto_id
                })
            } else if ((e.key === '+' || e.key === '=') && carritoSeleccionado) {
                e.preventDefault()
                cambiarCantidad(carritoSeleccionado,
                    (carrito.find(i => i.producto_id === carritoSeleccionado)?.cantidad ?? 0) + 1
                )
            } else if (e.key === '-' && carritoSeleccionado) {
                e.preventDefault()
                cambiarCantidad(carritoSeleccionado,
                    (carrito.find(i => i.producto_id === carritoSeleccionado)?.cantidad ?? 1) - 1
                )
            }
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [carrito, carritoSeleccionado])

    const total = carrito.reduce((acc, i) => acc + i.subtotal, 0)

    // ── Completar venta ──────────────────────────────────────────
    async function completarVenta() {
        if (carrito.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agrega al menos un producto' })
            return
        }
        setGuardando(true)
        try {
            await window.electronAPI.ventas.create({
                venta: {
                    total,
                    notas,
                    vendedor: user?.username ?? '',
                },
                detalles: carrito.map(i => ({
                    producto_id: i.producto_id,
                    cantidad: i.cantidad,
                    precio_unitario: i.precio_unitario,
                    subtotal: i.subtotal,
                })),
            })
            toast.current.show({ severity: 'success', summary: 'Venta completada', detail: `Total: $${total.toFixed(2)}` })
            limpiarCarrito()
            loadProductos()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setGuardando(false)
        }
    }

    function pedirConfirmacion() {
        confirmDialog({
            message: `¿Confirmar venta por $${total.toFixed(2)}?`,
            header: 'Confirmar venta',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Confirmar',
            rejectLabel: 'Cancelar',
            accept: completarVenta,
        })
    }

    const productosFiltrados = productos.filter(p => {
        const q = busqueda.toLowerCase()
        return p.nombre.toLowerCase().includes(q) || (p.descripcion ?? '').toLowerCase().includes(q)
    })

    // ── Templates tabla carrito ──────────────────────────────────
    const cantidadTemplate = (row) => (
        <InputNumber
            value={row.cantidad}
            onValueChange={e => cambiarCantidad(row.producto_id, e.value)}
            min={1}
            max={row.stock}
            showButtons
            buttonLayout="horizontal"
            decrementButtonClassName="p-button-text p-button-sm"
            incrementButtonClassName="p-button-text p-button-sm"
            decrementButtonIcon="pi pi-minus"
            incrementButtonIcon="pi pi-plus"
            inputStyle={{ width: '3rem', textAlign: 'center' }}
            style={{ width: '7rem' }}
        />
    )

    const subtotalTemplate = (row) => `$${row.subtotal.toFixed(2)}`
    const precioTemplate = (row) => `$${Number(row.precio_unitario).toFixed(2)}`

    const quitarTemplate = (row) => (
        <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            onClick={() => quitarDelCarrito(row.producto_id)}
        />
    )

    return (
        <>
            <div style={{ height: '100%', padding: '0 0.8rem', background: '#f4f6f9' }}>
                <Toast ref={toast} />
                <ConfirmDialog />

                {/* Nombre del Ticket actual */}
                <div>
                    Venta de productos - ${ }
                </div>

                {/* Barra de búsqueda y botón de agregar producto */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.75rem 0', flexShrink: 0 }}>
                    <IconField iconPosition="left" style={{ width: '50%' }}>
                        <InputIcon className="pi pi-search" />
                        <InputText
                            placeholder="Buscar producto..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') searchProduct() }}
                            style={{ width: '100%', padding: '0.5rem 0.75rem', paddingLeft: '2.5rem' }}
                        />
                    </IconField>

                    <Button
                        id='searchProduct'
                        label="Agregar producto - Enter"
                        icon="pi pi-plus"
                        size="small"
                        style={{ width: '20%', flexShrink: 0 }}
                        disabled={!busqueda.trim()}
                        onClick={searchProduct}
                    />
                </div>

                {/* Catálogo / Productos */}
                <div style={{
                    flex: '0 0 58%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRight: '1px solid #dde2ea',
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', flexShrink: 0, borderBottom: '2px solid #e8eaf0', paddingBottom: '0.5rem' }}>
                        {tabls.map(tab => (
                            <Button
                                key={tab.key}
                                label={tab.label}
                                icon={tab.icon}
                                text
                                size="small"
                                style={{
                                    color: panelIzq === tab.key ? '#1e90ff' : '#666',
                                    fontWeight: panelIzq === tab.key ? 700 : 400,
                                    borderBottom: panelIzq === tab.key ? '2px solid #1e90ff' : '2px solid transparent',
                                    borderRadius: 0,
                                    marginBottom: '-0.52rem',
                                }}
                                onClick={() => setPanelIzq(tab.key)}
                            />
                        ))}
                    </div>

                    {/* {panelIzq === 'productos' ? (
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <Productos />
                        </div>
                    ) : (
                        <>
                            <div style={{
                                flex: 1,
                                overflow: 'auto',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                gap: '0.75rem',
                                alignContent: 'start',
                            }}>
                                {productosFiltrados.map(p => {
                                    const enCarrito = carrito.find(i => i.producto_id === p.id)
                                    const sinStock = p.stock <= 0
                                    return (
                                        <div
                                            key={p.id}
                                            onClick={() => !sinStock && agregarAlCarrito(p)}
                                            style={{
                                                background: '#fff',
                                                border: `2px solid ${enCarrito ? '#1e90ff' : '#e0e0e0'}`,
                                                borderRadius: '8px',
                                                padding: '0.85rem',
                                                cursor: sinStock ? 'not-allowed' : 'pointer',
                                                opacity: sinStock ? 0.5 : 1,
                                                transition: 'border-color 0.15s, box-shadow 0.15s',
                                                position: 'relative',
                                                userSelect: 'none',
                                            }}
                                            onMouseEnter={e => { if (!sinStock) e.currentTarget.style.boxShadow = '0 2px 10px rgba(30,144,255,0.2)' }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                                        >
                                            {enCarrito && (
                                                <Badge
                                                    value={enCarrito.cantidad}
                                                    style={{ position: 'absolute', top: '0.4rem', right: '0.4rem' }}
                                                />
                                            )}
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                                                {p.nombre}
                                            </div>
                                            <div style={{ color: '#1e90ff', fontWeight: 700, fontSize: '1rem' }}>
                                                ${Number(p.precio).toFixed(2)}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: sinStock ? '#e53935' : '#888', marginTop: '0.2rem' }}>
                                                Stock: {p.stock}
                                            </div>
                                        </div>
                                    )
                                })}

                                {productosFiltrados.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '3rem 0' }}>
                                        <i className="pi pi-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }} />
                                        No se encontraron productos
                                    </div>
                                )}
                            </div>
                        </>
                    )} */}
                </div>

                {/* Listado de Tickets */}
                <div style={{
                    display: 'flex',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    padding: '0.25rem 0',
                    marginBottom: '0.5rem',
                    flexShrink: 0,
                    scrollbarWidth: 'thin',
                }}>
                    {tickets.map(ticket => {
                        const activo = ticketActivo === ticket
                        return (
                            <button
                                key={ticket}
                                onClick={() => setTicketActivo(ticket)}
                                style={{
                                    flexShrink: 0,
                                    padding: '0.35rem 0.85rem',
                                    borderRadius: '20px',
                                    border: `1px solid ${activo ? '#1e90ff' : '#dde2ea'}`,
                                    background: activo ? '#1e90ff' : '#fff',
                                    color: activo ? '#fff' : '#555',
                                    fontWeight: activo ? 700 : 400,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {ticket}
                            </button>
                        )
                    })}
                    <button
                        onClick={() => {
                            const nombre = `Ticket #${tickets.length + 1}`
                            setTickets(prev => [...prev, nombre])
                            setTicketActivo(nombre)
                        }}
                        style={{
                            flexShrink: 0,
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            border: '1px dashed #aaa',
                            background: 'transparent',
                            color: '#888',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        + Nuevo
                    </button>
                </div>


                {/* Carrito */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem',
                    overflow: 'hidden',
                    background: '#fff',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                        <h3 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e' }}>
                            <i className="pi pi-shopping-cart" style={{ marginRight: '0.5rem', color: '#1e90ff' }} />
                            Carrito
                            {carrito.length > 0 && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#888', fontWeight: 400 }}>
                                    ({carrito.length} {carrito.length === 1 ? 'ítem' : 'ítems'})
                                </span>
                            )}
                        </h3>
                        {carrito.length > 0 && (
                            <Button
                                icon="pi pi-trash"
                                label="Vaciar"
                                text
                                severity="danger"
                                size="small"
                                onClick={limpiarCarrito}
                            />
                        )}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {carrito.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#bbb', padding: '3rem 0' }}>
                                <i className="pi pi-shopping-cart" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block' }} />
                                El carrito está vacío
                            </div>
                        ) : (
                            <DataTable
                                value={carrito}
                                size="small"
                                showGridlines={false}
                                rowClassName={row =>
                                    row.producto_id === carritoSeleccionado ? 'carrito-row-selected' : ''
                                }
                                onRowClick={e => setCarritoSeleccionado(e.data.producto_id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Column field="nombre" header="Producto" style={{ minWidth: '8rem' }} />
                                <Column header="Precio" body={precioTemplate} style={{ width: '6rem', borderLeft: 'none' }} />
                                <Column header="Cantidad" body={cantidadTemplate} style={{ width: '8rem', borderLeft: 'none' }} />
                                <Column header="Subtotal" body={subtotalTemplate} style={{ width: '6rem', fontWeight: 600, borderLeft: 'none' }} />
                                <Column body={quitarTemplate} style={{ width: '3rem', borderLeft: 'none' }} />
                            </DataTable>
                        )}
                    </div>

                    <Divider />

                    <div style={{ marginBottom: '0.75rem', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#555' }}>Notas (opcional)</label>
                        <InputTextarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={2}
                            style={{ width: '100%', resize: 'none' }}
                            placeholder="Observaciones de la venta..."
                        />
                    </div>


                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                        <div>
                            <div>
                                <span>4</span>
                                <span>Productos en la venta actual</span>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '0.5rem',
                            }}>
                                <Button
                                    label='F5 - Cambiar'
                                    size='small'
                                    text
                                    raised ></Button>
                                <Button
                                    label='F6 - Pendiente'
                                    size='small'
                                    text
                                    raised ></Button>
                                <Button
                                    label='Eliminar'
                                    size='small'
                                    text
                                    raised ></Button>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f4f6f9',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                            marginBottom: '0.75rem',
                            flexShrink: 0,
                            width: '80%',
                        }}>
                            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#555' }}>Total</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <Button
                        label="Completar venta"
                        icon="pi pi-check"
                        size="large"
                        style={{ width: '100%', flexShrink: 0 }}
                        disabled={carrito.length === 0 || guardando}
                        loading={guardando}
                        onClick={pedirConfirmacion}
                    />
                </div>

                {/* Info */}
                <footer>
                    <div>
                        <div>
                            <span>Total:</span>
                            <span>$5</span>
                        </div>
                        <div>
                            <span>Total:</span>
                            <span>$5</span>
                        </div>
                        <div>
                            <span>Total:</span>
                            <span>$5</span>
                        </div>
                        <Button label="c" icon="pi pi-check" size="small" text raised />
                    </div>

                    <div>
                        <Button label='Reimprimir ultimo ticket' icon="pi pi-print" size="small" text raised />
                        <Button label='Ventas del día y Devoluciones' icon="pi pi-print" size="small" text raised />
                    </div>
                </footer>
            </div >
        </>
    )
}

export default VentasNueva
