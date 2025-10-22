import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Building2, Users, DollarSign, Wrench, Megaphone,TrendingUp, LogOut, Home } from 'lucide-react'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/dashboard/properties', icon: Building2, label: 'Properties' },
    { path: '/dashboard/tenants', icon: Users, label: 'Tenants' },
    { path: '/dashboard/payments', icon: DollarSign, label: 'Payments' },
    { path: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance' },
    { path: '/dashboard/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics' }, 

  ]

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-[#1c1c1e] border-r border-[#2c2c2e] flex flex-col">
        <div className="p-6 border-b border-[#2c2c2e]">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            CoLiv OS
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'text-[#98989d] hover:bg-[#2c2c2e]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#2c2c2e]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
