import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Calendar,
  ReceiptText,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import BrandMark from '../common/BrandMark'
import ThemeToggle from '../common/ThemeToggle'

const navItems = [
  { to: '/customer/home', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customer/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/customer/booking', icon: Calendar, label: 'Book a Table' },
  { to: '/customer/track', icon: ReceiptText, label: 'My Orders' },
]

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-6">
            <BrandMark showTagline={false} />
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="hidden text-sm text-slate-500 dark:text-slate-300 sm:block">Hi, {user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-8">{children}</main>
    </div>
  )
}
