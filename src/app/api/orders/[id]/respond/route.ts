import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendApprovalNotification, sendRevisionNotification } from '@/lib/email'
import { Order } from '@/types/order'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, revision_notes } = body

    if (action === 'approve') {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: '시안 확정' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await sendApprovalNotification(data as Order)
      return NextResponse.json({ success: true })
    }

    if (action === 'revise') {
      const { data: current, error: fetchError } = await supabase
        .from('orders')
        .select('revision_count')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const newCount = (current.revision_count ?? 0) + 1

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: '시안 수정 요청',
          revision_notes,
          revision_count: newCount,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await sendRevisionNotification(data as Order)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 })
  } catch (error) {
    console.error('Review respond error:', error)
    const message = (error as { message?: string })?.message ?? String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
