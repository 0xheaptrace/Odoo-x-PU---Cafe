import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Megaphone } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import * as promotionService from '../../services/promotionService'
import * as productService from '../../services/productService'
import { formatCurrency, getId, paginate } from '../../utils/helpers'

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()
  const appliesTo = watch('appliesTo', 'order')
  const perPage = 8

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, prodRes] = await Promise.all([
        promotionService.getAllPromotions(),
        productService.getAllProducts(),
      ])
      setPromotions(pRes.data || [])
      setProducts(prodRes.data || [])
    } catch {
      toast.error('Failed to load promotions')
    } finally {
      setLoading(false)
    }
  }

  const filtered = promotions
    .filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || p.appliesTo === typeFilter
      return matchSearch && matchType
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const paged = paginate(filtered, page, perPage)
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const openCreate = () => {
    setEditing(null)
    reset({
      name: '',
      appliesTo: 'order',
      product: '',
      minimumQuantity: '',
      minimumOrderAmount: '',
      discountType: 'percentage',
      discountValue: '',
      isActive: true,
    })
    setModalOpen(true)
  }

  const openEdit = (promo) => {
    setEditing(promo)
    reset({
      name: promo.name,
      appliesTo: promo.appliesTo,
      product: getId(promo.product) || '',
      minimumQuantity: promo.minimumQuantity ?? '',
      minimumOrderAmount: promo.minimumOrderAmount ?? '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      isActive: promo.isActive !== false,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        name: data.name,
        appliesTo: data.appliesTo,
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        isActive: data.isActive === true || data.isActive === 'true',
        product: data.appliesTo === 'product' ? data.product : undefined,
        minimumQuantity: data.minimumQuantity ? parseInt(data.minimumQuantity, 10) : undefined,
        minimumOrderAmount: data.minimumOrderAmount ? parseFloat(data.minimumOrderAmount) : undefined,
      }
      if (editing) {
        await promotionService.updatePromotion(getId(editing), payload)
        toast.success('Promotion updated')
      } else {
        await promotionService.createPromotion(payload)
        toast.success('Promotion created')
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await promotionService.deletePromotion(deleteId)
      toast.success('Promotion deleted')
      setDeleteId(null)
      loadData()
    } catch {
      toast.error('Delete failed')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Promotion',
      render: (r) => (
        <span className="flex items-center gap-2 font-medium">
          <Megaphone className="h-4 w-4 text-purple-500" />
          {r.name}
        </span>
      ),
    },
    { key: 'appliesTo', label: 'Applies To', render: (r) => <span className="capitalize">{r.appliesTo}</span> },
    {
      key: 'product',
      label: 'Product',
      render: (r) => r.product?.name || '—',
    },
    {
      key: 'discount',
      label: 'Discount',
      render: (r) =>
        r.discountType === 'percentage'
          ? `${r.discountValue}%`
          : formatCurrency(r.discountValue),
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
      <PageHeader title="Promotions" subtitle="Automatic discounts on products or orders" actionLabel="Add Promotion" onAction={openCreate} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search promotions..." className="flex-1" />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All Types</option>
          <option value="product">Product</option>
          <option value="order">Order</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} emptyMessage="No promotions found" />
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

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Promotion' : 'New Promotion'} onSubmit={handleSubmit(onSubmit)} loading={saving} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Name" name="name" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Applies To</label>
            <select {...register('appliesTo')} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="order">Order</option>
              <option value="product">Product</option>
            </select>
          </div>
          {appliesTo === 'product' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Product</label>
              <select {...register('product', { required: appliesTo === 'product' })} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={getId(p)} value={getId(p)}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input label="Min Quantity" name="minimumQuantity" type="number" {...register('minimumQuantity')} />
          <Input label="Min Order Amount" name="minimumOrderAmount" type="number" step="0.01" {...register('minimumOrderAmount')} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Discount Type</label>
            <select {...register('discountType')} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <Input label="Discount Value" name="discountValue" type="number" step="0.01" {...register('discountValue', { required: true })} />
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isActive')} className="rounded border-gray-300" />
              Active
            </label>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} message="Delete this promotion?" />
    </AdminLayout>
  )
}
