import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ik } from '../utils/imagekit';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Product, Category, Banner } from '../types';
import ProductCard from '../components/product/ProductCard';
import { ArrowRight, Sparkles } from 'lucide-react';

// ── Deals Countdown Timer ──────────────────────────────────────────────────────
const DealsCountdown: React.FC<{ endTime: string | null }> = ({ endTime }) => {
  const calc = useCallback(() => {
    if (!endTime) return null;
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, ended: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, ended: false };
  }, [endTime]);

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);

  if (!endTime || !time) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-bold text-gray-700">
        {time.ended ? '🔴 Deal Ended' : '⏰ Ends in:'}
      </span>
      {!time.ended && (
        <div className="flex items-center gap-1.5">
          {[['H', time.h], ['M', time.m], ['S', time.s]].map(([label, val]) => (
            <div key={label as string} className="flex flex-col items-center">
              <div className="bg-red-600 text-white text-lg font-black w-12 h-12 rounded-xl flex items-center justify-center shadow-md">
                {pad(val as number)}
              </div>
              <span className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Hero Banner Card Component (from HomePage) ─────────────────────────────
const HeroBannerCard: React.FC<{ banners: Banner[]; mobile?: boolean }> = ({ banners, mobile }) => {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => setActive(i => (i + 1) % banners.length), 3500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [banners.length])

  if (!banners.length) return null

  return (
    <div className="relative w-full overflow-hidden bg-white"
      style={{ borderRadius: mobile ? '1rem' : '2rem', aspectRatio: mobile ? '16/7' : '5/2', boxShadow: mobile ? '0 4px 20px rgba(0,0,0,0.10)' : '0 24px 64px rgba(233,30,99,0.18), 0 8px 24px rgba(0,0,0,0.08)' }}>
      {banners.map((bn, i) => (
        <Link key={bn._id} to={bn.link || '/products'}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {bn.image
            ? <img src={ik.banner(bn.image)} alt={bn.title || 'Banner'} width={900} height={400} loading="eager" fetchPriority="high" className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#E91E63,#C77DFF)' }}>
              <p className="text-white font-black text-xl text-center px-6">{bn.title}</p>
            </div>
          }
        </Link>
      ))}
    </div>
  )
}

interface DealProduct {
  _id: string;
  product: Product;
  dealPrice: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  endTime: string;
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [heroBanners, setHeroBanners] = useState<Banner[]>([])
  const [hangingBanners, setHangingBanners] = useState<Banner[]>([])
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const isDealsPage = slug === 'deals-of-the-day';

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryAndBanners = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      setSelectedSubId(null);

      try {
        // 1. Fetch Main Category
        const { data: { category: fetchedCategory } } = await api.get(`/categories/${slug}`);
        if (!fetchedCategory) throw new Error("Category not found");
        setCategory(fetchedCategory);

        // 2. Fetch Banners (Backend now returns both category-specific and global fallback)
        const bannerRes = await api.get(`/banners?isActive=true&category=${fetchedCategory._id}`);
        const allBanners: Banner[] = bannerRes.data.banners || [];

        // Separation Logic:
        // If there are ANY banners specifically assigned to this category, we might want to prioritize them.
        // For now, we'll show all (sorted by backend) but strictly separate Hero and Hanging types.
        setHeroBanners(allBanners.filter(b => b.type === 'hero' || b.type === 'promo' || b.type === 'category'));
        setHangingBanners(allBanners.filter(b => b.type === 'hanging'));

        // 3. Deals page: fetch from deals endpoint
        if (fetchedCategory.slug === 'deals-of-the-day') {
          const [subRes, dealsRes] = await Promise.all([
            api.get('/categories/all'),
            api.get('/deals-of-day'),
          ]);
          setDeals(dealsRes.data?.deals || []);
          const filteredSubs = (subRes?.data?.categories || []).filter(
            (c: any) => c.parent?._id === fetchedCategory._id || c.parent === fetchedCategory._id
          );
          setSubCategories(filteredSubs);
        } else {
          const subRes = await api.get('/categories/all');
          const filteredSubs = (subRes?.data?.categories || []).filter(
            (c: any) => c.parent?._id === fetchedCategory._id || c.parent === fetchedCategory._id
          );
          setSubCategories(filteredSubs);

          if (fetchedCategory.layoutType !== 'hanging') {
            // Pass ALL category IDs (parent + all subs) directly — guaranteed to show all products
            const allCatIds = [fetchedCategory._id, ...filteredSubs.map((s: any) => s._id)].join(',');
            const prodRes = await api.get(`/products?categoryIds=${allCatIds}&limit=48&page=1`);
            setProducts(prodRes.data?.products || []);
            setTotalProducts(prodRes.data?.total || 0);
            setCurrentPage(1);
          }
        }

      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load collection.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndBanners();
  }, [slug]);

  const handleSubCategorySelect = async (subId: string | null) => {
    if (!category) return;
    setSelectedSubId(subId);
    setProductsLoading(true);
    setCurrentPage(1);
    try {
      let url = '';
      if (subId) {
        // Specific subcategory selected — show only that subcategory's products
        url = `/products?category=${subId}&limit=48&page=1`;
      } else {
        // View All — show parent + ALL subcategories
        const allCatIds = [category._id, ...subCategories.map((s: any) => s._id)].join(',');
        url = `/products?categoryIds=${allCatIds}&limit=48&page=1`;
      }
      const res = await api.get(url);
      setProducts(res.data?.products || []);
      setTotalProducts(res.data?.total || 0);
    } catch {
      // keep existing products on error
    } finally {
      setProductsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!category) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      let url = '';
      if (selectedSubId) {
        url = `/products?category=${selectedSubId}&limit=48&page=${nextPage}`;
      } else {
        const allCatIds = [category._id, ...subCategories.map((s: any) => s._id)].join(',');
        url = `/products?categoryIds=${allCatIds}&limit=48&page=${nextPage}`;
      }
      const res = await api.get(url);
      setProducts(prev => [...prev, ...(res.data?.products || [])]);
      setCurrentPage(nextPage);
    } catch {
      // keep existing on error
    } finally {
      setLoadingMore(false);
    }
  };

  // Main Render Logic
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!category) return <ErrorState message="Category could not be found." />;

  return category.layoutType === 'hanging' ? (
    <HangingLayout category={category} subCategories={subCategories} heroBanners={heroBanners} />
  ) : (
    <StandardLayout
      category={category}
      subCategories={subCategories}
      products={products}
      deals={deals}
      heroBanners={heroBanners}
      hangingBanners={hangingBanners}
      selectedSubId={selectedSubId}
      onSelectSub={handleSubCategorySelect}
      productsLoading={productsLoading}
      isDealsPage={isDealsPage}
      totalProducts={totalProducts}
      onLoadMore={handleLoadMore}
      loadingMore={loadingMore}
    />
  );
};

export default CategoryPage;

/* =========================================
   Helper Components (For Clean Architecture)
   Note: Aap inhe alag files mein bhi move kar sakte hain
========================================= */

const LoadingState = () => (
  <div className="max-w-7xl mx-auto px-4 py-32 min-h-[60vh] flex flex-col items-center justify-center text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
    <p className="text-gray-400 font-bold mt-4 animate-pulse">Loading your collection...</p>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="max-w-7xl mx-auto px-4 py-32 min-h-[60vh] flex flex-col items-center justify-center text-center">
    <p className="text-6xl mb-4">⚠️</p>
    <p className="text-gray-600 font-bold text-xl">{message}</p>
    <Link to="/" className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-primary/90 transition-colors">
      Back to Home
    </Link>
  </div>
);

const HangingLayout = ({ category, subCategories, heroBanners }: { category: Category; subCategories: Category[]; heroBanners: Banner[] }) => (
  <div className="min-h-screen bg-pink-50/30 pb-20">
    {/* Dynamic Banner Section for Hanging Layout */}
    {(category.banner || heroBanners.length > 0) && (
      <div className="w-full relative overflow-hidden mb-8 border-b-4 border-primary/20 bg-pink-50/50" style={{ minHeight: '30vh' }}>
        {/* Background image: prefer category-specific hero if exists, otherwise fallback to old category.banner */}
        <img 
          src={heroBanners[0]?.image || category.banner} 
          className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pink-50 via-transparent to-transparent" />
        
        <div className="relative z-10 py-16 px-6 flex flex-col items-center justify-center min-h-[30vh]">
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-3">Premium Collection</p>
          <h1 className="text-4xl md:text-7xl font-heading font-black text-gray-900 drop-shadow-sm uppercase text-center max-w-4xl">
            {category.name}
          </h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-purple-500 mt-6 rounded-full" />
        </div>
      </div>
    )}

    {/* Header */}
    <div className="max-w-7xl mx-auto px-4 pt-12 text-center mb-16">
      <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-3">Premium Collection</p>
      <h1 className="text-4xl md:text-6xl font-heading font-black text-gray-900 mb-4">{category.name}</h1>
      <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full" />
    </div>

    {/* Rope and Hanging Items */}
    <div className="relative mb-20">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 shadow-lg z-10" />

      <div className="flex flex-wrap justify-center gap-x-12 gap-y-20 pt-1 relative z-0 px-4">
        {subCategories.map((sub) => (
          <Link key={sub._id} to={`/category/${sub.slug}`} className="group flex flex-col items-center">
            <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-primary/20 group-hover:h-20 transition-all duration-500" />
            <div className="bg-white p-4 rounded-[2rem] shadow-2xl border-2 border-primary/10 group-hover:border-primary group-hover:-rotate-3 transition-all duration-500 group-hover:scale-110">
              <div className="w-40 h-56 lg:w-52 lg:h-72 rounded-[1.5rem] overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                {sub.image ? (
                  <img src={ik.catCircle(sub.image)} alt={sub.name} width={300} height={400} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{sub.icon || '🛍️'}</span>
                )}
              </div>
              <div className="mt-3 bg-primary text-white text-[10px] font-black py-1 px-3 rounded-full text-center uppercase tracking-widest shadow-lg shadow-primary/20 group-hover:bg-primary/90">
                {sub.name}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>

    {/* Empty State */}
    {subCategories.length === 0 && (
      <div className="text-center py-20 opacity-40">
        <p className="text-6xl mb-4">📦</p>
        <p className="font-bold text-gray-500 text-xl">Coming soon in this collection</p>
      </div>
    )}
  </div>
);

const StandardLayout = ({ category, subCategories, products, deals, heroBanners, hangingBanners, selectedSubId, onSelectSub, productsLoading, isDealsPage, totalProducts, onLoadMore, loadingMore }: { category: Category; subCategories: Category[]; products: Product[]; deals: DealProduct[]; heroBanners: Banner[]; hangingBanners: Banner[]; selectedSubId: string | null; onSelectSub: (id: string | null) => void; productsLoading: boolean; isDealsPage?: boolean; totalProducts: number; onLoadMore: () => void; loadingMore: boolean }) => (
  <div className="w-full pb-20">
    {/* ── Hero Banner — same full-width style as HomePage HeroLayout4 ── */}
    {(heroBanners.length > 0 || hangingBanners.length > 0) && (
      <section className="relative overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf2ff 40%, #fff8f0 70%, #fefffe 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.07) 0%, transparent 70%)' }} />
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(199,125,255,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,139,90,0.06) 0%, transparent 70%)' }} />
        </div>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(233,30,99,0.25), rgba(199,125,255,0.25), transparent)' }} />

        {/* Mobile: Hero Banner Slider + Hanging Items auto-scrolling marquee */}
        <div className="block lg:hidden w-full relative z-10 px-3 pt-3 overflow-hidden">
          {heroBanners.length > 0 && <HeroBannerCard banners={heroBanners} mobile />}
          
          {hangingBanners.length > 0 && (
            <div className="mt-8 pb-4 relative">
              <style>{`
                @keyframes marquee-scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .marquee-container {
                  display: flex;
                  gap: 1.5rem;
                  width: max-content;
                  animation: marquee-scroll 30s linear infinite;
                }
                .marquee-container:hover { animation-play-state: paused; }
                @keyframes sway-mob { 0%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} 100%{transform:rotate(-3deg)} }
                .mob-hang { transform-origin: top center; animation: sway-mob 3s ease-in-out infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
              `}</style>
              
              <div className="marquee-container no-scrollbar">
                {/* Render twice for seamless loop */}
                {[...hangingBanners, ...hangingBanners].map((b, i) => (
                  <div key={i} className="mob-hang flex flex-col items-center" style={{ animationDelay: `${(i % hangingBanners.length) * 0.5}s` }}>
                    <div className="w-[1px] h-10 bg-gradient-to-b from-pink-400 to-pink-200" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 -mb-0.5 z-10 bg-white" />
                    <div className="bg-white p-1.5 rounded-2xl shadow-xl border border-pink-100 flex-shrink-0">
                      <img src={ik.hanging(b.image)} alt={b.title || 'item'} width={112} height={176} loading="lazy" className="w-28 h-44 rounded-xl object-cover" />
                      {b.title && (
                        <div className="mt-1.5 bg-pink-500 text-white text-[10px] font-black py-1 px-3 rounded-full text-center truncate max-w-[112px] shadow-lg shadow-pink-500/20">
                          {b.title}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Fade edges */}
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-pink-50/50 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pink-50/50 to-transparent pointer-events-none z-10" />
            </div>
          )}
        </div>

        {/* Desktop: hanging items left + banner right (identical to HomePage) */}
        <div className="hidden lg:flex w-full px-14 xl:px-24 py-12 relative z-10 items-stretch" style={{ minHeight: '60vh' }}>
          <div className="w-full flex flex-row items-stretch gap-16">
            {/* Left — Hanging banners */}
            {hangingBanners.length > 0 && (
              <div className="flex-1 flex flex-row items-start justify-center gap-4 overflow-visible" style={{ alignSelf: 'stretch', marginTop: '-45px' }}>
                <style>{`
                  @keyframes sway-cat { 0%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} 100%{transform:rotate(-6deg)} }
                  .cat-hang2 { transform-origin: top center; }
                  .cat-hang2:nth-child(odd)  { animation: sway-cat 3.2s ease-in-out infinite; }
                  .cat-hang2:nth-child(even) { animation: sway-cat 3.2s ease-in-out infinite 0.7s; }
                  .cat-hang2:nth-child(3n)   { animation: sway-cat 3.2s ease-in-out infinite 1.4s; }
                `}</style>
                {hangingBanners.slice(0, 6).map((b, i) => (
                  <a key={i} href={b.link || '#'} className="cat-hang2 flex flex-col items-center" style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{ width: '2px', height: '45px', background: 'linear-gradient(180deg,#f43f8e,#e879a0)', borderRadius: '1px' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #9ca3af', background: 'transparent', marginBottom: '-3px', zIndex: 2 }} />
                    <div style={{ background: 'white', padding: '8px', borderRadius: '30px', boxShadow: '0 15px 40px rgba(244,63,142,0.25)', border: '2px solid rgba(244,63,142,0.18)' }}>
                      <img src={ik.hanging(b.image)} alt={b.title || 'item'} width={160} height={240} loading="lazy" style={{ width: '160px', height: '240px', borderRadius: '24px', objectFit: 'cover', display: 'block' }} />
                      {b.title && (
                        <div style={{ marginTop: '10px', background: 'linear-gradient(135deg,#f43f8e,#ec4899)', borderRadius: '18px', padding: '6px 15px', textAlign: 'center', boxShadow: '0 4px 12px rgba(244,63,142,0.35)' }}>
                          <span style={{ color: 'white', fontSize: '14px', fontWeight: 900, letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{b.title}</span>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Right — Main banner slider */}
            {heroBanners.length > 0 && (
              <div className="flex-[1.5] flex flex-col justify-center">
                <HeroBannerCard banners={heroBanners} />
              </div>
            )}
          </div>
        </div>
      </section>
    )}

    {/* Fallback: old category banner if no hero banners set */}
    {category.banner && heroBanners.length === 0 && hangingBanners.length === 0 && (
      <div className="w-full aspect-[2/1] md:aspect-[4/1] overflow-hidden mb-8 shadow-xl relative">
        <img src={category.banner} className="w-full h-full object-cover" alt={category.name} />
      </div>
    )}

    {/* Page content with padding */}
    <div className="px-4 md:px-10 lg:px-16 xl:px-24">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-gray-900 flex items-center gap-3">
          <span>{category.icon}</span>
          {category.name || category.slug}
        </h1>
        {category.description && <p className="text-gray-500 mt-3 text-lg max-w-3xl">{category.description}</p>}
      </div>

      {/* Deals Of The Day — Countdown Banner */}
      {isDealsPage && deals.length > 0 && (
        <div className="mb-8 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff4d00 0%, #ff8c00 50%, #ffd700 100%)' }}>
          <div className="px-6 md:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="bg-white/20 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">🔥 Limited Time Offer</span>
              <p className="text-white/80 text-sm font-medium mt-2">{deals.length} deals available today</p>
            </div>
            <DealsCountdown endTime={deals[0]?.endTime || null} />
          </div>
        </div>
      )}

      {/* Circular Subcategories Carousel */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-5 mb-12">
          <button
            onClick={() => onSelectSub(null)}
            className="flex flex-col items-center gap-2 group w-[100px] sm:w-[120px] cursor-pointer border-none bg-transparent p-0"
          >
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 overflow-hidden flex flex-col items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-105 ${selectedSubId === null ? 'border-primary bg-primary/15 scale-105 shadow-md' : 'border-primary bg-primary/5'}`}>
              <span className="text-xl sm:text-2xl font-black text-primary uppercase">View</span>
              <span className="text-[10px] font-bold text-primary/60 tracking-tighter uppercase font-heading">All</span>
            </div>
            <span className={`text-[12px] sm:text-[13px] font-bold text-center leading-tight ${selectedSubId === null ? 'text-primary' : 'text-primary'}`}>View All</span>
          </button>

          {subCategories.map((sub) => (
            <button
              key={sub._id}
              onClick={() => onSelectSub(sub._id)}
              className="flex flex-col items-center gap-2 group w-[100px] sm:w-[120px] cursor-pointer border-none bg-transparent p-0"
            >
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 overflow-hidden bg-gray-50 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-105 ${selectedSubId === sub._id ? 'border-primary scale-105 shadow-md ring-2 ring-primary/30' : 'border-gray-200 group-hover:border-primary'}`}>
                {sub.image ? (
                  <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{sub.icon || '🛍️'}</span>
                )}
              </div>
              <span className={`text-[12px] sm:text-[13px] font-bold text-center leading-tight transition-colors line-clamp-2 px-1 ${selectedSubId === sub._id ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}`}>
                {sub.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {productsLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : isDealsPage ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {deals.map((deal) => (
              <DealCard key={deal._id} deal={deal} />
            ))}
          </div>
          {deals.length === 0 && (
            <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-3xl mt-8 border-2 border-dashed border-gray-200">
              <p className="text-5xl mb-4">🏷️</p>
              <p className="font-medium text-lg text-gray-500">No active deals right now.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Product count */}
          {products.length > 0 && (
            <p className="text-sm text-gray-500 mb-4 font-medium">
              Showing <span className="font-bold text-gray-800">{products.length}</span> of <span className="font-bold text-gray-800">{totalProducts}</span> products
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>

          {/* Load More Button */}
          {products.length < totalProducts && (
            <div className="flex justify-center mt-10">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    Loading...
                  </>
                ) : (
                  `Load More (${totalProducts - products.length} more)`
                )}
              </button>
            </div>
          )}

          {/* Empty State for Products */}
          {products.length === 0 && (
            <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-3xl mt-8 border-2 border-dashed border-gray-200">
              <p className="text-5xl mb-4">🛒</p>
              <p className="font-medium text-lg text-gray-500">No products available in this category yet.</p>
            </div>
          )}
        </>
      )}
    </div>{/* end inner padding div */}
  </div>
);

// ── Deal Product Card ──────────────────────────────────────────────────────────
const DealCard: React.FC<{ deal: DealProduct }> = ({ deal }) => {
  const { product, dealPrice, discountValue, discountType } = deal;
  const savings = product.price - dealPrice;
  const expired = new Date(deal.endTime) < new Date();

  if (expired) return <ProductCard product={product} />;

  return (
    <a href={`/products/${product.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative">
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}
        </div>
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img src={product.images?.[0]?.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
        <div className="p-3">
          <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{product.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-black text-red-600">₹{dealPrice}</span>
            <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
          </div>
          <p className="text-[10px] text-green-600 font-bold mt-0.5">Save ₹{savings}</p>
        </div>
      </div>
    </a>
  );
};