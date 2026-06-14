import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Plus,
  Minus,
  Trash2,
  User,
  Ticket,
  ChefHat,
  Banknote,
  CreditCard,
  Smartphone,
  ShoppingBag,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import POSLayout from '../../components/pos/POSLayout'
import Button from '../../components/common/Button'
import SearchBar from '../../components/common/SearchBar'
import Modal from '../../components/common/Modal'
import * as productService from '../../services/productService'
import * as categoryService from '../../services/categoryService'
import * as customerService from '../../services/customerService'
import * as couponService from '../../services/couponService'
import * as orderService from '../../services/orderService'
import * as paymentSettingsService from '../../services/paymentSettingsService'
import * as floorService from '../../services/floorService'
import { formatCurrency, getId, getCategoryId } from '../../utils/helpers'

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: Banknote, variant: undefined },
  { key: 'card', label: 'Card', icon: CreditCard, variant: 'secondary' },
  { key: 'upi', label: 'UPI', icon: Smartphone, variant: 'secondary' },
]

export default function POSPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState({ amount: 0, type: null, value: 0 })
  const [orderId, setOrderId] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [selectedTable, setSelectedTable] = useState('')
  const [customerModal, setCustomerModal] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState({ cash: true, card: true, upi: false, upiId: '' })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, cRes, custRes, settingsRes] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        customerService.getAllCustomers(),
        paymentSettingsService.getPaymentSettings(),
      ])
      const floorRes = await floorService.getAllFloors()
      setProducts((pRes.data || []).filter((p) => p.isActive !== false))
      setCategories(cRes.data || [])
      setCustomers(custRes.data || [])
      setFloors(floorRes.data || [])
      const tableFromUrl = searchParams.get('table')
      if (tableFromUrl) setSelectedTable(tableFromUrl)
      const settings = settingsRes.data || {}
      setPaymentSettings({
        cash: settings.cash !== false,
        card: settings.card !== false,
        upi: settings.upi === true,
        upiId: settings.upiId || '',
      })
    } catch {
      toast.error('Failed to load POS data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const allTables = useMemo(
    () => floors.flatMap((floor) => (floor.tables || []).map((table) => ({ ...table, floorName: floor.name }))),
    [floors],
  )

  const selectedTableRecord = allTables.find((table) => getId(table) === selectedTable)

  const hydrateOrder = (order) => {
    setActiveOrder(order || null)
    setOrderId(order ? getId(order) : null)
    setSelectedCustomer(order?.customer || null)
    setCart(
      (order?.items || []).map((item) => ({
        productId: getId(item.product) || item.productId,
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        tax: 0,
        color: '#f59e0b',
      })),
    )
    setDiscount({ amount: order?.discountAmount || 0, type: null, value: 0 })
    setCouponCode(order?.couponCode || '')
  }

  const loadActiveOrderForTable = async (tableId) => {
    if (!tableId) {
      hydrateOrder(null)
      return
    }
    try {
      const res = await orderService.getAllOrders({ table: tableId, active: true })
      hydrateOrder((res.data || [])[0] || null)
    } catch {
      toast.error('Failed to reopen table order')
    }
  }

  useEffect(() => {
    if (selectedTable) loadActiveOrderForTable(selectedTable)
  }, [selectedTable])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catId = getCategoryId(p)
      const matchCat = activeCategory === 'all' || catId === activeCategory
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch && p.isActive !== false
    })
  }, [products, activeCategory, search])

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const taxAmount = cart.reduce(
    (sum, item) => sum + item.lineTotal * ((item.tax || 0) / 100),
    0,
  )
  const discountAmount = discount.amount
  const total = Math.max(0, subtotal + taxAmount - discountAmount)

  const addToCart = (product) => {
    const cat = product.category || categories.find((c) => getId(c) === getCategoryId(product))
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === getId(product))
      if (existing) {
        return prev.map((i) =>
          i.productId === getId(product)
            ? {
                ...i,
                quantity: i.quantity + 1,
                lineTotal: (i.quantity + 1) * i.unitPrice,
              }
            : i,
        )
      }
      return [
        ...prev,
        {
          productId: getId(product),
          product,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          lineTotal: product.price,
          tax: product.tax || 0,
          color: cat?.color || '#94a3b8',
        },
      ]
    })
  }

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i
          const qty = Math.max(0, i.quantity + delta)
          return { ...i, quantity: qty, lineTotal: qty * i.unitPrice }
        })
        .filter((i) => i.quantity > 0),
    )
  }

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const buildOrderPayload = () => ({
    table: selectedTable || undefined,
    customer: selectedCustomer ? getId(selectedCustomer) : undefined,
    items: cart.map((i) => ({
      product: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal,
    taxAmount,
    discountAmount,
    couponCode: couponCode || undefined,
    total,
  })

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const res = await couponService.validateCoupon(couponCode.trim())
      const { discountType, discountValue } = res.data
      let amount = 0
      if (discountType === 'percentage') {
        amount = subtotal * (discountValue / 100)
      } else {
        amount = discountValue
      }
      setDiscount({ amount, type: discountType, value: discountValue })
      toast.success('Coupon applied!')
    } catch {
      toast.error('Invalid coupon code')
      setDiscount({ amount: 0, type: null, value: 0 })
    }
  }

  const ensureOrder = async () => {
    if (!selectedTable) {
      throw new Error('Select a table before creating an order')
    }
    const payload = buildOrderPayload()
    if (orderId) {
      const res = await orderService.updateOrder(orderId, payload)
      return res.data
    }
    const res = await orderService.createOrder(payload)
    setOrderId(getId(res.data))
    setActiveOrder(res.data)
    return res.data
  }

  const handleSendToKitchen = async () => {
    if (!cart.length) {
      toast.error('Cart is empty')
      return
    }
    setProcessing(true)
    try {
      const order = await ensureOrder()
      const res = await orderService.sendToKitchen(getId(order))
      toast.success('Sent to kitchen!')
      setActiveOrder(res.data)
      setSelectedPaymentMethod(null)
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Failed to send to kitchen')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayment = async (method) => {
    if (!cart.length) {
      toast.error('Cart is empty')
      return
    }
    setProcessing(true)
    try {
      const order = await ensureOrder()
      await orderService.processPayment(getId(order), { paymentMethod: method })
      toast.success('Payment processed!')
      setCart([])
      setOrderId(null)
      setActiveOrder(null)
      setSelectedTable('')
      setSelectedCustomer(null)
      setDiscount({ amount: 0, type: null, value: 0 })
      setCouponCode('')
      setSelectedPaymentMethod(null)
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const enabledPaymentMethods = PAYMENT_METHODS.filter((method) => paymentSettings[method.key])
  const upiPaymentValue = paymentSettings.upiId
    ? `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=${encodeURIComponent('Folk & Forks')}&am=${total.toFixed(2)}&cu=INR`
    : ''

  const handlePaymentMethodClick = (method) => {
    if (method === 'upi') {
      setSelectedPaymentMethod('upi')
      return
    }

    setSelectedPaymentMethod(method)
    handlePayment(method)
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch),
  )

  return (
    <POSLayout fullWidth>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* LEFT — Products */}
        <div className="flex w-[38%] flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search menu..." />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  activeCategory === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={getId(cat)}
                  type="button"
                  onClick={() => setActiveCategory(getId(cat))}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    activeCategory === getId(cat) ? 'text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  style={
                    activeCategory === getId(cat)
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-32 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const cat = product.category
                  return (
                    <button
                      key={getId(product)}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="card group overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div
                        className="flex h-20 items-center justify-center"
                        style={{ backgroundColor: `${cat?.color || '#e2e8f0'}25` }}
                      >
                        <ShoppingBag
                          className="h-8 w-8 transition group-hover:scale-110"
                          style={{ color: cat?.color || '#64748b' }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-slate-900 line-clamp-1">{product.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-bold text-brand-600">
                            {formatCurrency(product.price)}
                          </span>
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <Plus className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {!loading && !filteredProducts.length && (
              <p className="py-16 text-center text-sm text-slate-500">No products found</p>
            )}
          </div>
        </div>

        {/* CENTER — Cart */}
        <div className="flex w-[34%] flex-col bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h2 className="font-bold text-slate-900">Current Order</h2>
            <p className="text-xs text-slate-500">
              {selectedTableRecord ? `Table ${selectedTableRecord.tableNumber} · ` : ''}
              {cart.length} items
              {activeOrder ? ` · ${activeOrder.orderNumber}` : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!cart.length ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <ShoppingBag className="mb-3 h-12 w-12" />
                <p className="text-sm">Tap products to add to cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="card flex items-center gap-3 p-3">
                    <div
                      className="h-10 w-1 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, -1)}
                        className="rounded-lg p-1 hover:bg-slate-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, 1)}
                        className="rounded-lg p-1 hover:bg-slate-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="w-16 text-right font-semibold text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Summary */}
        <div className="flex w-[28%] flex-col border-l border-slate-200 bg-white">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="card mb-4 p-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Service Table</p>
              <select
                value={selectedTable}
                onChange={(event) => setSelectedTable(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select table</option>
                {allTables
                  .filter((table) => table.isActive !== false)
                  .map((table) => (
                    <option key={getId(table)} value={getId(table)}>
                      {table.floorName} · Table {table.tableNumber} · {table.currentStatus || 'available'}
                    </option>
                  ))}
              </select>
              {activeOrder && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Reopened active order {activeOrder.orderNumber}. Kitchen and payment actions will update this table.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCustomerModal(true)}
              className="card mb-4 flex w-full items-center gap-3 p-4 text-left transition hover:bg-brand-50"
            >
              <div className="rounded-full bg-brand-100 p-2">
                <User className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="font-medium text-slate-900">
                  {selectedCustomer?.name || 'Walk-in Customer'}
                </p>
              </div>
            </button>

            <div className="card mb-4 p-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Coupon Code</p>
              <div className="flex gap-2">
                <input
                  name="couponCode"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <Button variant="secondary" onClick={applyCoupon}>
                  <Ticket className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 p-4">
            <Button fullWidth onClick={handleSendToKitchen} loading={processing} variant="secondary" disabled={!selectedTable}>
              <ChefHat className="h-4 w-4" />
              Send to Kitchen
            </Button>
            {enabledPaymentMethods.length ? (
              enabledPaymentMethods.map(({ key, label, icon: Icon, variant }) => (
                <Button
                  key={key}
                  fullWidth
                  onClick={() => handlePaymentMethodClick(key)}
                  loading={processing && selectedPaymentMethod === key}
                  variant={variant}
                  disabled={!selectedTable}
                >
                  <Icon className="h-4 w-4" />
                  Pay {label}
                </Button>
              ))
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No payment methods are enabled.
              </div>
            )}
            {selectedPaymentMethod === 'upi' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                {upiPaymentValue ? (
                  <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
                    <QRCodeSVG value={upiPaymentValue} size={132} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-8 text-sm text-slate-500">
                    UPI ID is not configured.
                  </div>
                )}
                <p className="mt-3 text-xs font-semibold uppercase text-slate-400">UPI ID</p>
                <p className="mt-1 break-all font-medium text-slate-900">
                  {paymentSettings.upiId || 'Not configured'}
                </p>
                <Button
                  fullWidth
                  className="mt-3"
                  onClick={() => handlePayment('upi')}
                  loading={processing}
                  disabled={!paymentSettings.upiId}
                >
                  <Smartphone className="h-4 w-4" />
                  Confirm UPI Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={customerModal} onClose={() => setCustomerModal(false)} title="Assign Customer" size="md">
        <SearchBar value={customerSearch} onChange={setCustomerSearch} placeholder="Search customers..." />
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          <button
            type="button"
            onClick={() => { setSelectedCustomer(null); setCustomerModal(false) }}
            className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-100"
          >
            Walk-in Customer
          </button>
          {filteredCustomers.map((c) => (
            <button
              key={getId(c)}
              type="button"
              onClick={() => { setSelectedCustomer(c); setCustomerModal(false) }}
              className="w-full rounded-xl border border-slate-100 px-4 py-3 text-left text-sm hover:border-brand-200 hover:bg-brand-50"
            >
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-slate-500">{c.phone || c.email || '—'}</p>
            </button>
          ))}
        </div>
      </Modal>
    </POSLayout>
  )
}
