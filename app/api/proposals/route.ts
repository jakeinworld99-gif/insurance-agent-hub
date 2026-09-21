import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customer_id, product_id } = await req.json()
  if (!customer_id || !product_id) {
    return NextResponse.json({ error: 'Missing customer_id or product_id' }, { status: 400 })
  }

  const { data: agent } = await supabase.from('agents').select('id').eq('user_id', user.id).single()
  if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cust } = await supabase.from('customers').select('*').eq('id', customer_id).eq('agent_id', agent.id).single()
  if (!cust) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const { data: prod } = await supabase.from('products').select('*').eq('id', product_id).eq('active', true).single()
  if (!prod) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const { data, error } = await supabase.from('proposals').insert({
    customer_id,
    product_id,
    agent_id: agent.id,
    status: 'draft',
    premium: prod.base_premium_cents,
    sum_insured: prod.sum_insured_inr,
    term_years: prod.base_term_years || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
