import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendOrderNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: body.customer_name,
        phone: body.phone,
        product_type: body.product_type,
        design_type: body.design_type,
        width_cm: body.width_cm ? parseFloat(body.width_cm) : null,
        height_cm: body.height_cm ? parseFloat(body.height_cm) : null,
        quantity: parseInt(body.quantity),
        text_top: body.text_top || null,
        text_main: body.text_main || null,
        text_bottom: body.text_bottom || null,
        text_corrections: body.text_corrections || '',
        shipping_address: body.shipping_address,
        shipping_address_detail: body.shipping_address_detail || null,
        payment_method: body.payment_method,
        receipt_type: body.receipt_type || null,
        business_number: body.business_number || null,
        email: body.email || null,
        card_phone: body.card_phone || null,
        items: body.items || null,
        other_requests: body.other_requests || '',
        needs_statement: body.needs_statement || false,
        statement_email: body.statement_email || null,
        image_urls: body.image_urls || [],
        status: '접수',
      }])
      .select()
      .single()

    if (error) throw error

    sendOrderNotification(data).catch(console.error)

    return NextResponse.json({ success: true, order: data })
  } catch (error) {
    console.error('Order creation error:', error)
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, orders: data })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ success: false, error: '주문 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}
