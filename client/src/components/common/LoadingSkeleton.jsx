export default function LoadingSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <div className="skeleton h-4 w-32 rounded" />
      </div>
      <div className="divide-y divide-slate-50 p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="skeleton h-4 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton mb-3 h-4 w-24 rounded" />
      <div className="skeleton h-8 w-32 rounded" />
    </div>
  )
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="skeleton mb-3 h-24 w-full rounded-lg" />
          <div className="skeleton mb-2 h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}
