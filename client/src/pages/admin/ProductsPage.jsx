import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Package } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import * as productService from '../../services/productService'
import * as categoryService from '../../services/categoryService'
import { formatCurrency, getId, getCategoryId, paginate } from '../../utils/helpers'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, setValue } = useForm()
  const perPage = 8

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
      ])
      setProducts(pRes.data || [])
      setCategories(cRes.data || [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
      const catId = getCategoryId(p)
      const matchCat = !categoryFilter || catId === categoryFilter
      return matchSearch && matchCat
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const paged = paginate(filtered, page, perPage)
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', price: '', tax: 0, category: '', description: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditing(product)
    reset({
      name: product.name,
      price: product.price,
      tax: product.tax || 0,
      category: getCategoryId(product),
      description: product.description || '',
      isActive: product.isActive !== false,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        name: data.name,
        price: parseFloat(data.price),
        tax: parseFloat(data.tax) || 0,
        category: data.category,
        description: data.description,
        isActive: data.isActive,
      }
      if (editing) {
        await productService.updateProduct(getId(editing), payload)
        toast.success('Product updated')
      } else {
        await productService.createProduct(payload)
        toast.success('Product created')
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
      await productService.deleteProduct(deleteId)
      toast.success('Product deleted')
      setDeleteId(null)
      loadData()
    } catch {
      toast.error('Delete failed')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${r.category?.color || '#e2e8f0'}30` }}
          >
            <Package className="h-4 w-4" style={{ color: r.category?.color || '#64748b' }} />
          </div>
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: r.category?.color || '#94a3b8' }}
          />
          {r.category?.name || '—'}
        </span>
      ),
    },
    { key: 'price', label: 'Price', render: (r) => formatCurrency(r.price) },
    { key: 'tax', label: 'Tax', render: (r) => `${r.tax || 0}%` },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <StatusBadge status={r.isActive !== false ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openEdit(r) }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDeleteId(getId(r)) }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Products"
        subtitle="Manage your menu items"
        actionLabel="Add Product"
        onAction={openCreate}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search products..." className="flex-1" />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={getId(c)} value={getId(c)}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={5} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} emptyMessage="No products found" />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i + 1)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}
                >
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
        title={editing ? 'Edit Product' : 'New Product'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
        size="lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" {...register('name', { required: true })} />
          <Input label="Price" type="number" step="0.01" {...register('price', { required: true })} />
          <Input label="Tax %" type="number" {...register('tax')} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
            <select {...register('category', { required: true })} className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={getId(c)} value={getId(c)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input label="Description" {...register('description')} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        message="Delete this product?"
      />
    </AdminLayout>
  )
}
