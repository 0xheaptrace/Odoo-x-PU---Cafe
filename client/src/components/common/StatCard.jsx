import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              )}
              <span className={trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
