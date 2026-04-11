import { create } from 'zustand'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Cart } from '../types'

interface CartState {
  cart: Cart | null
  count: number
  loading: boolean
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number, variant?: string) => Promise<boolean>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotal: () => { subtotal: number; shipping: number; total: number }
}

const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  count: 0,
  loading: false,

  fetchCart: async () => {
    try {
      const res = await api.get('/cart')
      const cart = res.data.cart as Cart
      const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
      set({ cart, count })
    } catch {}
  },

  addToCart: async (productId, quantity = 1, variant = '') => {
    try {
      const res = await api.post('/cart/add', { productId, quantity, variant })
      const cart = res.data.cart as Cart
      const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
      set({ cart, count })
      toast.success('Added to cart! 🛒')
      return true
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add')
      return false
    }
  },

  updateItem: async (itemId, quantity) => {
    const previousCart = get().cart
    const previousCount = get().count

    // Optimistic Update
    if (get().cart) {
      const newItems = get().cart!.items.map(item => 
        item._id === itemId ? { ...item, quantity } : item
      )
      const newCart = { ...get().cart!, items: newItems }
      const newCount = newItems.reduce((a, b) => a + b.quantity, 0)
      set({ cart: newCart, count: newCount })
    }

    try {
      const res = await api.put('/cart/update', { itemId, quantity })
      const cart = res.data.cart as Cart
      const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
      set({ cart, count })
    } catch {
      // Rollback on failure
      set({ cart: previousCart, count: previousCount })
       toast.error('Failed to update. Syncing...')
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/remove/${itemId}`)
      await get().fetchCart()
      toast.success('Removed from cart')
    } catch {}
  },

  clearCart: async () => {
    try {
      await api.delete('/cart/clear')
      set({ cart: { items: [] }, count: 0 })
    } catch {}
  },

  getTotal: () => {
    const cart = get().cart
    if (!cart?.items?.length) return { subtotal: 0, shipping: 0, total: 0 }
    const subtotal = cart.items.reduce((a, b) => a + (b.price || b.product?.price || 0) * b.quantity, 0)
    const shipping = subtotal > 499 ? 0 : 49
    return { subtotal, shipping, total: subtotal + shipping }
  },
}))

export default useCartStore
