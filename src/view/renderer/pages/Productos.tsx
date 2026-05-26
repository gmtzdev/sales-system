import React, { useEffect, useState, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'

interface ProductForm {
    code: string
    description: string
    tsale: string
    pcost: number
    psale: number
    dept: number | null
    provid: number | null
    umeas: number
    wholeSale: number
    ipriority: number
    dinventary: number
    dinventarymin: number
    dinventarymax: number
    profitporcentage: number
    components: string
    taxes: string
    // eager-loaded associations
    supplier?: { id: number; name: string }
    departament?: { id: number; name: string }
    image: string | null
}

interface LookupOption {
    label: string
    value: number
}

const TSALE_OPTIONS = [
    { label: 'Unidad', value: 'unit' },
    { label: 'Peso', value: 'weight' },
    { label: 'Servicio', value: 'service' },
]

const F = ({ label, children, required }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="p-fluid">
        <label style={{ fontSize: '0.875rem', marginBottom: '0.35rem', display: 'block' }}>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {children}
    </div>
)

const EMPTY_PRODUCT: ProductForm = {
    code: '', description: '', tsale: 'unit',
    pcost: 0, psale: 0, dept: null, provid: null,
    umeas: 0, wholeSale: 0, ipriority: 0,
    dinventary: 0, dinventarymin: 0, dinventarymax: 0,
    profitporcentage: 0, components: '', taxes: '',
    image: null
}

function Productos() {
    const toast = useRef<Toast>(null)
    const codeInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [productos, setProductos] = useState<ProductForm[]>([])
    const [loading, setLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const [dialogVisible, setDialogVisible] = useState(false)
    const [product, setProduct] = useState<ProductForm>(EMPTY_PRODUCT)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [suppliers, setSuppliers] = useState<LookupOption[]>([])
    const [departaments, setDepartaments] = useState<LookupOption[]>([])

    useEffect(() => {
        loadProductos()
        loadLookups()
    }, [])

    async function loadProductos() {
        setLoading(true)
        try {
            const rows = await (window as any).electronAPI.productos.findAll({
                order: [['code', 'ASC']],
                includeAssociations: true,
            })
            setProductos(rows as ProductForm[])
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setLoading(false)
        }
    }

    async function loadLookups() {
        try {
            const [supRows, deptRows] = await Promise.all([
                (window as any).electronAPI.suppliers.findAll({ order: [['name', 'ASC']] }),
                (window as any).electronAPI.departaments.findAll({ order: [['name', 'ASC']] }),
            ])
            setSuppliers((supRows as { id: number; name: string }[]).map(s => ({ label: s.name, value: s.id })))
            setDepartaments((deptRows as { id: number; name: string }[]).map(d => ({ label: d.name, value: d.id })))
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        }
    }

    function openNew() {
        setProduct(EMPTY_PRODUCT)
        setIsEditing(false)
        setDialogVisible(true)
    }

    function openEdit(row: ProductForm) {
        setProduct({
            ...row,
            dept: row.departament?.id ?? row.dept,
            provid: row.supplier?.id ?? row.provid,
        })
        setIsEditing(true)
        setDialogVisible(true)
    }

    async function saveProduct() {
        if (!product.code.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Requerido', detail: 'El cÃ³digo es obligatorio' })
            return
        }
        if (!product.dept || !product.provid) {
            toast.current?.show({ severity: 'warn', summary: 'Requerido', detail: 'Departamento y Proveedor son obligatorios' })
            return
        }
        setSaving(true)
        const payload = {
            description: product.description,
            tsale: product.tsale,
            pcost: product.pcost,
            psale: product.psale,
            dept: product.dept,
            provid: product.provid,
            umeas: product.umeas,
            wholeSale: product.wholeSale,
            ipriority: product.ipriority,
            dinventary: product.dinventary,
            dinventarymin: product.dinventarymin,
            dinventarymax: product.dinventarymax,
            profitporcentage: product.profitporcentage,
            components: product.components,
            taxes: product.taxes,
            image: product.image ?? undefined,
        }
        try {
            if (isEditing) {
                await (window as any).electronAPI.productos.update(product.code, payload)
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: product.code })
            } else {
                await (window as any).electronAPI.productos.create({ code: product.code, ...payload })
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: product.code })
            }
            setDialogVisible(false)
            loadProductos()
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        } finally {
            setSaving(false)
        }
    }

    function confirmDelete(row: ProductForm) {
        confirmDialog({
            message: `¿Eliminar "${row.code}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: () => deleteProduct(row),
        })
    }

    function toFileUrl(p: string): string {
        return 'product-img:///' + encodeURIComponent(p)
    }

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (product.image) {
            await window.electronAPI.productos.deleteImage(product.image)
        }
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Array.from(new Uint8Array(arrayBuffer))
        const savedPath = await window.electronAPI.productos.saveImage(file.name, buffer)
        setProduct(p => ({ ...p, image: savedPath }))
        e.target.value = ''
    }

    async function deleteProduct(row: ProductForm) {
        try {
            await (window as any).electronAPI.productos.delete(row.code)
            toast.current?.show({ severity: 'info', summary: 'Eliminado', detail: row.code })
            loadProductos()
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as Error).message })
        }
    }

    const stockTemplate = (row: ProductForm) => {
        if (Number(row.dinventary) <= 0)
            return <Tag value="Sin stock" severity="danger" />
        if (Number(row.dinventary) <= Number(row.dinventarymin))
            return <Tag value={`Bajo Â· ${row.dinventary}`} severity="warning" />
        return <Tag value={String(row.dinventary)} severity="success" />
    }

    const actionsTemplate = (row: ProductForm) => (
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
                globalFilterFields={['code', 'description']}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="Sin productos"
                stripedRows
            >
                {/* <Column header="" style={{ width: '60px' }} body={(r: ProductForm) =>
                    r.image
                        ? <img src={toFileUrl(r.image)} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        : <i className="pi pi-image" style={{ color: '#ccc', fontSize: '1.25rem' }} />
                } /> */}
                <Column field="code" header="Código" sortable style={{ width: '130px' }} />
                <Column field="description" header="Descripción" />
                <Column header="Proveedor" body={(r: ProductForm) => r.supplier?.name ?? '—'} />
                <Column header="Departamento" body={(r: ProductForm) => r.departament?.name ?? '—'} />
                <Column field="psale" header="Precio" sortable body={(r: ProductForm) => `$${Number(r.psale).toFixed(2)}`} style={{ width: '110px' }} />
                <Column field="dinventary" header="Stock" sortable body={stockTemplate} style={{ width: '120px' }} />
                <Column body={actionsTemplate} style={{ width: '100px' }} />
            </DataTable>

            <Dialog
                header={isEditing ? `Editar · ${product.code}` : 'Nuevo producto'}
                visible={dialogVisible}
                style={{ width: '640px' }}
                onHide={() => setDialogVisible(false)}
                onShow={() => codeInputRef.current?.focus()}
                footer={dialogFooter}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>

                    {/* Código + tipo de venta */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <F label="Código" required>
                            <InputText
                                ref={codeInputRef}
                                value={product.code}
                                onChange={e => setProduct(p => ({ ...p, code: e.target.value }))}
                                disabled={isEditing}
                                maxLength={150}
                            />
                        </F>
                        <F label="Tipo de venta" required>
                            <Dropdown
                                value={product.tsale}
                                options={TSALE_OPTIONS}
                                onChange={e => setProduct(p => ({ ...p, tsale: e.value }))}
                            />
                        </F>
                    </div>

                    {/* Imagen */}
                    <F label="Imagen">
                        <input
                            type="file"
                            accept="image/*"
                            ref={imageInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {product.image
                                ? <img src={toFileUrl(product.image)} alt="Producto" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e0e0e0' }} />
                                : <div style={{ width: '80px', height: '80px', border: '2px dashed #ccc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="pi pi-image" style={{ fontSize: '2rem', color: '#ccc' }} />
                                </div>
                            }
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <Button type="button" label="Seleccionar" icon="pi pi-upload" outlined size="small" onClick={() => imageInputRef.current?.click()} />
                                {product.image && (
                                    <Button type="button" label="Quitar" icon="pi pi-times" outlined severity="danger" size="small" onClick={async () => {
                                        await window.electronAPI.productos.deleteImage(product.image!)
                                        setProduct(p => ({ ...p, image: null }))
                                    }} />
                                )}
                            </div>
                        </div>
                    </F>

                    {/* Descripción */}
                    <F label="Descripción">
                        <InputTextarea
                            value={product.description}
                            onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
                            rows={2}
                            maxLength={255}
                        />
                    </F>

                    {/* Proveedor + Departamento */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <F label="Proveedor" required>
                            <Dropdown
                                value={product.provid}
                                options={suppliers}
                                onChange={e => setProduct(p => ({ ...p, provid: e.value }))}
                                placeholder="Seleccionar..."
                                filter
                            />
                        </F>
                        <F label="Departamento" required>
                            <Dropdown
                                value={product.dept}
                                options={departaments}
                                onChange={e => setProduct(p => ({ ...p, dept: e.value }))}
                                placeholder="Seleccionar..."
                                filter
                            />
                        </F>
                    </div>

                    {/* Costo + Precio venta + Mayoreo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <F label="Costo">
                            <InputNumber value={product.pcost}
                                onValueChange={(e: InputNumberValueChangeEvent) => setProduct(p => ({ ...p, pcost: e.value ?? 0 }))}
                                mode="currency" currency="USD" locale="es-MX" min={0} />
                        </F>
                        <F label="Precio venta">
                            <InputNumber value={product.psale}
                                onValueChange={(e: InputNumberValueChangeEvent) => setProduct(p => ({ ...p, psale: e.value ?? 0 }))}
                                mode="currency" currency="USD" locale="es-MX" min={0} />
                        </F>
                        <F label="Precio mayoreo">
                            <InputNumber value={product.wholeSale}
                                onValueChange={(e: InputNumberValueChangeEvent) => setProduct(p => ({ ...p, wholeSale: e.value ?? 0 }))}
                                mode="currency" currency="USD" locale="es-MX" min={0} />
                        </F>
                    </div>

                    {/* Inventario actual / mínimo / máximo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <F label="Inventario">
                            <InputNumber value={product.dinventary}
                                onValueChange={(e: InputNumberValueChangeEvent) => setProduct(p => ({ ...p, dinventary: e.value ?? 0 }))}
                                min={0} minFractionDigits={2} />
                        </F>
                        <F label="Mínimo">
                            <InputNumber value={product.dinventarymin}
                                onValueChange={(e: InputNumberValueChangeEvent) => setProduct(p => ({ ...p, dinventarymin: e.value ?? 0 }))}
                                min={0} minFractionDigits={2} />
                        </F>
                        <F label="Máximo">
                            <InputNumber value={product.dinventarymax}
                                onValueChange={(e: InputNumberValueChangeEvent) => setProduct(p => ({ ...p, dinventarymax: e.value ?? 0 }))}
                                min={0} minFractionDigits={2} />
                        </F>
                    </div>

                </div>
            </Dialog>
        </>
    )
}

export default Productos
