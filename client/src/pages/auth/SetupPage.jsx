import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getHomeRoute } from '../../utils/routing'
import Button from '../../components/common/Button'
import BrandMark from '../../components/common/BrandMark'
import ThemeToggle from '../../components/common/ThemeToggle'
import { BRAND_NAME, BRAND_POS_NAME, BRAND_TAGLINE } from '../../constants/brand'

export default function SetupPage() {
  const { setupAdmin } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await setupAdmin(data.name, data.email, data.password)
      toast.success('Admin account created!')
      navigate(getHomeRoute(user.role))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-[linear-gradient(135deg,#111827_0%,#4a3412_48%,#020617_100%)] p-12 text-white lg:flex">
        <BrandMark className="[&_p:first-child]:text-white" />
        <div>
          <h1 className="font-serif text-5xl font-bold leading-tight">Set up {BRAND_NAME}.</h1>
          <p className="mt-3 text-xl text-amber-200">{BRAND_TAGLINE}</p>
          <p className="mt-6 max-w-md text-lg text-slate-300">
            This one-time step creates the administrator who can manage products, employees, and settings.
          </p>
        </div>
        <p className="text-sm text-slate-400">© 2026 {BRAND_POS_NAME}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandMark showTagline={false} />
            <ThemeToggle />
          </div>
          <div className="mb-4 hidden justify-end lg:flex">
            <ThemeToggle />
          </div>
          <div className="card p-8">
            <h2 className="font-serif text-3xl font-bold text-slate-900">Admin setup</h2>
            <p className="mt-1 text-sm text-slate-500">Create the first administrator account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950/70"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950/70"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950/70"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: (v) => v === password || 'Passwords do not match',
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950/70"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" fullWidth loading={loading}>Create Admin Account</Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              <Link to="/login" className="font-medium text-brand-600">Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
