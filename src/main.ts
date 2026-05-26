import { app, BrowserWindow, Menu, MenuItem, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { initDatabase, closeDatabase } from './database/models'
import { registerProductosHandlers } from './ipc/productos.handlers'
import { registerUsersHandlers } from './ipc/users.handlers'
import { registerSaleTicketHandlers } from './ipc/saleticket.handlers'
import { registerSuppliersHandlers } from './ipc/suppliers.handlers'
import { registerDepartamentsHandlers } from './ipc/departaments.handlers'
import { registerOperationsHandlers } from './ipc/operations.handlers'

const isDev: boolean = !app.isPackaged

// Register custom scheme before app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'product-img', privileges: { secure: true, bypassCSP: true, stream: true } },
])

// Register all IPC handlers before creating any window
registerProductosHandlers()
registerUsersHandlers()
registerSaleTicketHandlers()
registerSuppliersHandlers()
registerDepartamentsHandlers()
registerOperationsHandlers()

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

    const defaultMenu = Menu.getApplicationMenu()
    const menu = Menu.buildFromTemplate([
        ...(defaultMenu?.items ?? []),
        new MenuItem({
            label: 'Herramientas',
            submenu: Menu.buildFromTemplate([
                {
                    label: 'Herramientas de desarrollo',
                    accelerator: 'F12',
                    click: () => win.webContents.toggleDevTools(),
                },
            ]),
        }),
    ])
    Menu.setApplicationMenu(menu)

    if (isDev) {
        win.loadURL('http://localhost:5173')
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'))
    }
}

app.whenReady().then(() => {
    // Serve product images from {userData}/products/ via custom protocol
    protocol.handle('product-img', (request) => {
        const fileName = path.basename(decodeURIComponent(new URL(request.url).pathname))
        const filePath = path.join(app.getPath('userData'), 'products', fileName)
        return net.fetch(pathToFileURL(filePath).toString())
    })

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
