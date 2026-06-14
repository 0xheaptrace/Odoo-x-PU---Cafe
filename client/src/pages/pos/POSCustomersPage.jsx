import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Pencil, Trash2, User, Mail, Phone } from 'lucide-react'
import POSLayout from '../../components/pos/POSLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import { GridSkeleton } from '../../components/common/LoadingSkeleton'
import * as customerService from '../../services/customerService'
import { getId } from '../../utils/helpers'

export default function POSCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const loadCustomers = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res = await customerService.getAllCustomers(q || undefined)
      setCustomers(res.data || [])
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(search), 300)
    return () => clearTimeout(timer)
  }, [loadCustomers, search])

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', email: '', phone: '' })
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    reset({ name: c.name, email: c.email || '', phone: c.phone || '' })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) {
        await customerService.updateCustomer(getId(editing), data)
        toast.success('Customer updated')
      } else {
        await customerService.createCustomer(data)
        toast.success('Customer created')
      }
      setModalOpen(false)
      loadCustomers(search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await customerService.deleteCustomer(deleteId)
      toast.success('Customer deleted')
      setDeleteId(null)
      loadCustomers(search)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <POSLayout>
      <PageHeader
        title="Customers"
        subtitle="Manage walk-in and regular customers"
        actionLabel="Add Customer"
        onAction={openCreate}
      />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or phone..."
        className="mb-6 max-w-md"
      />

      {loading ? (
        <GridSkeleton count={6} />
      ) : customers.length === 0 ? (
        <EmptyState message="No customers found" icon={User} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={getId(c)} className="card group p-5 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setDeleteId(getId(c))} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{c.name}</h3>
              {c.email && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" />{c.email}
                </p>
              )}
              {c.phone && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone className="h-3.5 w-3.5" />{c.phone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'New Customer'} onSubmit={handleSubmit(onSubmit)} loading={saving}>
        <div className="space-y-4">
          <Input label="Name" name="name" {...register('name', { required: true })} />
          <Input label="Email" name="email" type="email" {...register('email')} />
          <Input label="Phone" name="phone" {...register('phone')} />
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} message="Delete this customer?" />
    </POSLayout>
  )
}
