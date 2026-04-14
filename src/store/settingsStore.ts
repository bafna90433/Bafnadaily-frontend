import { create } from 'zustand'
import api from '../utils/api'

interface HomepageSections {
  heroBanner: boolean
  categories: boolean
  featuresBar: boolean
  trendingProducts: boolean
  newArrivals: boolean
  featuredProducts: boolean
  promoBanners: boolean
  underPriceBanner: boolean
  giftComboBanner: boolean
}

interface MOQPolicy {
  belowPrice: number
  belowPriceQty: number
  abovePriceQty: number
}

interface SiteSettings {
  siteName: string
  siteTagline: string
  siteLogo: string
  favicon: string
  whatsappNumber: string
  whatsappEnabled: boolean
  supportEmail: string
  supportPhone: string
  homepageSections: HomepageSections
  codEnabled: boolean
  codAdvancePercent: number
  codFlatCharge: number
  upiEnabled: boolean
  upiId: string
  freeShippingAbove: number
  standardShippingCharge: number
  giftWrapCharge: number
  promoText: string
  b2bEnabled: boolean
  moqPolicy: MOQPolicy
  maintenanceMode: boolean
  maintenanceMessage: string
  razorpayEnabled: boolean
  razorpayKeyId: string
  shiprocketEnabled: boolean
  homeLayout: number
  hapticFeedback: boolean
}

const DEFAULT: SiteSettings = {
  siteName: 'Reteiler',
  siteTagline: 'Gifts & Accessories',
  siteLogo: '',
  favicon: '',
  whatsappNumber: '7550350036',
  whatsappEnabled: true,
  supportEmail: 'support@reteiler.in',
  supportPhone: '',
  homepageSections: {
    heroBanner: true, categories: true, featuresBar: true,
    trendingProducts: true, newArrivals: true, featuredProducts: true,
    promoBanners: true, underPriceBanner: true, giftComboBanner: true,
  },
  codEnabled: true,
  codAdvancePercent: 30,
  codFlatCharge: 0,
  upiEnabled: true,
  upiId: '',
  freeShippingAbove: 499,
  standardShippingCharge: 49,
  giftWrapCharge: 29,
  promoText: '🚚 Free Delivery on orders above ₹499 | COD Available 🎁',
  b2bEnabled: true,
  moqPolicy: { belowPrice: 60, belowPriceQty: 3, abovePriceQty: 2 },
  maintenanceMode: false,
  maintenanceMessage: '',
  razorpayEnabled: false,
  razorpayKeyId: '',
  shiprocketEnabled: false,
  homeLayout: 1,
  hapticFeedback: true,
}

interface SettingsState {
  settings: SiteSettings
  loaded: boolean
  fetchSettings: () => Promise<void>
  getMOQ: (price: number) => number
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT,
  loaded: false,

  fetchSettings: async () => {
    try {
      const res = await api.get('/settings/public')
      set({ settings: { ...DEFAULT, ...res.data.settings }, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  getMOQ: (price: number) => {
    const { moqPolicy } = get().settings
    if (!moqPolicy) return 1
    return price < moqPolicy.belowPrice ? moqPolicy.belowPriceQty : moqPolicy.abovePriceQty
  },
}))

export default useSettingsStore
export type { SiteSettings, HomepageSections, MOQPolicy }
