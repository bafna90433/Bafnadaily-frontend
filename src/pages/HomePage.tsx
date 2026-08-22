import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Gift,
  PackageCheck, RotateCcw, ShieldCheck, ShoppingBag, Sparkles, Star,
  Truck,
} from 'lucide-react'
import api from '../utils/api'
import { ik } from '../utils/imagekit'
import { Banner, Category, Product } from '../types'
import ProductCard from '../components/product/ProductCard'
import useCartStore from '../store/cartStore'
import useSettingsStore from '../store/settingsStore'

const HOME_DEFAULTS = {
  heroEyebrow: 'Made for your everyday moments',
  heroTitle: 'Little things that make life',
  heroHighlight: 'more delightful.',
  heroSubtitle: 'Discover playful accessories, thoughtful gifts and everyday finds—curated to feel special and priced to make you smile.',
  primaryCtaLabel: 'Shop new arrivals',
  primaryCtaLink: '/products?newArrival=true',
  secondaryCtaLabel: 'Explore all products',
  secondaryCtaLink: '/products',
  categoryEyebrow: 'Find your favourite',
  categoryTitle: 'Shop by category',
  trendingEyebrow: 'Loved right now',
  trendingTitle: 'Trending picks',
  newArrivalsEyebrow: 'Just landed',
  newArrivalsTitle: 'Fresh arrivals',
  featuredEyebrow: 'Handpicked for you',
  featuredTitle: 'Bafna favourites',
  promoOneEyebrow: 'Small price, big joy',
  promoOneTitle: 'Cute finds under ₹199',
  promoOneSubtitle: 'Easy gifts and everyday treats without stretching your budget.',
  promoOneCta: 'Shop under ₹199',
  promoOneLink: '/products?maxPrice=199',
  promoTwoEyebrow: 'Gift-ready favourites',
  promoTwoTitle: 'Make their day special',
  promoTwoSubtitle: 'Thoughtful picks for birthdays, surprises and just-because moments.',
  promoTwoCta: 'Explore gifts',
  promoTwoLink: '/category/gifts',
  trustTitle: 'Shopping that feels simple',
  trustSubtitle: 'From secure checkout to careful packing, we make every order feel effortless.',
  closingEyebrow: 'A little joy is one click away',
  closingTitle: 'Find something you’ll love today.',
  closingSubtitle: 'New drops, giftable finds and happy prices—all in one cheerful place.',
  closingCta: 'Start shopping',
  closingLink: '/products',
}

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-[1.35rem] border border-stone-100 bg-white">
    <div className="aspect-square skeleton" />
    <div className="space-y-2 p-3.5">
      <div className="h-3 w-1/3 rounded skeleton" />
      <div className="h-4 rounded skeleton" />
      <div className="h-4 w-2/3 rounded skeleton" />
      <div className="h-9 rounded-xl skeleton" />
    </div>
  </div>
)

const SectionHeading: React.FC<{
  eyebrow: string
  title: string
  link?: string
  align?: 'left' | 'center'
  dark?: boolean
}> = ({ eyebrow, title, link, align = 'left', dark = false }) => (
  <div className={`relative z-10 mb-7 flex items-end gap-4 md:mb-10 ${align === 'center' ? 'flex-col items-center text-center' : 'justify-between'}`}>
    <div>
      <div className={`mb-2.5 flex items-center gap-2.5 ${align === 'center' ? 'justify-center' : ''}`}><span className="h-px w-7 bg-primary/55" /><p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">{eyebrow}</p></div>
      <h2 className={`font-heading text-[1.7rem] font-black leading-none tracking-[-0.045em] md:text-[2.65rem] ${dark ? 'text-white' : 'text-[#15111b]'}`}>{title}</h2>
    </div>
    {link && (
      <Link to={link} className="group hidden items-center gap-2 rounded-full border border-stone-200/80 bg-white/90 px-5 py-3 text-xs font-black text-slate-700 shadow-[0_8px_30px_rgba(51,30,39,0.07)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-[0_12px_34px_rgba(225,29,72,0.13)] md:inline-flex">
        View all <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    )}
  </div>
)

const HeroSlider: React.FC<{ banners: Banner[]; fullWidth?: boolean }> = ({ banners, fullWidth = false }) => {
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (banners.length < 2) return
    timer.current = setInterval(() => setActive(value => (value + 1) % banners.length), 4500)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [banners.length])

  if (!banners.length) {
    return (
      <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-rose-100 via-orange-50 to-violet-100 ${fullWidth ? 'rounded-[2rem] md:aspect-[1920/620] md:rounded-none' : 'rounded-[2rem] md:aspect-[6/5]'}`}>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center text-primary/70">
            <Gift className="mx-auto mb-3" size={52} />
            <p className="font-black">Your next favourite is here</p>
          </div>
        </div>
      </div>
    )
  }

  const previous = () => setActive(value => (value - 1 + banners.length) % banners.length)
  const next = () => setActive(value => (value + 1) % banners.length)

  return (
    <div className={`relative aspect-[16/10] overflow-hidden bg-stone-100 shadow-[0_24px_70px_rgba(58,30,35,0.16)] ${fullWidth ? 'rounded-[2rem] md:aspect-[1920/620] md:rounded-none' : 'rounded-[2rem] md:aspect-[6/5] md:rounded-[2.75rem]'}`}>
      {banners.map((banner, index) => (
        <Link key={banner._id} to={banner.link || '/products'} className={`absolute inset-0 transition-all duration-700 ${index === active ? 'scale-100 opacity-100' : 'pointer-events-none scale-105 opacity-0'}`}>
          {banner.image ? (
            <img src={ik.banner(banner.image)} alt={banner.title || 'Bafnadaily collection'} className="h-full w-full object-cover" fetchPriority={index === 0 ? 'high' : 'auto'} loading={index === 0 ? 'eager' : 'lazy'} />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-violet-600" />
          )}
          {(banner.title || banner.subtitle) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-6 pt-20 text-white md:p-9 md:pt-28">
              {banner.title && <p className="text-xl font-black md:text-3xl">{banner.title}</p>}
              {banner.subtitle && <p className="mt-1 max-w-md text-sm text-white/80">{banner.subtitle}</p>}
            </div>
          )}
        </Link>
      ))}
      {banners.length > 1 && (
        <>
          <button onClick={previous} aria-label="Previous banner" className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:scale-105"><ChevronLeft size={18} /></button>
          <button onClick={next} aria-label="Next banner" className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:scale-105"><ChevronRight size={18} /></button>
          <div className="absolute bottom-4 right-4 flex gap-1.5 rounded-full bg-slate-950/20 p-2 backdrop-blur">
            {banners.map((_, index) => <button key={index} onClick={() => setActive(index)} aria-label={`Go to banner ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/55'}`} />)}
          </div>
        </>
      )}
    </div>
  )
}

const HeroBannerCard: React.FC<{ banners: Banner[]; mobile?: boolean }> = ({ banners, mobile }) => {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => setActive(index => (index + 1) % banners.length), 3500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners.length])

  return (
    <div className="relative w-full overflow-hidden bg-white shadow-2xl"
      style={{ borderRadius: mobile ? '1.5rem' : '3.5rem', aspectRatio: mobile ? '16/9' : '2/1', boxShadow: mobile ? '0 10px 30px rgba(0,0,0,0.1)' : '0 25px 60px rgba(0,0,0,0.12)' }}>
      {banners.length === 0 ? (
        <div className="absolute inset-0 skeleton" />
      ) : banners.map((banner, index) => (
        <Link key={banner._id} to={banner.link || '/products'}
          className={`absolute inset-0 transition-opacity duration-700 ${index === active ? 'scale-100 opacity-100' : 'pointer-events-none scale-105 opacity-0'}`}>
          {banner.image ? (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
              <img src={ik.banner(banner.image)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" aria-hidden="true" />
              <img src={mobile ? ik.mobileBanner(banner.image) : ik.banner(banner.image)} alt={banner.title || 'Banner'} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} className="relative z-10 h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-violet-500">
              <p className="px-6 text-center text-xl font-black text-white">{banner.title}</p>
            </div>
          )}
        </Link>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-5 z-20 flex gap-1.5">
          {banners.map((_, index) => <button key={index} onClick={() => setActive(index)} aria-label={`Go to banner ${index + 1}`} className={`rounded-full transition-all duration-300 ${index === active ? 'h-1.5 w-5 bg-white' : 'h-1.5 w-1.5 bg-white/50'}`} />)}
        </div>
      )}
      <Link to={banners[active]?.link || '/products'} className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black text-primary shadow-lg backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.92)' }}>
        Shop <ArrowRight size={11} />
      </Link>
    </div>
  )
}

const CampaignBanner: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => setActive(index => (index + 1) % banners.length), 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  if (!banners.length) return null

  return (
    <section className="w-full bg-white py-5 md:py-0">
      <div className="relative w-full overflow-hidden bg-rose-100 shadow-[0_18px_55px_rgba(190,24,93,0.16)] md:aspect-[1920/532]">
          <div className="relative aspect-[16/7] md:absolute md:inset-0 md:aspect-auto">
            {banners.map((banner, index) => (
              <Link
                key={banner._id}
                to={banner.link || '/products'}
                aria-label={banner.title || 'Shop Bafnadaily campaign'}
                className={`absolute inset-0 transition-all duration-700 ${index === active ? 'scale-100 opacity-100' : 'pointer-events-none scale-[1.02] opacity-0'}`}
              >
                <img
                  src={ik.banner(banner.image || '')}
                  alt={banner.title || 'Bafnadaily campaign'}
                  className="h-full w-full object-cover object-left md:object-contain"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 flex gap-1.5 rounded-full bg-slate-950/20 p-2 backdrop-blur md:bottom-5 md:right-5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActive(index)}
                  aria-label={`Show campaign ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${active === index ? 'w-6 bg-white' : 'w-1.5 bg-white/55'}`}
                />
              ))}
            </div>
          )}
      </div>
    </section>
  )
}

const HeroLayout4: React.FC<{ heroBanners: Banner[]; hangingBanners: Banner[] }> = ({ heroBanners, hangingBanners }) => (
  <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf2ff 40%, #fff8f0 70%, #fefffe 100%)' }}>
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.07) 0%, transparent 70%)' }} />
      <div className="absolute right-10 top-10 h-64 w-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(199,125,255,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,139,90,0.06) 0%, transparent 70%)' }} />
    </div>
    <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(233,30,99,0.25), rgba(199,125,255,0.25), transparent)' }} />
    {heroBanners.length > 0 && <div className="relative z-10 block w-full px-3 pb-1 pt-3 lg:hidden"><HeroBannerCard banners={heroBanners} mobile /></div>}
    <div className="relative z-10 hidden w-full items-stretch px-14 py-12 lg:flex xl:px-24" style={{ minHeight: '60vh' }}>
      <div className="flex w-full flex-row items-stretch gap-16">
        <div className="flex flex-1 flex-row items-start justify-center gap-6 overflow-visible" style={{ alignSelf: 'stretch', marginTop: '-45px' }}>
          <style>{`@keyframes sway-hero { 0%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} 100%{transform:rotate(-6deg)} } .hero-kc { transform-origin: top center; animation: sway-hero 3.5s ease-in-out infinite; }`}</style>
          {hangingBanners.slice(0, 6).map((banner, index) => (
            <Link key={banner._id} to={banner.link || '/products'} className="hero-kc group/item flex flex-col items-center" style={{ animationDelay: `${index * 0.6}s` }}>
              <div className="h-[60px] w-0.5 rounded-sm bg-gradient-to-b from-pink-500 to-pink-300" />
              <div className="z-[2] -mb-1 h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />
              <div className="rounded-[30px] border-[2.5px] border-pink-500/15 bg-white p-2 shadow-[0_15px_45px_rgba(244,63,142,0.22)] transition-all duration-300 group-hover/item:border-primary">
                <img src={ik.hanging(banner.image)} alt={banner.title || 'keychain'} width={165} height={250} loading="lazy" className="h-[250px] w-[165px] rounded-3xl object-cover" />
                {banner.title && <div className="mt-2.5 rounded-[14px] bg-gradient-to-br from-pink-500 to-pink-400 px-3.5 py-1.5 text-center shadow-[0_4px_12px_rgba(244,63,142,0.4)]"><span className="whitespace-nowrap text-[13px] font-black tracking-wide text-white">{banner.title}</span></div>}
              </div>
            </Link>
          ))}
        </div>
        {heroBanners.length > 0 && <div className="flex flex-[1.5] flex-col justify-center"><HeroBannerCard banners={heroBanners} /></div>}
      </div>
    </div>
  </section>
)

const ProductShelf: React.FC<{
  eyebrow: string
  title: string
  products: Product[]
  loading: boolean
  viewAll: string
  tone?: 'ivory' | 'rose' | 'pearl'
}> = ({ eyebrow, title, products, loading, viewAll, tone = 'ivory' }) => {
  const toneClass = tone === 'rose'
    ? 'bg-[radial-gradient(circle_at_8%_12%,rgba(251,207,220,0.48),transparent_25%),linear-gradient(135deg,#fff8f8_0%,#fffdf9_56%,#fff4f7_100%)]'
    : tone === 'pearl'
      ? 'bg-[radial-gradient(circle_at_88%_8%,rgba(221,214,254,0.42),transparent_25%),linear-gradient(135deg,#fffdf8_0%,#faf8ff_58%,#fff8fb_100%)]'
      : 'bg-[linear-gradient(135deg,#fffdf8_0%,#fffaf4_52%,#fffdfb_100%)]'

  return (
    <section className={`d2c-shell relative overflow-hidden border-b border-stone-200/55 py-11 md:py-20 ${toneClass}`}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[44px] border-white/40" />
      <SectionHeading eyebrow={eyebrow} title={title} link={viewAll} />
      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6 xl:gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : products.slice(0, 6).map((product, index) => <ProductCard key={product._id} product={product} priority={index < 3} />)}
      </div>
      {!loading && products.length === 0 && (
        <div className="relative z-10 rounded-3xl border border-dashed border-stone-200 bg-white/80 py-14 text-center text-sm font-bold text-stone-400">Products will appear here when they are enabled from admin.</div>
      )}
      <Link to={viewAll} className="relative z-10 mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 shadow-sm md:hidden">View all <ArrowRight size={14} /></Link>
    </section>
  )
}

const HomePage: React.FC = () => {
  const { settings } = useSettingsStore()
  const { count, setHasNewItem } = useCartStore()
  const sectionSettings = settings.homepageSections || ({} as any)
  const content = useMemo(() => ({ ...HOME_DEFAULTS, ...sectionSettings }), [sectionSettings])
  const [trending, setTrending] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [heroBanners, setHeroBanners] = useState<Banner[]>([])
  const [promoBanners, setPromoBanners] = useState<Banner[]>([])
  const [hangingBanners, setHangingBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (count > 0) setHasNewItem(true) }, [count, setHasNewItem])

  useEffect(() => {
    Promise.all([
      api.get('/banners?isActive=true'),
      api.get('/categories?isActive=true&limit=12'),
      api.get('/products?trending=true&limit=8'),
      api.get('/products?newArrival=true&limit=8'),
      api.get('/products?featured=true&limit=8'),
      api.get('/products?limit=18'),
    ]).then(([bannerResponse, categoryResponse, trendingResponse, newResponse, featuredResponse, allResponse]) => {
      const allBanners: Banner[] = bannerResponse.data.banners || []
      const allProducts: Product[] = allResponse.data.products || []
      const trendingProducts: Product[] = trendingResponse.data.products || []
      const arrivalProducts: Product[] = newResponse.data.products || []
      const featuredProducts: Product[] = featuredResponse.data.products || []
      setHeroBanners(allBanners.filter(banner => banner.type === 'hero' && banner.isActive && banner.showOnWebsite !== false))
      setPromoBanners(allBanners.filter(banner => banner.type === 'promo' && banner.isActive && banner.showOnWebsite !== false))
      setHangingBanners(allBanners.filter(banner => banner.type === 'hanging' && banner.isActive && banner.showOnWebsite !== false))
      setCategories(categoryResponse.data.categories || [])
      setTrending(trendingProducts.length ? trendingProducts : allProducts.slice(0, 8))
      setNewArrivals(arrivalProducts.length ? arrivalProducts : allProducts.slice(6, 14))
      setFeatured(featuredProducts.length ? featuredProducts : [...allProducts].reverse().slice(0, 8))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const trustItems = [
    { icon: Truck, title: `Free delivery above ₹${settings.freeShippingAbove ?? 499}`, text: 'Delivered across India' },
    { icon: ShieldCheck, title: 'Secure checkout', text: 'UPI, online payment & COD' },
    { icon: PackageCheck, title: 'Packed with care', text: 'Quality checked before dispatch' },
    { icon: RotateCcw, title: 'Easy support', text: 'Friendly help when you need it' },
  ]

  return (
    <div className="overflow-hidden bg-[#fbf8f3]">
      <Helmet>
        <title>{settings.siteName || 'Bafnadaily'} — Gifts, Accessories & Everyday Joy</title>
        <meta name="description" content={`${settings.siteName || 'Bafnadaily'} brings you trending accessories, thoughtful gifts and everyday finds with secure checkout and delivery across India.`} />
        <meta property="og:title" content={`${settings.siteName || 'Bafnadaily'} — Everyday finds, made delightful`} />
        <meta property="og:type" content="website" />
      </Helmet>

      {sectionSettings.heroBanner !== false && <HeroLayout4 heroBanners={heroBanners} hangingBanners={hangingBanners} />}

      {sectionSettings.featuresBar !== false && (
        <section className="relative border-b border-stone-200/70 bg-[#fffdfa]">
          <div className="d2c-shell grid grid-cols-2 gap-3 py-4 md:grid-cols-4 md:gap-4 md:py-5">
            {trustItems.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/75 px-3 py-3 shadow-[0_7px_24px_rgba(48,32,36,0.045)] backdrop-blur md:px-4">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[0.9rem] bg-gradient-to-br from-rose-50 to-pink-100 text-primary ring-1 ring-primary/10"><Icon size={18} /></div>
                <div><p className="text-[11px] font-black text-slate-900 md:text-xs">{title}</p><p className="mt-0.5 hidden text-[10px] text-stone-400 sm:block">{text}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sectionSettings.categories !== false && (
        <section className="relative border-b border-rose-100/70 bg-[radial-gradient(circle_at_90%_0%,rgba(253,215,226,0.5),transparent_26%),linear-gradient(180deg,#fff_0%,#fffaf8_100%)]">
          <div className="d2c-shell py-10 md:py-16">
            <div className="mb-6 flex items-end justify-between">
              <div><div className="mb-2 flex items-center gap-2.5"><span className="h-px w-7 bg-primary/55" /><p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">{content.categoryEyebrow}</p></div><h2 className="font-heading text-[1.7rem] font-black tracking-[-0.045em] text-[#15111b] md:text-[2.65rem]">{content.categoryTitle}</h2></div>
              <Link to="/products" className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-xs font-black text-primary shadow-[0_8px_28px_rgba(56,34,42,0.07)] transition hover:-translate-y-0.5 hover:border-primary/30 sm:flex">View all <ArrowRight size={13} /></Link>
            </div>
            <div className="scrollbar-hidden -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 lg:gap-6">
              {loading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="w-[132px] flex-shrink-0 sm:w-auto"><div className="aspect-square rounded-t-full rounded-b-3xl skeleton" /><div className="mx-auto mt-3 h-3 w-24 rounded skeleton" /></div>) : categories.slice(0, 6).map((category, index) => (
                <Link key={category._id} to={`/category/${category.slug}`} className="group w-[132px] flex-shrink-0 snap-start text-center sm:w-auto">
                  <div className="relative aspect-square overflow-hidden rounded-t-[999px] rounded-b-[1.8rem] border border-white bg-[#fdebf1] p-1.5 shadow-[0_14px_35px_rgba(78,42,54,0.11)] ring-1 ring-rose-100 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_24px_48px_rgba(225,29,72,0.18)]">
                    {category.image ? <img src={ik.catCircle(category.image)} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className={`grid h-full place-items-center text-5xl ${index % 2 ? 'bg-violet-100' : 'bg-rose-100'}`}>{category.icon || '🛍️'}</div>}
                  </div>
                  <p className="mx-auto mt-3 w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-black leading-4 text-slate-800 shadow-sm ring-1 ring-stone-100 transition-all group-hover:text-primary md:text-sm">{category.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {sectionSettings.trendingProducts !== false && <ProductShelf eyebrow={content.trendingEyebrow} title={content.trendingTitle} products={trending} loading={loading} viewAll="/products" tone="rose" />}

      {sectionSettings.promoBanners !== false && (
        <section className="d2c-shell grid gap-4 bg-[#fffdfa] py-10 md:grid-cols-2 md:gap-6 md:py-16">
          {sectionSettings.underPriceBanner !== false && (
            <Link to={content.promoOneLink} className="group relative min-h-[300px] overflow-hidden rounded-[2.25rem] border border-white/80 bg-[linear-gradient(135deg,#f8cfd9_0%,#fff1ee_100%)] p-7 shadow-[0_24px_60px_rgba(148,65,91,0.13)] transition duration-500 hover:-translate-y-1 md:min-h-[360px] md:p-10">
              <div className="absolute -bottom-20 -right-14 h-64 w-64 rounded-full bg-white/45" />
              <div className="absolute right-8 top-8 grid h-28 w-28 rotate-6 place-items-center rounded-[2rem] bg-white/65 text-5xl shadow-xl transition duration-500 group-hover:-rotate-3 group-hover:scale-105">💝</div>
              <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-end">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">{content.promoOneEyebrow}</p>
                <h3 className="mt-3 font-heading text-3xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-4xl">{content.promoOneTitle}</h3>
                <p className="mt-3 text-xs font-medium leading-5 text-slate-600 md:text-sm">{content.promoOneSubtitle}</p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white">{content.promoOneCta} <ArrowRight size={13} /></span>
              </div>
            </Link>
          )}
          {sectionSettings.giftComboBanner !== false && (
            <Link to={content.promoTwoLink} className="group relative min-h-[300px] overflow-hidden rounded-[2.25rem] border border-white/80 bg-[linear-gradient(135deg,#ded9ff_0%,#f6efff_100%)] p-7 shadow-[0_24px_60px_rgba(93,70,143,0.13)] transition duration-500 hover:-translate-y-1 md:min-h-[360px] md:p-10">
              <div className="absolute -right-12 -top-16 h-60 w-60 rounded-full bg-white/35" />
              <div className="absolute right-8 top-8 grid h-28 w-28 -rotate-6 place-items-center rounded-[2rem] bg-white/65 text-5xl shadow-xl transition duration-500 group-hover:rotate-3 group-hover:scale-105">🎁</div>
              <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-end">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">{content.promoTwoEyebrow}</p>
                <h3 className="mt-3 font-heading text-3xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-4xl">{content.promoTwoTitle}</h3>
                <p className="mt-3 text-xs font-medium leading-5 text-slate-600 md:text-sm">{content.promoTwoSubtitle}</p>
                <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white">{content.promoTwoCta} <ArrowRight size={13} /></span>
              </div>
            </Link>
          )}
        </section>
      )}

      {sectionSettings.newArrivals !== false && <ProductShelf eyebrow={content.newArrivalsEyebrow} title={content.newArrivalsTitle} products={newArrivals} loading={loading} viewAll="/products?newArrival=true" tone="ivory" />}

      {sectionSettings.promoBanners !== false && <CampaignBanner banners={promoBanners} />}

      {sectionSettings.featuredProducts !== false && <ProductShelf eyebrow={content.featuredEyebrow} title={content.featuredTitle} products={featured} loading={loading} viewAll="/products?featured=true" tone="pearl" />}

      {sectionSettings.closingCta !== false && <section className="d2c-shell bg-[#fffaf7] py-10 md:py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.22),transparent_24%),linear-gradient(135deg,#be0b55_0%,#e12b65_48%,#6d36b5_100%)] px-6 py-14 text-center text-white shadow-[0_35px_95px_rgba(162,25,80,0.25)] md:px-12 md:py-20">
          <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full border-[32px] border-white/10" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/10" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">{content.closingEyebrow}</p>
            <h2 className="mt-4 font-heading text-3xl font-black tracking-[-0.04em] md:text-5xl">{content.closingTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/75 md:text-base">{content.closingSubtitle}</p>
            <Link to={content.closingLink} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1">{content.closingCta} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>}
    </div>
  )
}

export default HomePage
