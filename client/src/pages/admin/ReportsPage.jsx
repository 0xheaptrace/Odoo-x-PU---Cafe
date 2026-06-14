import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, FileSpreadsheet } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import DashboardCard from '../../components/common/DashboardCard'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import { CardSkeleton } from '../../components/common/LoadingSkeleton'
import * as reportService from '../../services/reportService'
import { formatCurrency, DEMO_SUMMARY, DEMO_SALES_TREND } from '../../utils/helpers'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [salesTrend, setSalesTrend] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topCategories, setTopCategories] = useState([])

  useEffect(() => {
    loadReports()
  }, [period, customFrom, customTo])

  const getFilters = () => {
    if (customFrom || customTo) return { from: customFrom, to: customTo }
    return { period }
  }

  const loadReports = async () => {
    setLoading(true)
    const filters = getFilters()
    try {
      const [sRes, tRes, pRes, cRes] = await Promise.allSettled([
        reportService.getSummary(filters),
        reportService.getSalesTrend(filters),
        reportService.getTopProducts(filters),
        reportService.getTopCategories(filters),
      ])
      setSummary(sRes.status === 'fulfilled' ? sRes.value.data : DEMO_SUMMARY)
      setSalesTrend(tRes.status === 'fulfilled' && tRes.value.data?.length ? tRes.value.data : DEMO_SALES_TREND)
      setTopProducts(pRes.status === 'fulfilled' ? pRes.value.data || [] : [])
      setTopCategories(cRes.status === 'fulfilled' ? cRes.value.data || [] : [])
    } catch {
      setSummary(DEMO_SUMMARY)
      setSalesTrend(DEMO_SALES_TREND)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => toast.success('PDF export — demo UI ready')
  const handleExportXLS = () => toast.success('Excel export — demo UI ready')

  return (
    <AdminLayout>
      <PageHeader title="Reports & Analytics" subtitle="Executive insights for Folk & Forks">
        <Button variant="secondary" onClick={handleExportPDF}>
          <FileText className="h-4 w-4" /> PDF
        </Button>
        <Button variant="secondary" onClick={handleExportXLS}>
          <FileSpreadsheet className="h-4 w-4" /> XLS
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => { setPeriod(p.key); setCustomFrom(''); setCustomTo('') }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              period === p.key && !customFrom ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-slate-300">|</span>
        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <span className="text-slate-400">to</span>
        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue)} color="green" />
          <StatCard title="Total Orders" value={summary?.totalOrders ?? 0} color="brand" />
          <StatCard title="Avg Order Value" value={formatCurrency(summary?.avgOrderValue)} color="purple" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Revenue Chart">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb20" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        <DashboardCard title="Orders Chart">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Top Products">
          {topProducts.length ? topProducts.map((p, i) => (
            <div key={i} className="flex justify-between border-b border-slate-50 py-3 last:border-0">
              <span className="font-medium text-slate-800">{p.name}</span>
              <span className="text-sm text-slate-500">{p.totalQuantity} sold · {formatCurrency(p.totalRevenue)}</span>
            </div>
          )) : <p className="py-8 text-center text-sm text-slate-500">No data for this period</p>}
        </DashboardCard>
        <DashboardCard title="Top Categories">
          {topCategories.length ? topCategories.map((c, i) => (
            <div key={i} className="flex justify-between border-b border-slate-50 py-3 last:border-0">
              <span className="font-medium text-slate-800">{c.name}</span>
              <span className="text-sm font-medium text-slate-700">{formatCurrency(c.totalRevenue)}</span>
            </div>
          )) : <p className="py-8 text-center text-sm text-slate-500">No data for this period</p>}
        </DashboardCard>
      </div>
    </AdminLayout>
  )
}
