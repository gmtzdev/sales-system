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
import './VentasNueva.css'

interface TabItem {
    key: string
    label: string
    icon: string
}

interface ProductoRow {
    code: string
    description: string
    price: number
    stock: number
}

interface CarritoItem {
    code: string
    nombre: string
    precio_unitario: number
    cantidad: number
    subtotal: number
    stock: number
}

const tabls: TabItem[] = [
    { key: 'catalogo', label: 'Catálogo', icon: 'pi pi-th-large' },
    { key: 'productos', label: 'Productos', icon: 'pi pi-box' }
]

function VentasNueva(): React.ReactElement {
    const toast = useRef<Toast>(null)
    const { user } = useAuth() as unknown as { user: { username: string } | null; login: (u: string, p: string) => boolean; logout: () => void }
    const [panelIzq, setPanelIzq] = useState<string>('catalogo')
    const [productos, setProductos] = useState<ProductoRow[]>([])

    const [notas, setNotas] = useState<string>('')
    const [guardando, setGuardando] = useState<boolean>(false)
    const [tickets, setTickets] = useState<string[]>(['Ticket #1', 'Ticket #2', 'Ticket #3',])
    const [ticketActivo, setTicketActivo] = useState<string>('Ticket #1')
    const [carritoSeleccionado, setCarritoSeleccionado] = useState<string | null>(null)

    useEffect(() => {
        // loadProductos()
    }, [])


    // Barra de búsqueda de productos
    const [busqueda, setBusqueda] = useState<string>('')
    async function searchProduct(): Promise<void> {
        const q = busqueda.trim()
        if (!q) return

        console.log(`Buscando producto con "${q}"...`)

        try {
            const resultados = await window.electronAPI.productos.findAll({
                where: { code: q },
            }) as ProductoRow[]

            console.log("Resultados de búsqueda:", resultados)

            // Coincidencia exacta primero, luego parcial
            const encontrado: ProductoRow | undefined = resultados.find(p => p.code.toLowerCase() === q.toLowerCase()) ?? resultados[0]

            if (!encontrado) {
                toast.current?.show({ severity: 'warn', summary: 'No encontrado', detail: `No hay productos con "${q}"` })
                return
            }

            console.log("Producto encontrado:", encontrado)
            agregarAlCarrito(encontrado)
            setBusqueda('')
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        }
    }


    // ── Carrito ──────────────────────────────────────────────────
    const [carrito, setCarrito] = useState<CarritoItem[]>([])
    function agregarAlCarrito(producto: ProductoRow): void {
        if (producto.stock <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin stock', detail: `"${producto.description}" no tiene stock disponible` })
            return
        }
        setCarrito(prev => {
            const idx = prev.findIndex(i => i.code === producto.code)
            if (idx >= 0) {
                const item = prev[idx]
                if (item.cantidad >= producto.stock) {
                    toast.current?.show({ severity: 'warn', summary: 'Stock insuficiente', detail: `Máximo ${producto.stock} unidades` })
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
            const nuevo: CarritoItem = {
                code: producto.code,
                nombre: producto.description,
                precio_unitario: Number(producto.price),
                cantidad: 1,
                subtotal: Number(producto.price),
                stock: producto.stock,
            }
            setCarritoSeleccionado(producto.code)
            return [...prev, nuevo]
        })
    }

    function cambiarCantidad(producto_code: string, nuevaCantidad: number | null): void {
        setCarrito(prev =>
            prev.map(item => {
                if (item.code !== producto_code) return item
                const cant = Math.max(1, Math.min(nuevaCantidad ?? 1, item.stock))
                return { ...item, cantidad: cant, subtotal: Number((cant * item.precio_unitario).toFixed(2)) }
            }),
        )
    }

    function quitarDelCarrito(producto_code: string): void {
        setCarrito(prev => prev.filter(i => i.code !== producto_code))
    }

    function limpiarCarrito(): void {
        setCarrito([])
        setNotas('')
        setCarritoSeleccionado(null)
    }





















    // async function loadProductos(): Promise<void> {
    //     try {
    //         const rows = await window.electronAPI.productos.findAll({
    //             order: [['code', 'ASC']],
    //         }) as ProductoRow[]
    //         setProductos(rows)
    //     } catch (err) {
    //         toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
    //     }
    // }



    // ── Navegación teclado en carrito ──────────────────────────
    useEffect(() => {
        function handleKey(e: KeyboardEvent): void {
            if (carrito.length === 0) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCarritoSeleccionado(prev => {
                    const idx = carrito.findIndex(i => i.code === prev)
                    return carrito[Math.min(idx + 1, carrito.length - 1)].code
                })
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCarritoSeleccionado(prev => {
                    const idx = carrito.findIndex(i => i.code === prev)
                    return carrito[Math.max(idx - 1, 0)].code
                })
            } else if ((e.key === '+' || e.key === '=') && carritoSeleccionado) {
                e.preventDefault()
                cambiarCantidad(carritoSeleccionado,
                    (carrito.find(i => i.code === carritoSeleccionado)?.cantidad ?? 0) + 1
                )
            } else if (e.key === '-' && carritoSeleccionado) {
                e.preventDefault()
                cambiarCantidad(carritoSeleccionado,
                    (carrito.find(i => i.code === carritoSeleccionado)?.cantidad ?? 1) - 1
                )
            }
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [carrito, carritoSeleccionado])

    const total = carrito.reduce((acc, i) => acc + i.subtotal, 0)

    // ── Completar venta ──────────────────────────────────────────
    async function completarVenta(): Promise<void> {
        if (carrito.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agrega al menos un producto' })
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
                    code: i.code,
                    cantidad: i.cantidad,
                    precio_unitario: i.precio_unitario,
                    subtotal: i.subtotal,
                })),
            })
            toast.current?.show({ severity: 'success', summary: 'Venta completada', detail: `Total: $${total.toFixed(2)}` })
            limpiarCarrito()
            // loadProductos()
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setGuardando(false)
        }
    }

    function pedirConfirmacion(): void {
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
        return p.code.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    })

    // ── Templates tabla carrito ──────────────────────────────────
    const cantidadTemplate = (row: CarritoItem) => (
        <InputNumber
            value={row.cantidad}
            onValueChange={e => cambiarCantidad(row.code, e.value ?? null)}
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
    const subtotalTemplate = (row: CarritoItem) => `$${row.subtotal.toFixed(2)}`
    const precioTemplate = (row: CarritoItem) => `$${Number(row.precio_unitario).toFixed(2)}`
    const quitarTemplate = (row: CarritoItem) => (
        <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            onClick={() => quitarDelCarrito(row.code)}
        />
    )

    return (
        <>
            <div style={{ height: '100%', padding: '0 0.8rem', background: '#f4f6f9' }}>
                <Toast ref={toast} />
                <ConfirmDialog />

                {/* Nombre del Ticket actual */}
                <div>
                    <h3 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e' }}>
                        <i className="pi pi-shopping-cart" style={{ marginRight: '0.5rem', color: '#1e90ff' }} />
                        Venta de productos - Ticket #1
                    </h3>
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
                                    outline: 'none',
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
                            <DataTable<CarritoItem[]>
                                value={carrito}
                                size="small"
                                showGridlines={false}
                                rowClassName={(row: CarritoItem) =>
                                    row.code === carritoSeleccionado ? 'carrito-row-selected' : ''
                                }
                                onRowClick={e => setCarritoSeleccionado((e.data as CarritoItem).code)}
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
                                <span>{carrito.length}</span>
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
                                    raised />
                                <Button
                                    label='F6 - Pendiente'
                                    size='small'
                                    text
                                    raised />
                                <Button
                                    label='Eliminar'
                                    size='small'
                                    text
                                    raised />
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
