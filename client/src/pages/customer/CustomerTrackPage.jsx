import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Calendar, Eye, PackageCheck, ReceiptText } from 'lucide-react'
import CustomerLayout from '../../components/customer/CustomerLayout'
import DataTable from '../../components/common/DataTable'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import * as bookingService from '../../services/bookingService'
import * as orderService from '../../services/orderService'
import { useRealtimeUpdates } from '../../hooks/useSocket'
import { formatCurrency, formatDate, formatDateTime, getId } from '../../utils/helpers'

const TRACKING_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'served', label: 'Served' },
  { key: 'completed', label: 'Completed' },
]

const getOrderTrackingStatus = (order) => {
  if (order.status && !['draft', 'paid'].includes(order.status)) return order.status
  if (order.status === 'paid') return 'completed'
  const itemStatuses = (order.items || []).map((item) => item.kitchenStatus)
  if (itemStatuses.length && itemStatuses.every((status) => status === 'completed')) return 'ready'
  if (itemStatuses.includes('preparing')) return 'preparing'
  return 'pending'
}

function OrderProgress({ status }) {
  const currentIndex = Math.max(
    0,
    TRACKING_STEPS.findIndex((step) => step.key === status),
  )

  return (
    <div className="min-w-[320px]">
      <div className="flex items-center">
        {TRACKING_STEPS.map((step, index) => {
          const done = index <= currentIndex
          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {index + 1}
              </div>
              {index < TRACKING_STEPS.length - 1 && (
                <div className={`h-1 flex-1 ${index < currentIndex ? 'bg-brand-600' : 'bg-slate-100'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-[11px] font-medium text-slate-500">
        {TRACKING_STEPS.map((step, index) => (
          <span key={step.key} className={index <= currentIndex ? 'text-brand-700' : undefined}>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function OrderDetailsModal({ order, onClose }) {
  const items = order?.items || []

  return (
    <Modal isOpen={!!order} onClose={onClose} title={order ? `Order ${order.orderNumber}` : 'Order Details'} size="lg">
      {order && (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Date</p>
              <p className="mt-1 font-medium text-slate-800">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Payment</p>
              <p className="mt-1 font-medium text-slate-800">{order.paymentMethod || 'Pending'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Total Bill</p>
              <p className="mt-1 font-bold text-slate-900">{formatCurrency(order.total)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={getId(item)}>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function CustomerTrackPage() {
  const [bookings, setBookings] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const realtime = useRealtimeUpdates()

  const loadTrackingData = async () => {
    setLoading(true)
    try {
      const [bookingRes, orderRes] = await Promise.all([
        bookingService.getAllBookings(),
        orderService.getAllOrders(),
      ])
      setBookings(bookingRes.data || [])
      setOrders(orderRes.data || [])
    } catch {
      toast.error('Failed to load your tracking data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadTrackingData, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const offOrder = realtime.on('order_updated', loadTrackingData)
    const offPayment = realtime.on('payment_updated', loadTrackingData)
    const offBooking = realtime.on('booking_updated', loadTrackingData)
    return () => {
      offOrder?.()
      offPayment?.()
      offBooking?.()
    }
  }, [realtime])

  const orderRows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        trackingStatus: getOrderTrackingStatus(order),
      })),
    [orders],
  )

  const bookingColumns = [
    {
      key: 'date',
      label: 'Date & Time',
      render: (r) => (
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          {formatDate(r.date)} - {r.time}
        </span>
      ),
    },
    {
      key: 'table',
      label: 'Table',
      render: (r) => `Table ${r.table?.tableNumber || '-'} (${r.floor?.name || '-'})`,
    },
    { key: 'guests', label: 'Guests', render: (r) => r.numberOfGuests },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'email',
      label: 'Confirmation',
      render: (r) => (r.confirmationEmailSent ? 'Email sent' : 'Pending'),
    },
  ]

  const orderColumns = [
    {
      key: 'orderNumber',
      label: 'Order Number',
      render: (r) => <span className="font-semibold text-slate-900">{r.orderNumber}</span>,
    },
    { key: 'createdAt', label: 'Order Date', render: (r) => formatDateTime(r.createdAt) },
    {
      key: 'items',
      label: 'Items Ordered',
      render: (r) => (
        <div className="min-w-[180px]">
          <p className="font-medium text-slate-800">
            {(r.items || []).map((item) => item.name).join(', ') || '-'}
          </p>
          <p className="text-xs text-slate-500">
            {(r.items || []).length} item{(r.items || []).length === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (r) => (r.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
    },
    { key: 'total', label: 'Total Amount', render: (r) => formatCurrency(r.total) },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      render: (r) => <StatusBadge status={r.paymentStatus || (r.status === 'paid' ? 'paid' : 'unpaid')} />,
    },
    {
      key: 'orderStatus',
      label: 'Order Status',
      render: (r) => (
        <div className="space-y-2">
          <StatusBadge status={r.trackingStatus} />
          <OrderProgress status={r.trackingStatus} />
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Details',
      render: (r) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setSelectedOrder(r)
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      ),
    },
  ]

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Track your orders, payments, and reservations</p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} cols={5} />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">My Orders</h2>
            </div>
            <DataTable
              columns={orderColumns}
              data={orderRows}
              onRowClick={setSelectedOrder}
              emptyMessage="You have no orders yet"
            />
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">My Bookings</h2>
            </div>
            <DataTable columns={bookingColumns} data={bookings} emptyMessage="You have no bookings yet" />
          </section>
        </div>
      )}

      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </CustomerLayout>
  )
}
