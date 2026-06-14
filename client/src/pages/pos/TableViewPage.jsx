import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CreditCard, RefreshCw, Users } from 'lucide-react'
import POSLayout from '../../components/pos/POSLayout'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { GridSkeleton } from '../../components/common/LoadingSkeleton'
import Button from '../../components/common/Button'
import * as floorService from '../../services/floorService'
import * as bookingService from '../../services/bookingService'
import * as orderService from '../../services/orderService'
import { useRealtimeUpdates } from '../../hooks/useSocket'
import { getId } from '../../utils/helpers'
import { TABLE_STATUS } from '../../constants'

const TABLE_STATUSES = [
  TABLE_STATUS.AVAILABLE,
  TABLE_STATUS.RESERVED,
  TABLE_STATUS.OCCUPIED,
  TABLE_STATUS.CLEANING,
]

export default function TableViewPage() {
  const navigate = useNavigate()
  const [floors, setFloors] = useState([])
  const [bookings, setBookings] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFloor, setActiveFloor] = useState(null)
  const realtime = useRealtimeUpdates()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const offTable = realtime.on('table_updated', loadData)
    const offOrder = realtime.on('order_updated', loadData)
    const offPayment = realtime.on('payment_updated', loadData)
    const offBooking = realtime.on('booking_updated', loadData)
    return () => {
      offTable?.()
      offOrder?.()
      offPayment?.()
      offBooking?.()
    }
  }, [realtime])

  const loadData = async () => {
    setLoading(true)
    try {
      const [fRes, bRes, oRes] = await Promise.allSettled([
        floorService.getAllFloors(),
        bookingService.getAllBookings(),
        orderService.getAllOrders({ active: true }),
      ])
      const floorData = fRes.status === 'fulfilled' ? fRes.value.data || [] : []
      setFloors(floorData)
      setActiveFloor(getId(floorData[0]))
      if (bRes.status === 'fulfilled') setBookings(bRes.value.data || [])
      if (oRes.status === 'fulfilled') setOrders(oRes.value.data || [])
    } finally {
      setLoading(false)
    }
  }

  const currentFloor = floors.find((f) => getId(f) === activeFloor) || floors[0]

  const getTableStatus = (table) => {
    if (table.currentStatus && table.currentStatus !== 'available') return table.currentStatus
    const today = new Date().toDateString()
    const reserved = bookings.some(
      (b) =>
        getId(b.table) === getId(table) &&
        new Date(b.date).toDateString() === today &&
        b.status === 'confirmed',
    )
    if (reserved) return 'reserved'
    return table.currentStatus || 'available'
  }

  const tableStyle = (status) => {
    const styles = {
      available: 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-100',
      occupied: 'border-rose-400 bg-gradient-to-br from-rose-50 to-white shadow-rose-100',
      reserved: 'border-purple-400 bg-gradient-to-br from-purple-50 to-white shadow-purple-100',
      cleaning: 'border-sky-400 bg-gradient-to-br from-sky-50 to-white shadow-sky-100',
    }
    return styles[status] || styles.available
  }

  const activeOrderForTable = (table) =>
    orders.find((order) => getId(order.table) === getId(table) || order.table === getId(table))

  const updateTableStatus = async (table, status) => {
    try {
      await floorService.updateTable(getId(table), { currentStatus: status })
      toast.success(`Table ${table.tableNumber} marked ${status}`)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update table')
    }
  }

  return (
    <POSLayout>
      <PageHeader title="Floor & Table View" subtitle="Live table status across all floors" />

      {loading ? (
        <GridSkeleton count={6} />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {floors.map((floor) => (
              <button
                key={getId(floor)}
                type="button"
                onClick={() => setActiveFloor(getId(floor))}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  getId(currentFloor) === getId(floor)
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>

          {currentFloor ? (
            <div className="card p-6">
              <h2 className="mb-6 text-lg font-semibold text-slate-800">{currentFloor.name}</h2>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {(currentFloor.tables || []).map((table) => {
                  const status = getTableStatus(table)
                  const activeOrder = activeOrderForTable(table)
                  return (
                    <div
                      key={getId(table)}
                      className={`rounded-2xl border-2 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${tableStyle(status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-slate-900">
                          {table.tableNumber}
                        </span>
                        <StatusBadge status={status} />
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="h-4 w-4" />
                        {table.seats} seats
                      </div>
                      {activeOrder && (
                        <button
                          type="button"
                          onClick={() => navigate(`/pos?table=${getId(table)}`)}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Reopen bill
                        </button>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {TABLE_STATUSES.map((nextStatus) => (
                          <button
                            key={nextStatus}
                            type="button"
                            onClick={() => updateTableStatus(table, nextStatus)}
                            className="rounded-lg border border-white/70 bg-white/80 px-2 py-1.5 text-[11px] font-semibold capitalize text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                          >
                            {nextStatus}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              {!(currentFloor.tables?.length) && (
                <p className="py-12 text-center text-slate-500">No tables configured for this floor</p>
              )}
            </div>
          ) : (
            <p className="py-16 text-center text-slate-500">No floors configured yet</p>
          )}

          <div className="mt-6 flex flex-wrap gap-4">
            {TABLE_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <StatusBadge status={s} />
              </div>
            ))}
            <Button variant="secondary" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
              Refresh live status
            </Button>
          </div>
        </>
      )}
    </POSLayout>
  )
}
