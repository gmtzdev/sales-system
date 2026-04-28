// Expone APIs seguras al proceso renderer a través de contextBridge
const { contextBridge, ipcRenderer } = require('electron')

// Lista blanca de canales IPC permitidos
const ALLOWED_SEND_CHANNELS = []
const ALLOWED_RECEIVE_CHANNELS = []

contextBridge.exposeInMainWorld('electronAPI', {
    // Mensajería genérica (uso futuro)
    send: (channel, data) => {
        if (ALLOWED_SEND_CHANNELS.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },
    on: (channel, callback) => {
        if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => callback(...args))
        }
    },

    // API de Productos
    productos: {
        findAll: (opts) => ipcRenderer.invoke('productos:findAll', opts),
        findById: (id) => ipcRenderer.invoke('productos:findById', id),
        create: (data) => ipcRenderer.invoke('productos:create', data),
        update: (id, data) => ipcRenderer.invoke('productos:update', id, data),
        delete: (id) => ipcRenderer.invoke('productos:delete', id),
    },

    // API de Usuarios
    usuarios: {
        findAll: (opts) => ipcRenderer.invoke('usuarios:findAll', opts),
        findById: (id) => ipcRenderer.invoke('usuarios:findById', id),
        create: (data) => ipcRenderer.invoke('usuarios:create', data),
        update: (id, data) => ipcRenderer.invoke('usuarios:update', id, data),
        delete: (id) => ipcRenderer.invoke('usuarios:delete', id),
    },

    // API de Ventas
    ventas: {
        create: (payload) => ipcRenderer.invoke('ventas:create', payload),
        findAll: (opts) => ipcRenderer.invoke('ventas:findAll', opts),
        findById: (id) => ipcRenderer.invoke('ventas:findById', id),
    },
})

