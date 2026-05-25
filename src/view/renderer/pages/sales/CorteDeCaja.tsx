import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { InputNumber } from 'primereact/inputnumber'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Divider } from 'primereact/divider'
import { Skeleton } from 'primereact/skeleton'
import { Tag } from 'primereact/tag'

// ── Types ────────────────────────────────────────────────────────────────────

interface SaleRow {
    id: number
    total: number
    subtotal: number
    taxes: number
    profit: number
    pay_method: string | null
    saled_at: string
    is_cancelled: boolean
}

interface Resumen {
    totalVentas: number
    totalEfectivo: number
    totalTarjeta: number
    totalOtros: number
    numVentas: number
    numCanceladas: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(s: string | null | undefined): string {
    if (!s) return '—'
    return new Date(s).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
    label: string
    value: string
    icon: string
    color: string
    bg: string
    sub?: string
}

function SummaryCard({ label, value, icon, color, bg, sub }: SummaryCardProps) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.1rem 1.4rem',
            flex: '1 1 180px',
            minWidth: '160px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            borderTop: `4px solid ${color}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <i className={icon} style={{ color, fontSize: '1rem' }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.76rem', color: '#aaa', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CorteDeCaja(): React.ReactElement {
    const toast = useRef<InstanceType<typeof Toast>>(null)
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [operation, setOperation] = useState<OperationRecord | null>(null)
    const [resumen, setResumen] = useState<Resumen | null>(null)
    const [efectivoContado, setEfectivoContado] = useState<number>(0)
    const [cerrando, setCerrando] = useState(false)

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos(): Promise<void> {
        setLoading(true)
        try {
            // Get open operation
            const op = await window.electronAPI.operations.findOpen()
            if (!op) {
                toast.current?.show({ severity: 'warn', summary: 'Sin operación', detail: 'No hay operación abierta.' })
                setLoading(false)
                return
            }
            setOperation(op)

            // Fetch all closed sales for this operation
            const ventas = (await window.electronAPI.salesticket.findAll({
                where: { operation_id: op.id, is_open: false } as Record<string, unknown>,
            })) as SaleRow[]

            // Compute summary
            let totalVentas = 0
            let totalEfectivo = 0
            let totalTarjeta = 0
            let totalOtros = 0
            let numCanceladas = 0

            for (const v of ventas) {
                if (v.is_cancelled) {
                    numCanceladas++
                    continue
                }
                const t = Number(v.total) || 0
                totalVentas += t

                const method = (v.pay_method ?? 'cash').toLowerCase()
                if (method === 'cash' || method === 'efectivo') {
                    totalEfectivo += t
                } else if (method === 'card' || method === 'tarjeta') {
                    totalTarjeta += t
                } else {
                    totalOtros += t
                }
            }

            setResumen({
                totalVentas,
                totalEfectivo,
                totalTarjeta,
                totalOtros,
                numVentas: ventas.filter(v => !v.is_cancelled).length,
                numCanceladas,
            })
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setLoading(false)
        }
    }

    function confirmarCierre(): void {
        confirmDialog({
            header: 'Cerrar operación',
            message: '¿Estás seguro de que deseas cerrar la operación del día? Esta acción no se puede deshacer.',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Cerrar operación',
            rejectLabel: 'Cancelar',
            accept: cerrarOperacion,
        })
    }

    async function cerrarOperacion(): Promise<void> {
        if (!operation) return
        setCerrando(true)
        try {
            await window.electronAPI.operations.close(operation.id)
            localStorage.removeItem('operation_id')
            toast.current?.show({ severity: 'success', summary: 'Operación cerrada', detail: 'El corte de caja se realizó correctamente.' })
            setTimeout(() => navigate('/'), 1500)
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setCerrando(false)
        }
    }

    // ── Derived values ──────────────────────────────────────────────────────
    const fondoInicial = operation ? Number(operation.money_in_box) : 0
    const efectivoEsperado = fondoInicial + (resumen?.totalEfectivo ?? 0)
    const diferencia = efectivoContado - efectivoEsperado

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1a1a2e', fontSize: '1.5rem', fontWeight: 800 }}>
                        <i className="pi pi-calculator" style={{ marginRight: '0.5rem', color: '#1e90ff' }} />
                        Corte de Caja
                    </h2>
                    {operation && !loading && (
                        <p style={{ margin: '0.3rem 0 0', color: '#888', fontSize: '0.85rem' }}>
                            Operación #{operation.id} · Apertura: {fmtDate(operation.start_at)}
                        </p>
                    )}
                </div>
                <Button
                    icon="pi pi-refresh"
                    rounded
                    text
                    tooltip="Recargar"
                    tooltipOptions={{ position: 'left' }}
                    onClick={cargarDatos}
                    disabled={loading}
                />
            </div>

            {!operation && !loading && (
                <div style={{
                    background: '#fff3cd', border: '1px solid #ffc107',
                    borderRadius: '10px', padding: '1.25rem', color: '#856404',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.4rem' }} />
                    <div>
                        <strong>Sin operación activa</strong>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                            Abre una operación desde el Dashboard para poder realizar el corte.
                        </p>
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} width="200px" height="100px" borderRadius="12px" />)}
                </div>
            )}

            {!loading && operation && resumen && (
                <>
                    {/* ── KPI Cards ─────────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                        <SummaryCard
                            label="Total Ventas"
                            value={fmt(resumen.totalVentas)}
                            icon="pi pi-dollar"
                            color="#1e90ff"
                            bg="#e8f4ff"
                            sub={`${resumen.numVentas} ticket${resumen.numVentas !== 1 ? 's' : ''} cerrado${resumen.numVentas !== 1 ? 's' : ''}`}
                        />
                        <SummaryCard
                            label="Efectivo"
                            value={fmt(resumen.totalEfectivo)}
                            icon="pi pi-money-bill"
                            color="#28a745"
                            bg="#e9f7ec"
                            sub="Ventas en efectivo"
                        />
                        <SummaryCard
                            label="Tarjeta"
                            value={fmt(resumen.totalTarjeta)}
                            icon="pi pi-credit-card"
                            color="#6f42c1"
                            bg="#f0ebff"
                            sub="Ventas con tarjeta"
                        />
                        {resumen.totalOtros > 0 && (
                            <SummaryCard
                                label="Otros"
                                value={fmt(resumen.totalOtros)}
                                icon="pi pi-wallet"
                                color="#fd7e14"
                                bg="#fff3e8"
                                sub="Transferencia / vale"
                            />
                        )}
                        {resumen.numCanceladas > 0 && (
                            <SummaryCard
                                label="Canceladas"
                                value={String(resumen.numCanceladas)}
                                icon="pi pi-times-circle"
                                color="#dc3545"
                                bg="#fdecea"
                                sub="Tickets cancelados"
                            />
                        )}
                    </div>

                    {/* ── Arqueo de caja ────────────────────────────────────── */}
                    <div style={{
                        background: '#fff', borderRadius: '14px',
                        boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '1.5rem',
                        marginBottom: '1.5rem',
                    }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1a1a2e', fontWeight: 700 }}>
                            <i className="pi pi-wallet" style={{ marginRight: '0.5rem', color: '#1e90ff' }} />
                            Arqueo de Efectivo
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem', marginBottom: '1rem' }}>
                            <RowItem label="Fondo inicial" value={fmt(fondoInicial)} />
                            <RowItem label="Ventas en efectivo" value={fmt(resumen.totalEfectivo)} />
                            <RowItem label="Efectivo esperado en caja" value={fmt(efectivoEsperado)} highlight />
                        </div>

                        <Divider style={{ margin: '0.75rem 0' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 220px' }}>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.88rem', color: '#444' }}>
                                    Efectivo contado (real)
                                </label>
                                <InputNumber
                                    value={efectivoContado}
                                    onValueChange={e => setEfectivoContado(e.value ?? 0)}
                                    mode="currency"
                                    currency="MXN"
                                    locale="es-MX"
                                    min={0}
                                    style={{ width: '100%' }}
                                    inputStyle={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ flex: '1 1 220px', paddingTop: '1.4rem' }}>
                                <RowItem
                                    label="Diferencia"
                                    value={fmt(diferencia)}
                                    highlight
                                    color={diferencia === 0 ? '#28a745' : diferencia > 0 ? '#1e90ff' : '#dc3545'}
                                />
                                {diferencia !== 0 && (
                                    <Tag
                                        severity={diferencia > 0 ? 'info' : 'danger'}
                                        value={diferencia > 0 ? 'Sobrante' : 'Faltante'}
                                        style={{ marginTop: '0.3rem' }}
                                    />
                                )}
                                {diferencia === 0 && efectivoContado > 0 && (
                                    <Tag severity="success" value="Cuadra exacto" style={{ marginTop: '0.3rem' }} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Cerrar operación ──────────────────────────────────── */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            label="Cerrar operación del día"
                            icon="pi pi-lock"
                            severity="danger"
                            onClick={confirmarCierre}
                            loading={cerrando}
                            style={{ fontWeight: 700, padding: '0.75rem 1.75rem' }}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

// ── Small helper component ────────────────────────────────────────────────────

interface RowItemProps {
    label: string
    value: string
    highlight?: boolean
    color?: string
}

function RowItem({ label, value, highlight, color }: RowItemProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' }}>
            <span style={{ fontSize: '0.88rem', color: '#666' }}>{label}</span>
            <span style={{
                fontSize: highlight ? '1rem' : '0.92rem',
                fontWeight: highlight ? 800 : 600,
                color: color ?? (highlight ? '#1a1a2e' : '#333'),
            }}>
                {value}
            </span>
        </div>
    )
}
