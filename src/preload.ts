// Exposes safe APIs to the renderer process via contextBridge
import { contextBridge, ipcRenderer } from 'electron'

// Types for the electronAPI exposed to the renderer
type IpcOptions = Record<string, unknown>

// Whitelist of generic IPC channels (for future use)
const ALLOWED_SEND_CHANNELS: string[] = []
const ALLOWED_RECEIVE_CHANNELS: string[] = []

contextBridge.exposeInMainWorld('electronAPI', {
    // Generic messaging (future use)
    send: (channel: string, data: unknown): void => {
        if (ALLOWED_SEND_CHANNELS.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },
    on: (channel: string, callback: (...args: unknown[]) => void): void => {
        if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => callback(...args))
        }
    },

    // Products API (code is the primary key)
    productos: {
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('productos:findAll', opts),
        findByCode: (code: string) => ipcRenderer.invoke('productos:findByCode', code),
        create: (data: IpcOptions) => ipcRenderer.invoke('productos:create', data),
        update: (code: string, data: IpcOptions) => ipcRenderer.invoke('productos:update', code, data),
        delete: (code: string) => ipcRenderer.invoke('productos:delete', code),
    },

    // Users API
    usuarios: {
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('usuarios:findAll', opts),
        findById: (id: number) => ipcRenderer.invoke('usuarios:findById', id),
        create: (data: IpcOptions) => ipcRenderer.invoke('usuarios:create', data),
        update: (id: number, data: IpcOptions) => ipcRenderer.invoke('usuarios:update', id, data),
        delete: (id: number) => ipcRenderer.invoke('usuarios:delete', id),
    },

    // Sales API
    ventas: {
        create: (payload: IpcOptions) => ipcRenderer.invoke('ventas:create', payload),
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('ventas:findAll', opts),
        findById: (id: number) => ipcRenderer.invoke('ventas:findById', id),
    },

    // Suppliers API
    suppliers: {
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('suppliers:findAll', opts),
        findById: (id: number) => ipcRenderer.invoke('suppliers:findById', id),
        create: (data: IpcOptions) => ipcRenderer.invoke('suppliers:create', data),
        update: (id: number, data: IpcOptions) => ipcRenderer.invoke('suppliers:update', id, data),
        delete: (id: number) => ipcRenderer.invoke('suppliers:delete', id),
    },

    // Departments API
    departaments: {
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('departaments:findAll', opts),
        findById: (id: number) => ipcRenderer.invoke('departaments:findById', id),
        create: (data: IpcOptions) => ipcRenderer.invoke('departaments:create', data),
        update: (id: number, data: IpcOptions) => ipcRenderer.invoke('departaments:update', id, data),
        delete: (id: number) => ipcRenderer.invoke('departaments:delete', id),
    },
})

