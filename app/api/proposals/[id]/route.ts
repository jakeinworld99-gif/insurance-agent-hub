import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase.from('agents').select('id').eq('user_id', user.id).single()
  if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prop } = await supabase
    .from('proposals').select('*').eq('id', params.id).eq('agent_id', agent.id).single()
  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { status } = body

  const { data, error } = await supabase
    .from('proposals').update({ status }).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
