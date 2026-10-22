import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 0px)' }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-5 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
