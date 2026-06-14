import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Button from '../../components/common/Button'
import { GridSkeleton } from '../../components/common/LoadingSkeleton'
import * as floorService from '../../services/floorService'
import { getId } from '../../utils/helpers'

export default function FloorsPage() {
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [floorModal, setFloorModal] = useState(false)
  const [tableModal, setTableModal] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [deleteTableId, setDeleteTableId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register: regFloor, handleSubmit: submitFloor, reset: resetFloor } = useForm()
  const { register: regTable, handleSubmit: submitTable, reset: resetTable } = useForm()

  useEffect(() => {
    loadFloors()
  }, [])

  const loadFloors = async () => {
    setLoading(true)
    try {
      const res = await floorService.getAllFloors()
      setFloors(res.data || [])
    } catch {
      toast.error('Failed to load floors')
    } finally {
      setLoading(false)
    }
  }

  const onCreateFloor = async (data) => {
    setSaving(true)
    try {
      await floorService.createFloor(data)
      toast.success('Floor created')
      setFloorModal(false)
      resetFloor()
      loadFloors()
    } catch {
      toast.error('Failed to create floor')
    } finally {
      setSaving(false)
    }
  }

  const onAddTable = async (data) => {
    setSaving(true)
    try {
      await floorService.addTable(getId(selectedFloor), {
        tableNumber: data.tableNumber,
        seats: parseInt(data.seats, 10),
      })
      toast.success('Table added')
      setTableModal(false)
      resetTable()
      loadFloors()
    } catch {
      toast.error('Failed to add table')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTable = async () => {
    try {
      await floorService.deleteTable(deleteTableId)
      toast.success('Table deleted')
      setDeleteTableId(null)
      loadFloors()
    } catch {
      toast.error('Delete failed')
    }
  }

  const statusColor = (status) => {
    if (status === 'occupied') return 'border-rose-300 bg-rose-50'
    if (status === 'reserved') return 'border-purple-300 bg-purple-50'
    if (status === 'cleaning') return 'border-sky-300 bg-sky-50'
    return 'border-emerald-300 bg-emerald-50'
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Floors & Tables"
        subtitle="Manage dining areas and table layout"
        actionLabel="Add Floor"
        onAction={() => { resetFloor(); setFloorModal(true) }}
      />

      {loading ? (
        <GridSkeleton count={2} />
      ) : (
        <div className="space-y-8">
          {floors.map((floor) => (
            <div key={getId(floor)} className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{floor.name}</h2>
                <Button
                  variant="secondary"
                  onClick={() => { setSelectedFloor(floor); resetTable(); setTableModal(true) }}
                >
                  <Plus className="h-4 w-4" />
                  Add Table
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {(floor.tables || []).map((table) => (
                  <div
                    key={getId(table)}
                    className={`relative rounded-2xl border-2 p-4 transition hover:shadow-md ${statusColor(table.currentStatus)}`}
                  >
                    <button
                      type="button"
                      onClick={() => setDeleteTableId(getId(table))}
                      className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-2xl font-bold text-slate-900">T{table.tableNumber}</p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                      <Users className="h-3.5 w-3.5" />
                      {table.seats} seats
                    </div>
                    <div className="mt-3">
                      <StatusBadge status={table.currentStatus || 'available'} />
                    </div>
                  </div>
                ))}
                {!(floor.tables?.length) && (
                  <p className="col-span-full py-8 text-center text-sm text-slate-500">
                    No tables on this floor yet
                  </p>
                )}
              </div>
            </div>
          ))}
          {!floors.length && (
            <p className="py-16 text-center text-slate-500">Create your first floor to get started</p>
          )}
        </div>
      )}

      <FormModal isOpen={floorModal} onClose={() => setFloorModal(false)} title="New Floor" onSubmit={submitFloor(onCreateFloor)} loading={saving}>
        <Input label="Floor Name" {...regFloor('name', { required: true })} placeholder="e.g. Ground Floor" />
      </FormModal>

      <FormModal isOpen={tableModal} onClose={() => setTableModal(false)} title={`Add Table — ${selectedFloor?.name}`} onSubmit={submitTable(onAddTable)} loading={saving}>
        <div className="space-y-4">
          <Input label="Table Number" {...regTable('tableNumber', { required: true })} />
          <Input label="Seats" type="number" {...regTable('seats', { required: true })} />
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteTableId} onConfirm={handleDeleteTable} onCancel={() => setDeleteTableId(null)} message="Delete this table?" />
    </AdminLayout>
  )
}
