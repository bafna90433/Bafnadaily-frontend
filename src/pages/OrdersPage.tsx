import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { Order } from '../types'
import useAuthStore from '../store/authStore'

const SC: Record<string,string> = { placed:'bg-blue-100 text-blue-700',confirmed:'bg-purple-100 text-purple-700',processing:'bg-yellow-100 text-yellow-700',shipped:'bg-orange-100 text-orange-700',delivered:'bg-green-100 text-green-700',cancelled:'bg-red-100 text-red-700' }

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (!user) { navigate('/login'); return }; api.get('/orders/my').then(r => setOrders(r.data.orders)).finally(() => setLoading(false)) }, [user])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">{Array(3).fill(0).map((_,i)=><div key={i} className="h-28 skeleton rounded-2xl"/>)}</div>
  if (!orders.length) return <div className="max-w-md mx-auto text-center py-24 px-4"><Package size={64} className="text-gray-200 mx-auto mb-4"/><h2 className="text-xl font-bold mb-2">No orders yet</h2><Link to="/products" className="btn-primary mt-4">Start Shopping</Link></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <Link key={order._id} to={`/orders/${order._id}`} className="card p-4 block hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div><p className="font-bold text-gray-900">#{order.orderNumber}</p><p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p><p className="text-sm text-gray-600 mt-1">{order.items.length} item(s) · <strong>₹{order.total}</strong></p></div>
              <div className="flex items-center gap-2"><span className={`badge ${SC[order.orderStatus]||'bg-gray-100 text-gray-600'} capitalize`}>{order.orderStatus}</span><ChevronRight size={16} className="text-gray-400"/></div>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {order.items.slice(0,4).map((item,i) => <img key={i} src={(item as any).image||`https://placehold.co/56x56/FCE4EC/E91E63?text=P`} alt={(item as any).name} className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0"/>)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default OrdersPage
