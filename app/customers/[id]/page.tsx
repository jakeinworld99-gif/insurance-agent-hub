'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [customer, setCustomer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [eligible, setEligible] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [agentId, setAgentId] = useState<string | null>(null)

  useEffect(() => {
    const id = params.id as string
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const res = await fetch('/api/agent/me')
      const { agentId: aid } = await res.json()
      if (!aid) { router.push('/login'); return }
      setAgentId(aid)

      const [{ data: cust }, { data: prods }, { data: props }, { data: pols }] = await Promise.all([
        supabase.from('customers').select('*').eq('id', id).eq('agent_id', aid).single(),
        supabase.from('products').select('*').eq('active', true),
        supabase.from('proposals').select('*, products(*)').eq('customer_id', id).eq('agent_id', aid),
        supabase.from('policies').select('*, products(*)').eq('customer_id', id).eq('agent_id', aid),
      ])
      if (!cust) { router.push('/dashboard'); return }
      setCustomer(cust)
      setProducts(prods || [])
      setProposals(props || [])
      setPolicies(pols || [])

      if (cust.date_of_birth) {
        const age = new Date().getFullYear() - new Date(cust.date_of_birth).getFullYear()
        const elig = (prods || []).filter((p: any) => {
          const at = p.applies_to || {}
          if (at.min_age !== undefined && age < at.min_age) return false
          if (at.max_age !== undefined && age > at.max_age) return false
          if (at.vehicle_types && cust.vehicle_type && !at.vehicle_types.includes(cust.vehicle_type)) return false
          return true
        })
        setEligible(elig)
      }
      setLoading(false)
    })
  }, [params.id])

  const createProposal = async (productId: string) => {
    setCreating(true)
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: params.id, product_id: productId }),
    })
    const data = await res.json()
    if (data.id) router.push(`/customers/${params.id}/proposal/${data.id}`)
    else { alert('Failed: ' + data.error); setCreating(false) }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 p-10 text-gray-500">Loading...</div>
  if (!customer) return null

  const catLabel = (cat: string) => ({ term: 'Term Life', health: 'Health', vehicle: 'Vehicle' }[cat] || cat)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
          <p className="text-gray-500 mt-1">{customer.customer_email || customer.email} · {customer.phone}</p>
          <p className="text-gray-400 text-sm mt-1">
            DOB: {customer.date_of_birth} · City: {customer.city || 'N/A'} · Income: {customer.annual_income ? `Rs ${Number(customer.annual_income).toLocaleString()}` : 'N/A'}
          </p>
        </div>

        {proposals.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposals</h2>
            <div className="space-y-3">
              {proposals.map((prop) => (
                <Link key={prop.id} href={`/customers/${params.id}/proposal/${prop.id}`} className="block border rounded-xl p-4 hover:border-blue-400 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{prop.products?.name}</p>
                      <p className="text-gray-500 text-sm">
                        Rs {Number(prop.products?.base_premium_cents / 100).toLocaleString()}/yr · {catLabel(prop.products?.category)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        prop.status === 'paid' ? 'bg-green-100 text-green-700' :
                        prop.status === 'agreed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{prop.status}</span>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligible Products</h2>
          {eligible.length === 0 ? (
            <p className="text-gray-500">No products match this customer profile yet.</p>
          ) : (
            <div className="grid gap-4">
              {eligible.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {catLabel(p.category)} · Sum: Rs {Number(p.sum_insured_inr).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        Rs {Number(p.base_premium_cents / 100).toLocaleString()}/yr
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => createProposal(p.id)}
                    disabled={creating}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Proposal'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {policies.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Policies</h2>
            <div className="grid gap-4">
              {policies.map((pol) => (
                <div key={pol.id} className="border border-green-200 bg-green-50 rounded-xl p-5">
                  <p className="font-semibold text-gray-900">{pol.products?.name}</p>
                  <p className="text-gray-600 text-sm font-mono">Policy #{pol.policy_number}</p>
                  <p className="text-gray-500 text-sm">Issued: {new Date(pol.started_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
