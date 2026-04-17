import React, { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import BottomNav from './components/layout/BottomNav'
import WhatsAppButton from './components/common/WhatsAppButton'

// Lazy load all pages — splits JS bundle per route
const HomePage = lazy(() => import('./pages/HomePage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"/>
  </div>
)
import useAuthStore from './store/authStore'
import useCartStore from './store/cartStore'
import useSettingsStore from './store/settingsStore'
import { useVisitorTracking } from './utils/useVisitorTracking'

const App: React.FC = () => {
  const { user } = useAuthStore()
  const { fetchCart } = useCartStore()
  const { fetchSettings, settings } = useSettingsStore()

  useEffect(() => { fetchSettings() }, [])
  useEffect(() => { if (user) fetchCart() }, [user])

  // Apply layout class to body for global full-width override
  useEffect(() => {
    const layout = settings.homeLayout || 4
    document.body.setAttribute('data-layout', String(layout))
    return () => document.body.removeAttribute('data-layout')
  }, [settings.homeLayout])

  // ── Meta Pixel ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!settings.metaPixelEnabled || !settings.metaPixelId) return
    if ((window as any).fbq) return // already loaded

    const pixelId = settings.metaPixelId
    const script = document.createElement('script')
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${pixelId}');
      fbq('track','PageView');
    `
    document.head.appendChild(script)

    // noscript fallback
    const noscript = document.createElement('noscript')
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`
    document.head.appendChild(noscript)
  }, [settings.metaPixelEnabled, settings.metaPixelId])

  // ── Google Analytics ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!settings.googleAnalyticsEnabled || !settings.googleAnalyticsId) return
    if (document.getElementById('ga-script')) return // already loaded

    const gaId = settings.googleAnalyticsId
    const script1 = document.createElement('script')
    script1.id = 'ga-script'
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script1)

    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `
    document.head.appendChild(script2)
  }, [settings.googleAnalyticsEnabled, settings.googleAnalyticsId])

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 2500, style: { fontFamily: 'DM Sans', fontSize: '14px' } }} />
      <TrackerInit />
      <Navbar />
      <main className="min-h-screen pb-20 md:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppButton />
    </BrowserRouter>
  )
}

// Small wrapper component to call tracking hook inside BrowserRouter context
const TrackerInit = () => { useVisitorTracking(); return null }


export default App
