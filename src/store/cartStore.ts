import { create } from 'zustand'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Cart, Product, CartItem } from '../types'

interface CartState {
  cart: Cart | null
  count: number
  loading: boolean
  hasNewItem: boolean
  fetchCart: () => Promise<void>
  addToCart: (product: Product, quantity?: number, variant?: string) => Promise<boolean>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  setHasNewItem: (val: boolean) => void
  getTotal: () => { subtotal: number; shipping: number; total: number }
}

// ── Per-item debounce maps ────────────────────────────────────────────────────
// UI updates instantly on every click.
// API fires only after 400ms pause per item (last-write-wins).
// Stale server responses from earlier in-flight calls are ignored completely.
const updateTimers  = new Map<string, ReturnType<typeof setTimeout>>()
const pendingQty    = new Map<string, number>()
const snapshotCache = new Map<string, { cart: Cart | null; count: number }>()

const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  count: 0,
  loading: false,
  hasNewItem: false,

  fetchCart: async () => {
    try {
      const res = await api.get('/cart')
      const cart = res.data.cart as Cart
      const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
      set({ cart, count })
    } catch {}
  },

  addToCart: async (product, quantity = 1, variant = '') => {
    const previousCart  = get().cart
    const previousCount = get().count
    const previousHasNewItem = get().hasNewItem

    // Optimistic: build new items list
    const newItems = [...(previousCart?.items || [])]
    const idx = newItems.findIndex(i => i.product?._id === product._id)
    if (idx !== -1) {
      newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + quantity }
    } else {
      newItems.push({
        _id: `temp-${Date.now()}`,
        product,
        quantity,
        price: product.price,
        variant,
      } as CartItem)
    }

    const optimisticCart  = { ...previousCart, items: newItems } as Cart
    const optimisticCount = newItems.reduce((a, b) => a + b.quantity, 0)
    set({ cart: optimisticCart, count: optimisticCount, hasNewItem: true })
    toast.success('Added to cart! 🛒', { id: `add-${product._id}` })

    try {
      const res   = await api.post('/cart/add', { productId: product._id, quantity, variant })
      const cart  = res.data.cart as Cart
      const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
      set({ cart, count, hasNewItem: true })
      return true
    } catch (err: any) {
      set({ cart: previousCart, count: previousCount, hasNewItem: previousHasNewItem })
      toast.error(err.response?.data?.message || 'Failed to add')
      return false
    }
  },

  // ── Debounced updateItem ──────────────────────────────────────────────────
  updateItem: async (itemId, quantity) => {
    // 1. Instant UI update — every click feels snappy
    const currentCart = get().cart
    if (currentCart) {
      const newItems = currentCart.items.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      )
      set({
        cart: { ...currentCart, items: newItems },
        count: newItems.reduce((a, b) => a + b.quantity, 0),
      })
    }

    // 2. Record latest desired qty for this item
    pendingQty.set(itemId, quantity)

    // 3. Save rollback snapshot only on the FIRST click of a burst
    if (!snapshotCache.has(itemId)) {
      snapshotCache.set(itemId, { cart: currentCart, count: get().count })
    }

    // 4. Cancel previous timer for this item
    const prev = updateTimers.get(itemId)
    if (prev) clearTimeout(prev)

    // 5. Schedule a single API call after 400ms of silence
    const timer = setTimeout(async () => {
      updateTimers.delete(itemId)

      const finalQty = pendingQty.get(itemId)
      const snapshot = snapshotCache.get(itemId)
      pendingQty.delete(itemId)
      snapshotCache.delete(itemId)

      if (finalQty === undefined) return

      try {
        const res   = await api.put('/cart/update', { itemId, quantity: finalQty })
        const cart  = res.data.cart as Cart
        const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
        // Only sync from server if no new burst has started for this item
        if (!updateTimers.has(itemId)) {
          set({ cart, count })
        }
      } catch {
        if (snapshot) set({ cart: snapshot.cart, count: snapshot.count })
        toast.error('Failed to update quantity')
      }
    }, 400)

    updateTimers.set(itemId, timer)
  },

  removeItem: async (itemId) => {
    // Cancel any pending debounced update before removing
    const prev = updateTimers.get(itemId)
    if (prev) { clearTimeout(prev); updateTimers.delete(itemId) }
    pendingQty.delete(itemId)
    snapshotCache.delete(itemId)

    // Optimistic remove
    const currentCart = get().cart
    if (currentCart) {
      const newItems = currentCart.items.filter(i => i._id !== itemId)
      set({
        cart: { ...currentCart, items: newItems },
        count: newItems.reduce((a, b) => a + b.quantity, 0),
      })
    }

    try {
      await api.delete(`/cart/remove/${itemId}`)
      await get().fetchCart()
      toast.success('Removed from cart')
    } catch {
      await get().fetchCart()
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart/clear')
      set({ cart: { items: [] }, count: 0 })
    } catch {}
  },

  setHasNewItem: (val: boolean) => {
    set({ hasNewItem: val })
  },

  getTotal: () => {
    const cart = get().cart
    if (!cart?.items?.length) return { subtotal: 0, shipping: 0, total: 0 }
    const subtotal = cart.items.reduce(
      (a, b) => a + (b.price || b.product?.price || 0) * b.quantity,
      0
    )
    return { subtotal, shipping: 0, total: subtotal }
  },
}))

export default useCartStore
