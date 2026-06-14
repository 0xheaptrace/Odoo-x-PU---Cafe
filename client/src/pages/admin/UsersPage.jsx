import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Trash2, Key, Archive } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import SearchBar from '../../components/common/SearchBar'
import DataTable from '../../components/common/DataTable'
import FormModal from '../../components/common/FormModal'
import Input from '../../components/common/Input'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import { ROLES } from '../../constants'
import { formatDate, getId, paginate } from '../../utils/helpers'
import * as userService from '../../services/userService'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [passwordModal, setPasswordModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [archiveId, setArchiveId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm()
  const passwordForm = useForm()
  const perPage = 8

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userService.getAllUsers()
      setUsers(res.data || [])
    } catch {
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadUsers)
  }, [loadUsers])

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase()
      const matchSearch =
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      const matchRole = !roleFilter || u.role === roleFilter
      return matchSearch && matchRole
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const paged = paginate(filtered, page, perPage)
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const openCreate = () => {
    reset({ name: '', email: '', password: '' })
    setModalOpen(true)
  }

  const onCreate = async (data) => {
    setSaving(true)
    try {
      await userService.createUser({ ...data, role: ROLES.EMPLOYEE })
      toast.success('Employee created — share their login credentials')
      setModalOpen(false)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async (data) => {
    setSaving(true)
    try {
      await userService.changePassword(getId(passwordModal), data.password)
      toast.success('Password updated')
      setPasswordModal(null)
      passwordForm.reset()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    try {
      await userService.archiveUser(archiveId)
      toast.success('User archived')
      setArchiveId(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive user')
    }
  }

  const handleDelete = async () => {
    try {
      await userService.deleteUser(deleteId)
      toast.success('User deleted')
      setDeleteId(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (r) => <StatusBadge status={r.role} label={r.role} />,
    },
    { key: 'createdAt', label: 'Joined', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-1">
          <button
            type="button"
            title="Change password"
            onClick={() => {
              setPasswordModal(r)
              passwordForm.reset({ password: '' })
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
          >
            <Key className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Archive"
            onClick={() => setArchiveId(getId(r))}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => setDeleteId(getId(r))}
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
        title="Employees"
        subtitle="Add staff accounts — customers register themselves via the sign-up page"
        actionLabel="Add Employee"
        onAction={openCreate}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or email..." className="flex-1" />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All Roles</option>
          <option value={ROLES.ADMIN}>Admin</option>
          <option value={ROLES.EMPLOYEE}>Employee</option>
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={5} />
      ) : (
        <>
          <DataTable columns={columns} data={paged} emptyMessage="No staff members found" />
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

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Employee" onSubmit={handleSubmit(onCreate)} loading={saving}>
        <div className="space-y-4">
          <Input label="Name" name="name" {...register('name', { required: true })} />
          <Input label="Email" name="email" type="email" {...register('email', { required: true })} />
          <Input label="Password" name="password" type="password" {...register('password', { required: true, minLength: 6 })} />
          <p className="text-sm text-slate-500">
            Share these credentials with the employee so they can sign in at the POS.
          </p>
        </div>
      </FormModal>

      <FormModal
        isOpen={!!passwordModal}
        onClose={() => setPasswordModal(null)}
        title={`Change Password — ${passwordModal?.name}`}
        onSubmit={passwordForm.handleSubmit(onChangePassword)}
        loading={saving}
        submitLabel="Update Password"
      >
        <Input label="New Password" name="password" type="password" {...passwordForm.register('password', { required: true, minLength: 6 })} />
      </FormModal>

      <ConfirmDialog isOpen={!!archiveId} onConfirm={handleArchive} onCancel={() => setArchiveId(null)} message="Archive this user? They will no longer appear in the list." confirmLabel="Archive" />
      <ConfirmDialog isOpen={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} message="Permanently delete this user? This cannot be undone." />
    </AdminLayout>
  )
}
