import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { UtensilsCrossed } from 'lucide-react'
import CustomerLayout from '../../components/customer/CustomerLayout'
import SearchBar from '../../components/common/SearchBar'
import EmptyState from '../../components/common/EmptyState'
import { GridSkeleton } from '../../components/common/LoadingSkeleton'
import StatusBadge from '../../components/common/StatusBadge'
import * as productService from '../../services/productService'
import * as categoryService from '../../services/categoryService'
import { formatCurrency, getCategoryId, getId } from '../../utils/helpers'

export default function CustomerMenuPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
      ])
      setProducts((pRes.data || []).filter((p) => p.isActive !== false))
      setCategories(cRes.data || [])
    } catch {
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || getCategoryId(p) === categoryFilter
    return matchSearch && matchCat
  })

  const categoryName = (product) => {
    const catId = getCategoryId(product)
    return categories.find((c) => getId(c) === catId)?.name || 'Other'
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Our Menu</h1>
        <p className="mt-1 text-sm text-slate-500">Freshly prepared dishes, drinks, and seasonal favorites</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search menu..."
          className="flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={getId(c)} value={getId(c)}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <GridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No items match your search" icon={UtensilsCrossed} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <div key={getId(product)} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {categoryName(product)}
                  </p>
                  <h3 className="mt-1 font-semibold text-slate-900">{product.name}</h3>
                  {product.description && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{product.description}</p>
                  )}
                </div>
                <StatusBadge status="active" label="Available" />
              </div>
              <p className="mt-4 text-lg font-bold text-brand-600">
                {formatCurrency(product.price)}
              </p>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  )
}
