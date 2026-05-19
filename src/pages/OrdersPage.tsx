import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ChevronRight, FileText, Truck, Star, BookOpen } from 'lucide-react'
import api from '../utils/api'
import { Order } from '../types'
import useAuthStore from '../store/authStore'
import useSettingsStore from '../store/settingsStore'
import toast from 'react-hot-toast'

// ── Rate Products Banner ───────────────────────────────────────────────────────
function RateProductsBanner() {
  const [pending, setPending] = useState<any[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get('/orders/pending-reviews').then(r => {
      if (r.data.success) setPending(r.data.pendingReviews)
    }).catch(() => { })
  }, [])

  const submitRating = async (productId: string) => {
    const rating = ratings[productId]
    if (!rating) return
    setSubmitting(s => ({ ...s, [productId]: true }))
    try {
      await api.post(`/products/${productId}/review`, { rating, comment: '' })
      toast.success('Thank you for your rating! ⭐')
      setPending(p => p.filter(x => x.productId !== productId))
    } catch {
      toast.error('Could not submit rating')
    } finally {
      setSubmitting(s => ({ ...s, [productId]: false }))
    }
  }

  if (!pending.length) return null

  return (
    <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">⭐</span>
        <div>
          <h3 className="font-black text-gray-800">Rate Your Recent Purchases</h3>
          <p className="text-xs text-gray-500">{pending.length} product{pending.length !== 1 ? 's' : ''} awaiting your review</p>
        </div>
      </div>
      <div className="space-y-3">
        {pending.map(item => (
          <div key={item.productId} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRatings(r => ({ ...r, [item.productId]: s }))}
                    className="transition-transform hover:scale-125 active:scale-110">
                    <Star size={20}
                      className={s <= (ratings[item.productId] || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 fill-gray-100'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => submitRating(item.productId)}
              disabled={!ratings[item.productId] || submitting[item.productId]}
              className="flex-shrink-0 px-4 py-2 bg-primary text-white text-xs font-black rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all"
            >
              {submitting[item.productId] ? '...' : 'Submit'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

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

  const getGstRate = (it: any) => {
    if (it.gstRate && it.gstRate > 0) return it.gstRate
    const name = (it.name || '').toLowerCase()
    const sku = (it.sku || '').toUpperCase()
    if (sku.startsWith('KEY') || name.includes('keychain') || name.includes('ring')) {
      return 5
    }
    return 18
  }

  const getItemCategory = (it: any) => {
    let catName = ''
    if (it.product?.category?.name) {
      catName = it.product.category.name.toLowerCase()
    } else {
      const name = (it.name || '').toLowerCase()
      const sku = (it.sku || '').toUpperCase()
      if (sku.startsWith('KEY') || name.includes('keychain') || name.includes('ring')) {
        return 'keychain'
      }
      return 'toys'
    }

    if (catName.includes('keychain') || catName.includes('keyring') || catName.includes('key')) {
      return 'keychain'
    }
    if (catName.includes('plush')) {
      return 'plushies'
    }
    if (catName.includes('toy')) {
      return 'toys'
    }
    return catName
  }

  const itemRows = order.items.map((it: any, i: number) => {
    return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b">${i + 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">
        <span style="font-weight:600;color:#1e293b">${it.name}</span>
        ${it.variant ? `<br><span style="font-size:11px;color:#94a3b8">${it.variant}</span>` : ''}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#475569">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#94a3b8;text-decoration:${(it.mrp && it.mrp > it.price) ? 'line-through' : 'none'}">₹${(it.mrp || it.price).toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;color:#475569">₹${it.price.toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">₹${(it.price * it.quantity).toLocaleString('en-IN')}</td>
    </tr>`
  }).join('')

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
        <th style="width:80px;text-align:right">MRP</th>
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
      ${(() => {
        const byCategory: Record<string, { rate: number; amount: number }> = {}
        ;(order.items||[]).forEach((it:any) => {
          const r = getGstRate(it); if(!r) return
          const cat = getItemCategory(it)
          const amt = it.price*it.quantity*r/(100+r)
          if (!byCategory[cat]) {
            byCategory[cat] = { rate: r, amount: 0 }
          }
          byCategory[cat].amount += amt
        })
        const entries = Object.entries(byCategory).sort(([a],[b])=>a.localeCompare(b))
        if(!entries.length) return ''
        return `<div style="border-top:1px dashed #e2e8f0;padding-top:6px;margin-top:4px">` +
          entries.map(([cat, info])=>`<div class="sum-row" style="color:#6366f1;font-size:11px"><span>${cat} GST @ ${info.rate}% (included)</span></div>`).join('') +
          `</div>`
      })()}
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

const printCatalog = (order: Order, settings: any) => {
  const win = window.open('', '_blank')
  if (!win) return

  const sa = order.shippingAddress as any
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const printDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const siteName = settings?.siteName || 'Store'
  const logo = settings?.siteLogo || ''
  const totalQty = (order.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 0), 0)

  const cardItems = order.items.map((it: any) => {
    const fallbackImage = `https://placehold.co/240x240/FCE4EC/E91E63?text=${encodeURIComponent(it.name.substring(0, 8))}`
    const imgUrl = it.image || fallbackImage
    return `
      <div class="card">
        <div class="qty-tag">${it.quantity} Pcs</div>
        <div class="img-box">
          <img src="${imgUrl}" alt="${it.name}" onerror="this.onerror=null;this.src='${fallbackImage}';"/>
        </div>
        <div class="info">
          <div class="title">${it.name}</div>
          ${it.sku ? `<div class="sku">SKU: ${it.sku}</div>` : `<div class="sku" style="background:#f1f5f9;color:#94a3b8;font-family:monospace">SKU: —</div>`}
          ${it.variant ? `<div class="variant">Variant: ${it.variant}</div>` : ''}
          <div class="price-box">
            <div>
              <span class="price-lbl">Wholesale Rate</span>
              <div class="price-val" style="color:#e91e63;font-size:14px;font-weight:800">₹${Number(it.price).toLocaleString('en-IN')}</div>
            </div>
            ${it.mrp && it.mrp > it.price ? `
            <div style="text-align:right">
              <span class="price-lbl">MRP</span>
              <div class="price-val" style="text-decoration:line-through;color:#94a3b8">₹${Number(it.mrp).toLocaleString('en-IN')}</div>
            </div>
            ` : ''}
          </div>
          <div style="margin-top:8px;font-size:11px;color:#64748b;display:flex;justify-content:space-between;background:#f8fafc;padding:5px 8px;border-radius:6px">
            <span>Qty: <strong style="color:#0f172a">${it.quantity} Pcs</strong></span>
            <span>Item Total: <strong style="color:#0f172a">₹${(it.price * it.quantity).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Order Catalog Reference \${order.orderNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:32px;font-size:13px}
    .wrap{max-width:1080px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #e91e63;margin-bottom:22px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
    .brand{display:flex;align-items:center;gap:12px}
    .brand img{height:52px;object-fit:contain}
    .logo-box{width:48px;height:48px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px}
    .brand-name{font-size:22px;font-weight:800;letter-spacing:-0.5px}
    .brand-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .inv-right{text-align:right}
    .inv-right h1{font-size:26px;font-weight:900;color:#e91e63;letter-spacing:1px}
    .inv-right p{font-size:12px;color:#64748b;margin-top:3px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
    .mc{background:#fff;border-radius:12px;padding:15px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
    .mc h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px}
    .mc p{font-size:13px;line-height:1.7}
    
    .grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;margin-bottom:24px}
    .card{background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:15px;display:flex;flex-direction:column;position:relative;box-shadow:0 1px 3px rgba(0,0,0,0.02);break-inside:avoid;page-break-inside:avoid}
    .img-box{width:100%;height:180px;background:#f8fafc;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:12px;border:1px solid #f1f5f9}
    .img-box img{max-width:100%;max-height:100%;object-fit:contain}
    .info{flex:1;display:flex;flex-direction:column}
    .title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:36px}
    .sku{display:inline-block;font-size:10px;font-weight:700;color:#6366f1;background:#e0e7ff;padding:2px 8px;border-radius:4px;margin-bottom:8px;width:fit-content;font-family:monospace}
    .variant{font-size:11px;color:#64748b;margin-bottom:8px;font-style:italic}
    
    .price-box{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0}
    .price-lbl{font-size:10px;color:#94a3b8;display:block;text-transform:uppercase;font-weight:600;letter-spacing:0.5px}
    .price-val{font-size:12px;font-weight:600;color:#0f172a}
    
    .qty-tag{position:absolute;top:10px;right:10px;background:#e91e63;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;box-shadow:0 2px 4px rgba(233,30,99,0.3);z-index:10}
    
    .foot{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    .no-print{text-align:center;margin-top:20px;margin-bottom:30px}
    .pbtn{padding:12px 30px;background:#e91e63;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 6px rgba(233,30,99,0.2);margin-right:10px}
    .cbtn{padding:12px 24px;background:#64748b;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
    
    @media print{
      body{background:#fff;padding:0}
      .head{box-shadow:none;border:none;padding:10px 0;border-bottom:3px solid #e91e63;border-radius:0}
      .mc{box-shadow:none;padding:10px 0}
      .card{box-shadow:none;border:1px solid #cbd5e1}
      .no-print{display:none}
      .grid{grid-template-columns:repeat(3, 1fr);gap:15px}
    }
  </style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="brand">
      \${logo ? \`<img src="\${logo}" alt="Logo"/>\` : \`<div style="width:48px;height:48px;background:#e91e63;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:20px">B</div>\`}
      <div>
        <div class="brand-sub" style="font-size:16px;font-weight:800;color:#1e293b">Product Catalog Reference Sheet</div>
      </div>
    </div>
    <div class="inv-right">
      <h1>ORDER CATALOG</h1>
      <p>Order #: <strong>\${order.orderNumber}</strong></p>
      <p>Date: \${orderDate}</p>
      <p>Printed: \${printDate}</p>
      <p style="margin-top:4px;font-size:12px;color:#e91e63">Items: <strong>\${(order.items || []).length}</strong> | Total Qty: <strong>\${totalQty} Pcs</strong></p>
    </div>
  </div>

  <div class="meta">
    <div class="mc">
      <h4>Customer Details</h4>
      <p><strong>Shop/Customer: \${sa?.name || '—'}</strong><br/>
      📞 Phone: \${sa?.phone || '—'}</p>
    </div>
    <div class="meta-card" style="background:#fff;border-radius:12px;padding:15px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
      <h4>Shipping Address</h4>
      <p>\${sa?.addressLine1 || '—'}\${sa?.addressLine2 ? ', ' + sa.addressLine2 : ''}<br/>
      \${sa?.city || ''}, \${sa?.state || ''}<br/>
      PIN: \${sa?.pincode || '—'}</p>
    </div>
  </div>

  <div class="grid">\${cardItems}</div>

  <div class="foot">
    <p style="font-size:13px;font-weight:600;color:#475569;margin-bottom:4px">Catalog Reference for Order #\${order.orderNumber}</p>
    <p>This catalog contains products ordered by you. Thank you for your business!</p>
  </div>
</div>
<div class="no-print">
  <button class="pbtn" onclick="window.print()">🖨️ Print Catalog / Save PDF</button>
  <button class="cbtn" onclick="window.close()">Close Window</button>
</div>
</body></html>`

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
      {Array(3).fill(0).map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
    </div>
  )

  if (!orders.length) return (
    <div className="max-w-md mx-auto text-center py-24 px-4">
      <Package size={64} className="text-gray-200 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">No orders yet</h2>
      <Link to="/products" className="btn-primary mt-4">Start Shopping</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">My Orders</h1>
      <RateProductsBanner />
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.items.length} item(s) · <strong>₹{order.total?.toLocaleString('en-IN')}</strong>
                </p>
                {(order as any).trackingNumber && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <Truck size={11} /> {(order as any).courierName}: {(order as any).trackingNumber}
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
                  <FileText size={12} /> Invoice
                </button>
                <button
                  onClick={() => printCatalog(order, settings)}
                  className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  <BookOpen size={12} /> Catalog
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
                View Details <ChevronRight size={14} />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() => printInvoice(order, settings)}
                  className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-primary hover:text-white text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  <FileText size={13} /> Invoice
                </button>
                <button
                  onClick={() => printCatalog(order, settings)}
                  className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-indigo-600 hover:text-white text-gray-600 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                >
                  <BookOpen size={13} /> Catalog
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrdersPage
