import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/Toast'
import { MainLayout } from '@/components/layout/MainLayout'
import { RequirePermission } from '@/components/auth/RequirePermission'
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
import { MessagesPage } from '@/pages/messages/MessagesPage'
import { SupportPage } from '@/pages/support/SupportPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { AccessDeniedPage } from '@/pages/auth/AccessDeniedPage'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, currentEstablishment, memberships } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Carregando seus dados…</p>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Carregando…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const denied = <AccessDeniedPage />

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      <Route path="/pdv" element={<ProtectedRoute><RequirePermission module="pdv" fallback={denied}><PDVPage /></RequirePermission></ProtectedRoute>} />
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<RequirePermission module="dashboard" fallback={denied}><DashboardPage /></RequirePermission>} />
        <Route path="products" element={<RequirePermission module="products" fallback={denied}><ProductsPage /></RequirePermission>} />
        <Route path="stock" element={<RequirePermission module="stock" fallback={denied}><StockPage /></RequirePermission>} />
        <Route path="customers" element={<RequirePermission module="customers" fallback={denied}><CustomersPage /></RequirePermission>} />
        <Route path="pets" element={<RequirePermission module="pets" fallback={denied}><PetsPage /></RequirePermission>} />
        <Route path="services" element={<RequirePermission module="services" fallback={denied}><ServicesPage /></RequirePermission>} />
        <Route path="professionals" element={<RequirePermission module="professionals" fallback={denied}><ProfessionalsPage /></RequirePermission>} />
        <Route path="schedule" element={<RequirePermission module="schedule" fallback={denied}><SchedulePage /></RequirePermission>} />
        <Route path="service-orders" element={<RequirePermission module="service_orders" fallback={denied}><ServiceOrdersPage /></RequirePermission>} />
        <Route path="sales" element={<RequirePermission module="sales" fallback={denied}><SalesPage /></RequirePermission>} />
        <Route path="cash-register" element={<RequirePermission module="cash_register" fallback={denied}><CashRegisterPage /></RequirePermission>} />
        <Route path="financial" element={<RequirePermission module="financial" fallback={denied}><FinancialPage /></RequirePermission>} />
        <Route path="purchases" element={<RequirePermission module="purchases" fallback={denied}><PurchasesPage /></RequirePermission>} />
        <Route path="suppliers" element={<RequirePermission module="suppliers" fallback={denied}><SuppliersPage /></RequirePermission>} />
        <Route path="reports" element={<RequirePermission module="reports" fallback={denied}><ReportsPage /></RequirePermission>} />
        <Route path="users" element={<RequirePermission module="users" fallback={denied}><UsersPage /></RequirePermission>} />
        <Route path="settings" element={<RequirePermission module="settings" fallback={denied}><SettingsPage /></RequirePermission>} />
        <Route path="license" element={<RequirePermission module="license" fallback={denied}><LicensePage /></RequirePermission>} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="support" element={<SupportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
