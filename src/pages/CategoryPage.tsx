import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ik } from '../utils/imagekit';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Product, Category, Banner } from '../types';
import ProductCard from '../components/product/ProductCard';
import { ShoppingCart } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

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

// ── Hero Banner Slider ──────────────────────────────────────────────────────
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
        <Link key={bn._id} to={bn.link || '/'}
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

const LIMIT = 24;

// Helper: get ALL descendants (children + grandchildren) of a category
const getAllDescendantIds = (parentId: string, allCats: any[]): string[] => {
  const children = allCats.filter(
    (c: any) => c.parent?._id === parentId || c.parent === parentId
  );
  return [
    ...children.map((c: any) => c._id),
    ...children.flatMap((c: any) => getAllDescendantIds(c._id, allCats)),
  ];
};

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [allCatIds, setAllCatIds] = useState<string>(''); // all descendant IDs joined
  const [heroBanners, setHeroBanners] = useState<Banner[]>([]);
  const [hangingBanners, setHangingBanners] = useState<Banner[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const isDealsPage = slug === 'deals-of-the-day';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      setSelectedSubId(null);
      setCurrentPage(1);

      try {
        const { data: { category: fetchedCategory } } = await api.get(`/categories/${slug}`);
        if (!fetchedCategory) throw new Error("Category not found");
        setCategory(fetchedCategory);

        // Banners
        const bannerRes = await api.get(`/banners?isActive=true&category=${fetchedCategory._id}`);
        const allBanners: Banner[] = bannerRes.data.banners || [];
        setHeroBanners(allBanners.filter((b: Banner) => b.type === 'hero' || b.type === 'promo' || b.type === 'category'));
        setHangingBanners(allBanners.filter((b: Banner) => b.type === 'hanging'));

        // All categories
        const subRes = await api.get('/categories/all');
        const allCats = subRes?.data?.categories || [];

        // Direct children (for the subcategory circles UI)
        const directSubs = allCats.filter(
          (c: any) => c.parent?._id === fetchedCategory._id || c.parent === fetchedCategory._id
        );
        setSubCategories(directSubs);

        if (fetchedCategory.slug === 'deals-of-the-day') {
          const dealsRes = await api.get('/deals-of-day');
          setDeals(dealsRes.data?.deals || []);
        } else if (fetchedCategory.layoutType !== 'hanging') {
          // ALL descendants (recursive) for products query
          const descendantIds = getAllDescendantIds(fetchedCategory._id, allCats);
          const ids = [fetchedCategory._id, ...descendantIds].join(',');
          setAllCatIds(ids);

          const prodRes = await api.get(`/products?categoryIds=${ids}&limit=${LIMIT}&page=1`);
          setProducts(prodRes.data?.products || []);
          setTotalProducts(prodRes.data?.total || 0);
          setTotalPages(prodRes.data?.pages || 1);
        }

      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load collection.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug]);

  // Fetch products when page changes
  const fetchProducts = async (page: number, subId: string | null) => {
    if (!category) return;
    setProductsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      let url = '';
      if (subId) {
        url = `/products?category=${subId}&limit=${LIMIT}&page=${page}`;
      } else {
        url = `/products?categoryIds=${allCatIds}&limit=${LIMIT}&page=${page}`;
      }
      const res = await api.get(url);
      setProducts(res.data?.products || []);
      setTotalProducts(res.data?.total || 0);
      setTotalPages(res.data?.pages || 1);
      setCurrentPage(page);
    } catch {
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSubCategorySelect = async (subId: string | null) => {
    if (!category) return;
    setSelectedSubId(subId);
    setCurrentPage(1);
    setProductsLoading(true);
    try {
      const url = subId
        ? `/products?category=${subId}&limit=${LIMIT}&page=1`
        : `/products?categoryIds=${allCatIds}&limit=${LIMIT}&page=1`;
      const res = await api.get(url);
      setProducts(res.data?.products || []);
      setTotalProducts(res.data?.total || 0);
      setTotalPages(res.data?.pages || 1);
    } catch {
    } finally {
      setProductsLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!category) return <ErrorState message="Category could not be found." />;

  return category.layoutType === 'hanging' ? (
    <HangingLayout category={category} subCategories={subCategories} />
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
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={(page) => fetchProducts(page, selectedSubId)}
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

const HangingLayout = ({ category, subCategories }: { category: Category; subCategories: Category[] }) => (
  <div className="min-h-screen bg-pink-50/30 pb-20">
    {/* Banner Section for Hanging Layout */}
    {category.banner && (
      <div className="w-full relative overflow-hidden mb-8 border-b-4 border-primary/20 bg-pink-50/50" style={{ minHeight: '30vh' }}>
        <img
          src={category.banner}
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

const StandardLayout = ({ category, subCategories, products, deals, heroBanners, hangingBanners, selectedSubId, onSelectSub, productsLoading, isDealsPage, totalProducts, currentPage, totalPages, onPageChange }: { category: Category; subCategories: Category[]; products: Product[]; deals: DealProduct[]; heroBanners: Banner[]; hangingBanners: Banner[]; selectedSubId: string | null; onSelectSub: (id: string | null) => void; productsLoading: boolean; isDealsPage?: boolean; totalProducts: number; currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => (
  <div className="w-full pb-20">

    {/* ── Hero section: hanging items + banner (like HomePage) ── */}
    {(heroBanners.length > 0 || hangingBanners.length > 0) ? (
      <section style={{ background: 'linear-gradient(180deg,#fde8f0 0%,transparent 85%)', paddingTop: '52px', paddingBottom: '32px', position: 'relative' }}>
        {/* Rope line at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,transparent,rgba(233,30,99,0.4),rgba(199,125,255,0.4),transparent)' }} />

        {/* ── MOBILE ── */}
        <div className="block lg:hidden">
          {/* Banner on top — z-index: 10, overlaps marquee below */}
          {heroBanners.length > 0 && (
            <div className="px-3" style={{ position: 'relative', zIndex: 10, marginBottom: '-20px' }}>
              <HeroBannerCard banners={heroBanners} mobile />
            </div>
          )}
          {hangingBanners.length > 0 && (
            <div style={{ width: '100vw', overflowX: 'hidden', position: 'relative', zIndex: 1, paddingTop: heroBanners.length > 0 ? '30px' : '0' }}>
              <style>{`
                @keyframes mob-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                .mob-mq { display:flex; gap:1rem; width:max-content; animation:mob-marquee 15s linear infinite; padding-left:12px; }
                .mob-mq:hover { animation-play-state:paused }
                @keyframes mob-sway { 0%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} 100%{transform:rotate(-3deg)} }
                .mob-hang-item { transform-origin:top center; animation:mob-sway 3s ease-in-out infinite; }
              `}</style>
              <div className="mob-mq">
                {[...hangingBanners, ...hangingBanners].map((b, i) => (
                  <div key={i} className="mob-hang-item flex flex-col items-center flex-shrink-0" style={{ animationDelay: `${(i % hangingBanners.length) * 0.5}s` }}>
                    <div className="w-px h-10 bg-gradient-to-b from-pink-400 to-pink-200" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 -mb-0.5 z-10 bg-white" />
                    <div className="bg-white p-1.5 rounded-2xl shadow-lg">
                      <img src={ik.hanging(b.image)} alt={b.title || ''} width={100} height={160} loading="lazy" className="w-24 h-40 rounded-xl object-cover" />
                      {b.title && <div className="mt-1.5 bg-pink-500 text-white text-[10px] font-black py-1 px-3 rounded-full text-center truncate max-w-[100px]">{b.title}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── DESKTOP ── */}
        <div className="hidden lg:flex w-full pb-4 items-start" style={{ position: 'relative' }}>
          {/* Left — hanging items (z-index: 1, behind banner) */}
          {hangingBanners.length > 0 && (
            <div className="flex-1 min-w-0" style={{ overflowX: 'hidden', position: 'relative', zIndex: 1 }}>
              <style>{`
                @keyframes pc-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                .pc-mq { display:flex; gap:1.5rem; width:max-content; animation:pc-marquee 25s linear infinite; }
                .pc-mq:hover { animation-play-state:paused }
                @keyframes pc-sway { 0%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} 100%{transform:rotate(-6deg)} }
                .pc-hang-item { transform-origin:top center; animation:pc-sway 3.2s ease-in-out infinite; }
              `}</style>
              <div className="pc-mq">
                {[...hangingBanners, ...hangingBanners].map((b, i) => (
                  <a key={i} href={b.link || '#'} className="pc-hang-item flex flex-col items-center flex-shrink-0" style={{ textDecoration: 'none', animationDelay: `${(i % hangingBanners.length) * 0.4}s` }}>
                    <div style={{ width: 2, height: 52, background: 'linear-gradient(180deg,#f43f8e,#e879a0)', borderRadius: 1 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #9ca3af', background: 'white', marginBottom: -3, zIndex: 2 }} />
                    <div style={{ background: 'white', padding: 8, borderRadius: 30, boxShadow: '0 8px 24px rgba(244,63,142,0.15)' }}>
                      <img src={ik.hanging(b.image)} alt={b.title || ''} width={160} height={240} loading="lazy" style={{ width: 160, height: 240, borderRadius: 24, objectFit: 'cover', display: 'block' }} />
                      {b.title && (
                        <div style={{ marginTop: 10, background: 'linear-gradient(135deg,#f43f8e,#ec4899)', borderRadius: 18, padding: '6px 15px', textAlign: 'center' }}>
                          <span style={{ color: 'white', fontSize: 14, fontWeight: 900, letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{b.title}</span>
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* Right — banner: z-index: 10, overlaps left items slightly */}
          {heroBanners.length > 0 && (
            <div className="flex-[1.5] flex flex-col justify-center pt-2 pr-14 xl:pr-24"
              style={{ position: 'relative', zIndex: 10, marginLeft: '-60px' }}>
              <HeroBannerCard banners={heroBanners} />
            </div>
          )}
        </div>
      </section>
    ) : category.banner ? (
      /* Fallback: simple category banner image */
      <div className="w-full aspect-[2/1] md:aspect-[4/1] overflow-hidden mb-8 shadow-xl">
        <img src={category.banner} className="w-full h-full object-cover" alt={category.name} />
      </div>
    ) : null}

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
          {totalProducts > 0 && (
            <p className="text-sm text-gray-500 mb-4 font-medium">
              <span className="font-bold text-gray-800">{totalProducts}</span> products
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>

          {/* Numbered Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
              {/* Prev */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm"
              >‹</button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Show: first, last, current, and neighbors
                const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                const showDots = !show && (page === 2 || page === totalPages - 1);
                if (showDots) return <span key={page} className="text-gray-400 text-sm px-1">…</span>;
                if (!show) return null;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                      page === currentPage
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >{page}</button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm"
              >›</button>
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

  const { cart, addToCart, updateItem } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const cartItem = cart?.items?.find(i => i.product?._id === product._id);
  const qtyInCart = cartItem?.quantity || 0;

  const rawImg = product.images?.[0]?.url || '';
  const img = rawImg ? ik.thumb(rawImg) : `https://placehold.co/300x300/FCE4EC/E91E63?text=${encodeURIComponent(product.name)}`;

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (navigator.vibrate) navigator.vibrate(30);
    setAdding(true);
    await addToCart(product._id, product.minQty || 1);
    setAdding(false);
  };

  const handleUpdateQty = async (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    if (!cartItem) return;
    if (navigator.vibrate) navigator.vibrate(30);
    const newQty = cartItem.quantity + delta;
    if (newQty < (product.minQty || 1)) return;
    await updateItem(cartItem._id, newQty);
  };

  if (expired) return <ProductCard product={product} />;

  return (
    <Link to={`/product/${product.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative">
        {/* Discount badge */}
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}
        </div>
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img src={img} alt={product.name} width={300} height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/300x300/FCE4EC/E91E63?text=Product` }}
          />
        </div>
        <div className="p-3">
          <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{product.name}</p>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-base font-black text-red-600">₹{dealPrice}</span>
            <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
          </div>
          <p className="text-[10px] text-green-600 font-bold mb-2">Save ₹{savings.toFixed(0)}</p>

          {/* ── Cart Controls ── */}
          {product.stock > 0 ? (
            qtyInCart > 0 ? (
              <div className="flex items-center rounded-xl overflow-hidden border border-primary h-9">
                <button
                  onClick={(e) => handleUpdateQty(e, -1)}
                  disabled={qtyInCart <= (product.minQty || 1)}
                  className="flex-1 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-base font-black text-primary leading-none">−</span>
                </button>
                <div className="flex-[1.5] h-full flex items-center justify-center bg-primary text-white font-black text-sm">
                  {qtyInCart}
                </div>
                <button
                  onClick={(e) => handleUpdateQty(e, 1)}
                  className="flex-1 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-base font-black text-primary leading-none">+</span>
                </button>
              </div>
            ) : (
              <button onClick={handleCart} disabled={adding}
                className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)', color: '#fff', boxShadow: '0 4px 14px rgba(233,30,99,0.25)' }}>
                <ShoppingCart size={13} />
                {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            )
          ) : (
            <div className="w-full py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold text-center">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};