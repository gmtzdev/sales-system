/// <reference types="vite/client" />
import type { SaleTicket } from "./renderer/pages/core/interfaces/SaleTicket.interface"

// CSS side-effect imports
declare module '*.css'
declare module '*.module.css' {
    const classes: Record<string, string>
    export default classes
}

declare global {
    // electronAPI exposed via contextBridge in preload.ts
    interface IpcOptions {
        [key: string]: unknown
    }

    interface ElectronAPI {
        send: (channel: string, data: unknown) => void
        on: (channel: string, callback: (...args: unknown[]) => void) => void
        productos: {
            findAll: (opts?: IpcOptions) => Promise<unknown[]>
            findByCode: (code: string) => Promise<unknown>
            create: (data: IpcOptions) => Promise<unknown>
            update: (code: string, data: IpcOptions) => Promise<unknown>
            delete: (code: string) => Promise<unknown>
        }
        users: {
            findAll: (opts?: IpcOptions) => Promise<unknown[]>
            findById: (id: number) => Promise<unknown>
            create: (data: IpcOptions) => Promise<unknown>
            update: (id: number, data: IpcOptions) => Promise<unknown>
            delete: (id: number) => Promise<unknown>
            login: (username: string, password: string) => Promise<{ ok: boolean; user?: Record<string, unknown>; error?: string }>
        }
        salesticket: {
            create: (payload: IpcOptions) => Promise<SaleTicket>
            findAll: (opts?: IpcOptions) => Promise<SaleTicket[]>
            findById: (id: number) => Promise<SaleTicket | null>
        }
        suppliers: {
            findAll: (opts?: IpcOptions) => Promise<unknown[]>
            findById: (id: number) => Promise<unknown>
            create: (data: IpcOptions) => Promise<unknown>
            update: (id: number, data: IpcOptions) => Promise<unknown>
            delete: (id: number) => Promise<unknown>
        }
        departaments: {
            findAll: (opts?: IpcOptions) => Promise<unknown[]>
            findById: (id: number) => Promise<unknown>
            create: (data: IpcOptions) => Promise<unknown>
            update: (id: number, data: IpcOptions) => Promise<unknown>
            delete: (id: number) => Promise<unknown>
        }
        operations: {
            findOpen: () => Promise<OperationRecord | null>
            create: (data: IpcOptions) => Promise<OperationRecord>
            close: (id: number) => Promise<{ affectedRows: number }>
        }
    }

    interface OperationRecord {
        id: number
        money_in_box: number
        exchange_rate: number
        start_user_id: number
        start_at: string
        closed_at: string | null
        box_id: number
        is_open: boolean
    }

    interface Window {
        electronAPI: ElectronAPI
    }
}
