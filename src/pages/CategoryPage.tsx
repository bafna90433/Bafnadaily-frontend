import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import { Product, Category } from '../types'
import ProductCard from '../components/product/ProductCard'

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{slug:string}>()
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/categories/${slug}`).then(async r => {
      setCategory(r.data.category)
      if (r.data.category?._id) { const res = await api.get(`/products?category=${r.data.category._id}&limit=24`); setProducts(res.data.products) }
    }).catch(console.error).finally(()=>setLoading(false))
  }, [slug])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6"><h1 className="text-2xl font-heading font-bold">{category?.icon} {category?.name||slug}</h1>{category?.description&&<p className="text-gray-500 mt-1">{category.description}</p>}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {loading ? Array(8).fill(0).map((_,i)=><div key={i} className="h-64 skeleton rounded-2xl"/>) : products.map(p=><ProductCard key={p._id} product={p}/>)}
      </div>
      {!loading&&products.length===0&&<div className="text-center py-20 text-gray-400"><p className="text-4xl mb-3">🛍️</p><p>No products in this category yet</p></div>}
    </div>
  )
}

export default CategoryPage
