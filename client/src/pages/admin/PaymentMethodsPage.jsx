import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { CreditCard, Banknote, Smartphone, Save } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { CardSkeleton } from '../../components/common/LoadingSkeleton'
import DashboardCard from '../../components/common/DashboardCard'
import * as paymentSettingsService from '../../services/paymentSettingsService'

const METHODS = [
  { key: 'cash', label: 'Cash', icon: Banknote, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
  { key: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-50 text-purple-600' },
]

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { cash: true, card: true, upi: false, upiId: '' },
  })
  const upiEnabled = watch('upi')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await paymentSettingsService.getPaymentSettings()
      const s = res.data || {}
      reset({
        cash: s.cash !== false,
        card: s.card !== false,
        upi: s.upi === true,
        upiId: s.upiId || '',
      })
    } catch {
      toast.error('Failed to load payment settings')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await paymentSettingsService.updatePaymentSettings({
        cash: !!data.cash,
        card: !!data.card,
        upi: !!data.upi,
        upiId: data.upiId || null,
      })
      toast.success('Payment settings saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <PageHeader title="Payment Methods" subtitle="Configure which payment options are available at POS" />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {METHODS.map(({ key, label, icon: Icon, color }) => (
              <DashboardCard key={key} title={label}>
                <div className="flex flex-col items-center py-4">
                  <div className={`mb-4 rounded-2xl p-4 ${color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      {...register(key)}
                      className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Accept {label}
                    </span>
                  </label>
                </div>
              </DashboardCard>
            ))}
          </div>

          {upiEnabled && (
            <div className="card mt-6 p-6">
              <h3 className="mb-4 font-semibold text-slate-900">UPI Configuration</h3>
              <Input
                label="UPI ID"
                name="upiId"
                placeholder="yourname@upi"
                {...register('upiId')}
                helperText="Displayed to customers when paying via UPI"
              />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>

          <div className="card mt-6 p-5">
            <p className="text-sm text-slate-500">
              Toggle payment methods above and save to update POS checkout options.
            </p>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
