import { useCallback, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Circle, RefreshCw } from 'lucide-react'
import CustomerLayout from '../../components/customer/CustomerLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { CardSkeleton } from '../../components/common/LoadingSkeleton'
import * as bookingService from '../../services/bookingService'
import * as floorService from '../../services/floorService'
import { getId } from '../../utils/helpers'
import { useAuth } from '../../hooks/useAuth'

export default function CustomerBookingPage() {
  const { user } = useAuth()
  const [floors, setFloors] = useState([])
  const [bookedTableIds, setBookedTableIds] = useState(new Set())
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, watch, setValue } = useForm()
  const selectedFloor = watch('floor')
  const selectedTable = watch('table')
  const selectedDate = watch('date')
  const selectedTime = watch('time')

  const isTableAvailable = useCallback(
    (table) =>
      table.isActive !== false &&
      table.currentStatus === 'available' &&
      !bookedTableIds.has(getId(table)),
    [bookedTableIds],
  )

  const tablesForFloor = useMemo(() => {
    const floor = floors.find((f) => getId(f) === selectedFloor)
    return (floor?.tables || []).filter((t) => t.isActive !== false)
  }, [floors, selectedFloor])

  const availableTablesForFloor = useMemo(
    () => tablesForFloor.filter(isTableAvailable),
    [isTableAvailable, tablesForFloor],
  )

  const loadBookedTables = useCallback(async (date, time) => {
    if (!date || !time) {
      setBookedTableIds(new Set())
      return
    }

    setAvailabilityLoading(true)
    try {
      const res = await bookingService.getAllBookings({
        availability: 'tables',
        date,
        time,
      })
      setBookedTableIds(new Set((res.data || []).map((booking) => getId(booking.table))))
    } catch {
      toast.error('Failed to refresh table availability')
    } finally {
      setAvailabilityLoading(false)
    }
  }, [])

  const loadFloors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await floorService.getAllFloors()
      const data = res.data || []
      setFloors(data)
      if (data[0]) {
        reset({
          floor: getId(data[0]),
          table: '',
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          numberOfGuests: 2,
        })
      }
    } catch {
      toast.error('Failed to load tables')
    } finally {
      setLoading(false)
    }
  }, [reset])

  useEffect(() => {
    const timer = window.setTimeout(loadFloors, 0)
    return () => window.clearTimeout(timer)
  }, [loadFloors])

  useEffect(() => {
    const timer = window.setTimeout(() => loadBookedTables(selectedDate, selectedTime), 250)
    return () => window.clearTimeout(timer)
  }, [loadBookedTables, selectedDate, selectedTime])

  useEffect(() => {
    if (selectedTable && !availableTablesForFloor.some((table) => getId(table) === selectedTable)) {
      setValue('table', '')
    }
  }, [availableTablesForFloor, selectedTable, setValue])

  const onSubmit = async (data) => {
    if (!user?.customerId) {
      toast.error('Customer profile not found. Please log out and sign in again.')
      return
    }

    setSaving(true)
    try {
      await bookingService.createBooking({
        customer: user.customerId,
        floor: data.floor,
        table: data.table,
        date: data.date,
        time: data.time,
        numberOfGuests: parseInt(data.numberOfGuests, 10),
        status: 'confirmed',
      })
      toast.success('Booking confirmed! Check your email for details.')
      setBookedTableIds((prev) => new Set([...prev, data.table]))
      reset({
        floor: getId(floors[0]) || '',
        table: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        numberOfGuests: 2,
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Book a Table</h1>
        <p className="mt-1 text-sm text-slate-500">Reserve your spot at Folk & Forks</p>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Floor</label>
                <select
                  {...register('floor', { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
                >
                  {floors.map((f) => (
                    <option key={getId(f)} value={getId(f)}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Table</label>
                <select
                  {...register('table', { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
                >
                  <option value="">Select table</option>
                  {availableTablesForFloor.map((t) => (
                    <option key={getId(t)} value={getId(t)}>
                      Table {t.tableNumber} ({t.seats} seats)
                    </option>
                  ))}
                </select>
                {!availableTablesForFloor.length && (
                  <p className="mt-2 text-xs text-violet-700">
                    No tables are available for the selected floor, date, and time.
                  </p>
                )}
              </div>
              <Input label="Date" name="date" type="date" {...register('date', { required: true })} />
              <Input label="Time" name="time" type="time" {...register('time', { required: true })} />
              <Input
                label="Number of Guests"
                name="numberOfGuests"
                type="number"
                min="1"
                {...register('numberOfGuests', { required: true })}
              />
              <Button type="submit" loading={saving} fullWidth disabled={!availableTablesForFloor.length}>
                Confirm Booking
              </Button>
            </div>
          </form>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">Table Availability</h2>
                <p className="mt-1 text-xs text-slate-500">Green tables can be booked now</p>
              </div>
              {availabilityLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Table</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tablesForFloor.map((table) => {
                    const available = isTableAvailable(table)
                    return (
                      <tr
                        key={getId(table)}
                        className={available ? 'bg-emerald-50/60' : 'bg-violet-50/60'}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          Table {table.tableNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{table.seats}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              available
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            <Circle className="h-2.5 w-2.5 fill-current" />
                            {available ? 'Available' : 'Not available'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </CustomerLayout>
  )
}
