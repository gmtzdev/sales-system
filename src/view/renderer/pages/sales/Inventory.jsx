import React, { useEffect, useState, useRef } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { InputNumber } from 'primereact/inputnumber'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Toast } from 'primereact/toast'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown'

// Default empty form values aligned with ProductAttributes
const EMPTY_PRODUCT = {
    code: '',
    description: '',
    tsale: 'unit',
    pcost: 0,
    psale: 0,
    dept: null,
    provid: null,
    umeas: 0,
    wholeSale: 0,
    ipriority: 0,
    dinventary: 0,
    dinventarymin: 0,
    dinventarymax: 0,
    profitporcentage: 0,
    components: '',
    taxes: '',
}

// Sale type options
const TSALE_OPTIONS = [
    { label: 'Unit', value: 'unit' },
    { label: 'Weight', value: 'weight' },
    { label: 'Service', value: 'service' },
]

function Inventory() {
    const toast = useRef(null)

    // Product list state
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)

    // Lookup data for dropdowns
    const [suppliers, setSuppliers] = useState([])
    const [departaments, setDepartaments] = useState([])

    // Search / filter
    const [globalFilter, setGlobalFilter] = useState('')

    // Create / edit dialog
    const [dialogVisible, setDialogVisible] = useState(false)
    const [product, setProduct] = useState(EMPTY_PRODUCT)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Load everything on mount
    useEffect(() => {
        loadProducts()
        loadLookups()
    }, [])

    // â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async function loadProducts() {
        setLoading(true)
        try {
            const rows = await window.electronAPI.productos.findAll({
                order: [['code', 'ASC']],
                includeAssociations: true,
            })
            setProducts(rows)
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setLoading(false)
        }
    }

    async function loadLookups() {
        try {
            const [supRows, deptRows] = await Promise.all([
                window.electronAPI.suppliers.findAll({ order: [['name', 'ASC']] }),
                window.electronAPI.departaments.findAll({ order: [['name', 'ASC']] }),
            ])
            setSuppliers(supRows.map(s => ({ label: s.name, value: s.id })))
            setDepartaments(deptRows.map(d => ({ label: d.name, value: d.id })))
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    // â”€â”€ Dialog helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    function openNewProduct() {
        setProduct(EMPTY_PRODUCT)
        setIsEditing(false)
        setDialogVisible(true)
    }

    function openEditProduct(row) {
        setProduct({
            ...row,
            dept: row.departament?.id ?? row.dept,
            provid: row.supplier?.id ?? row.provid,
        })
        setIsEditing(true)
        setDialogVisible(true)
    }

    function closeDialog() {
        setDialogVisible(false)
    }

    // â”€â”€ CRUD operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async function saveProduct() {
        if (!product.code.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Required', detail: 'Product code is required.' })
            return
        }
        if (!product.dept || !product.provid) {
            toast.current.show({ severity: 'warn', summary: 'Required', detail: 'Department and Supplier are required.' })
            return
        }
        setSaving(true)
        try {
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
            }
            if (isEditing) {
                // Update â€” code is PK and cannot change
                await window.electronAPI.productos.update(product.code, payload)
                toast.current.show({ severity: 'success', summary: 'Updated', detail: product.code })
            } else {
                // Create â€” include code
                await window.electronAPI.productos.create({ code: product.code, ...payload })
                toast.current.show({ severity: 'success', summary: 'Created', detail: product.code })
            }
            closeDialog()
            loadProducts()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setSaving(false)
        }
    }

    function confirmDeleteProduct(row) {
        confirmDialog({
            message: `Delete product "${row.code}"? This action cannot be undone.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptClassName: 'p-button-danger',
            accept: () => deleteProduct(row),
        })
    }

    async function deleteProduct(row) {
        try {
            await window.electronAPI.productos.delete(row.code)
            toast.current.show({ severity: 'info', summary: 'Deleted', detail: row.code })
            loadProducts()
        } catch (err) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    // â”€â”€ Column templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const priceTemplate = (row) => `$${Number(row.psale).toFixed(2)}`
    const costTemplate = (row) => `$${Number(row.pcost).toFixed(2)}`
    const supplierTemplate = (row) => row.supplier?.name ?? 'â€”'
    const deptTemplate = (row) => row.departament?.name ?? 'â€”'

    // Stock badge based on dinventary vs dinventarymin
    const stockTemplate = (row) => {
        if (Number(row.dinventary) <= 0)
            return <Tag value="Out of stock" severity="danger" />
        if (Number(row.dinventary) <= Number(row.dinventarymin))
            return <Tag value={`Low Â· ${row.dinventary}`} severity="warning" />
        return <Tag value={row.dinventary} severity="success" />
    }

    const actionsTemplate = (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="pi pi-pencil" rounded text severity="info"
                tooltip="Edit" tooltipOptions={{ position: 'top' }}
                onClick={() => openEditProduct(row)} />
            <Button icon="pi pi-trash" rounded text severity="danger"
                tooltip="Delete" tooltipOptions={{ position: 'top' }}
                onClick={() => confirmDeleteProduct(row)} />
        </div>
    )

    // â”€â”€ Derived stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const totalProducts = products.length
    const lowStockCount = products.filter(p => Number(p.dinventary) > 0 && Number(p.dinventary) <= Number(p.dinventarymin)).length
    const outOfStockCount = products.filter(p => Number(p.dinventary) <= 0).length

    // â”€â”€ Table header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const tableHeader = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Product List</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText placeholder="Search..." value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)} />
                </IconField>
                <Button label="New Product" icon="pi pi-plus" onClick={openNewProduct} />
            </div>
        </div>
    )

    // â”€â”€ Dialog footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const dialogFooter = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={closeDialog} disabled={saving} />
            <Button label="Save" icon="pi pi-check" onClick={saveProduct} loading={saving} />
        </div>
    )

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return (
        <div style={{ padding: '1.5rem' }}>
            <Toast ref={toast} />
            <ConfirmDialog />

            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
                <i className="pi pi-box" style={{ marginRight: '0.5rem' }} />
                Inventory
            </h2>

            {/* Summary stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <StatCard label="Total Products" value={totalProducts} icon="pi pi-list" color="#3b82f6" />
                <StatCard label="Low Stock" value={lowStockCount} icon="pi pi-exclamation-circle" color="#f59e0b" />
                <StatCard label="Out of Stock" value={outOfStockCount} icon="pi pi-times-circle" color="#ef4444" />
            </div>

            {/* Products table */}
            <DataTable
                value={products}
                loading={loading}
                header={tableHeader}
                globalFilter={globalFilter}
                globalFilterFields={['code', 'description']}
                paginator rows={10} rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="No products found."
                stripedRows removableSort
            >
                <Column field="code" header="Code" sortable style={{ width: '130px' }} />
                <Column field="description" header="Description" />
                <Column header="Supplier" body={supplierTemplate} />
                <Column header="Department" body={deptTemplate} />
                <Column field="pcost" header="Cost" body={costTemplate} sortable style={{ width: '110px' }} />
                <Column field="psale" header="Sale Price" body={priceTemplate} sortable style={{ width: '110px' }} />
                <Column field="dinventary" header="Stock" body={stockTemplate} sortable style={{ width: '130px' }} />
                <Column body={actionsTemplate} style={{ width: '110px' }} />
            </DataTable>

            {/* Create / Edit dialog */}
            <Dialog
                header={isEditing ? `Edit Product Â· ${product.code}` : 'New Product'}
                visible={dialogVisible}
                style={{ width: '680px' }}
                onHide={closeDialog}
                footer={dialogFooter}
                draggable={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>

                    {/* Row 1: Code + Sale type */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Field label="Code" required style={{ flex: 1 }}>
                            <InputText value={product.code}
                                onChange={e => setProduct(p => ({ ...p, code: e.target.value }))}
                                disabled={isEditing}
                                style={{ width: '100%' }} maxLength={150} autoFocus />
                        </Field>
                        <Field label="Sale Type" required style={{ flex: 1 }}>
                            <Dropdown value={product.tsale} options={TSALE_OPTIONS}
                                onChange={e => setProduct(p => ({ ...p, tsale: e.value }))}
                                style={{ width: '100%' }} />
                        </Field>
                    </div>

                    {/* Row 2: Description */}
                    <Field label="Description">
                        <InputTextarea value={product.description}
                            onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
                            rows={2} style={{ width: '100%' }} maxLength={255} />
                    </Field>

                    {/* Row 3: Supplier + Department */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Field label="Supplier" required style={{ flex: 1 }}>
                            <Dropdown value={product.provid} options={suppliers}
                                onChange={e => setProduct(p => ({ ...p, provid: e.value }))}
                                placeholder="Select supplier" filter style={{ width: '100%' }} />
                        </Field>
                        <Field label="Department" required style={{ flex: 1 }}>
                            <Dropdown value={product.dept} options={departaments}
                                onChange={e => setProduct(p => ({ ...p, dept: e.value }))}
                                placeholder="Select department" filter style={{ width: '100%' }} />
                        </Field>
                    </div>

                    {/* Row 4: Cost + Sale price + Wholesale */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Field label="Cost Price" style={{ flex: 1 }}>
                            <InputNumber value={product.pcost}
                                onValueChange={e => setProduct(p => ({ ...p, pcost: e.value ?? 0 }))}
                                mode="currency" currency="USD" locale="en-US" min={0} style={{ width: '100%' }} />
                        </Field>
                        <Field label="Sale Price" style={{ flex: 1 }}>
                            <InputNumber value={product.psale}
                                onValueChange={e => setProduct(p => ({ ...p, psale: e.value ?? 0 }))}
                                mode="currency" currency="USD" locale="en-US" min={0} style={{ width: '100%' }} />
                        </Field>
                        <Field label="Wholesale Price" style={{ flex: 1 }}>
                            <InputNumber value={product.wholeSale}
                                onValueChange={e => setProduct(p => ({ ...p, wholeSale: e.value ?? 0 }))}
                                mode="currency" currency="USD" locale="en-US" min={0} style={{ width: '100%' }} />
                        </Field>
                    </div>

                    {/* Row 5: Profit % + Priority + Unit of measure */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Field label="Profit %" style={{ flex: 1 }}>
                            <InputNumber value={product.profitporcentage}
                                onValueChange={e => setProduct(p => ({ ...p, profitporcentage: e.value ?? 0 }))}
                                min={0} max={100} suffix="%" minFractionDigits={2} style={{ width: '100%' }} />
                        </Field>
                        <Field label="Unit of Measure" style={{ flex: 1 }}>
                            <InputNumber value={product.umeas}
                                onValueChange={e => setProduct(p => ({ ...p, umeas: e.value ?? 0 }))}
                                min={0} style={{ width: '100%' }} />
                        </Field>
                        <Field label="Priority" style={{ flex: 1 }}>
                            <InputNumber value={product.ipriority}
                                onValueChange={e => setProduct(p => ({ ...p, ipriority: e.value ?? 0 }))}
                                min={0} style={{ width: '100%' }} />
                        </Field>
                    </div>

                    {/* Row 6: Stock / Min / Max */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Field label="Current Stock" style={{ flex: 1 }}>
                            <InputNumber value={product.dinventary}
                                onValueChange={e => setProduct(p => ({ ...p, dinventary: e.value ?? 0 }))}
                                min={0} minFractionDigits={2} style={{ width: '100%' }} />
                        </Field>
                        <Field label="Min Stock" style={{ flex: 1 }}>
                            <InputNumber value={product.dinventarymin}
                                onValueChange={e => setProduct(p => ({ ...p, dinventarymin: e.value ?? 0 }))}
                                min={0} minFractionDigits={2} style={{ width: '100%' }} />
                        </Field>
                        <Field label="Max Stock" style={{ flex: 1 }}>
                            <InputNumber value={product.dinventarymax}
                                onValueChange={e => setProduct(p => ({ ...p, dinventarymax: e.value ?? 0 }))}
                                min={0} minFractionDigits={2} style={{ width: '100%' }} />
                        </Field>
                    </div>

                </div>
            </Dialog>
        </div>
    )
}

// â”€â”€ Helper component: summary stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({ label, value, icon, color }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--surface-card, #fff)',
            border: '1px solid var(--surface-border, #e2e8f0)',
            borderRadius: '8px', padding: '0.75rem 1.25rem', minWidth: '160px',
        }}>
            <i className={icon} style={{ fontSize: '1.5rem', color }} />
            <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-color-secondary, #64748b)', marginTop: '0.2rem' }}>{label}</div>
            </div>
        </div>
    )
}

// â”€â”€ Helper wrapper: labeled field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Field({ label, required, children, style }) {
    return (
        <div className="p-field" style={style}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {children}
        </div>
    )
}

export default Inventory
