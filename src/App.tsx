import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import BottomNav from './components/layout/BottomNav'
import WhatsAppButton from './components/common/WhatsAppButton'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import WishlistPage from './pages/WishlistPage'
import SearchPage from './pages/SearchPage'
import NotFoundPage from './pages/NotFoundPage'
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

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 2500, style: { fontFamily: 'DM Sans', fontSize: '14px' } }} />
      <TrackerInit />
      <Navbar />
      <main className="min-h-screen pb-20 md:pb-0">
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
