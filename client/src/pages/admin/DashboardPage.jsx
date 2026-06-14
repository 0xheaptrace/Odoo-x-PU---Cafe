import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  DollarSign,
  LayoutGrid,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import DashboardCard from '../../components/common/DashboardCard'
import StatusBadge from '../../components/common/StatusBadge'
import * as bookingService from '../../services/bookingService'
import * as floorService from '../../services/floorService'
import * as orderService from '../../services/orderService'
import * as reportService from '../../services/reportService'
import { formatCurrency, formatDateTime, getId } from '../../utils/helpers'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
]

const METRIC_STYLES = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
}

const formatChartDate = (value) => {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatHour = (hour) => {
  const date = new Date()
  date.setHours(Number(hour), 0, 0, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric' })
}

function MetricCard({ title, value, detail, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className={`rounded-xl p-3 ring-1 ${METRIC_STYLES[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function EmptyPanel({ message }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton mt-4 h-8 w-32 rounded" />
            <div className="skeleton mt-3 h-3 w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('week')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [failedSections, setFailedSections] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dashboard, setDashboard] = useState({
    summary: { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
    salesTrend: [],
    topProducts: [],
    topCategories: [],
    peakHours: [],
    recentOrders: [],
    floors: [],
    bookings: [],
  })

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      setRefreshing(true)

      const requests = [
        ['summary', reportService.getSummary({ period })],
        ['sales trend', reportService.getSalesTrend({ period })],
        ['top products', reportService.getTopProducts({ period })],
        ['top categories', reportService.getTopCategories({ period })],
        ['peak hours', reportService.getPeakHours({ period })],
        ['recent orders', orderService.getAllOrders()],
        ['table status', floorService.getAllFloors()],
        ['bookings', bookingService.getAllBookings()],
      ]

      const results = await Promise.allSettled(requests.map(([, request]) => request))
      if (!active) return

      const failed = []
      const valueAt = (index, fallback) => {
        const result = results[index]
        if (result.status === 'fulfilled') return result.value.data ?? fallback
        failed.push(requests[index][0])
        return fallback
      }

      setDashboard({
        summary: valueAt(0, { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }),
        salesTrend: valueAt(1, []),
        topProducts: valueAt(2, []),
        topCategories: valueAt(3, []),
        peakHours: valueAt(4, []),
        recentOrders: valueAt(5, []).slice(0, 6),
        floors: valueAt(6, []),
        bookings: valueAt(7, []),
      })
      setFailedSections(failed)
      setLastUpdated(new Date())
      setLoading(false)
      setRefreshing(false)
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [period, refreshKey])

  const tableStats = useMemo(() => {
    const tables = dashboard.floors.flatMap((floor) => floor.tables || [])
    const activeTables = tables.filter((table) => table.isActive !== false)
    const occupied = activeTables.filter((table) => table.currentStatus === 'occupied').length
    return {
      total: activeTables.length,
      occupied,
      available: Math.max(0, activeTables.length - occupied),
      utilization: activeTables.length ? Math.round((occupied / activeTables.length) * 100) : 0,
    }
  }, [dashboard.floors])

  const todayBookings = useMemo(() => {
    const today = new Date().toDateString()
    return dashboard.bookings
      .filter(
        (booking) =>
          new Date(booking.date).toDateString() === today &&
          booking.status === 'confirmed',
      )
      .sort((a, b) => String(a.time).localeCompare(String(b.time)))
  }, [dashboard.bookings])

  const periodLabel = PERIODS.find((item) => item.key === period)?.label || 'Selected period'
  const maxProductQuantity = Math.max(
    1,
    ...dashboard.topProducts.map((product) => product.totalQuantity || 0),
  )
  const maxCategoryRevenue = Math.max(
    1,
    ...dashboard.topCategories.map((category) => category.totalRevenue || 0),
  )

  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
            Operations overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            Live sales, service, and floor activity in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPeriod(item.key)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  period === item.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {failedSections.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Some live data could not be loaded: {failedSections.join(', ')}. Available sections
            are still shown.
          </p>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Revenue"
              value={formatCurrency(dashboard.summary.totalRevenue)}
              detail={periodLabel}
              icon={DollarSign}
              color="emerald"
            />
            <MetricCard
              title="Paid Orders"
              value={dashboard.summary.totalOrders ?? 0}
              detail={periodLabel}
              icon={ShoppingBag}
              color="blue"
            />
            <MetricCard
              title="Average Order"
              value={formatCurrency(dashboard.summary.avgOrderValue)}
              detail="Per paid order"
              icon={TrendingUp}
              color="violet"
            />
            <MetricCard
              title="Table Utilization"
              value={`${tableStats.utilization}%`}
              detail={`${tableStats.occupied} of ${tableStats.total} occupied`}
              icon={LayoutGrid}
              color="amber"
            />
            <MetricCard
              title="Today's Bookings"
              value={todayBookings.length}
              detail="Confirmed reservations"
              icon={CalendarDays}
              color="rose"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <DashboardCard
              title="Sales performance"
              subtitle={`${periodLabel} revenue and paid orders`}
              action={
                <Link
                  to="/admin/reports"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Full report <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {dashboard.salesTrend.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.salesTrend} margin={{ top: 8, right: 8, left: 0 }}>
                      <defs>
                        <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={formatChartDate}
                      />
                      <YAxis
                        yAxisId="revenue"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(value) => `$${value}`}
                        width={54}
                      />
                      <YAxis yAxisId="orders" orientation="right" hide />
                      <Tooltip
                        labelFormatter={formatChartDate}
                        formatter={(value, name) =>
                          name === 'Revenue'
                            ? [formatCurrency(value), name]
                            : [value, name]
                        }
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 12px 30px rgb(15 23 42 / 0.08)',
                        }}
                      />
                      <Area
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#2563eb"
                        fill="url(#dashboardRevenue)"
                        strokeWidth={2.5}
                      />
                      <Bar
                        yAxisId="orders"
                        dataKey="orders"
                        name="Orders"
                        fill="#cbd5e1"
                        radius={[4, 4, 0, 0]}
                        barSize={12}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel message="No paid-order sales data is available for this period." />
              )}
            </DashboardCard>

            <DashboardCard title="Peak service hours" subtitle={`Order volume for ${periodLabel.toLowerCase()}`}>
              {dashboard.peakHours.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.peakHours} margin={{ top: 8, right: 4, left: -24 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={formatHour}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        labelFormatter={(hour) => formatHour(hour)}
                        formatter={(value) => [value, 'Orders']}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Bar dataKey="orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel message="Peak-hour activity will appear after paid orders are recorded." />
              )}
            </DashboardCard>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <DashboardCard
              title="Recent orders"
              subtitle="Latest activity across the dining floor"
              action={
                <Link
                  to="/pos/orders"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {dashboard.recentOrders.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                        <th className="pb-3 font-semibold">Order</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Time</th>
                        <th className="pb-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dashboard.recentOrders.map((order) => (
                        <tr key={getId(order)}>
                          <td className="py-3.5 font-semibold text-slate-900">
                            {order.orderNumber || 'Unnumbered'}
                          </td>
                          <td className="py-3.5 text-slate-600">
                            {order.customer?.name || 'Walk-in'}
                          </td>
                          <td className="py-3.5">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-3.5 text-slate-500">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="py-3.5 text-right font-semibold text-slate-900">
                            {formatCurrency(order.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyPanel message="No orders have been created yet." />
              )}
            </DashboardCard>

            <DashboardCard
              title="Floor status"
              subtitle={`${tableStats.available} tables currently available`}
              action={
                <Link
                  to="/admin/floors"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {dashboard.floors.length ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xl font-bold text-slate-900">{tableStats.total}</p>
                      <p className="mt-1 text-xs text-slate-500">Total</p>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-3 text-center">
                      <p className="text-xl font-bold text-rose-600">{tableStats.occupied}</p>
                      <p className="mt-1 text-xs text-rose-500">Occupied</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{tableStats.available}</p>
                      <p className="mt-1 text-xs text-emerald-500">Available</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {dashboard.floors.map((floor) => {
                      const tables = (floor.tables || []).filter((table) => table.isActive !== false)
                      const occupied = tables.filter(
                        (table) => table.currentStatus === 'occupied',
                      ).length
                      const percentage = tables.length
                        ? Math.round((occupied / tables.length) * 100)
                        : 0

                      return (
                        <div key={getId(floor)}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{floor.name}</span>
                            <span className="text-xs text-slate-400">
                              {occupied}/{tables.length} occupied
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyPanel message="No floors or tables have been configured." />
              )}
            </DashboardCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Top products" subtitle={`Best sellers for ${periodLabel.toLowerCase()}`}>
              {dashboard.topProducts.length ? (
                <div className="space-y-4">
                  {dashboard.topProducts.map((product, index) => (
                    <div key={getId(product) || product.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600">
                            {index + 1}
                          </span>
                          <span className="truncate font-medium text-slate-700">{product.name}</span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                          {product.totalQuantity} sold
                        </span>
                      </div>
                      <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{
                            width: `${((product.totalQuantity || 0) / maxProductQuantity) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="Product rankings will appear after paid orders." />
              )}
            </DashboardCard>

            <DashboardCard title="Top categories" subtitle="Ranked by revenue">
              {dashboard.topCategories.length ? (
                <div className="space-y-4">
                  {dashboard.topCategories.map((category, index) => (
                    <div key={getId(category) || category.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">
                            {index + 1}
                          </span>
                          <span className="truncate font-medium text-slate-700">{category.name}</span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                          {formatCurrency(category.totalRevenue)}
                        </span>
                      </div>
                      <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{
                            width: `${((category.totalRevenue || 0) / maxCategoryRevenue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="Category rankings will appear after paid orders." />
              )}
            </DashboardCard>

            <DashboardCard
              title="Today's bookings"
              subtitle="Confirmed arrivals"
              action={
                <Link
                  to="/admin/bookings"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {todayBookings.length ? (
                <div className="space-y-3">
                  {todayBookings.slice(0, 5).map((booking) => (
                    <div
                      key={getId(booking)}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {booking.customer?.name || 'Guest'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Users className="h-3 w-3" />
                          {booking.numberOfGuests} guests, Table{' '}
                          {booking.table?.tableNumber || '-'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{booking.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="There are no confirmed bookings for today." />
              )}
            </DashboardCard>
          </div>
        </>
      )}

      {lastUpdated && (
        <p className="mt-5 text-right text-xs text-slate-400">
          Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </AdminLayout>
  )
}
