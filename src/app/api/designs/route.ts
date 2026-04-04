import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productType = searchParams.get('product_type')

    let query = supabase
      .from('designs')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (productType) query = query.eq('product_type', productType)

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, designs: data })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = await supabase
      .from('designs')
      .insert([{
        name: body.name,
        thumbnail_url: body.thumbnail_url,
        product_type: body.product_type || '현수막',
        category: body.category || '',
        sort_order: body.sort_order ?? 0,
        active: body.active ?? true,
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, design: data })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
