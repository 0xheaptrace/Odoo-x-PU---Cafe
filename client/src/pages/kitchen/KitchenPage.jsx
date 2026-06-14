import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { ChefHat, Wifi, WifiOff, ArrowRight, Search } from 'lucide-react'
import SearchBar from '../../components/common/SearchBar'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/common/EmptyState'
import { useKitchenSocket } from '../../hooks/useSocket'
import * as orderService from '../../services/orderService'
import { KITCHEN_STATUS } from '../../constants'
import { BRAND_NAME } from '../../constants/brand'
import { getId } from '../../utils/helpers'

const COLUMNS = [
  { key: KITCHEN_STATUS.TO_COOK, label: 'To Cook', color: 'border-orange-400 bg-orange-50' },
  { key: KITCHEN_STATUS.PREPARING, label: 'Preparing', color: 'border-blue-400 bg-blue-50' },
  { key: KITCHEN_STATUS.COMPLETED, label: 'Completed', color: 'border-emerald-400 bg-emerald-50' },
]

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { connected, on, emit } = useKitchenSocket()

  const loadOrders = useCallback(async () => {
    try {
      const res = await orderService.getAllOrders()
      const kitchenOrders = (res.data || []).filter((o) =>
        o.items?.some((i) => i.sentToKitchen),
      )
      setOrders(kitchenOrders)
    } catch {
      toast.error('Failed to load kitchen orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const unsubNew = on('new_order', () => loadOrders())
    const unsubUpdate = on('order_status_updated', () => loadOrders())
    return () => {
      unsubNew?.()
      unsubUpdate?.()
    }
  }, [on, loadOrders])

  const moveStatus = (orderId, itemIndex, currentStatus) => {
    const flow = {
      [KITCHEN_STATUS.TO_COOK]: KITCHEN_STATUS.PREPARING,
      [KITCHEN_STATUS.PREPARING]: KITCHEN_STATUS.COMPLETED,
      [KITCHEN_STATUS.PENDING]: KITCHEN_STATUS.TO_COOK,
    }
    const next = flow[currentStatus]
    if (!next) return
    emit('update_order_status', { orderId, itemIndex, newStatus: next })
    loadOrders()
  }

  const getTickets = (status) => {
    const tickets = []
    orders.forEach((order) => {
      if (search && !order.orderNumber?.toLowerCase().includes(search.toLowerCase())) return
      order.items?.forEach((item, idx) => {
        if (!item.sentToKitchen) return
        const itemStatus = item.kitchenStatus || KITCHEN_STATUS.PENDING
        if (itemStatus === status || (status === KITCHEN_STATUS.TO_COOK && itemStatus === KITCHEN_STATUS.PENDING)) {
          tickets.push({ order, item, itemIndex: idx })
        }
      })
    })
    return tickets
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-500 p-2">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Kitchen Display</h1>
            <p className="text-xs text-slate-400">{BRAND_NAME} KDS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-sm ${connected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {connected ? 'Live' : 'Offline'}
          </div>
          <div className="w-64">
            <SearchBar value={search} onChange={setSearch} placeholder="Search orders..." />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">Loading orders...</div>
      ) : (
        <div className="grid h-[calc(100vh-5rem)] grid-cols-3 gap-4 p-4">
          {COLUMNS.map((col) => {
            const tickets = getTickets(col.key)
            return (
              <div key={col.key} className={`rounded-2xl border-2 ${col.color} p-4`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">{col.label}</h2>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-sm font-bold text-slate-700">
                    {tickets.length}
                  </span>
                </div>
                <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
                  {tickets.map(({ order, item, itemIndex }) => (
                    <div
                      key={`${getId(order)}-${itemIndex}`}
                      className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{order.orderNumber}</span>
                        <StatusBadge status={item.kitchenStatus || 'pending'} />
                      </div>
                      {order.table && (
                        <p className="mt-1 text-xs text-slate-500">
                          Table {order.table.tableNumber || order.table}
                        </p>
                      )}
                      <div className="mt-3 rounded-lg bg-slate-50 p-3">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                        {item.notes && <p className="mt-1 text-xs italic text-slate-400">{item.notes}</p>}
                      </div>
                      {col.key !== KITCHEN_STATUS.COMPLETED && (
                        <button
                          type="button"
                          onClick={() => moveStatus(getId(order), itemIndex, item.kitchenStatus || KITCHEN_STATUS.PENDING)}
                          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
                        >
                          Move Forward
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!tickets.length && (
                    <p className="py-8 text-center text-sm text-slate-500">No tickets</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !orders.length && (
        <div className="px-4 pb-8">
          <EmptyState message="No kitchen orders yet — send orders from POS" icon={ChefHat} />
        </div>
      )}
    </div>
  )
}
