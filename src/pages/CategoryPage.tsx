import React, { useRef, useState, useEffect, useCallback } from 'react';
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
            ? <img src={bn.image} alt={bn.title} className="w-full h-full" style={{ objectFit: 'cover', objectPosition: 'center' }} />
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

        // 2. Fetch Category-Specific Banners
        const bannerRes = await api.get(`/banners?isActive=true&category=${fetchedCategory._id}`);
        const allBanners: Banner[] = bannerRes.data.banners || [];
        setHeroBanners(allBanners.filter(b => b.type !== 'hanging'));
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
          const [subRes, prodRes] = await Promise.all([
            api.get('/categories/all'),
            fetchedCategory.layoutType !== 'hanging'
              ? api.get(`/products?category=${fetchedCategory._id}&limit=24`)
              : Promise.resolve(null),
          ]);
          const filteredSubs = (subRes?.data?.categories || []).filter(
            (c: any) => c.parent?._id === fetchedCategory._id || c.parent === fetchedCategory._id
          );
          setSubCategories(filteredSubs);
          if (prodRes) setProducts(prodRes.data?.products || []);
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
    try {
      const categoryId = subId || category._id;
      const res = await api.get(`/products?category=${categoryId}&limit=24`);
      setProducts(res.data?.products || []);
    } catch {
      // keep existing products on error
    } finally {
      setProductsLoading(false);
    }
  };

  // Main Render Logic
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
    {/* Banner Section */}
    {category.banner && (
      <div className="w-full aspect-[2/1] md:aspect-[4/1] relative overflow-hidden mb-8 border-b-4 border-primary/20">
        <img src={category.banner} className="w-full h-full object-cover" alt={category.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 md:p-16">
          <h1 className="text-white text-4xl md:text-7xl font-heading font-black drop-shadow-2xl uppercase">
            {category.name}
          </h1>
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
            <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-primary/10 group-hover:border-primary group-hover:-rotate-3 transition-all duration-500 group-hover:scale-110">
              <div className="w-36 h-48 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                {sub.image ? (
                  <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
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

const StandardLayout = ({ category, subCategories, products, deals, heroBanners, hangingBanners, selectedSubId, onSelectSub, productsLoading, isDealsPage }: { category: Category; subCategories: Category[]; products: Product[]; deals: DealProduct[]; heroBanners: Banner[]; hangingBanners: Banner[]; selectedSubId: string | null; onSelectSub: (id: string | null) => void; productsLoading: boolean; isDealsPage?: boolean }) => (
  <div className="w-full px-4 md:px-10 lg:px-16 xl:px-24 py-6 pb-20">
    {/* ── Category Specific Professional Hero Banner (Dynamic) ── */}
    {(heroBanners.length > 0 || hangingBanners.length > 0) && (
      <section className="relative overflow-hidden rounded-[2.5rem] mb-12" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf2ff 40%, #fff8f0 70%, #fefffe 100%)' }}>
        {/* Soft decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(233,30,99,0.07) 0%, transparent 70%)' }} />
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(199,125,255,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,139,90,0.06) 0%, transparent 70%)' }} />
        </div>

        {/* Mobile only: banner card slider */}
        {heroBanners.length > 0 && (
          <div className="block lg:hidden w-full relative z-10 px-3 pt-3 pb-4">
            <HeroBannerCard banners={heroBanners} mobile />
          </div>
        )}

        {/* Desktop: split layout — hanging items left, slider right */}
        <div className="hidden lg:flex w-full px-10 xl:px-20 py-12 relative z-10 items-stretch" style={{ minHeight: '400px' }}>
          <div className="w-full flex flex-row items-stretch gap-16">
            {/* Left Column — Hanging items */}
            {hangingBanners.length > 0 && (
              <div className="flex-1 flex flex-row items-start justify-center gap-6 overflow-visible" style={{ alignSelf: 'stretch', marginTop: '-45px' }}>
                <style>{`
                  @keyframes sway-category { 0%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} 100%{transform:rotate(-5deg)} }
                  .cat-hang:nth-child(odd)  { animation: sway-category 3s ease-in-out infinite; }
                  .cat-hang:nth-child(even) { animation: sway-category 3s ease-in-out infinite 0.5s; }
                `}</style>
                {hangingBanners.slice(0, 4).map((b, i) => (
                  <a key={i} href={b.link || '#'} className="cat-hang flex flex-col items-center" style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{ width: '1.5px', height: '40px', background: 'linear-gradient(180deg,#f43f8e,#e879a0)', borderRadius: '1px' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid #9ca3af', background: 'transparent', marginBottom: '-2px', zIndex: 2 }} />
                    <div style={{ background: 'white', padding: '4px', borderRadius: '18px', boxShadow: '0 6px 18px rgba(244,63,142,0.15)', border: '1.5px solid rgba(244,63,142,0.1)' }}>
                      <img src={b.image} alt="keychain" style={{ width: '90px', height: '130px', borderRadius: '14px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ marginTop: '4px', background: 'linear-gradient(135deg,#f43f8e,#ec4899)', borderRadius: '10px', padding: '3px 8px', textAlign: 'center' }}>
                        <span style={{ color: 'white', fontSize: '9px', fontWeight: 900, letterSpacing: '0.4px' }}>Under {b.title?.split('Under')[1] || '50'}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Right Column — Main Banner Slider */}
            {heroBanners.length > 0 && (
              <div className="flex-[2.5] flex flex-col justify-center">
                <HeroBannerCard banners={heroBanners} />
              </div>
            )}
          </div>
        </div>
      </section>
    )}

    {/* Old Banner Section (Showing only if no Hero banners) */}
    {category.banner && heroBanners.length === 0 && (
      <div className="w-full aspect-[2/1] md:aspect-[4/1] rounded-3xl overflow-hidden mb-8 shadow-xl relative">
        <img src={category.banner} className="w-full h-full object-cover" alt={category.name} />
      </div>
    )}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Empty State for Products */}
        {products.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-3xl mt-8 border-2 border-dashed border-gray-200">
            <p className="text-5xl mb-4">🛒</p>
            <p className="font-medium text-lg text-gray-500">No products available in this category yet.</p>
          </div>
        )}
      </>
    )}
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