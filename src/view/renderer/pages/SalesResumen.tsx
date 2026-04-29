import React, { useEffect, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { ProgressBar } from 'primereact/progressbar'
import { Skeleton } from 'primereact/skeleton'

// ── Types ────────────────────────────────────────────────────────────────────

interface VentaRow {
    id: number
    fecha: string
    total: number
    notas: string
    vendedor: string
}

interface ProductoResumenRow {
    code: string
    description: string
    dinventary: number
    dinventarymin: number
    dinventarymax: number
}

interface KPI {
    label: string
    value: string
    sub: string
    icon: string
    color: string
    bg: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}

function startOfWeek(d: Date): Date {
    const x = new Date(d)
    const day = x.getDay()          // 0=Sun
    x.setDate(x.getDate() - day)
    x.setHours(0, 0, 0, 0)
    return x
}

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1)
}

function fmt(n: number): string {
    return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(s: string): string {
    const d = new Date(s)
    return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ kpi }: { kpi: KPI }) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            flex: 1,
            minWidth: '160px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            borderTop: `4px solid ${kpi.color}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <i className={kpi.icon} style={{ color: kpi.color, fontSize: '1.1rem' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>
                {kpi.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{kpi.sub}</div>
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SalesResumen(): React.ReactElement {
    const [ventas, setVentas] = useState<VentaRow[]>([])
    const [productos, setProductos] = useState<ProductoResumenRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const [v, p] = await Promise.all([
                    window.electronAPI.ventas.findAll() as Promise<VentaRow[]>,
                    window.electronAPI.productos.findAll() as Promise<ProductoResumenRow[]>,
                ])
                setVentas(v)
                setProductos(p)
            } catch (_) {
                // silencio — sin datos
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // ── Derived stats ──────────────────────────────────────────────────────────
    const now = new Date()
    const hoy = startOfDay(now)
    const semana = startOfWeek(now)
    const mes = startOfMonth(now)

    const ventasHoy = ventas.filter(v => new Date(v.fecha) >= hoy)
    const ventasSemana = ventas.filter(v => new Date(v.fecha) >= semana)
    const ventasMes = ventas.filter(v => new Date(v.fecha) >= mes)

    const totalHoy = ventasHoy.reduce((a, v) => a + Number(v.total), 0)
    const totalSemana = ventasSemana.reduce((a, v) => a + Number(v.total), 0)
    const totalMes = ventasMes.reduce((a, v) => a + Number(v.total), 0)
    const promHoy = ventasHoy.length ? totalHoy / ventasHoy.length : 0

    const kpis: KPI[] = [
        {
            label: 'Ventas hoy',
            value: String(ventasHoy.length),
            sub: ventasHoy.length === 1 ? 'transacción' : 'transacciones',
            icon: 'pi pi-receipt',
            color: '#1e90ff',
            bg: '#e8f2ff',
        },
        {
            label: 'Total del día',
            value: fmt(totalHoy),
            sub: `${ventasHoy.length} venta(s)`,
            icon: 'pi pi-dollar',
            color: '#22c55e',
            bg: '#e8faf0',
        },
        {
            label: 'Esta semana',
            value: fmt(totalSemana),
            sub: `${ventasSemana.length} venta(s)`,
            icon: 'pi pi-calendar',
            color: '#f59e0b',
            bg: '#fff7e6',
        },
        {
            label: 'Este mes',
            value: fmt(totalMes),
            sub: `${ventasMes.length} venta(s)`,
            icon: 'pi pi-chart-line',
            color: '#a855f7',
            bg: '#f5edff',
        },
        {
            label: 'Ticket promedio',
            value: fmt(promHoy),
            sub: 'promedio del día',
            icon: 'pi pi-percentage',
            color: '#ef4444',
            bg: '#fef2f2',
        },
    ]

    // ── Stock bajo ─────────────────────────────────────────────────────────────
    const stockBajo = productos
        .filter(p => p.dinventary <= (p.dinventarymin ?? 0))
        .sort((a, b) => a.dinventary - b.dinventary)

    // ── Últimas ventas (tabla) ─────────────────────────────────────────────────
    const ultimas = ventas.slice(0, 15)

    // ── Top vendedores del mes ─────────────────────────────────────────────────
    const vendedoresMap = new Map<string, { total: number; count: number }>()
    ventasMes.forEach(v => {
        const key = v.vendedor || '—'
        const prev = vendedoresMap.get(key) ?? { total: 0, count: 0 }
        vendedoresMap.set(key, { total: prev.total + Number(v.total), count: prev.count + 1 })
    })
    const topVendedores = [...vendedoresMap.entries()]
        .map(([nombre, { total, count }]) => ({ nombre, total, count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    const maxVendedor = topVendedores[0]?.total ?? 1

    return (
        <div style={{ height: '100%', overflow: 'auto', padding: '1.25rem', background: '#f4f6f9' }}>

            {/* Título */}
            <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontWeight: 800, color: '#1a1a2e', fontSize: '1.3rem' }}>
                    <i className="pi pi-chart-bar" style={{ marginRight: '0.6rem', color: '#1e90ff' }} />
                    Resumen de ventas
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
                    {now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* KPI Cards */}
            {loading ? (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} style={{ flex: 1, minWidth: '160px', height: '110px', borderRadius: '12px', overflow: 'hidden' }}>
                            <Skeleton height="110px" />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {kpis.map(k => <KpiCard key={k.label} kpi={k} />)}
                </div>
            )}

            {/* Fila principal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', alignItems: 'start' }}>

                {/* Últimas ventas */}
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="pi pi-list" style={{ color: '#1e90ff' }} />
                        <span style={{ fontWeight: 700, color: '#1a1a2e' }}>Últimas ventas</span>
                        <Tag value={`${ventas.length} total`} severity="info" style={{ marginLeft: 'auto', fontSize: '0.75rem' }} />
                    </div>
                    {loading ? (
                        <div style={{ padding: '1rem' }}>
                            {[...Array(6)].map((_, i) => <Skeleton key={i} height="2.5rem" className="mb-1" style={{ marginBottom: '0.5rem' }} />)}
                        </div>
                    ) : (
                        <DataTable
                            value={ultimas}
                            size="small"
                            emptyMessage="Sin ventas registradas"
                            style={{ fontSize: '0.85rem' }}
                        >
                            <Column field="id" header="#" style={{ width: '3rem', color: '#888' }} />
                            <Column
                                field="fecha"
                                header="Fecha"
                                body={(r: VentaRow) => fmtDate(r.fecha)}
                                style={{ width: '10rem' }}
                            />
                            <Column field="vendedor" header="Vendedor" style={{ width: '8rem' }} />
                            <Column
                                field="total"
                                header="Total"
                                body={(r: VentaRow) => (
                                    <span style={{ fontWeight: 700, color: '#22c55e' }}>{fmt(Number(r.total))}</span>
                                )}
                                style={{ width: '7rem' }}
                            />
                            <Column
                                field="notas"
                                header="Notas"
                                body={(r: VentaRow) => (
                                    <span style={{ color: '#888', fontStyle: r.notas ? 'normal' : 'italic' }}>
                                        {r.notas || '—'}
                                    </span>
                                )}
                            />
                        </DataTable>
                    )}
                </div>

                {/* Columna derecha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Stock bajo */}
                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="pi pi-exclamation-triangle" style={{ color: '#f59e0b' }} />
                            <span style={{ fontWeight: 700, color: '#1a1a2e' }}>Stock bajo</span>
                            {stockBajo.length > 0 && (
                                <Tag value={stockBajo.length} severity="warning" style={{ marginLeft: 'auto', fontSize: '0.75rem' }} />
                            )}
                        </div>
                        <div style={{ padding: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
                            {loading ? (
                                [...Array(4)].map((_, i) => <Skeleton key={i} height="2.2rem" style={{ marginBottom: '0.5rem' }} />)
                            ) : stockBajo.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#aaa', padding: '1.5rem 0', fontSize: '0.85rem' }}>
                                    <i className="pi pi-check-circle" style={{ fontSize: '1.5rem', color: '#22c55e', display: 'block', marginBottom: '0.4rem' }} />
                                    Todo el stock está bien
                                </div>
                            ) : (
                                stockBajo.map(p => {
                                    const pct = p.dinventarymax > 0
                                        ? Math.round((p.dinventary / p.dinventarymax) * 100)
                                        : 0
                                    const critico = p.dinventary === 0
                                    return (
                                        <div key={p.code} style={{
                                            padding: '0.6rem 0.5rem',
                                            borderBottom: '1px solid #f5f5f5',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.3rem',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333' }}>
                                                    {p.description || p.code}
                                                </span>
                                                <Tag
                                                    value={critico ? 'Agotado' : `${p.dinventary} uds`}
                                                    severity={critico ? 'danger' : 'warning'}
                                                    style={{ fontSize: '0.72rem' }}
                                                />
                                            </div>
                                            <ProgressBar
                                                value={pct}
                                                showValue={false}
                                                style={{ height: '5px' }}
                                                color={critico ? '#ef4444' : '#f59e0b'}
                                            />
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Top vendedores del mes */}
                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="pi pi-star" style={{ color: '#a855f7' }} />
                            <span style={{ fontWeight: 700, color: '#1a1a2e' }}>Top vendedores (mes)</span>
                        </div>
                        <div style={{ padding: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
                            {loading ? (
                                [...Array(3)].map((_, i) => <Skeleton key={i} height="2.2rem" style={{ marginBottom: '0.5rem' }} />)
                            ) : topVendedores.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#aaa', padding: '1rem 0', fontSize: '0.85rem' }}>
                                    Sin datos este mes
                                </div>
                            ) : (
                                topVendedores.map((v, idx) => (
                                    <div key={v.nombre} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.5rem 0',
                                        borderBottom: '1px solid #f5f5f5',
                                    }}>
                                        <span style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: idx === 0 ? '#fbbf24' : idx === 1 ? '#d1d5db' : '#cd7c4b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                        }}>
                                            {idx + 1}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {v.nombre}
                                            </div>
                                            <ProgressBar
                                                value={Math.round((v.total / maxVendedor) * 100)}
                                                showValue={false}
                                                style={{ height: '4px', marginTop: '3px' }}
                                                color="#a855f7"
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>
                                            {fmt(v.total)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
