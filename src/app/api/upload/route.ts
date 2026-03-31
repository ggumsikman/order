import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 없습니다.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { data, error } = await supabase.storage
      .from('order-images')
      .upload(fileName, buffer, { contentType: file.type })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('order-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: '파일 업로드에 실패했습니다.' }, { status: 500 })
  }
}
