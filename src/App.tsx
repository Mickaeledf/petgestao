import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { PetsPage } from '@/pages/pets/PetsPage'
import { ServicesPage } from '@/pages/services/ServicesPage'
import { ProfessionalsPage } from '@/pages/professionals/ProfessionalsPage'
import { SchedulePage } from '@/pages/schedule/SchedulePage'
import { SalesPage } from '@/pages/sales/SalesPage'
import { PDVPage } from '@/pages/sales/PDVPage'
import { StockPage } from '@/pages/stock/StockPage'
import { CashRegisterPage } from '@/pages/cash-register/CashRegisterPage'
import { FinancialPage } from '@/pages/financial/FinancialPage'
import { PurchasesPage } from '@/pages/purchases/PurchasesPage'
import { SuppliersPage } from '@/pages/suppliers/SuppliersPage'
import { ServiceOrdersPage } from '@/pages/service-orders/ServiceOrdersPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { LicensePage } from '@/pages/license/LicensePage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, currentEstablishment, memberships } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!currentEstablishment && memberships.length === 0) {
    return <OnboardingPage />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      <Route path="/pdv" element={<ProtectedRoute><PDVPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="pets" element={<PetsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="professionals" element={<ProfessionalsPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="service-orders" element={<ServiceOrdersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="cash-register" element={<CashRegisterPage />} />
        <Route path="financial" element={<FinancialPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="license" element={<LicensePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
