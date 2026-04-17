export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  images: { url: string; fileId?: string; colorName?: string }[]
  category: { _id: string; name: string; slug: string }
  price: number
  mrp: number
  discount: number
  stock: number
  sku?: string
  barcode?: string
  variants: { name: string; value: string; additionalPrice: number }[]
  reviews: Review[]
  averageRating: number
  numReviews: number
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  giftWrapping: boolean
  tags: string[]
  colors: { name: string; hex: string }[]
  material?: string
  sold: number
  minQty: number
  perPiecePrice?: string
  perPacketText?: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  isActive: boolean
  featured: boolean
  sortOrder: number
  layoutType?: 'standard' | 'hanging'
  banner?: string
  isDashboardMain?: boolean
  parent?: any
}

export interface User {
  _id: string
  name: string
  phone: string
  email?: string
  avatar?: string
  addresses: Address[]
}

export interface Address {
  _id?: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

export interface CartItem {
  _id: string
  product: Product
  quantity: number
  variant?: string
  price: number
}

export interface Cart {
  items: CartItem[]
}

export interface OrderItem {
  product: string | Product
  name: string
  image?: string
  price: number
  quantity: number
  variant?: string
}

export interface Order {
  _id: string
  orderNumber: string
  user: string | User
  items: OrderItem[]
  shippingAddress: Address
  paymentMethod: 'cod' | 'online' | 'upi'
  paymentStatus: string
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  statusHistory: { status: string; note?: string; updatedAt: string }[]
  subtotal: number
  shippingCharge: number
  discount: number
  couponCode?: string
  total: number
  giftWrapping: boolean
  giftMessage?: string
  trackingNumber?: string
  createdAt: string
}

export interface Review {
  _id: string
  user: { _id: string; name: string; avatar?: string }
  rating: number
  comment: string
  images?: string[]
  createdAt: string
}

export interface Banner {
  _id: string
  title: string
  subtitle?: string
  image?: string
  link?: string
  type: 'hero' | 'promo' | 'category' | 'hanging'
  showOnMobile?: boolean
  showOnWebsite?: boolean
  isActive: boolean
  sortOrder: number
  category?: { _id: string; name: string; slug: string } | string | null
}
