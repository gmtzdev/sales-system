// CSS side-effect imports
declare module '*.css'

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
    }
    salesticket: {
        create: (payload: IpcOptions) => Promise<unknown>
        findAll: (opts?: IpcOptions) => Promise<unknown[]>
        findById: (id: number) => Promise<unknown>
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
}

interface Window {
    electronAPI: ElectronAPI
}
