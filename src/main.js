const { app, BrowserWindow } = require('electron')
const path = require('path')
const { initDatabase, closeDatabase } = require('./database/models')
const { registerProductosHandlers } = require('./ipc/productos.handlers')
const { registerUsuariosHandlers } = require('./ipc/usuarios.handlers')
const { registerVentasHandlers } = require('./ipc/ventas.handlers')

const isDev = !app.isPackaged

registerProductosHandlers()
registerUsuariosHandlers()
registerVentasHandlers()

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
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
