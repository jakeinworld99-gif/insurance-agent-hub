'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [proposal, setProposal] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [paymentLink, setPaymentLink] = useState('')

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  useEffect(() => {
    const proposalId = params.proposalId as string
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('proposals').select('*, products(*), customers(*)')
        .eq('id', proposalId).single()
      if (!data) { router.push('/dashboard'); return }
      setProposal(data)
      setCustomer(data.customers)
      setProduct(data.products)
      if (data.status === 'paid' || data.status === 'agreed') {
        const { data: pay } = await supabase.from('payments').select('*').eq('proposal_id', proposalId).single()
        setPayment(pay)
        if (pay) setPaymentLink(`${appUrl}/pay/${pay.token}`)
      }
      setLoading(false)
    })
  }, [params.proposalId])

  const markAgreed = async () => {
    setActioning(true)
    const res = await fetch(`/api/proposals/${params.proposalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'agreed' }),
    })
    const data = await res.json()
    if (data.id) setProposal((p: any) => ({ ...p, status: 'agreed' }))
    setActioning(false)
  }

  const generatePaymentLink = async () => {
    setActioning(true)
    const res = await fetch(`/api/proposals/${params.proposalId}/payment-link`, { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      setPaymentLink(data.url)
      if (data.token) setPayment({ token: data.token })
    }
    setActioning(false)
  }

  const shareWhatsApp = (text: string) => {
    const phone = customer?.phone
    if (!phone) return
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const sharePdfWa = () => {
    const pdfUrl = `${appUrl}/api/proposals/${params.proposalId}/pdf`
    const text = `Hi ${customer?.full_name?.split(' ')[0]}, here is your insurance proposal.\n\nProduct: ${product?.name}\nSum assured: Rs ${Number(product?.sum_insured_inr).toLocaleString()}\nAnnual premium: Rs ${Number(product?.base_premium_cents / 100).toLocaleString()}\n\nView your proposal PDF: ${pdfUrl}`
    shareWhatsApp(text)
  }

  const sharePaymentWa = () => {
    if (!paymentLink) return
    const text = `Hi ${customer?.full_name?.split(' ')[0]}, please complete your payment for the ${product?.name} policy.\n\nPay here: ${paymentLink}`
    shareWhatsApp(text)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 p-10 text-gray-500">Loading...</div>
  if (!proposal) return null

  const pdfUrl = `${appUrl}/api/proposals/${params.proposalId}/pdf`

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-yellow-100 text-yellow-700',
    agreed: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          Back
        </button>

        <div className="bg-white rounded-2xl shadow p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proposal for {customer?.full_name}</h1>
              <p className="text-gray-500 mt-1">{product?.name}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[proposal.status] || 'bg-gray-100 text-gray-600'}`}>
              {proposal.status}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Sum Assured:</span> <strong>Rs {Number(product?.sum_insured_inr).toLocaleString()}</strong></div>
            <div><span className="text-gray-500">Premium:</span> <strong>Rs {Number(product?.base_premium_cents / 100).toLocaleString()}/yr</strong></div>
            {product?.category === 'term' && <div><span className="text-gray-500">Term:</span> <strong>{product?.base_term_years} years</strong></div>}
            {product?.category === 'vehicle' && <div><span className="text-gray-500">Vehicle type:</span> <strong>{customer?.vehicle_type}</strong></div>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href={pdfUrl} target="_blank" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              View PDF
            </a>
            <button onClick={sharePdfWa} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
              Share PDF via WhatsApp
            </button>
            {proposal.status === 'draft' && (
              <button onClick={markAgreed} disabled={actioning} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                {actioning ? 'Saving...' : 'Mark as Agreed'}
              </button>
            )}
            {(proposal.status === 'agreed' || proposal.status === 'paid') && !paymentLink && (
              <button onClick={generatePaymentLink} disabled={actioning} className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50">
                {actioning ? 'Generating...' : 'Generate Payment Link'}
              </button>
            )}
            {paymentLink && (
              <>
                <button onClick={sharePaymentWa} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  Share Payment Link via WhatsApp
                </button>
                <button onClick={() => navigator.clipboard.writeText(paymentLink)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Copy Payment Link
                </button>
              </>
            )}
          </div>
          {paymentLink && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Payment link</p>
              <p className="text-sm font-mono text-blue-600 break-all">{paymentLink}</p>
            </div>
          )}
        </div>

        {paymentLink && (
          <div className="bg-white rounded-2xl shadow p-8">
            <h2 className="text-lg font-semibold mb-4">Payment Status</h2>
            {payment?.status === 'paid' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-green-800">
                <p className="font-semibold">Payment received</p>
                <p className="text-sm mt-1">The policy is now active.</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-yellow-800">
                <p className="font-semibold">Awaiting payment</p>
                <p className="text-sm mt-1">Share the payment link with the customer to collect payment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
