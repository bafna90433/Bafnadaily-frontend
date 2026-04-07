import React from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Phone, Mail, MapPin, Heart } from 'lucide-react'
import useSettingsStore from '../../store/settingsStore'

const Footer: React.FC = () => {
  const { settings } = useSettingsStore()
  const siteName = settings.siteName || 'Reteiler'
  
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-6 hidden lg:block">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{siteName[0].toUpperCase()}</span>
            </div>
            <span className="font-heading font-bold text-xl text-white">{siteName}</span>
          </div>
          <p className="text-sm leading-relaxed mb-4">{settings.siteTagline || 'Trending gifts, keychains, accessories & more. Your one-stop gift shop!'}</p>
          <a href="#" className="inline-flex p-2 bg-gray-800 rounded-lg hover:bg-primary transition-colors"><Instagram size={18} /></a>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Categories</h4>
          <ul className="space-y-2 text-sm">
            {['🔑 Keychains','👗 Women Accessories','👜 Fashion','💄 Beauty','🎁 Gifts','💕 Cute Items'].map(c => (
              <li key={c}><Link to="#" className="hover:text-primary transition-colors">{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[['Home','/'],['Under ₹199','/products?maxPrice=199'],['Under ₹299','/products?maxPrice=299'],['Track Order','/orders'],['Wishlist','/wishlist']].map(([l,h]) => (
              <li key={l}><Link to={h} className="hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone size={15} /> {settings.supportPhone || '+91 XXXXXXXXXX'}</li>
            <li className="flex items-center gap-2"><Mail size={15} /> {settings.supportEmail || 'support@reteiler.in'}</li>
            <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5" /> India 🇮🇳</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-gray-800 flex justify-between items-center text-xs">
        <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        <p className="flex items-center gap-1">Made with <Heart size={12} className="text-primary fill-primary" /> in India</p>
        <div className="flex gap-4">
          <Link to="#" className="hover:text-primary">Privacy</Link>
          <Link to="#" className="hover:text-primary">Terms</Link>
          <Link to="#" className="hover:text-primary">Returns</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
