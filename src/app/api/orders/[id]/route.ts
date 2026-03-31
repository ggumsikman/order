import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, order: data })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ success: false, error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.draft_images !== undefined) updateData.draft_images = body.draft_images
    if (body.payment_link !== undefined) updateData.payment_link = body.payment_link

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, order: data })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ success: false, error: '업데이트에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order delete error:', error)
    return NextResponse.json({ success: false, error: '삭제에 실패했습니다.' }, { status: 500 })
  }
}
