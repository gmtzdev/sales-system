import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import VentasNueva from './pages/VentasNueva'
import VentasHistorial from './pages/VentasHistorial'
import Inventory from './pages/sales/Inventory'
import Suppliers from './pages/admin/Suppliers'

function App() {
    return (
        <AuthProvider>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Login />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/sales"
                        element={
                            <ProtectedRoute>
                                <Ventas />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <Navigate to="index" replace />
                            }
                        />

                        <Route
                            path="index"
                            element={<VentasNueva />}
                        />

                        <Route
                            path="historial"
                            element={<VentasHistorial />}
                        />

                        <Route
                            path='inventory'
                            element={<Inventory />}
                        />
                    </Route>

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <Suppliers />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="suppliers" element={<Suppliers />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </HashRouter>
        </AuthProvider>
    )
}

export default App
