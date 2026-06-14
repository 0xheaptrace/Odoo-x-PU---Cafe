import { Link } from 'react-router-dom'
import CustomerLayout from '../../components/customer/CustomerLayout'
import Button from '../../components/common/Button'

export default function CustomerCheckoutPage() {
  return (
    <CustomerLayout>
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-3 text-slate-500">
          Online ordering is coming soon. Browse our menu and pay at the counter when you visit.
        </p>
        <Link to="/customer/menu" className="mt-6 inline-block">
          <Button>Browse Menu</Button>
        </Link>
      </div>
    </CustomerLayout>
  )
}
