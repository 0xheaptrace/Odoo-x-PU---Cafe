import { Inbox } from 'lucide-react'

export default function EmptyState({ message, icon: Icon = Inbox, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
