import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ik } from '../utils/imagekit';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Product, Category, Banner, DealProduct } from '../types';
import ProductCard from '../components/product/ProductCard';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

const LIMIT = 24;

// ── Deals Countdown Timer ─────────────────────────────────────────────────────
const DealsCountdown: React.FC<{ endTime: string | null }> = ({ endTime }) => {
  const calc = useCallback(() => {
    if (!endTime) return null;
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, ended: true };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      ended: false,
    };
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
      <span className="text-sm font-bold text-gray-700">{time.ended ? '🔴 Deal Ended' : '⏰ Ends in:'}</span>
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

// ── Hero Banner Card Component ───────────────────────────────────────────────
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
    <div className="relative w-full overflow-hidden bg-white shadow-2xl"
      style={{ borderRadius: mobile ? '1.5rem' : '3.5rem', aspectRatio: mobile ? '16/9' : '2/1', boxShadow: mobile ? '0 10px 30px rgba(0,0,0,0.1)' : '0 25px 60px rgba(0,0,0,0.12)' }}>
      {banners.map((bn, i) => (
        <Link key={bn._id} to={bn.link || '/products'}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
          {bn.image ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img src={ik.banner(bn.image)} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110" aria-hidden="true" />
              <img src={ik.banner(bn.image)} alt={bn.title || 'Banner'} loading="eager" fetchPriority="high" className="relative z-10 w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-purple-600">
              <p className="text-white font-black text-2xl text-center px-6 drop-shadow-md">{bn.title}</p>
            </div>
          )}
        </Link>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  )
}


const getAllDescendantIds = (parentId: string, allCats: any[]): string[] => {
  const children = allCats.filter((c: any) => c.parent?._id === parentId || c.parent === parentId);
  return [
    ...children.map((c: any) => c._id),
    ...children.flatMap((c: any) => getAllDescendantIds(c._id, allCats)),
  ];
};

// ── Main Page Component ────────────────────────────────────────────────────────
const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<DealProduct[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [heroBanners, setHeroBanners] = useState<Banner[]>([]);
  const [hangingBanners, setHangingBanners] = useState<Banner[]>([]);
  const [allCatIds, setAllCatIds] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isDealsPage = slug === 'deals-of-the-day';

  const fetchPage = async (page: number, subId: string | null) => {
    if (!category || !allCatIds) return;
    setProductsLoading(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
    try {
      let url = '';
      if (subId === 'SHOW_ALL') {
        url = `/products?limit=${LIMIT}&page=${page}`;
      } else if (subId) {
        url = `/products?category=${subId}&limit=${LIMIT}&page=${page}`;
      } else {
        url = `/products?categoryIds=${allCatIds}&limit=${LIMIT}&page=${page}`;
      }
      const res = await api.get(url);
      setProducts(res.data?.products || []);
      setTotalProducts(res.data?.total || 0);
      setTotalPages(res.data?.pages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      setSelectedSubId(null);
      setCurrentPage(1);
      setProducts([]);

      try {
        const { data: { category: fetchedCategory } } = await api.get(`/categories/${slug}`);
        if (!fetchedCategory) throw new Error('Category not found');
        setCategory(fetchedCategory);

        // Parallel fetch for everything else once we have the category
        const [bannerRes, subRes] = await Promise.all([
          api.get(`/banners?isActive=true&category=${fetchedCategory._id}`),
          api.get('/categories/all')
        ]);

        const allBanners: Banner[] = bannerRes.data.banners || [];
        const allCats = subRes?.data?.categories || [];

        // Banners filtering
        const catHeros = allBanners.filter((b: any) => {
          const bannerCatId = typeof b.category === 'object' ? b.category?._id : b.category;
          return bannerCatId === fetchedCategory._id && (b.type === 'hero' || b.type === 'promo' || b.type === 'category');
        });
        const catHangings = allBanners.filter((b: any) => {
          const bannerCatId = typeof b.category === 'object' ? b.category?._id : b.category;
          return bannerCatId === fetchedCategory._id && b.type === 'hanging';
        });
        const globalHeros = allBanners.filter(b => !b.category && (b.type === 'hero' || b.type === 'promo' || b.type === 'category'));
        const globalHangings = allBanners.filter(b => !b.category && b.type === 'hanging');

        setHeroBanners(catHeros.length > 0 ? catHeros : globalHeros);
        setHangingBanners(catHangings.length > 0 ? catHangings : globalHangings);

        // Subcategories
        const directSubs = allCats.filter((c: any) => c.parent?._id === fetchedCategory._id || c.parent === fetchedCategory._id);
        setSubCategories(directSubs);

        // Fetch products/deals in parallel with the above processing if possible, or right after
        if (fetchedCategory.slug === 'deals-of-the-day') {
          const dealsRes = await api.get('/deals-of-day');
          setDeals(dealsRes.data?.deals || []);
        } else if (fetchedCategory.layoutType !== 'hanging') {
          const descendantIds = getAllDescendantIds(fetchedCategory._id, allCats);
          const ids = [fetchedCategory._id, ...descendantIds].join(',');
          setAllCatIds(ids);
          const prodRes = await api.get(`/products?categoryIds=${ids}&limit=${LIMIT}&page=1`);
          setProducts(prodRes.data?.products || []);
          setTotalProducts(prodRes.data?.total || 0);
          setTotalPages(prodRes.data?.pages || 1);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load collection.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug]);

  const handleSubCategorySelect = async (subId: string | null) => {
    if (!category) return;
    setSelectedSubId(subId);
    setCurrentPage(1);
    fetchPage(1, subId);
  };

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
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={(page) => fetchPage(page, selectedSubId)}
    />
  );
};

// ── Shared Layout Components ────────────────────────────────────────────────────

const LoadingState = () => (
  <div className="w-full">
    {/* Banner Skeleton */}
    <section className="relative overflow-hidden mb-12 px-4 md:px-14 lg:px-24 py-12" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf2ff 40%, #fff8f0 70%, #fefffe 100%)' }}>
      <div className="w-full aspect-[16/9] lg:aspect-[2/1] skeleton rounded-[1.5rem] lg:rounded-[3.5rem]" />
    </section>

    <div className="px-4 md:px-10 lg:px-16 xl:px-24">
      {/* Title Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-10 w-64 skeleton rounded-xl" />
        <div className="h-4 w-96 skeleton rounded-lg opacity-50" />
      </div>

      {/* Subcategories Skeleton Scroll */}
      <div className="flex gap-5 mb-14 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 overflow-x-auto scrollbar-hidden">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full skeleton" />
            <div className="h-3 w-16 skeleton rounded" />
          </div>
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all relative">
            <div className="aspect-square skeleton" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 skeleton rounded" />
              <div className="h-4 w-1/2 skeleton rounded" />
              <div className="h-8 w-full skeleton rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
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
    <div className="max-w-7xl mx-auto px-4 pt-12 text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-heading font-black text-gray-900 mb-4">{category.name}</h1>
      <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full" />
    </div>
    <div className="flex flex-wrap justify-center gap-x-12 gap-y-20 pt-1 px-4">
      {subCategories.map((sub) => (
        <Link key={sub._id} to={`/category/${sub.slug}`} className="group flex flex-col items-center">
          <div className="w-0.5 h-16 bg-gradient-to-b from-primary to-primary/20 group-hover:h-20 transition-all duration-500" />
          <div className="bg-white p-4 rounded-[2rem] shadow-2xl border-2 border-primary/10 group-hover:border-primary transition-all duration-500 group-hover:scale-110">
            <div className="w-40 h-56 lg:w-52 lg:h-72 rounded-[1.5rem] overflow-hidden bg-gray-50 flex items-center justify-center">
              {sub.image ? <img src={ik.catCircle(sub.image)} alt={sub.name} className="w-full h-full object-cover" /> : <span className="text-4xl">{sub.icon || '🛍️'}</span>}
            </div>
            <div className="mt-3 bg-primary text-white text-[10px] font-black py-1 px-3 rounded-full text-center uppercase tracking-widest shadow-lg">
              {sub.name}
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const StandardLayout = ({
  category, subCategories, products, deals, heroBanners, hangingBanners, selectedSubId, onSelectSub,
  productsLoading, isDealsPage, totalProducts, currentPage, totalPages, onPageChange,
}: {
  category: Category; subCategories: Category[]; products: Product[]; deals: DealProduct[]; heroBanners: Banner[]; hangingBanners: Banner[];
  selectedSubId: string | null; onSelectSub: (id: string | null) => void;
  productsLoading: boolean; isDealsPage?: boolean; totalProducts: number;
  currentPage: number; totalPages: number; onPageChange: (page: number) => void;
}) => (
  <div className="w-full pb-20">
    <section className="relative overflow-hidden mb-12" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #fdf2ff 40%, #fff8f0 70%, #fefffe 100%)' }}>
      {/* Mobile only: full-width landscape banner */}
      {heroBanners.length > 0 && (
        <div className="block lg:hidden w-full relative z-10 px-3 pt-3 pb-1">
          <HeroBannerCard banners={heroBanners} mobile />
        </div>
      )}

      <div className="hidden lg:flex w-full px-14 xl:px-24 py-12 items-stretch min-h-[50vh]">
        <div className="w-full flex row gap-16">
          <div className="flex-1 flex flex-row items-start justify-center gap-6 mt-[-45px]">
            <style>{`
              @keyframes sway-hero { 0%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} 100%{transform:rotate(-6deg)} }
              .hang-item-style { transform-origin: top center; animation: sway-hero 3.5s ease-in-out infinite; }
            `}</style>
            {hangingBanners.slice(0, 6).map((b, i) => (
              <a key={i} href={b.link || '#'} className="hang-item-style flex flex-col items-center group" style={{ animationDelay: `${i * 0.6}s` }}>
                <div className="w-[2px] h-[60px] bg-gradient-to-b from-pink-500 to-pink-400" />
                <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-300 ring-2 ring-white -mb-0.5 z-10" />
                <div className="bg-white p-2 rounded-[2rem] shadow-xl border-2 border-pink-100 group-hover:border-primary transition-all">
                  <img src={ik.hanging(b.image)} alt={b.title} width={165} height={250} className="w-40 h-64 rounded-[1.5rem] object-cover" />
                </div>
              </a>
            ))}
          </div>
          {heroBanners.length > 0 && <div className="flex-[1.5] flex flex-col justify-center"><HeroBannerCard banners={heroBanners} /></div>}
        </div>
      </div>
    </section>

    <div className="px-4 md:px-10 lg:px-16 xl:px-24">
      <div className="mb-8 font-heading">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 flex items-center gap-3">
          <span>{category.icon}</span> {category.name}
        </h1>
        {category.description && <p className="text-gray-500 mt-3 text-lg">{category.description}</p>}
      </div>

      {isDealsPage && deals.length > 0 && (
        <div className="mb-8 rounded-3xl p-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white flex justify-between items-center">
          <p className="font-bold uppercase tracking-widest">🔥 Deals of the Day</p>
          <DealsCountdown endTime={deals[0].endTime} />
        </div>
      )}

      {/* Horizontal Subcategory Scroll */}
      {subCategories.length > 0 && (
        <div className="flex gap-5 mb-14 bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 overflow-x-auto scrollbar-hidden scroll-smooth">
          <button onClick={() => onSelectSub('SHOW_ALL')} className="flex flex-col items-center gap-2 group flex-shrink-0">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all ${selectedSubId === 'SHOW_ALL' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-primary/5'}`}>
              <span className="text-primary font-black text-xs">ALL</span>
            </div>
            <span className="text-[12px] font-bold text-gray-600">View All</span>
          </button>
          {subCategories.map((sub) => (
            <button key={sub._id} onClick={() => onSelectSub(sub._id)} className="flex flex-col items-center gap-3 group flex-shrink-0">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 overflow-hidden transition-all ${selectedSubId === sub._id ? 'border-primary scale-110 shadow-lg' : 'border-gray-200'}`}>
                {sub.image ? <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" /> : <span className="text-3xl">{sub.icon || '🛍️'}</span>}
              </div>
              <span className={`text-[12px] font-black ${selectedSubId === sub._id ? 'text-primary' : 'text-gray-500'}`}>{sub.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        {productsLoading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] transition-all flex items-start justify-center pt-20">
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary" />
              <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Refreshing...</span>
            </div>
          </div>
        )}
        
        {isDealsPage ? (
          <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 ${productsLoading ? 'opacity-40 grayscale' : ''}`}>
            {deals.map((d) => <DealCard key={d._id} deal={d} />)}
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 ${productsLoading ? 'opacity-40 grayscale' : ''}`}>
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-16 font-bold">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => onPageChange(p)} className={`w-10 h-10 rounded-xl transition-all ${p === currentPage ? 'bg-primary text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);

const DealCard: React.FC<{ deal: DealProduct }> = ({ deal }) => {
  const { product, dealPrice, discountValue, discountType } = deal;
  const savings = product.price - dealPrice;
  const expired = new Date(deal.endTime) < new Date();
  const { cart, addToCart, updateItem, removeItem } = useCartStore(); // Added removeItem
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const cartItem = cart?.items?.find(i => i.product?._id === product._id);
  const qtyInCart = cartItem?.quantity || 0;
  const img = product.images?.[0]?.url ? ik.thumb(product.images[0].url) : `https://placehold.co/300x300/FCE4EC/E91E63?text=${encodeURIComponent(product.name)}`;

  const handleUpdateQty = async (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    if (!cartItem) return;
    const newQty = cartItem.quantity + delta;
    if (delta === -1 && cartItem.quantity <= (product.minQty || 1)) {
      await removeItem(cartItem._id);
    } else if (newQty >= (product.minQty || 1)) {
      await updateItem(cartItem._id, newQty);
    }
  };

  const handleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    await addToCart(product, product.minQty || 1);
  };

  if (expired) return <ProductCard product={product} />;

  return (
    <Link to={`/product/${product.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all relative">
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}
        </div>
        <div className="aspect-square bg-gray-50 overflow-hidden">
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
        </div>
        <div className="p-3">
          <h3 className="text-xs font-bold text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
          <div className="flex items-center gap-2 my-1">
            <span className="text-sm font-black text-red-600">₹{dealPrice}</span>
            <span className="text-[10px] text-gray-400 line-through">₹{product.price}</span>
          </div>
          {product.stock !== 0 ? (
            qtyInCart > 0 ? (
              <div className="flex items-center h-8 rounded-lg overflow-hidden border border-primary">
                <button onClick={(e) => handleUpdateQty(e, -1)} className="flex-1 bg-gray-50">−</button>
                <div className="flex-1 bg-primary text-white text-[10px] font-bold text-center">{qtyInCart}</div>
                <button onClick={(e) => handleUpdateQty(e, 1)} className="flex-1 bg-gray-50">+</button>
              </div>
            ) : (
              <button onClick={handleCart} className="w-full py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold flex items-center justify-center gap-1">
                <ShoppingCart size={10} /> Add to Cart
              </button>
            )
          ) : <div className="text-[10px] text-gray-400 font-bold text-center py-1.5 bg-gray-50 rounded-lg">Out of Stock</div>}
        </div>
      </div>
    </Link>
  );
};

export default CategoryPage;
