import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase.from('agents').select('id').eq('user_id', user.id).single()
  if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prop } = await supabase
    .from('proposals').select('*').eq('id', params.id).eq('agent_id', agent.id).single()
  if (!prop) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const pdfUrl = `${appUrl}/api/proposals/${params.id}/pdf`

  if (!prop.pdf_url) {
    await supabase.from('proposals').update({ pdf_url: pdfUrl }).eq('id', params.id)
  }

  const { data: existing } = await supabase
    .from('payments').select('token').eq('proposal_id', params.id).single()

  if (existing) {
    return NextResponse.json({ token: existing.token, url: `${appUrl}/pay/${existing.token}`, pdf_url: pdfUrl })
  }

  const payToken = crypto.randomUUID().replace(/-/g, '').slice(0, 32)
  const amountCents = prop.premium || 0

  const { data: payment } = await supabase
    .from('payments')
    .insert({ proposal_id: params.id, token: payToken, amount_cents: amountCents, status: 'pending' })
    .select().single()

  return NextResponse.json({ token: payToken, url: `${appUrl}/pay/${payToken}`, pdf_url: pdfUrl })
}
