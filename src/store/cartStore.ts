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
    const previousCart = get().cart
    const previousCount = get().count
    const previousHasNewItem = get().hasNewItem

    // 1. Build Optimistic State
    let newItems = [...(previousCart?.items || [])]
    const existingIndex = newItems.findIndex(i => i.product?._id === product._id)
    
    if (existingIndex !== -1) {
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + quantity }
    } else {
      newItems.push({
        _id: `temp-${Date.now()}`, // Temporary ID for instant UI rendering
        product,
        quantity,
        price: product.price,
        variant
      } as CartItem)
    }

    const optimisticCart = { ...previousCart, items: newItems } as Cart
    const optimisticCount = newItems.reduce((a, b) => a + b.quantity, 0)

    // 2. Apply Optimistic Update & Instant Feedback
    set({ cart: optimisticCart, count: optimisticCount, hasNewItem: true })
    toast.success('Added to cart! 🛒', { id: `add-${product._id}` }) 

    try {
      const res = await api.post('/cart/add', { productId: product._id, quantity, variant })
      const cart = res.data.cart as Cart
      const count = cart.items?.reduce((a, b) => a + b.quantity, 0) || 0
      
      // 3. Sync with real data from server
      set({ cart, count, hasNewItem: true })
      return true
    } catch (err: any) {
      // Rollback on failure
      set({ cart: previousCart, count: previousCount, hasNewItem: previousHasNewItem })
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
  
  setHasNewItem: (val: boolean) => {
    set({ hasNewItem: val })
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
