const colorMap = {
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-emerald-100 text-emerald-700',
  gray: 'bg-emerald-100 text-emerald-700',
  orange: 'bg-emerald-100 text-emerald-700',
  purple: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ label, color = 'gray' }) {
  const isHex = color?.startsWith('#')

  const className = isHex
    ? 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
    : `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color] || colorMap.gray}`

  return (
    <span
      className={className}
      style={
        isHex
          ? {
              backgroundColor: `${color}20`,
              color,
            }
          : undefined
      }
    >
      {label}
    </span>
  )
}