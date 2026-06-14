import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Ticket } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import * as couponService from '../../services/couponService'
import { formatCurrency, getId, paginate } from '../../utils/helpers'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm()
  const perPage = 8

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const res = await couponService.getAllCoupons()
      setCoupons(res.data || [])
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const filtered = coupons
    .filter((c) => {
      const matchSearch = c.code?.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === '' ||
        (statusFilter === 'active' && c.isActive) ||
        (statusFilter === 'inactive' && !c.isActive)
      return matchSearch && matchStatus
    })
    .sort((a, b) => a.code.localeCompare(b.code))

  const paged = paginate(filtered, page, perPage)
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const openCreate = () => {
    setEditing(null)
    reset({ code: '', discountType: 'percentage', discountValue: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    reset({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      isActive: coupon.isActive !== false,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        code: data.code,
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        isActive: data.isActive === true || data.isActive === 'true',
      }
      if (editing) {
        await couponService.updateCoupon(getId(editing), payload)
        toast.success('Coupon updated')
      } else {
        await couponService.createCoupon(payload)
        toast.success('Coupon created')
      }
      setModalOpen(false)
      loadCoupons()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await couponService.deleteCoupon(deleteId)
      toast.success('Coupon deleted')
      setDeleteId(null)
      loadCoupons()
    } catch {
      toast.error('Delete failed')
    }
  }

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (r) => (
        <span className="flex items-center gap-2 font-mono font-semibold text-slate-900">
          <Ticket className="h-4 w-4 text-brand-500" />
          {r.code}
        </span>
      ),
    },
    {
      key: 'discountType',
      label: 'Type',
      render: (r) => <span className="capitalize">{r.discountType}</span>,
    },
    {
      key: 'discountValue',
      label: 'Value',
      render: (r) =>
        r.discountType === 'percentage' ? `${r.discountValue}%` : formatCurrency(r.discountValue),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setDeleteId(getId(r))} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader title="Coupons" subtitle="Manage discount codes" actionLabel="Add Coupon" onAction={openCreate} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by code..." className="flex-1" />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={5} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} emptyMessage="No coupons found" />
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

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'New Coupon'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="space-y-4">
          <Input label="Code" name="code" {...register('code', { required: true })} placeholder="SUMMER20" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Discount Type</label>
            <select {...register('discountType')} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <Input label="Discount Value" name="discountValue" type="number" step="0.01" {...register('discountValue', { required: true })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isActive')} className="rounded border-gray-300" />
            Active
          </label>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} message="Delete this coupon?" />
    </AdminLayout>
  )
}
