const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-100',
  unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  'to-cook': 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200',
  preparing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  ready: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200',
  served: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  occupied: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  reserved: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200',
  cleaning: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-700/80 dark:text-slate-200',
}

export default function StatusBadge({ status, label }) {
  const key = (status || '').toLowerCase()
  const style = STATUS_STYLES[key] || 'bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-100'
  const display = label || (status ? String(status).replace(/-/g, ' ') : 'unknown')

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ring-black/5 dark:ring-white/10 ${style}`}>
      {display}
    </span>
  )
}
