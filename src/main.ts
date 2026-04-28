import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './database/models'
import { registerProductosHandlers } from './ipc/productos.handlers'
import { registerUsuariosHandlers } from './ipc/usuarios.handlers'
import { registerVentasHandlers } from './ipc/ventas.handlers'
import { registerSuppliersHandlers } from './ipc/suppliers.handlers'

const isDev: boolean = !app.isPackaged

// Register all IPC handlers before creating any window
registerProductosHandlers()
registerUsuariosHandlers()
registerVentasHandlers()
registerSuppliersHandlers()

function createWindow(): void {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // preload.ts compiles to preload.js in the same output directory
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    if (isDev) {
        win.loadURL('http://localhost:5173')
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'))
    }
}

app.whenReady().then(() => {
    initDatabase()
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', async () => {
    await closeDatabase()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
