import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, MapPin, FileText, Truck, ExternalLink } from 'lucide-react'
import api from '../utils/api'
import { Order } from '../types'
import useSettingsStore from '../store/settingsStore'
import toast from 'react-hot-toast'

const STEPS = ['confirmed', 'shipped', 'delivered']
const STEP_LABELS = ['Confirmed', 'Shipped', 'Delivered']

const SC: Record<string,string> = {
  placed:'bg-blue-100 text-blue-700', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-yellow-100 text-yellow-700', shipped:'bg-orange-100 text-orange-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700',
}

const statusLabel = (s: string) => {
  if (s === 'placed' || s === 'confirmed' || s === 'processing') return 'Confirmed'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const printInvoice = (order: Order, settings: any) => {
  const win = window.open('', '_blank')
  if (!win) return

  const sa = order.shippingAddress as any
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
  const siteName = settings?.siteName || 'Store'
  const logo = settings?.siteLogo || ''

  const itemRows = order.items.map((it: any, i: number) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">
        <span style="font-weight:600;color:#1e293b">${it.name}</span>
        ${it.variant ? `<br><span style="font-size:11px;color:#94a3b8">${it.variant}</span>` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#475569">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#475569">₹${it.price.toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">₹${(it.price * it.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${order.orderNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;color:#1e293b;padding:32px;font-size:13px}
    .wrap{max-width:860px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #e91e63;margin-bottom:24px}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{height:52px;object-fit:contain}
    .brand-name{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .inv-title{text-align:right}
    .inv-title h1{font-size:28px;font-weight:900;color:#e91e63;letter-spacing:2px}
    .inv-title p{font-size:12px;color:#64748b;margin-top:4px}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:24px}
    .meta-card{background:#f8fafc;border-radius:12px;padding:14px 16px}
    .meta-card h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    .meta-card p{font-size:13px;color:#1e293b;line-height:1.7}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:linear-gradient(135deg,#e91e63,#c2185b)}
    th{padding:11px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#fff}
    th:last-child,th:nth-child(4){text-align:right}
    th:nth-child(3){text-align:center}
    th:nth-child(1){text-align:center;width:40px}
    .summary{margin-left:auto;width:260px}
    .sum-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
    .sum-total{display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;color:#1e293b;border-top:2px solid #1e293b;margin-top:4px}
    .track-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:12px;color:#15803d}
    .foot{text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8}
    .no-print{text-align:center;margin-top:24px}
    .print-btn{padding:12px 32px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
    @media print{body{padding:16px}.no-print{display:none}}
  </style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="${siteName}"/>` : `<div style="width:48px;height:48px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px">${siteName[0]}</div>`}
      <div>
        <div class="brand-name">${siteName}</div>
        <div class="brand-sub">Tax Invoice / Proforma Invoice</div>
      </div>
    </div>
    <div class="inv-title">
      <h1>INVOICE</h1>
      <p>${order.orderNumber}</p>
      <p style="margin-top:4px;color:#64748b">Date: ${orderDate}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-card">
      <h4>Bill To</h4>
      <p><strong>${sa?.name || '—'}</strong><br/>
      📞 ${sa?.phone || '—'}
      </p>
    </div>
    <div class="meta-card">
      <h4>Ship To</h4>
      <p>${sa?.addressLine1 || '—'}${sa?.addressLine2 ? ', ' + sa.addressLine2 : ''}<br/>
      ${sa?.city || ''}, ${sa?.state || ''}<br/>
      PIN: ${sa?.pincode || '—'}</p>
    </div>
    <div class="meta-card">
      <h4>Order Info</h4>
      <p>Order #: <strong>${order.orderNumber}</strong><br/>
      Date: ${orderDate}<br/>
      Payment: <strong style="color:${order.paymentMethod === 'cod' ? '#f59e0b' : '#10b981'}">${order.paymentMethod?.toUpperCase()}</strong><br/>
      Status: <strong>${statusLabel(order.orderStatus)}</strong></p>
    </div>
  </div>

  ${(order as any).trackingNumber ? `
  <div class="track-box">
    🚚 <strong>Shipped via ${(order as any).courierName || 'Courier'}</strong> &nbsp;·&nbsp;
    Tracking ID: <strong>${(order as any).trackingNumber}</strong>
  </div>` : ''}

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="summary">
    <div class="sum-row"><span>Subtotal</span><span>₹${order.subtotal?.toLocaleString('en-IN') || '—'}</span></div>
    <div class="sum-row"><span>Shipping</span><span>${(order.shippingCharge || 0) === 0 ? '<span style="color:#10b981;font-weight:600">FREE</span>' : '₹' + order.shippingCharge}</span></div>
    ${(order.discount || 0) > 0 ? `<div class="sum-row" style="color:#10b981"><span>Discount</span><span>-₹${order.discount?.toLocaleString('en-IN')}</span></div>` : ''}
    <div class="sum-total"><span>Grand Total</span><span>₹${order.total?.toLocaleString('en-IN')}</span></div>
  </div>

  <div class="foot">
    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:4px">Thank you for shopping with <strong>${siteName}</strong>! 🎉</p>
    <p>This is a computer generated invoice. For queries, contact us.</p>
  </div>
</div>
<div class="no-print">
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>
</body></html>`

  win.document.write(html)
  win.document.close()
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => navigate('/orders')).finally(() => setLoading(false))
  }, [id])

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return
    try {
      const res = await api.put(`/orders/${id}/cancel`, { reason: 'Cancelled by user' })
      setOrder(res.data.order)
      toast.success('Order cancelled')
    } catch (err: any) { toast.error(err.response?.data?.message || 'Cannot cancel') }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-96 skeleton rounded-2xl"/></div>
  if (!order) return null

  const displayStatus = order.orderStatus === 'placed' || order.orderStatus === 'processing' ? 'confirmed' : order.orderStatus
  const stepIdx = STEPS.indexOf(displayStatus)
  const trackingUrl = (order as any).courierName?.toLowerCase().includes('delhivery') && (order as any).trackingNumber
    ? `https://www.delhivery.com/track-v2/package/${(order as any).trackingNumber}`
    : (order as any).trackingNumber
    ? `https://www.google.com/search?q=${encodeURIComponent((order as any).trackingNumber + ' tracking')}`
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm font-medium">
        <ArrowLeft size={16}/> Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">#{order.orderNumber}</h1>
          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle:'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${SC[order.orderStatus] || 'bg-gray-100'} capitalize text-sm`}>
            {statusLabel(order.orderStatus)}
          </span>
          <button onClick={() => printInvoice(order, settings)}
            className="flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            <FileText size={13}/> Invoice
          </button>
        </div>
      </div>

      {/* Progress */}
      {order.orderStatus !== 'cancelled' && (
        <div className="card p-5 mb-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= stepIdx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < stepIdx ? <CheckCircle size={16}/> : i + 1}
                  </div>
                  <p className="text-[10px] mt-1.5 text-gray-500 text-center font-medium">{STEP_LABELS[i]}</p>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-1.5 mx-1 rounded-full transition-colors ${i < stepIdx ? 'bg-primary' : 'bg-gray-100'}`}/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Tracking */}
      {(order as any).trackingNumber && (
        <div className="card p-4 mb-4 bg-orange-50 border border-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-orange-500"/>
              <div>
                <p className="font-bold text-sm text-orange-800">{(order as any).courierName || 'Courier'}</p>
                <p className="text-xs text-orange-600">AWB: {(order as any).trackingNumber}</p>
              </div>
            </div>
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                Track Live <ExternalLink size={11}/>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card p-4 mb-4">
        <h3 className="font-bold mb-3 text-sm">Items ({order.items.length})</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <img src={(item as any).image || `https://placehold.co/56x56/FCE4EC/E91E63?text=P`}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-2">{(item as any).name}</p>
                {(item as any).variant && <p className="text-xs text-gray-400">{(item as any).variant}</p>}
                <p className="text-sm mt-1">₹{item.price.toLocaleString('en-IN')} × {item.quantity} = <strong>₹{(item.price * item.quantity).toLocaleString('en-IN')}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="card p-4 mb-4">
        <h3 className="font-bold mb-2 text-sm flex items-center gap-1"><MapPin size={14} className="text-primary"/> Delivery Address</h3>
        <p className="text-sm text-gray-600">{order.shippingAddress.name} · {order.shippingAddress.phone}</p>
        <p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</p>
        <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
      </div>

      {/* Payment Summary */}
      <div className="card p-4 mb-4">
        <h3 className="font-bold mb-3 text-sm">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={order.shippingCharge === 0 ? 'text-green-600 font-semibold' : ''}>{order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}</span></div>
          {(order.discount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount?.toLocaleString('en-IN')}</span></div>}
          <hr/>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{order.total?.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="uppercase text-orange-500 font-bold">{order.paymentMethod}</span></div>
        </div>
      </div>

      {/* Invoice Download */}
      <button onClick={() => printInvoice(order, settings)}
        className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary py-3 rounded-xl font-semibold hover:bg-primary hover:text-white transition-colors mb-3">
        <FileText size={16}/> Download Invoice
      </button>

      {/* Cancel */}
      {['placed','confirmed'].includes(order.orderStatus) && (
        <button onClick={cancel} className="w-full border-2 border-red-200 text-red-500 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
          Cancel Order
        </button>
      )}
    </div>
  )
}

export default OrderDetailPage
