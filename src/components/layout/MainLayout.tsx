import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60 transition-all duration-300">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
