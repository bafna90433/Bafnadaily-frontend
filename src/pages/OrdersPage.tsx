import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ChevronRight, FileText, Truck } from 'lucide-react'
import api from '../utils/api'
import { Order } from '../types'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'

const SC: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabel = (s: string) => {
  if (s === 'placed' || s === 'confirmed' || s === 'processing') return 'Confirmed'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const printInvoice = (order: Order, settings: any) => {
  const win = window.open('', '_blank')
  if (!win) return

  const sa = order.shippingAddress as any
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
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
    .meta-card p{font-size:13px;color:#1e293b;line-height:1.6}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:linear-gradient(135deg,#e91e63,#c2185b)}
    th{padding:11px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#fff}
    th:last-child,th:nth-child(3),th:nth-child(4){text-align:right}
    th:nth-child(1){text-align:center}
    .summary{margin-left:auto;width:260px}
    .sum-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
    .sum-total{display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;color:#1e293b;border-top:2px solid #1e293b;margin-top:4px}
    .track-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-top:16px;font-size:12px;color:#15803d}
    .foot{text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8}
    .no-print{text-align:center;margin-top:24px}
    .print-btn{padding:12px 32px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
    @media print{
      body{padding:16px}
      .no-print{display:none}
    }
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
      📞 ${sa?.phone || '—'}<br/>
      ${sa?.gstNumber ? `GST: ${sa.gstNumber}` : ''}
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

  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Product</th>
        <th style="width:60px;text-align:center">Qty</th>
        <th style="width:80px;text-align:right">Rate</th>
        <th style="width:100px;text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div style="flex:1">
      ${(order as any).trackingNumber ? `
        <div class="track-box">
          🚚 <strong>Shipped via ${(order as any).courierName || 'Courier'}</strong><br/>
          Tracking ID: <strong>${(order as any).trackingNumber}</strong>
        </div>` : ''}
    </div>
    <div class="summary">
      <div class="sum-row"><span>Subtotal</span><span>₹${order.subtotal?.toLocaleString('en-IN') || '—'}</span></div>
      <div class="sum-row"><span>Shipping</span><span>${(order.shippingCharge || 0) === 0 ? '<span style="color:#10b981;font-weight:600">FREE</span>' : '₹' + order.shippingCharge}</span></div>
      ${(order.discount || 0) > 0 ? `<div class="sum-row" style="color:#10b981"><span>Discount</span><span>-₹${order.discount?.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="sum-total"><span>Grand Total</span><span>₹${order.total?.toLocaleString('en-IN')}</span></div>
    </div>
  </div>

  <div class="foot">
    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:4px">Thank you for shopping with <strong>${siteName}</strong>! 🎉</p>
    <p>This is a computer generated invoice. For queries, contact us.</p>
  </div>
</div>
<div class="no-print">
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>
</body>
</html>`

  win.document.write(html)
  win.document.close()
}

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore()
  const { settings } = useSettingsStore()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    api.get('/orders/my').then(r => setOrders(r.data.orders)).finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {Array(3).fill(0).map((_,i) => <div key={i} className="h-28 skeleton rounded-2xl"/>)}
    </div>
  )

  if (!orders.length) return (
    <div className="max-w-md mx-auto text-center py-24 px-4">
      <Package size={64} className="text-gray-200 mx-auto mb-4"/>
      <h2 className="text-xl font-bold mb-2">No orders yet</h2>
      <Link to="/products" className="btn-primary mt-4">Start Shopping</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.items.length} item(s) · <strong>₹{order.total?.toLocaleString('en-IN')}</strong>
                </p>
                {(order as any).trackingNumber && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <Truck size={11}/> {(order as any).courierName}: {(order as any).trackingNumber}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${SC[order.orderStatus] || 'bg-gray-100 text-gray-600'} capitalize`}>
                  {statusLabel(order.orderStatus)}
                </span>
                <button
                  onClick={() => printInvoice(order, settings)}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <FileText size={12}/> Invoice
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto">
              {order.items.slice(0, 4).map((item, i) => (
                <img key={i}
                  src={(item as any).image || `https://placehold.co/56x56/FCE4EC/E91E63?text=P`}
                  alt={(item as any).name}
                  className="w-14 h-14 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <Link to={`/orders/${order._id}`} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View Details <ChevronRight size={14}/>
              </Link>
              <button
                onClick={() => printInvoice(order, settings)}
                className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-primary hover:text-white text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition-colors"
              >
                <FileText size={13}/> Download Invoice
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrdersPage
