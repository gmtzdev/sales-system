import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'

interface OpenOperationDialogProps {
    visible: boolean
    loading?: boolean
    onHide: () => void
    onConfirm: (moneyInBox: number) => void
}

function OpenOperationDialog({ visible, loading = false, onHide, onConfirm }: OpenOperationDialogProps): React.ReactElement {
    const [moneyInBox, setMoneyInBox] = useState<number>(0)

    function handleConfirm(): void {
        onConfirm(moneyInBox)
    }

    return (
        <Dialog
            header="¿Dinero en caja?"
            visible={visible}
            style={{ width: '400px' }}
            closable={false}
            draggable={false}
            onHide={onHide}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button
                        label="Cancelar"
                        icon="pi pi-times"
                        outlined
                        severity="danger"
                        onClick={onHide}
                    />
                    <Button
                        label="Abrir operación"
                        icon="pi pi-check"
                        onClick={handleConfirm}
                        loading={loading}
                    />
                </div>
            }
        >
            <p style={{ marginBottom: '1rem', color: '#555' }}>
                Escriba el monto de dinero que hay actualmente en la caja.
            </p>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
                Fondo inicial de caja
            </label>
            <InputNumber
                value={moneyInBox}
                onValueChange={e => setMoneyInBox(e.value ?? 0)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                style={{ width: '100%' }}
                inputStyle={{ width: '100%' }}
                min={0}
            />
        </Dialog>
    )
}

export default OpenOperationDialog
