import React, { useEffect, useState, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dialog } from 'primereact/dialog'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { ToggleButton } from 'primereact/togglebutton'
import { Tag } from 'primereact/tag'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Departament {
    id?: number
    name: string
    taxPorcentage: number
    active: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_DEPARTAMENT: Departament = {
    name: '',
    taxPorcentage: 0,
    active: true,
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Departaments() {
    const toast = useRef<any>(null)

    const [departaments, setDepartaments] = useState<Departament[]>([])
    const [loading, setLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false)
    const [departament, setDepartament] = useState<Departament>(EMPTY_DEPARTAMENT)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadDepartaments()
    }, [])

    // ── Data fetching ──────────────────────────────────────────────────────────

    async function loadDepartaments() {
        setLoading(true)
        try {
            const rows = await (window as any).electronAPI.departaments.findAll({
                order: [['name', 'ASC']],
            })
            setDepartaments(rows)
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setLoading(false)
        }
    }

    // ── Dialog helpers ─────────────────────────────────────────────────────────

    function openNewDepartament() {
        setDepartament(EMPTY_DEPARTAMENT)
        setDialogVisible(true)
    }

    function openEditDepartament(row: Departament) {
        setDepartament({ ...row })
        setDialogVisible(true)
    }

    function closeDialog() {
        setDialogVisible(false)
    }

    // ── CRUD operations ────────────────────────────────────────────────────────

    async function saveDepartament() {
        if (!departament.name.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Department name is required.' })
            return
        }
        setSaving(true)
        try {
            if (departament.id) {
                // Update existing department
                await (window as any).electronAPI.departaments.update(departament.id, {
                    name: departament.name,
                    taxPorcentage: departament.taxPorcentage,
                    active: departament.active,
                })
                toast.current?.show({ severity: 'success', summary: 'Updated', detail: departament.name })
            } else {
                // Create new department
                await (window as any).electronAPI.departaments.create({
                    name: departament.name,
                    taxPorcentage: departament.taxPorcentage,
                    active: departament.active,
                })
                toast.current?.show({ severity: 'success', summary: 'Created', detail: departament.name })
            }
            closeDialog()
            loadDepartaments()
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message })
        } finally {
            setSaving(false)
        }
    }

    function confirmDeleteDepartament(row: Departament) {
        confirmDialog({
            message: `Delete "${row.name}"? This action cannot be undone.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptClassName: 'p-button-danger',
            accept: () => deleteDepartament(row),
        })
    }

    async function deleteDepartament(row: Departament) {
        try {
            await (window as any).electronAPI.departaments.delete(row.id)
            toast.current?.show({ severity: 'info', summary: 'Deleted', detail: row.name })
            loadDepartaments()
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message })
        }
    }

    // ── Column templates ───────────────────────────────────────────────────────

    // Show tax as a percentage string
    const taxTemplate = (row: Departament) =>
        `${Number(row.taxPorcentage).toFixed(2)}%`

    // Active status badge
    const activeTemplate = (row: Departament) =>
        <Tag value={row.active ? 'Active' : 'Inactive'} severity={row.active ? 'success' : 'secondary'} />

    const actionsTemplate = (row: Departament) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                tooltip="Edit"
                tooltipOptions={{ position: 'top' }}
                onClick={() => openEditDepartament(row)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                tooltip="Delete"
                tooltipOptions={{ position: 'top' }}
                onClick={() => confirmDeleteDepartament(row)}
            />
        </div>
    )

    // ── Table header slot ──────────────────────────────────────────────────────

    const tableHeader = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Departments</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        placeholder="Search..."
                        value={globalFilter}
                        onChange={e => setGlobalFilter(e.target.value)}
                    />
                </IconField>
                <Button label="New Department" icon="pi pi-plus" onClick={openNewDepartament} />
            </div>
        </div>
    )

    // ── Dialog footer slot ─────────────────────────────────────────────────────

    const dialogFooter = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={closeDialog} disabled={saving} />
            <Button label="Save" icon="pi pi-check" onClick={saveDepartament} loading={saving} />
        </div>
    )

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div style={{ padding: '1.5rem' }}>
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Page title */}
            <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
                <i className="pi pi-sitemap" style={{ marginRight: '0.5rem' }} />
                Departments
            </h2>

            {/* Departments table */}
            <DataTable
                value={departaments}
                loading={loading}
                header={tableHeader}
                globalFilter={globalFilter}
                globalFilterFields={['name']}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="No departments found."
                stripedRows
                removableSort
            >
                <Column field="name" header="Name" sortable />
                <Column field="taxPorcentage" header="Tax %" body={taxTemplate} sortable style={{ width: '110px' }} />
                <Column field="active" header="Status" body={activeTemplate} style={{ width: '110px' }} />
                <Column body={actionsTemplate} style={{ width: '110px' }} />
            </DataTable>

            {/* Create / Edit dialog */}
            <Dialog
                header={departament.id ? 'Edit Department' : 'New Department'}
                visible={dialogVisible}
                style={{ width: '400px' }}
                onHide={closeDialog}
                footer={dialogFooter}
                draggable={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>

                    {/* Name */}
                    <div className="p-field">
                        <label htmlFor="dept-name" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <InputText
                            id="dept-name"
                            value={departament.name}
                            onChange={e => setDepartament(d => ({ ...d, name: e.target.value }))}
                            style={{ width: '100%' }}
                            maxLength={150}
                            autoFocus
                        />
                    </div>

                    {/* Tax percentage */}
                    <div className="p-field">
                        <label htmlFor="dept-tax" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Tax Percentage (%)
                        </label>
                        <InputNumber
                            id="dept-tax"
                            value={departament.taxPorcentage}
                            onValueChange={e => setDepartament(d => ({ ...d, taxPorcentage: e.value ?? 0 }))}
                            min={0}
                            max={100}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            suffix="%"
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Active toggle */}
                    <div className="p-field">
                        <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
                            Status
                        </label>
                        <ToggleButton
                            checked={departament.active}
                            onChange={e => setDepartament(d => ({ ...d, active: e.value }))}
                            onLabel="Active"
                            offLabel="Inactive"
                            onIcon="pi pi-check"
                            offIcon="pi pi-times"
                        />
                    </div>

                </div>
            </Dialog>
        </div>
    )
}
