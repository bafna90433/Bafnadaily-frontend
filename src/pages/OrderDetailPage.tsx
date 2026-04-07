import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, MapPin } from 'lucide-react'
import api from '../utils/api'
import { Order } from '../types'
import toast from 'react-hot-toast'

const STEPS = ['placed','confirmed','processing','shipped','delivered']
const SC: Record<string,string> = { placed:'bg-blue-100 text-blue-700',confirmed:'bg-purple-100 text-purple-700',processing:'bg-yellow-100 text-yellow-700',shipped:'bg-orange-100 text-orange-700',delivered:'bg-green-100 text-green-700',cancelled:'bg-red-100 text-red-700' }

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{id:string}>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => navigate('/orders')).finally(() => setLoading(false)) }, [id])

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return
    try { const res = await api.put(`/orders/${id}/cancel`,{reason:'Cancelled by user'}); setOrder(res.data.order); toast.success('Order cancelled') }
    catch (err: any) { toast.error(err.response?.data?.message || 'Cannot cancel') }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-96 skeleton rounded-2xl"/></div>
  if (!order) return null

  const stepIdx = STEPS.indexOf(order.orderStatus)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm font-medium"><ArrowLeft size={16}/> Back to Orders</button>
      <div className="flex items-center justify-between mb-5"><div><h1 className="text-xl font-bold">#{order.orderNumber}</h1><p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN',{dateStyle:'long'})}</p></div><span className={`badge ${SC[order.orderStatus]||'bg-gray-100'} capitalize text-sm`}>{order.orderStatus}</span></div>

      {order.orderStatus !== 'cancelled' && (
        <div className="card p-5 mb-4">
          <div className="flex items-center">
            {STEPS.map((s,i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i<=stepIdx?'bg-primary text-white':'bg-gray-100 text-gray-400'}`}>{i<stepIdx?<CheckCircle size={14}/>:i+1}</div>
                  <p className="text-[9px] mt-1 text-gray-500 capitalize text-center">{s}</p>
                </div>
                {i<STEPS.length-1 && <div className={`flex-1 h-1 mx-0.5 rounded ${i<stepIdx?'bg-primary':'bg-gray-100'}`}/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 mb-4"><h3 className="font-bold mb-3 text-sm">Items</h3><div className="space-y-3">{order.items.map((item,i)=>(
        <div key={i} className="flex gap-3">
          <img src={(item as any).image||`https://placehold.co/56x56/FCE4EC/E91E63?text=P`} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
          <div className="flex-1"><p className="font-medium text-sm line-clamp-1">{(item as any).name}</p>{(item as any).variant&&<p className="text-xs text-gray-400">{(item as any).variant}</p>}<p className="text-sm mt-1">₹{item.price} × {item.quantity} = <strong>₹{item.price*item.quantity}</strong></p></div>
        </div>
      ))}</div></div>

      <div className="card p-4 mb-4"><h3 className="font-bold mb-2 text-sm flex items-center gap-1"><MapPin size={14} className="text-primary"/>Delivery Address</h3><p className="text-sm text-gray-600">{order.shippingAddress.name} · {order.shippingAddress.phone}</p><p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2?`, ${order.shippingAddress.addressLine2}`:''}</p><p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p></div>

      <div className="card p-4 mb-4"><h3 className="font-bold mb-3 text-sm">Payment</h3><div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{order.subtotal}</span></div><div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingCharge===0?'FREE':'₹'+order.shippingCharge}</span></div>{order.discount>0&&<div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}<hr/><div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{order.total}</span></div><div className="flex justify-between"><span className="text-gray-500">Method</span><span className="uppercase text-orange-500 font-bold">{order.paymentMethod}</span></div></div></div>

      {['placed','confirmed'].includes(order.orderStatus) && <button onClick={cancel} className="w-full border-2 border-red-200 text-red-500 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">Cancel Order</button>}
    </div>
  )
}

export default OrderDetailPage
