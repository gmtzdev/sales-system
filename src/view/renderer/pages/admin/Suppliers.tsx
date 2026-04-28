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

// ── Types ──────────────────────────────────────────────────────────────────────

interface Supplier {
    id?: number
    name: string
    description: string
    address: string
    phoneNumber: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_SUPPLIER: Supplier = {
    name: '',
    description: '',
    address: '',
    phoneNumber: '',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Suppliers() {
    const toast = useRef<any>(null)

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false)
    const [supplier, setSupplier] = useState<Supplier>(EMPTY_SUPPLIER)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSuppliers()
    }, [])

    // ── Data fetching ──────────────────────────────────────────────────────────

    async function loadSuppliers() {
        setLoading(true)
        try {
            const rows = await (window as any).electronAPI.suppliers.findAll({
                order: [['name', 'ASC']],
            })
            setSuppliers(rows)
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setLoading(false)
        }
    }

    // ── Dialog helpers ─────────────────────────────────────────────────────────

    function openNewSupplier() {
        setSupplier(EMPTY_SUPPLIER)
        setDialogVisible(true)
    }

    function openEditSupplier(row: Supplier) {
        setSupplier({ ...row })
        setDialogVisible(true)
    }

    function closeDialog() {
        setDialogVisible(false)
    }

    // ── CRUD operations ────────────────────────────────────────────────────────

    async function saveSupplier() {
        if (!supplier.name.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Supplier name is required.' })
            return
        }
        setSaving(true)
        try {
            if (supplier.id) {
                // Update existing supplier
                await (window as any).electronAPI.suppliers.update(supplier.id, {
                    name: supplier.name,
                    description: supplier.description,
                    address: supplier.address,
                    phoneNumber: supplier.phoneNumber,
                })
                toast.current?.show({ severity: 'success', summary: 'Updated', detail: supplier.name })
            } else {
                // Create new supplier
                await (window as any).electronAPI.suppliers.create({
                    name: supplier.name,
                    description: supplier.description,
                    address: supplier.address,
                    phoneNumber: supplier.phoneNumber,
                })
                toast.current?.show({ severity: 'success', summary: 'Created', detail: supplier.name })
            }
            closeDialog()
            loadSuppliers()
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setSaving(false)
        }
    }

    function confirmDeleteSupplier(row: Supplier) {
        confirmDialog({
            message: `Delete "${row.name}"? This action cannot be undone.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptClassName: 'p-button-danger',
            accept: () => deleteSupplier(row),
        })
    }

    async function deleteSupplier(row: Supplier) {
        try {
            await (window as any).electronAPI.suppliers.delete(row.id)
            toast.current?.show({ severity: 'info', summary: 'Deleted', detail: row.name })
            loadSuppliers()
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    // ── Column templates ───────────────────────────────────────────────────────

    const actionsTemplate = (row: Supplier) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                tooltip="Edit"
                tooltipOptions={{ position: 'top' }}
                onClick={() => openEditSupplier(row)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                tooltip="Delete"
                tooltipOptions={{ position: 'top' }}
                onClick={() => confirmDeleteSupplier(row)}
            />
        </div>
    )

    // ── Table header slot ──────────────────────────────────────────────────────

    const tableHeader = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Suppliers</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        placeholder="Search..."
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                    />
                </IconField>
                <Button label="New Supplier" icon="pi pi-plus" onClick={openNewSupplier} />
            </div>
        </div>
    )

    // ── Dialog footer slot ─────────────────────────────────────────────────────

    const dialogFooter = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={closeDialog} disabled={saving} />
            <Button label="Save" icon="pi pi-check" onClick={saveSupplier} loading={saving} />
        </div>
    )

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div style={{ padding: '1.5rem' }}>
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Page title */}
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
                <i className="pi pi-truck" style={{ marginRight: '0.5rem' }} />
                Suppliers
            </h2>

            {/* Suppliers table */}
            <DataTable
                value={suppliers}
                loading={loading}
                header={tableHeader}
                globalFilter={globalFilter}
                globalFilterFields={['name', 'description', 'address', 'phoneNumber']}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="No suppliers found."
                stripedRows
                removableSort
            >
                <Column field="name" header="Name" sortable />
                <Column field="description" header="Description" />
                <Column field="address" header="Address" />
                <Column field="phoneNumber" header="Phone" style={{ width: '140px' }} />
                <Column body={actionsTemplate} style={{ width: '110px' }} />
            </DataTable>

            {/* Create / Edit dialog */}
            <Dialog
                header={supplier.id ? 'Edit Supplier' : 'New Supplier'}
                visible={dialogVisible}
                style={{ width: '440px' }}
                onHide={closeDialog}
                footer={dialogFooter}
                draggable={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>

                    {/* Name */}
                    <div className="p-field">
                        <label htmlFor="sup-name" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <InputText
                            id="sup-name"
                            value={supplier.name}
                            onChange={e => setSupplier(s => ({ ...s, name: e.target.value }))}
                            style={{ width: '100%' }}
                            maxLength={150}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="p-field">
                        <label htmlFor="sup-desc" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Description
                        </label>
                        <InputTextarea
                            id="sup-desc"
                            value={supplier.description}
                            onChange={e => setSupplier(s => ({ ...s, description: e.target.value }))}
                            rows={3}
                            style={{ width: '100%' }}
                            maxLength={255}
                        />
                    </div>

                    {/* Address */}
                    <div className="p-field">
                        <label htmlFor="sup-address" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Address
                        </label>
                        <InputText
                            id="sup-address"
                            value={supplier.address}
                            onChange={e => setSupplier(s => ({ ...s, address: e.target.value }))}
                            style={{ width: '100%' }}
                            maxLength={255}
                        />
                    </div>

                    {/* Phone number */}
                    <div className="p-field">
                        <label htmlFor="sup-phone" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Phone Number
                        </label>
                        <InputText
                            id="sup-phone"
                            value={supplier.phoneNumber}
                            onChange={e => setSupplier(s => ({ ...s, phoneNumber: e.target.value }))}
                            style={{ width: '100%' }}
                            maxLength={20}
                        />
                    </div>

                </div>
            </Dialog>
        </div>
    )
}
