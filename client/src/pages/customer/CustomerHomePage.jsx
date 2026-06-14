import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  MapPin,
  ReceiptText,
  Sparkles,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import CustomerLayout from '../../components/customer/CustomerLayout'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import * as bookingService from '../../services/bookingService'
import * as categoryService from '../../services/categoryService'
import * as floorService from '../../services/floorService'
import * as orderService from '../../services/orderService'
import * as productService from '../../services/productService'
import {
  formatCurrency,
  formatDate,
  getCategoryId,
  getId,
} from '../../utils/helpers'

const getBookingTimestamp = (booking) => {
  if (!booking?.date) return 0
  const date = new Date(booking.date)
  const [hours = 0, minutes = 0] = String(booking.time || '00:00')
    .split(':')
    .map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date.getTime()
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-64 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, detail, color }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 ${styles[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
          <p className="truncate text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, link, linkLabel }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {link && (
        <Link
          to={link}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default function CustomerHomePage() {
  const { user } = useAuth()
  const [currentTimestamp] = useState(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [failedSections, setFailedSections] = useState([])
  const [dashboard, setDashboard] = useState({
    bookings: [],
    orders: [],
    products: [],
    categories: [],
    floors: [],
  })

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      const requests = [
        ['bookings', bookingService.getAllBookings()],
        ['orders', orderService.getAllOrders()],
        ['menu', productService.getAllProducts()],
        ['categories', categoryService.getAllCategories()],
        ['tables', floorService.getAllFloors()],
      ]
      const results = await Promise.allSettled(requests.map(([, request]) => request))
      if (!active) return

      const failed = []
      const valueAt = (index) => {
        const result = results[index]
        if (result.status === 'fulfilled') return result.value.data || []
        failed.push(requests[index][0])
        return []
      }

      setDashboard({
        bookings: valueAt(0),
        orders: valueAt(1),
        products: valueAt(2).filter((product) => product.isActive !== false),
        categories: valueAt(3),
        floors: valueAt(4),
      })
      setFailedSections(failed)
      setLoading(false)
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const bookingSummary = useMemo(() => {
    const upcoming = dashboard.bookings
      .filter(
        (booking) =>
          booking.status === 'confirmed' &&
          getBookingTimestamp(booking) >= currentTimestamp,
      )
      .sort((a, b) => getBookingTimestamp(a) - getBookingTimestamp(b))

    return {
      upcoming,
      next: upcoming[0] || null,
      completed: dashboard.bookings.filter((booking) => booking.status === 'completed').length,
    }
  }, [currentTimestamp, dashboard.bookings])

  const tableSummary = useMemo(() => {
    const tables = dashboard.floors
      .flatMap((floor) => floor.tables || [])
      .filter((table) => table.isActive !== false)
    const available = tables.filter((table) => table.currentStatus === 'available').length
    return { total: tables.length, available }
  }, [dashboard.floors])

  const orderSummary = useMemo(() => {
    const sorted = [...dashboard.orders].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    )
    const active = sorted.filter(
      (order) => (order.paymentStatus || (order.status === 'paid' ? 'paid' : 'unpaid')) !== 'paid' && order.status !== 'cancelled',
    )
    return {
      recent: sorted.slice(0, 3),
      active,
      paid: sorted.filter((order) => (order.paymentStatus || (order.status === 'paid' ? 'paid' : 'unpaid')) === 'paid').length,
    }
  }, [dashboard.orders])

  const featuredProducts = useMemo(() => dashboard.products.slice(0, 4), [dashboard.products])

  const categoryById = useMemo(
    () =>
      new Map(dashboard.categories.map((category) => [getId(category), category])),
    [dashboard.categories],
  )

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  if (loading) {
    return (
      <CustomerLayout>
        <DashboardSkeleton />
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      {failedSections.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Some dashboard data could not be loaded: {failedSections.join(', ')}. Available
            sections are still shown.
          </p>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-blue-200">
              <Sparkles className="h-4 w-4" />
              {today}
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {user?.name?.split(' ')[0] || 'Guest'}.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Discover something delicious, reserve your favorite table, and keep every visit
              organized from your dashboard.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/customer/booking"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-blue-50"
              >
                <CalendarDays className="h-4 w-4" />
                Book a table
              </Link>
              <Link
                to="/customer/menu"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Explore menu
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            {bookingSummary.next ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                    Next reservation
                  </p>
                  <StatusBadge status={bookingSummary.next.status} />
                </div>
                <p className="mt-4 text-2xl font-bold">
                  {formatDate(bookingSummary.next.date)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="flex items-center gap-1.5 text-slate-300">
                      <Clock3 className="h-3.5 w-3.5" /> Time
                    </p>
                    <p className="mt-1 font-semibold">{bookingSummary.next.time}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="flex items-center gap-1.5 text-slate-300">
                      <Users className="h-3.5 w-3.5" /> Guests
                    </p>
                    <p className="mt-1 font-semibold">
                      {bookingSummary.next.numberOfGuests}
                    </p>
                  </div>
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="h-4 w-4" />
                  Table {bookingSummary.next.table?.tableNumber || '-'} on{' '}
                  {bookingSummary.next.floor?.name || 'the selected floor'}
                </p>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <CalendarDays className="h-6 w-6 text-blue-200" />
                </div>
                <p className="mt-4 font-semibold">No upcoming reservation</p>
                <p className="mt-1 text-sm text-slate-300">
                  Choose a table and plan your next visit.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          icon={CalendarDays}
          label="Upcoming"
          value={bookingSummary.upcoming.length}
          detail="Confirmed bookings"
          color="blue"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Visits"
          value={bookingSummary.completed}
          detail="Completed reservations"
          color="emerald"
        />
        <SummaryCard
          icon={LayoutGrid}
          label="Available Tables"
          value={tableSummary.available}
          detail={`${tableSummary.total} active tables`}
          color="violet"
        />
        <SummaryCard
          icon={ReceiptText}
          label="My Orders"
          value={dashboard.orders.length}
          detail={`${orderSummary.active.length} in progress`}
          color="emerald"
        />
        <SummaryCard
          icon={UtensilsCrossed}
          label="Menu Items"
          value={dashboard.products.length}
          detail={`${dashboard.categories.length} categories`}
          color="orange"
        />
      </section>

      <section className="mt-8">
        <SectionHeader
          title="My Orders"
          subtitle="Recent orders and payment status"
          link="/customer/track"
          linkLabel="View all"
        />
        {orderSummary.recent.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {orderSummary.recent.map((order) => {
              const itemCount = (order.items || []).reduce(
                (sum, item) => sum + (item.quantity || 0),
                0,
              )

              return (
                <Link
                  key={getId(order)}
                  to="/customer/track"
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {order.orderNumber}
                      </p>
                      <h3 className="mt-1 font-bold text-slate-900">
                        {formatCurrency(order.total)}
                      </h3>
                    </div>
                    <StatusBadge status={order.paymentStatus || (order.status === 'paid' ? 'paid' : 'unpaid')} />
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    {itemCount} item{itemCount === 1 ? '' : 's'} ordered on{' '}
                    {formatDate(order.createdAt)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">Order status</span>
                    <StatusBadge status={order.status === 'draft' ? 'pending' : order.status || 'pending'} />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
            Your orders will appear here after staff assign an order to your profile.
          </div>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader
          title="Popular on the menu"
          subtitle="A quick look at what is currently available"
          link="/customer/menu"
          linkLabel="View menu"
        />
        {featuredProducts.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => {
              const category =
                product.category || categoryById.get(getCategoryId(product))
              return (
                <Link
                  key={getId(product)}
                  to="/customer/menu"
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="flex h-28 items-center justify-center"
                    style={{ backgroundColor: `${category?.color || '#f97316'}18` }}
                  >
                    <UtensilsCrossed
                      className="h-9 w-9 transition group-hover:scale-110"
                      style={{ color: category?.color || '#f97316' }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {category?.name || 'Menu'}
                    </p>
                    <h3 className="mt-1 truncate font-semibold text-slate-900 group-hover:text-brand-600">
                      {product.name}
                    </h3>
                    <p className="mt-3 font-bold text-brand-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
            The menu is being prepared. Check back soon.
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            title="Upcoming bookings"
            subtitle="Your confirmed reservations"
            link="/customer/track"
            linkLabel="View all"
          />
          {bookingSummary.upcoming.length ? (
            <div className="space-y-3">
              {bookingSummary.upcoming.slice(0, 3).map((booking) => (
                <div
                  key={getId(booking)}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{formatDate(booking.date)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.time} · Table {booking.table?.tableNumber || '-'} ·{' '}
                      {booking.numberOfGuests} guests
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 py-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">Nothing booked yet</p>
              <Link
                to="/customer/booking"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
              >
                Reserve a table <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader title="Dining room availability" subtitle="Live active-table overview" />
          {dashboard.floors.length ? (
            <div className="space-y-4">
              {dashboard.floors.map((floor) => {
                const activeTables = (floor.tables || []).filter(
                  (table) => table.isActive !== false,
                )
                const available = activeTables.filter(
                  (table) => table.currentStatus === 'available',
                ).length
                const percentage = activeTables.length
                  ? Math.round((available / activeTables.length) * 100)
                  : 0

                return (
                  <div key={getId(floor)}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{floor.name}</span>
                      <span className="text-xs text-slate-500">
                        {available} of {activeTables.length} available
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <Link
                to="/customer/booking"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Choose your table
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">
              Table availability is not configured yet.
            </div>
          )}
        </div>
      </section>
    </CustomerLayout>
  )
}
