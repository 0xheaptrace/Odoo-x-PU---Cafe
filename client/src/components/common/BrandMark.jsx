import { UtensilsCrossed } from 'lucide-react'
import { BRAND_NAME, BRAND_TAGLINE } from '../../constants/brand'

export default function BrandMark({ showTagline = true, compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/20">
        <UtensilsCrossed className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-serif text-lg font-bold leading-tight text-slate-900 dark:text-slate-50">
            {BRAND_NAME}
          </p>
          {showTagline && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {BRAND_TAGLINE}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
