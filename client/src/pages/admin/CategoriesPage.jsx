import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Tags } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { GridSkeleton } from '../../components/common/LoadingSkeleton'
import EmptyState from '../../components/common/EmptyState'
import * as categoryService from '../../services/categoryService'
import { getId } from '../../utils/helpers'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()
  const colorValue = watch('color', '#2563eb')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await categoryService.getAllCategories()
      setCategories(res.data || [])
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()),
  )

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', color: '#2563eb' })
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    reset({ name: cat.name, color: cat.color })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) {
        await categoryService.updateCategory(getId(editing), data)
        toast.success('Category updated')
      } else {
        await categoryService.createCategory(data)
        toast.success('Category created')
      }
      setModalOpen(false)
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await categoryService.deleteCategory(deleteId)
      toast.success('Category deleted')
      setDeleteId(null)
      loadCategories()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Categories"
        subtitle="Organize your menu with color-coded categories"
        actionLabel="Add Category"
        onAction={openCreate}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search categories..."
        className="mb-6 max-w-md"
      />

      {loading ? (
        <GridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No categories found" icon={Tags} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((cat) => (
            <div
              key={getId(cat)}
              className="card group overflow-hidden transition hover:-translate-y-0.5"
            >
              <div className="h-2" style={{ backgroundColor: cat.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <Tags className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(getId(cat))}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{cat.name}</h3>
                <p className="mt-1 font-mono text-xs text-slate-500">{cat.color}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
      >
        <div className="space-y-4">
          <Input label="Name" {...register('name', { required: true })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" {...register('color')} className="h-10 w-14 cursor-pointer rounded-lg border" />
              <div
                className="flex flex-1 items-center gap-2 rounded-xl px-4 py-2"
                style={{ backgroundColor: `${colorValue}20`, color: colorValue }}
              >
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: colorValue }} />
                <span className="text-sm font-medium">Preview</span>
              </div>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        message="Delete this category?"
      />
    </AdminLayout>
  )
}
