import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Pencil, Calendar, Users } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import * as bookingService from '../../services/bookingService'
import * as customerService from '../../services/customerService'
import * as floorService from '../../services/floorService'
import { formatDate, getId, paginate } from '../../utils/helpers'

const STATUSES = ['confirmed', 'cancelled', 'completed']

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()
  const selectedFloor = watch('floor')
  const perPage = 8

  const tablesForFloor = useMemo(() => {
    const floor = floors.find((f) => getId(f) === selectedFloor)
    return floor?.tables || []
  }, [floors, selectedFloor])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, cRes, fRes] = await Promise.all([
        bookingService.getAllBookings(),
        customerService.getAllCustomers(),
        floorService.getAllFloors(),
      ])
      setBookings(bRes.data || [])
      setCustomers(cRes.data || [])
      setFloors(fRes.data || [])
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filtered = bookings
    .filter((b) => {
      const q = search.toLowerCase()
      const matchSearch =
        b.customer?.name?.toLowerCase().includes(q) ||
        b.table?.tableNumber?.toString().includes(q)
      const matchStatus = !statusFilter || b.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const paged = paginate(filtered, page, perPage)
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const openCreate = () => {
    setEditing(null)
    reset({
      customer: '',
      floor: getId(floors[0]) || '',
      table: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      numberOfGuests: 2,
      status: 'confirmed',
    })
    setModalOpen(true)
  }

  const openEdit = (booking) => {
    setEditing(booking)
    reset({
      customer: getId(booking.customer),
      floor: getId(booking.floor),
      table: getId(booking.table),
      date: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '',
      time: booking.time,
      numberOfGuests: booking.numberOfGuests,
      status: booking.status,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        customer: data.customer,
        floor: data.floor,
        table: data.table,
        date: data.date,
        time: data.time,
        numberOfGuests: parseInt(data.numberOfGuests, 10),
        status: data.status,
      }
      if (editing) {
        await bookingService.updateBooking(getId(editing), payload)
        toast.success('Booking updated')
      } else {
        await bookingService.createBooking(payload)
        toast.success('Booking created — confirmation email sent if customer has email')
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    try {
      await bookingService.updateBooking(cancelId, { status: 'cancelled' })
      toast.success('Booking cancelled')
      setCancelId(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking')
    }
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (r) => (
        <span className="flex items-center gap-2 font-medium">
          <Users className="h-4 w-4 text-slate-400" />
          {r.customer?.name || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date & Time',
      render: (r) => (
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          {formatDate(r.date)} · {r.time}
        </span>
      ),
    },
    {
      key: 'table',
      label: 'Table',
      render: (r) => `T${r.table?.tableNumber || '—'} (${r.floor?.name || '—'})`,
    },
    { key: 'guests', label: 'Guests', render: (r) => r.numberOfGuests },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'email',
      label: 'Email Sent',
      render: (r) => (r.confirmationEmailSent ? 'Yes' : 'No'),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600">
            <Pencil className="h-4 w-4" />
          </button>
          {r.status === 'confirmed' && (
            <button
              type="button"
              onClick={() => setCancelId(getId(r))}
              className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader title="Bookings" subtitle="Table reservations and confirmations" actionLabel="New Booking" onAction={openCreate} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search customer or table..." className="flex-1" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={7} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} emptyMessage="No bookings found" />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} type="button" onClick={() => setPage(i + 1)} className={`rounded-lg px-3 py-1.5 text-sm ${page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Booking' : 'New Booking'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
        size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Customer</label>
            <select {...register('customer', { required: true })} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={getId(c)} value={getId(c)}>{c.name} {c.phone ? `· ${c.phone}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Floor</label>
            <select {...register('floor', { required: true })} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              {floors.map((f) => (
                <option key={getId(f)} value={getId(f)}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Table</label>
            <select {...register('table', { required: true })} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="">Select table</option>
              {tablesForFloor.map((t) => (
                <option key={getId(t)} value={getId(t)}>Table {t.tableNumber} ({t.seats} seats)</option>
              ))}
            </select>
          </div>
          <Input label="Date" name="date" type="date" {...register('date', { required: true })} />
          <Input label="Time" name="time" type="time" {...register('time', { required: true })} />
          <Input label="Guests" name="numberOfGuests" type="number" min="1" {...register('numberOfGuests', { required: true })} />
          {editing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
              <select {...register('status')} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!cancelId}
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
        message="Cancel this booking?"
        confirmLabel="Cancel Booking"
      />
    </AdminLayout>
  )
}
