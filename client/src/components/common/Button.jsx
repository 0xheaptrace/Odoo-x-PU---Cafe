import Spinner from './Spinner'

const variants = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-amber-500/20 hover:bg-brand-700 focus:ring-brand-500 disabled:bg-brand-500/60 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 disabled:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 disabled:bg-rose-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400 disabled:text-slate-400 dark:text-slate-200 dark:hover:bg-slate-800',
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:translate-y-0 dark:focus:ring-offset-slate-950 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
