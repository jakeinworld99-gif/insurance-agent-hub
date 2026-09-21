'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

export default function PaySuccessPage() {
  const params = useParams()
  const search = useSearchParams()
  const token = params.token as string

  const policyNumber = search.get('policy') || ''
  const pdfUrl = search.get('pdf') || ''
  const paymentUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay/${token}` : ''

  const sharePdf = () => {
    const phone = search.get('phone')
    if (!phone) { alert('No phone number on file'); return }
    const text = `My insurance policy is confirmed!\n\nPolicy number: ${policyNumber}\nView your policy document: ${pdfUrl}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const sharePayment = () => {
    const phone = search.get('phone')
    if (!phone) { alert('No phone number on file'); return }
    const text = `Payment confirmed for your insurance policy.\n\nPolicy number: ${policyNumber}\nPay your premium: ${paymentUrl}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center space-y-6">
        <div className="text-5xl">&#x1F389;</div>
        <h1 className="text-2xl font-bold text-green-800">Payment Successful!</h1>
        {policyNumber && (
          <div className="bg-green-50 rounded-xl p-5 text-left space-y-2">
            <p className="text-gray-700"><strong>Policy Number:</strong> <span className="font-mono text-green-700">{policyNumber}</span></p>
          </div>
        )}
        {pdfUrl && (
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-2">Your policy document:</p>
            <a href={pdfUrl} target="_blank" className="text-blue-600 text-sm hover:underline break-all">
              {pdfUrl}
            </a>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={sharePdf}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Share PDF via WhatsApp
          </button>
          <button
            onClick={sharePayment}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Share Payment Link via WhatsApp
          </button>
        </div>
        <a href="/" className="block text-blue-600 font-medium hover:underline">
          Back to home
        </a>
      </div>
    </div>
  )
}
