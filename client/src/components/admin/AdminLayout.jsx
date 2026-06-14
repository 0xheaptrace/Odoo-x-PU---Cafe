import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  CreditCard,
  Ticket,
  Megaphone,
  Users,
  BarChart3,
  Calendar,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import BrandMark from '../common/BrandMark'
import ThemeToggle from '../common/ThemeToggle'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Tags, label: 'Categories' },
  { to: '/admin/floors', icon: Layers, label: 'Floors & Tables' },
  { to: '/admin/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/admin/promotions', icon: Megaphone, label: 'Promotions' },
  { to: '/admin/payment-methods', icon: CreditCard, label: 'Payment Methods' },
  { to: '/admin/users', icon: Users, label: 'Employees' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <BrandMark showTagline={false} />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3">
            <ThemeToggle />
          </div>
          <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  )
}
