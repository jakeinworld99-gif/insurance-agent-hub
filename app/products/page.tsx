'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ProductsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('products').select('*').eq('active', true).then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
    })
  }, [])

  const categoryLabel = (cat: string) => ({
    term: 'Term Life',
    health: 'Health',
    vehicle: 'Vehicle',
  }[cat] || cat)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">
            Dashboard
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const catLabel = categoryLabel(p.category)
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow p-6 space-y-3">
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      p.category === 'term' ? 'bg-blue-50 text-blue-600' :
                      p.category === 'health' ? 'bg-green-50 text-green-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>{catLabel}</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">{p.name}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {p.category === 'term' && <p>Term: {p.base_term_years} years</p>}
                    {p.category === 'vehicle' && <p>Vehicle type: {p.applies_to?.vehicle_types?.join(', ')}</p>}
                    {p.category === 'health' && <p>Coverage: {p.applies_to?.coverage_type}</p>}
                    <p>Sum: Rs {Number(p.sum_insured_inr).toLocaleString()}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xl font-bold text-blue-600">
                      Rs {Number(p.base_premium_cents / 100).toLocaleString()}<span className="text-sm font-normal text-gray-400">/yr</span>
                    </p>
                  </div>
                  <Link
                    href="/customers/new"
                    className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Get started
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
