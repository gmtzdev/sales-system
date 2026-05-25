import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
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
import { where } from 'sequelize'
import { SaleTicket } from '../core/interfaces/SaleTicket.interface'
import { Dialog } from 'primereact/dialog'

interface TabItem {
    key: string
    label: string
    icon: string
}

interface ProductoRow {
    code: string
    description: string
    tsale: string
    pcost: number
    psale: number
    dept: number
    provid: number
    umeas: number
    wholeSale: number
    ipriority: number
    dinventary: number
    dinventarymin: number
    dinventarymax: number
    profitporcentage: number
    components: string
    taxes: string
}

interface CarItem {
    code: string
    description: string
    psale: number
    amount: number
    subtotal: number
    stock: number
    tsale: string
    article_id?: number
}

interface TicketArticle {
    id: number
    ticket_id: number
    product_code: string
    product_name: string
    amount: number
    price_used: number
    product?: { code: string; description: string, tsale: string, psale: number, dinventary: number }
}

interface TicketWithArticles extends SaleTicket {
    articles?: TicketArticle[]
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
    const [tickets, setTickets] = useState<SaleTicket[]>(new Array(0))
    const [ticketActivo, setTicketActivo] = useState<number>(0)
    const [carritoSeleccionado, setCarritoSeleccionado] = useState<string | null>(null)

    // Operation
    const [operation, setOperation] = useState<OperationRecord | null>(null)
    const loadedRef = useRef(false)

    useEffect(() => {
        if (loadedRef.current) return
        loadedRef.current = true
        loadTickets()
    }, [])


    // Cargar tickets abiertos
    async function loadTickets(): Promise<void> {
        try {
            const rows = await window.electronAPI.salesticket.findAll({
                where: { is_open: true },
                order: [['id', 'ASC']]

            }) as SaleTicket[]

            const operationId = localStorage.getItem('operation_id')
            let currentOperation: OperationRecord | null = null
            if (operationId) {
                currentOperation = { id: Number(operationId) } as OperationRecord
                setOperation(currentOperation)
            }

            if (rows.length <= 0) {
                // Create a default ticket if none are open
                const defaultTicket: SaleTicket = {
                    box_id: 0,
                    cashier_id: 0,
                    name: 'Ticket #1',
                    is_open: true,
                    operation_id: currentOperation?.id ?? 0
                }
                const createdTicket = await window.electronAPI.salesticket.create({ sale: defaultTicket, detalles: [] })
                setTickets([createdTicket])
                setTicketActivo(createdTicket.id ?? 0)
            } else {
                setTickets(rows)
                setTicketActivo(rows[0].id ?? 0)
                await loadTicketArticles(rows[0].id ?? 0)
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        }
    }


    // Cargar artículos del ticket seleccionado
    async function loadTicketArticles(ticketId: number): Promise<void> {
        if (!ticketId) return
        try {
            const ticket = await window.electronAPI.salesticket.findById(ticketId) as TicketWithArticles | null
            if (!ticket?.articles?.length) {
                setCarrito([])
                return
            }
            const items: CarItem[] = ticket.articles.map(a => ({
                code: a.product_code,
                description: a.product?.description ?? a.product_name,
                psale: a.price_used,
                amount: a.amount,
                subtotal: Number((a.amount * a.price_used).toFixed(2)),
                stock: a.product?.dinventary ?? 999,
                tsale: a.product?.tsale ?? 'U',
                article_id: a.id,
            }))
            setCarrito(items)
            setCarritoSeleccionado(items[0]?.code ?? null)
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        }
    }

    // Barra de búsqueda de productos
    const [busqueda, setBusqueda] = useState<string>('')
    async function searchProduct(): Promise<void> {
        const q = busqueda.trim()
        if (!q) return

        try {
            const result = await window.electronAPI.productos.findByCode(q) as ProductoRow | null

            // Coincidencia exacta primero, luego parcial
            const found: ProductoRow | undefined | null = result;

            if (!found) {
                toast.current?.show({ severity: 'warn', summary: 'No encontrado', detail: `No hay productos con "${q}"` })
                return
            }

            agregarAlCarrito(found)
            setBusqueda('')
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        }
    }


    // ── Carrito ──────────────────────────────────────────────────
    const [carrito, setCarrito] = useState<CarItem[]>([])
    async function agregarAlCarrito(producto: ProductoRow): Promise<void> {
        if (producto.dinventary <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin stock', detail: `"${producto.description}" no tiene stock disponible` })
            return
        }
        const idx = carrito.findIndex(i => i.code === producto.code)
        if (idx >= 0) {
            const item = carrito[idx]
            if (item.amount >= producto.dinventary) {
                toast.current?.show({ severity: 'warn', summary: 'Stock insuficiente', detail: `Máximo ${producto.dinventary} unidades` })
                return
            }
            const newAmount = item.amount + 1
            if (item.article_id) {
                await window.electronAPI.salesticket.articles.update(item.article_id, newAmount)
            }
            setCarrito(prev => prev.map(i =>
                i.code === producto.code
                    ? { ...i, amount: newAmount, subtotal: Number((newAmount * i.psale).toFixed(2)) }
                    : i
            ))
        } else {
            try {
                const article = await window.electronAPI.salesticket.articles.create({
                    ticket_id: ticketActivo,
                    product_code: producto.code,
                    product_name: producto.description,
                    amount: 1,
                    profit: Number(producto.psale) - Number(producto.pcost),
                    departament_id: producto.dept ?? 0,
                    pay_at: new Date(),
                    uses_wholesale_price: false,
                    discount_percentage: 0,
                    components: producto.components ?? '',
                    taxes_used: producto.taxes ?? '',
                    unit_tax: 0,
                    price_used: Number(producto.psale),
                    amount_returned: 0,
                    was_returned: false,
                    percentage_paid: 100,
                })
                const nuevo: CarItem = {
                    code: producto.code,
                    description: producto.description,
                    psale: Number(producto.psale),
                    amount: 1,
                    subtotal: Number(producto.psale),
                    stock: producto.dinventary,
                    tsale: producto.tsale,
                    article_id: article.id,
                }
                setCarritoSeleccionado(producto.code)
                setCarrito(prev => [...prev, nuevo])
            } catch (err) {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
            }
        }
    }

    async function cambiarCantidad(producto_code: string, nuevaCantidad: number | null): Promise<void> {
        const item = carrito.find(i => i.code === producto_code)
        if (!item) return

        if (item.tsale === 'U') {
            nuevaCantidad = Math.round(nuevaCantidad ?? 1)
        }

        const cant = Math.max(0.01, Math.min(nuevaCantidad ?? 1, item.stock))
        if (item.article_id) {
            await window.electronAPI.salesticket.articles.update(item.article_id, cant)
        }
        setCarrito(prev =>
            prev.map(i =>
                i.code === producto_code
                    ? { ...i, amount: cant, subtotal: Number((Math.round(cant * i.psale * 2) / 2).toFixed(2)) }
                    : i
            )
        )
    }

    async function quitarDelCarrito(producto_code: string): Promise<void> {
        const item = carrito.find(i => i.code === producto_code)
        if (item?.article_id) {
            await window.electronAPI.salesticket.articles.delete(item.article_id)
        }
        setCarrito(prev => prev.filter(i => i.code !== producto_code))
    }

    function limpiarCarrito(): void {
        carrito.forEach(item => {
            if (item.article_id) {
                window.electronAPI.salesticket.articles.delete(item.article_id)
            }
        })
        setCarrito([])
        setNotas('')
        setCarritoSeleccionado(null)
    }

























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
                    (carrito.find(i => i.code === carritoSeleccionado)?.amount ?? 0) + 1
                )
            } else if (e.key === '-' && carritoSeleccionado) {
                e.preventDefault()
                cambiarCantidad(carritoSeleccionado,
                    (carrito.find(i => i.code === carritoSeleccionado)?.amount ?? 1) - 1
                )
            }
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [carrito, carritoSeleccionado])

    const total = carrito.reduce((acc, i) => acc + i.subtotal, 0)

    // ── Completar venta ──────────────────────────────────────────
    async function completarVenta(selectedPayMethod: 'cash' | 'card' | 'credit' = 'cash'): Promise<void> {
        if (carrito.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Carrito vacío', detail: 'Agrega al menos un producto' })
            return
        }
        if (!ticketActivo) {
            toast.current?.show({ severity: 'warn', summary: 'Sin ticket', detail: 'No hay ticket activo' })
            return
        }
        setGuardando(true)
        try {
            const subtotal = carrito.reduce((acc, i) => acc + i.subtotal, 0)
            const profit = carrito.reduce((acc, i) => acc + (i.psale - 0) * i.amount, 0) // simplified profit

            await window.electronAPI.salesticket.close(ticketActivo, {
                total,
                subtotal,
                taxes: 0,
                profit,
                notes: notas,
                pay_method: selectedPayMethod,
            })

            toast.current?.show({ severity: 'success', summary: 'Venta completada', detail: `Total: $${total.toFixed(2)}` })

            // Remove closed ticket from list, create a fresh one
            const remaining = tickets.filter(t => t.id !== ticketActivo)
            const nombre = `Ticket #${tickets.length + 1}`
            const newTicket: SaleTicket = {
                box_id: 0,
                cashier_id: 0,
                name: nombre,
                is_open: true,
                operation_id: operation?.id ?? 0,
            }
            const created = await window.electronAPI.salesticket.create({ sale: newTicket, detalles: [] })
            const updatedTickets = [...remaining, created]
            setTickets(updatedTickets)
            setTicketActivo(created.id ?? 0)
            setCarrito([])
            setNotas('')
            setCarritoSeleccionado(null)
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setGuardando(false)
        }
    }


    const [visible, setVisible] = useState(false)
    const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'credit'>('cash')
    const [cashReceived, setCashReceived] = useState<number>(0)

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
    const cantidadTemplate = (row: CarItem) => (
        <InputNumber
            value={row.amount}
            onValueChange={e => cambiarCantidad(row.code, e.value ?? null)}
            min={0.01}
            max={row.stock}
            showButtons
            buttonLayout="horizontal"
            decrementButtonClassName="p-button-text p-button-sm"
            incrementButtonClassName="p-button-text p-button-sm"
            decrementButtonIcon="pi pi-minus"
            incrementButtonIcon="pi pi-plus"
            inputStyle={{ width: '3rem', textAlign: 'center', padding: '3px', fontSize: '14px' }}
            style={{ width: '7rem' }}
        />
    )
    const subtotalTemplate = (row: CarItem) => {
        const rounded = Math.round(row.subtotal * 2) / 2
        return `$${rounded.toFixed(2)}`
    }
    const precioTemplate = (row: CarItem) => `$${Number(row.psale).toFixed(2)}`
    const quitarTemplate = (row: CarItem) => (
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
            <div style={{ height: '100%', padding: '1rem 0.8rem  0 0.8rem', background: '#f4f6f9' }}>
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
                        const activo = ticketActivo === ticket.id
                        return (
                            <button
                                key={ticket.id ?? ticket.name}
                                onClick={() => {
                                    setTicketActivo(ticket.id ?? 0)
                                    loadTicketArticles(ticket.id ?? 0)
                                }}
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
                                {ticket.name}
                            </button>
                        )
                    })}
                    <button
                        onClick={async () => {
                            const nombre = `Ticket #${tickets.length + 1}`
                            const newTicket: SaleTicket = { box_id: 0, cashier_id: 0, name: nombre, is_open: true, operation_id: operation?.id ?? 0 }
                            const created = await window.electronAPI.salesticket.create({ sale: newTicket, detalles: [] })
                            setTickets(prev => [...prev, created])
                            setTicketActivo(created.id ?? 0)
                            setCarrito([])
                            setCarritoSeleccionado(null)
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
                    height: '60vh'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                        <h3 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center' }}>
                            <i className="pi pi-shopping-cart" style={{ marginRight: '0.5rem', color: '#1e90ff' }} />
                            Carrito
                            {
                                carrito.length > 0 && (
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#888', fontWeight: 400 }}>
                                        ({carrito.length} {carrito.length === 1 ? 'ítem' : 'ítems'})
                                    </span>
                                )
                            }
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
                            <DataTable<CarItem[]>
                                value={carrito}
                                size="small"
                                showGridlines={false}
                                rowClassName={(row: CarItem) =>
                                    row.code === carritoSeleccionado ? 'carrito-row-selected' : ''
                                }
                                onRowClick={e => setCarritoSeleccionado((e.data as CarItem).code)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Column field='code' header="Código" style={{ width: '9rem' }} />
                                <Column field="description" header="Producto" style={{ minWidth: '8rem', borderLeft: 'none' }} />
                                <Column header="Precio venta" body={precioTemplate} style={{ width: '8rem', borderLeft: 'none' }} />
                                <Column header="Cantidad" body={cantidadTemplate} style={{ width: '10rem', borderLeft: 'none' }} />
                                <Column header="Subtotal" body={subtotalTemplate} style={{ width: '6rem', fontWeight: 600, borderLeft: 'none' }} />
                                <Column field='stock' header="Existencia" style={{ width: '6rem', borderLeft: 'none' }} />
                                {/* <Column body={quitarTemplate} style={{ width: '3rem', borderLeft: 'none' }} /> */}
                            </DataTable>
                        )}
                    </div>

                    <Divider />
                    {/* <Divider />

                    <div style={{ marginBottom: '0.75rem', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#555' }}>Notas (opcional)</label>
                        <InputTextarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={2}
                            style={{ width: '100%', resize: 'none' }}
                            placeholder="Observaciones de la venta..."
                        />
                    </div> */}


                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div >
                                <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '23px' }}>{carrito.length}</span>
                                    <span >Productos en la venta actual</span>
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
                                width: '12rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Button
                                    label="Completar venta"
                                    icon="pi pi-check"
                                    size="small"
                                    raised
                                    style={{ width: '11rem', height: '3rem' }}
                                    disabled={carrito.length === 0 || guardando}
                                    loading={guardando}
                                    onClick={() => { setCashReceived(0); setPayMethod('cash'); setVisible(true) }}
                                />

                                <Dialog
                                    header={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <i className="pi pi-shopping-bag" style={{ color: '#1e90ff', fontSize: '1.2rem' }} />
                                            <span>Cobrar venta</span>
                                        </div>
                                    }
                                    visible={visible}
                                    modal
                                    style={{ width: '480px' }}
                                    onHide={() => setVisible(false)}
                                    footer={
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <Button
                                                label="Cancelar"
                                                icon="pi pi-times"
                                                text
                                                severity="secondary"
                                                onClick={() => setVisible(false)}
                                            />
                                            <Button
                                                label="Cobrar (solo registrar)"
                                                icon="pi pi-save"
                                                outlined
                                                disabled={guardando}
                                                loading={guardando}
                                                onClick={() => { setVisible(false); completarVenta(payMethod) }}
                                            />
                                            <Button
                                                label="Cobrar e imprimir ticket"
                                                icon="pi pi-print"
                                                disabled={guardando}
                                                loading={guardando}
                                                onClick={() => { setVisible(false); completarVenta(payMethod) }}
                                            />
                                        </div>
                                    }
                                >
                                    {/* Total destacado */}
                                    <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>Total a cobrar</div>
                                        <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>${total.toFixed(2)}</div>
                                        <div style={{ fontSize: '0.82rem', color: '#aaa', marginTop: '0.3rem' }}>
                                            {carrito.length} {carrito.length === 1 ? 'artículo' : 'artículos'}
                                        </div>
                                    </div>

                                    <Divider style={{ margin: '0.75rem 0' }} />

                                    {/* Método de pago */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: '#444' }}>
                                            Método de pago
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {([
                                                { key: 'cash', label: 'Efectivo', icon: 'pi pi-money-bill' },
                                                { key: 'card', label: 'Tarjeta', icon: 'pi pi-credit-card' },
                                                { key: 'credit', label: 'Crédito', icon: 'pi pi-wallet' },
                                            ] as const).map(opt => (
                                                <Button
                                                    key={opt.key}
                                                    label={opt.label}
                                                    icon={opt.icon}
                                                    style={{
                                                        flex: 1,
                                                        background: payMethod === opt.key ? '#1e90ff' : '#fff',
                                                        color: payMethod === opt.key ? '#fff' : '#555',
                                                        border: `1px solid ${payMethod === opt.key ? '#1e90ff' : '#dde2ea'}`,
                                                        fontWeight: payMethod === opt.key ? 700 : 400,
                                                    }}
                                                    onClick={() => setPayMethod(opt.key)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Efectivo recibido – solo para pago en efectivo */}
                                    {payMethod === 'cash' && (
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: '#444' }}>
                                                Efectivo recibido
                                            </label>
                                            <InputNumber
                                                value={cashReceived}
                                                onValueChange={e => setCashReceived(e.value ?? 0)}
                                                mode="currency"
                                                currency="MXN"
                                                locale="es-MX"
                                                min={0}
                                                style={{ width: '100%' }}
                                                inputStyle={{ width: '100%' }}
                                                autoFocus
                                            />
                                            {cashReceived >= total && total > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', padding: '0.6rem 0.75rem', background: '#e9f7ec', borderRadius: '8px' }}>
                                                    <span style={{ fontWeight: 600, color: '#28a745' }}>Cambio</span>
                                                    <span style={{ fontWeight: 800, color: '#28a745', fontSize: '1.15rem' }}>
                                                        ${(cashReceived - total).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            {cashReceived > 0 && cashReceived < total && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', padding: '0.6rem 0.75rem', background: '#fdecea', borderRadius: '8px' }}>
                                                    <span style={{ fontWeight: 600, color: '#dc3545' }}>Falta</span>
                                                    <span style={{ fontWeight: 800, color: '#dc3545', fontSize: '1.15rem' }}>
                                                        ${(total - cashReceived).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Divider style={{ margin: '0.75rem 0' }} />

                                    {/* Resumen de artículos */}
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: '#444' }}>
                                            Resumen de la venta
                                        </label>
                                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                            {carrito.map(item => (
                                                <div key={item.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid #f0f0f0', color: '#555' }}>
                                                    <span>{item.description} <span style={{ color: '#aaa' }}>× {item.amount}</span></span>
                                                    <span style={{ fontWeight: 600 }}>${item.subtotal.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Dialog>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f4f6f9',
                            borderRadius: '8px',
                            padding: '0.75rem 1rem',
                        }}>
                            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#555' }}>Total</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e' }}>
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <footer className='footer'>
                    <div className='last-sale-info'>
                        <div className='sale-info'>
                            <span>Total:</span>
                            <span>$5</span>
                        </div>
                        <div className='sale-info'>
                            <span>Pagó con:</span>
                            <span>$5</span>
                        </div>
                        <div className='sale-info'>
                            <span>Cambio:</span>
                            <span>$0</span>
                        </div>
                        <Button icon="pi pi-check" size="small" text raised />
                    </div>

                    <div>
                        <Button label='Reimprimir ultimo ticket' icon="pi pi-print" size="small" text raised />
                        <Button label='Ventas del día y Devoluciones' icon="pi pi-calendar" size="small" text raised />
                    </div>
                </footer>
            </div >
        </>
    )
}

export default VentasNueva
