import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import POSLayout from '../../components/pos/POSLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Button from '../../components/common/Button'
import * as orderService from '../../services/orderService'
import { formatCurrency, formatDateTime, getId } from '../../utils/helpers'
import { ORDER_STATUS } from '../../constants'

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [statusFilter, dateFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (dateFilter) filters.date = dateFilter
      const res = await orderService.getAllOrders(filters)
      setOrders(res.data || [])
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async () => {
    try {
      await orderService.deleteOrder(deleteId)
      toast.success('Order deleted')
      setDeleteId(null)
      loadOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (r) => <span className="font-medium">{r.orderNumber}</span> },
    { key: 'customer', label: 'Customer', render: (r) => r.customer?.name || 'Walk-in' },
    { key: 'total', label: 'Amount', render: (r) => formatCurrency(r.total) },
    { key: 'status', label: 'Order Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'paymentStatus', label: 'Payment', render: (r) => <StatusBadge status={r.paymentStatus || (r.status === 'paid' ? 'paid' : 'unpaid')} /> },
    { key: 'date', label: 'Date', render: (r) => formatDateTime(r.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewOrder(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600">
            <Eye className="h-4 w-4" />
          </button>
          {r.paymentStatus !== 'paid' && !['completed', 'cancelled', 'paid'].includes(r.status) && (
            <>
              <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setDeleteId(getId(r))} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <POSLayout>
      <PageHeader title="Order History" subtitle="View and manage all orders" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={search} onChange={setSearch} placeholder="Search order or customer..." className="flex-1" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" />
      </div>

      {loading ? <LoadingSkeleton rows={8} cols={6} /> : <DataTable columns={columns} data={filtered} emptyMessage="No orders found" />}

      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.orderNumber}`} size="lg">
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Customer</span><p className="font-medium">{viewOrder.customer?.name || 'Walk-in'}</p></div>
              <div><span className="text-slate-500">Status</span><p><StatusBadge status={viewOrder.status} /></p></div>
              <div><span className="text-slate-500">Payment</span><p><StatusBadge status={viewOrder.paymentStatus || 'unpaid'} /></p></div>
              <div><span className="text-slate-500">Date</span><p className="font-medium">{formatDateTime(viewOrder.createdAt)}</p></div>
              <div><span className="text-slate-500">Total</span><p className="font-bold text-brand-600">{formatCurrency(viewOrder.total)}</p></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Items</p>
              {(viewOrder.items || []).map((item, i) => (
                <div key={i} className="flex justify-between py-2 text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <Button fullWidth onClick={() => setViewOrder(null)}>Close</Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} message="Delete this draft order?" />
    </POSLayout>
  )
}
