import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Heart, Instagram, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import useSettingsStore from '../../store/settingsStore'

const Footer: React.FC = () => {
  const { settings } = useSettingsStore()
  const siteName = settings.siteName || 'Bafnadaily'
  const whatsapp = String(settings.whatsappNumber || '').replace(/\D/g, '')

  return (
    <footer className="border-t border-slate-800 bg-slate-950 pb-24 pt-14 text-slate-400 md:pb-8 md:pt-20">
      <div className="d2c-shell">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.25fr_0.75fr_0.75fr_1fr] md:gap-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              {settings.siteLogo ? <img src={settings.siteLogo} alt={siteName} className="h-11 w-auto object-contain brightness-0 invert" /> : <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-xl font-black text-white">{siteName[0].toUpperCase()}</div>}
              <div><p className="text-lg font-black tracking-tight text-white">{siteName}</p><p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Official store</p></div>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">{settings.siteTagline || 'Thoughtful gifts, playful accessories and everyday finds—chosen to make every little moment feel special.'}</p>
            <div className="mt-6 flex items-center gap-2">
              <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white transition hover:border-primary hover:bg-primary"><Instagram size={17} /></a>
              {whatsapp && <a href={`https://wa.me/91${whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-black text-white transition hover:border-emerald-500 hover:bg-emerald-500"><Phone size={14} /> WhatsApp us</a>}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-white">Shop</h4>
            <ul className="space-y-3 text-sm">
              {[['New arrivals', '/products?newArrival=true'], ['Trending now', '/products?trending=true'], ['Under ₹199', '/products?maxPrice=199'], ['Featured picks', '/products?featured=true'], ['All products', '/products']].map(([label, href]) => <li key={label}><Link to={href} className="transition hover:text-white">{label}</Link></li>)}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-white">Your account</h4>
            <ul className="space-y-3 text-sm">
              {[['My profile', '/profile'], ['My orders', '/orders'], ['Wishlist', '/wishlist'], ['Shopping cart', '/cart'], ['Sign in', '/login']].map(([label, href]) => <li key={label}><Link to={href} className="transition hover:text-white">{label}</Link></li>)}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-white">We’re here to help</h4>
            <div className="space-y-4 text-sm">
              {settings.supportPhone && <a href={`tel:${settings.supportPhone}`} className="flex items-center gap-3 transition hover:text-white"><Phone size={16} className="text-primary" /> {settings.supportPhone}</a>}
              {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-3 transition hover:text-white"><Mail size={16} className="text-primary" /> {settings.supportEmail}</a>}
              <p className="flex items-center gap-3"><MapPin size={16} className="text-primary" /> Delivering across India</p>
              <Link to="/orders" className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-primary hover:text-white">Track your order <ArrowUpRight size={13} /></Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Secure shopping · Made with <Heart size={12} className="fill-primary text-primary" /> in India</p>
          <div className="flex gap-5"><a href="#" className="hover:text-white">Privacy</a><a href="#" className="hover:text-white">Terms</a><a href="#" className="hover:text-white">Returns</a></div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
