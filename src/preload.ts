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
    users: {
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('users:findAll', opts),
        findById: (id: number) => ipcRenderer.invoke('users:findById', id),
        create: (data: IpcOptions) => ipcRenderer.invoke('users:create', data),
        update: (id: number, data: IpcOptions) => ipcRenderer.invoke('users:update', id, data),
        delete: (id: number) => ipcRenderer.invoke('users:delete', id),
        login: (username: string, password: string) => ipcRenderer.invoke('users:login', username, password),
    },

    // Sales API
    salesticket: {
        create: (payload: IpcOptions) => ipcRenderer.invoke('salesticket:create', payload),
        findAll: (opts?: IpcOptions) => ipcRenderer.invoke('salesticket:findAll', opts),
        findById: (id: number) => ipcRenderer.invoke('salesticket:findById', id),
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

