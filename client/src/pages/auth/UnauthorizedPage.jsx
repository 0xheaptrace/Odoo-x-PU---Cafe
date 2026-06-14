import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'
import { getHomeRoute } from '../../utils/routing'

export default function UnauthorizedPage() {
  const storedUser = localStorage.getItem('user')
  const home = storedUser ? getHomeRoute(JSON.parse(storedUser).role) : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-2xl font-bold text-gray-900">Unauthorized</h1>
      <p className="mt-2 text-sm text-gray-500">
        You don&apos;t have permission to access this page.
      </p>
      <Link to={home} className="mt-6">
        <Button>Go to Home</Button>
      </Link>
    </div>
  )
}
