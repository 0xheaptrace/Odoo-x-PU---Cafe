export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  helperText,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-950/70 dark:text-slate-50 dark:placeholder:text-slate-500 ${
          error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
        }`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  )
}
